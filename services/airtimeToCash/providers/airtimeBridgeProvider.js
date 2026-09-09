import axios from 'axios';
import { AirtimeToCashProviderInterface, AIRTIME_CASH_STATUS } from '../providerInterface.js';

// ============================================================================
// AirtimeBridge Automation API client, implemented against the vendor's own
// published documentation (Getting Started / Authentication / Supported Networks /
// API Endpoints sections, as supplied directly -- not inferred, not guessed).
// ============================================================================
//
// Documented JSON response codes (returned in the body regardless of HTTP status):
//   2000 success | 3000 failed | 4000 pending, needs manual intervention |
//   4030 forbidden | 4010 session expired | 4290 too many requests |
//   5030 service/recipient unavailable (see the quota-check exception noted below)
// Documented HTTP status codes: 401, 403, 404, 422, 429, and 500 ("set to pending").
//
// Auth: documented as Content-Type/Accept only (no token) for Generate OTP and
// Verify OTP, with every other endpoint requiring Authorization: Bearer {token}.
// In practice, AirtimeBridge's live server rejects an unauthenticated
// generate/otp call with 401 {"message":"Unauthenticated."} -- confirmed against
// production, not assumed -- so both OTP endpoints also send the Bearer token,
// same as every other call. The token is a static credential generated in
// AirtimeBridge's own "Developer's Module" (this is exactly
// AirtimeCashProviderConfig.credentials.apiToken -- not derived from the
// OTP/session flow at all).
//
// Per-network amount ranges (documented; NOT the same as 9jaSub's own admin-
// configured AirtimeCashPricing min/max, which an admin could mis-set wider than
// these -- exported below for a future admin-UI validation pass, not enforced here
// since that's outside "implement the provider operations"):
export const AIRTIMEBRIDGE_NETWORK_LIMITS = Object.freeze({
    MTN: { min: 50, max: 10000 },
    AIRTEL: { min: 50, max: 20000 },
    GLO: { min: 50, max: 1000 },
    '9MOBILE': { min: 50, max: 20000 }
});

const CODE = Object.freeze({
    SUCCESS: 2000,
    FAILED: 3000,
    PENDING: 4000,
    FORBIDDEN: 4030,
    SESSION_EXPIRED: 4010,
    TOO_MANY_REQUESTS: 4290,
    UNAVAILABLE: 5030
});

export class AirtimeBridgeApiError extends Error {
    constructor(message, { code, httpStatus, raw } = {}) {
        super(message);
        this.name = 'AirtimeBridgeApiError';
        this.code = code;
        this.httpStatus = httpStatus;
        this.raw = raw;
    }
}

// NOT documented anywhere supplied: a "check transaction status by reference"
// endpoint, and a webhook. AirtimeBridge's only session-related GET-like operation
// is POST /api/v1/login/with/session/id, which re-validates a SIM session (returns
// airtimeBalance/tariff/type/sessionId) -- it does not report the outcome of a
// specific past transfer, so it cannot serve as a requery-by-reference endpoint.
// This is the ONE required-but-undocumented capability: reconciliation cannot ask
// AirtimeBridge "did transfer X actually go through?" after an ambiguous/exception
// response. checkStatus() below reports that plainly rather than guessing at an
// endpoint. If AirtimeBridge adds one, or confirms Login-with-Session-Id is meant
// to double as this, only this one method needs to change.
export class ProviderContractMissingError extends Error {
    constructor(method, detail) {
        super(`AirtimeBridge.${method}() cannot run: ${detail}`);
        this.name = 'ProviderContractMissingError';
        this.code = 'AIRTIME_CASH_PROVIDER_CONTRACT_MISSING';
    }
}

export class AirtimeBridgeProvider extends AirtimeToCashProviderInterface {
    constructor({ apiBaseUrl, apiToken, isTestMode } = {}) {
        super();
        // Every path passed to _post() below already starts with '/api/v1/...', so a
        // configured base URL ending in '/api' (e.g. a stale value saved before the
        // AirtimeCashProviderConfig default was corrected) would double up into
        // '/api/api/v1/...' and get rejected by AirtimeBridge with a 405. Strip a
        // trailing '/api' defensively so an already-stored config self-heals.
        this.apiBaseUrl = String(apiBaseUrl || 'https://automation.airtimetocash.com')
            .replace(/\/+$/, '')
            .replace(/\/api$/i, '');
        this.apiToken = apiToken; // never logged, never returned from any method
        this.isTestMode = isTestMode;
    }

    _publicHeaders() {
        return { 'Content-Type': 'application/json', Accept: 'application/json' };
    }

    _authHeaders() {
        if (!this.apiToken) {
            throw new AirtimeBridgeApiError('No AirtimeBridge API token configured.');
        }
        return { ...this._publicHeaders(), Authorization: `Bearer ${this.apiToken}` };
    }

    async _post(path, body, headers) {
        // Any non-2xx HTTP response throws via axios -- caught by
        // AirtimeToCashService.js's safeProviderCall(), which normalizes it to the
        // same 'ambiguous' shape a pending (4000) JSON body gets. This matches the
        // documented "500 Internal Server Error ... set to pending" convention:
        // an HTTP-level failure is treated no more confidently than a pending one.
        const response = await axios.post(`${this.apiBaseUrl}${path}`, body, { headers, timeout: 30000 });
        return response.data;
    }

    async requestOtp({ network, phone }) {
        const data = await this._post('/api/v1/generate/otp', { networkName: network, sender: phone }, this._authHeaders());
        if (data.code === CODE.SUCCESS) {
            return { success: true, status: AIRTIME_CASH_STATUS.SUCCESS, message: data.message, raw: data };
        }
        return { success: false, status: AIRTIME_CASH_STATUS.FAILED, message: data.message || 'Unable to send OTP.', raw: data };
    }

    async verifyOtp({ otp, phone, network }) {
        const data = await this._post('/api/v1/verify/otp', { networkName: network, sender: phone, otp }, this._authHeaders());
        if (data.code === CODE.SUCCESS) {
            return {
                success: true,
                status: AIRTIME_CASH_STATUS.SUCCESS,
                message: data.message,
                data: {
                    // sessionId is returned HERE, not by generate/otp -- AirtimeToCashService
                    // captures it from this response.
                    sessionId: data.data?.sessionId,
                    // The SIM's real airtime balance/tariff/type -- surfaced to the
                    // customer so they can see, before a transfer is attempted, whether
                    // the phone actually has enough airtime to convert.
                    airtimeBalance: data.data?.airtimeBalance,
                    tariff: data.data?.tariff,
                    type: data.data?.type
                },
                raw: data
            };
        }
        return { success: false, status: AIRTIME_CASH_STATUS.FAILED, message: data.message || 'Invalid OTP.', raw: data };
    }

    async checkAvailability({ network, amount }) {
        const data = await this._post('/api/v1/check/quota/availability', { networkName: network, amount }, this._authHeaders());
        // Documented anomaly: this endpoint's own "Success Response" example is
        // { code: 5030, message: "Recipient(s) Available" } -- even though the
        // top-level response-code table defines 5030 generically as "Service/
        // Recipient is unavailable". Trusting the endpoint's own literal example
        // over the generic table for this one case, but only when the message
        // actually confirms availability -- anything else on code 5030 is treated
        // as the generic table's meaning (unavailable).
        const message = String(data.message || '');
        const isDocumentedAvailableException = data.code === CODE.UNAVAILABLE && /available/i.test(message) && !/not\s+available|unavailable/i.test(message);
        if (data.code === CODE.SUCCESS || isDocumentedAvailableException) {
            return { success: true, status: AIRTIME_CASH_STATUS.SUCCESS, message: data.message, raw: data };
        }
        return { success: false, status: AIRTIME_CASH_STATUS.FAILED, message: data.message || 'Recipient/quota unavailable right now.', raw: data };
    }

    async transfer({ network, phone, amount, transferPin, sessionId, reference }) {
        if (!sessionId) {
            throw new AirtimeBridgeApiError('No sessionId available for transfer (OTP was never verified for this transaction).');
        }
        const data = await this._post(
            '/api/v1/transfer/airtime',
            { networkName: network, sender: phone, amount, reference, pin: transferPin, sessionId },
            this._authHeaders()
        );

        if (data.code === CODE.SUCCESS) {
            return {
                success: true,
                status: AIRTIME_CASH_STATUS.SUCCESS,
                message: data.message,
                data: {
                    // No distinct provider-side transaction ID is documented in the
                    // transfer response -- `reference` (ours, sent in the request) is
                    // the only correlator AirtimeBridge's docs show.
                    providerReference: reference,
                    // Provider's own conversion accounting -- AirtimeToCashService
                    // stores these separately from the 9jaSub-calculated payout for
                    // audit purposes; it never overwrites tenant pricing with them.
                    amountConverted: data.data?.amountConverted,
                    recipient: data.data?.recipient,
                    balanceBefore: data.data?.balanceBefore,
                    balanceAfter: data.data?.balanceAfter,
                    automationCharges: data.data?.automationCharges
                },
                raw: data
            };
        }

        // 4000 (pending, "not sure of delivery -- needs manual intervention") is the
        // provider's own definition of our MANUAL_REVIEW case, not a guessed
        // failure. 4290 (rate limited) is also ambiguous here, specifically for
        // this endpoint, because the docs do not state whether a rate-limited
        // transfer request ever reached the network before being rejected --
        // safer to review manually than assume nothing happened. 4010 (session
        // expired) is a definite pre-money-movement rejection -- the session was
        // no longer valid to use, so nothing was sent; the customer must restart
        // from a fresh OTP (a new transaction), never a blind retry of this one.
        const KNOWN_DEFINITE_FAILURES = new Set([CODE.FAILED, CODE.SESSION_EXPIRED, CODE.FORBIDDEN, CODE.UNAVAILABLE]);

        if (data.code === CODE.PENDING || data.code === CODE.TOO_MANY_REQUESTS) {
            return { success: false, status: AIRTIME_CASH_STATUS.AMBIGUOUS, message: data.message || 'Transfer outcome could not be confirmed.', data: { providerReference: reference }, raw: data };
        }

        if (KNOWN_DEFINITE_FAILURES.has(data.code)) {
            return { success: false, status: AIRTIME_CASH_STATUS.FAILED, message: data.message || 'Transfer failed.', data: { providerReference: reference }, raw: data };
        }

        // Any other/missing code is not one of the documented outcomes at all --
        // a malformed or unrecognized response is exactly as uncertain as a 4000,
        // never guessed as a clean failure.
        return { success: false, status: AIRTIME_CASH_STATUS.AMBIGUOUS, message: data.message || 'Unrecognized provider response; outcome could not be confirmed.', data: { providerReference: reference }, raw: data };
    }

    /**
     * POST /api/v1/login/with/session/id -- re-validates a previously-issued
     * sessionId and returns current SIM/session state (airtimeBalance, tariff,
     * type). NOT wired into the main OTP -> verify -> availability -> transfer
     * flow, since nothing in that flow needs session restoration (the same
     * sessionId from verifyOtp is used immediately). Available for a future
     * admin-assisted manual-review diagnostic (e.g. confirming a session is still
     * valid before an admin resolves a MANUAL_REVIEW transaction) -- called only
     * where explicitly needed, never automatically.
     */
    async loginWithSessionId({ network, phone, sessionId }) {
        if (!sessionId) {
            throw new AirtimeBridgeApiError('No sessionId provided for session login.');
        }
        const data = await this._post(
            '/api/v1/login/with/session/id',
            { networkName: network, sender: phone, sessionId },
            this._authHeaders()
        );
        if (data.code === CODE.SUCCESS) {
            return {
                success: true,
                status: AIRTIME_CASH_STATUS.SUCCESS,
                message: data.message,
                data: { sessionId: data.data?.sessionId, airtimeBalance: data.data?.airtimeBalance, tariff: data.data?.tariff, type: data.data?.type },
                raw: data
            };
        }
        return { success: false, status: AIRTIME_CASH_STATUS.FAILED, message: data.message || 'Session is no longer valid.', raw: data };
    }

    async checkStatus() {
        throw new ProviderContractMissingError(
            'checkStatus',
            'no transaction-status-by-reference endpoint (or webhook) is documented. ' +
            'POST /api/v1/login/with/session/id re-validates a SIM session but does not ' +
            'report a specific past transfer\'s outcome, so it cannot serve this purpose. ' +
            'A MANUAL_REVIEW transaction from an ambiguous transfer response must be ' +
            'resolved by an admin (see adminResolveManualReview) until AirtimeBridge ' +
            'documents a real requery mechanism.'
        );
    }
}

export default AirtimeBridgeProvider;
