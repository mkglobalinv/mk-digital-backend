import { AirtimeToCashProviderInterface } from '../providerInterface.js';

// ============================================================================
// STOP -- REAL PROVIDER CONTRACT NOT YET AVAILABLE
// ============================================================================
// This file implements the AirtimeToCashProviderInterface for AirtimeBridge
// (https://automation.airtimetocash.com), but the actual API contract --
// endpoint paths, request/response bodies, auth header format, sessionId
// lifecycle, quota mechanism, network identifiers, transfer PIN field name,
// webhook shape -- has not been implemented, because it has not been seen.
//
// The documentation URL (https://automation.airtimetocash.com/api/documentation)
// is blocked by this environment's network egress proxy (confirmed via WebFetch:
// EGRESS_BLOCKED, and via the proxy's own status endpoint, which does not list
// this host in any reachable allowlist). No endpoint, field name, header, or
// behavior below has been invented to fill that gap.
//
// Every method here throws ProviderContractMissingError instead of guessing.
// Per the explicit instruction governing this feature: "Do not assume undocumented
// endpoints exist... If an undocumented endpoint is required, stop and report
// exactly what is missing." This file IS that stop-and-report, made durable in
// code so the system fails loudly and specifically instead of silently doing the
// wrong thing against a real provider.
//
// This provider is never reached by a live request today: AirtimeCashProviderConfig
// .isActive defaults to false, and the customer-facing routes refuse to start a
// transaction while it is false (see AirtimeToCashService.assertServiceEnabled).
// It only becomes reachable once an admin explicitly flips isActive to true --
// which per the brief must happen only after the API contract below has been
// filled in and verified.
//
// TO COMPLETE THIS FILE, the following must be supplied (from the real docs, not
// inferred):
//   1. Base URL + auth: exact header name/format for the API token (Authorization:
//      Bearer? X-Api-Key? request-body field?).
//   2. POST endpoint + body to request an OTP (network, phone, amount -- exact
//      field names and casing).
//   3. POST endpoint + body to verify an OTP, and how the sessionId is returned
//      and must be resupplied on subsequent calls.
//   4. Endpoint for quota / recipient-availability check, and its request/response
//      shape (or confirmation that no separate step exists and availability is
//      only known at transfer time).
//   5. POST endpoint + body to submit the transfer, including the exact field name
//      for the customer's airtime transfer PIN, and the network identifiers/codes
//      AirtimeBridge expects (their own MTN/AIRTEL/GLO/9MOBILE codes, which may not
//      match 9jaSub's internal ones).
//   6. Endpoint + response shape to re-query a transfer's status by reference/
//      sessionId (for the reconciliation job), OR confirmation that AirtimeBridge
//      is webhook-only with no working requery endpoint (as is already true for
//      one of 9jaSub's existing VTU providers, PeyFlex -- see
//      services/requeryService.js's handling of it).
//   7. Whether a webhook exists, its payload shape, and how to verify its
//      authenticity (signature header, shared secret, IP allowlist, etc).
//   8. Whether AirtimeBridge itself ever pays the end customer directly (in which
//      case bank/account fields flow straight through to AirtimeBridge), or
//      whether AirtimeBridge only converts airtime into AirtimeBridge's own
//      balance/session with settlement to 9jaSub happening on a separate,
//      undocumented channel -- this determines whether 9jaSub's own payout phase
//      (deliberately out of scope for this implementation) is even meaningful.
// ============================================================================

export class ProviderContractMissingError extends Error {
    constructor(method, detail) {
        super(
            `AirtimeBridge.${method}() cannot run: the real API contract is unknown ` +
            `(https://automation.airtimetocash.com/api/documentation is unreachable from this ` +
            `environment and has not been supplied). ${detail}`
        );
        this.name = 'ProviderContractMissingError';
        this.code = 'AIRTIME_CASH_PROVIDER_CONTRACT_MISSING';
    }
}

export class AirtimeBridgeProvider extends AirtimeToCashProviderInterface {
    constructor({ apiBaseUrl, apiToken, isTestMode } = {}) {
        super();
        this.apiBaseUrl = apiBaseUrl;
        this.apiToken = apiToken; // never logged, never returned from any method
        this.isTestMode = isTestMode;
    }

    async requestOtp() {
        throw new ProviderContractMissingError(
            'requestOtp',
            'Need the documented OTP-request endpoint path and its request/response field names.'
        );
    }

    async verifyOtp() {
        throw new ProviderContractMissingError(
            'verifyOtp',
            'Need the documented OTP-verify endpoint path, and how sessionId is issued/reused.'
        );
    }

    async checkAvailability() {
        throw new ProviderContractMissingError(
            'checkAvailability',
            'Need the documented quota/recipient-availability endpoint (or confirmation none exists).'
        );
    }

    async transfer() {
        throw new ProviderContractMissingError(
            'transfer',
            'Need the documented transfer endpoint, its request body (incl. the transfer PIN field name), and network codes.'
        );
    }

    async checkStatus() {
        throw new ProviderContractMissingError(
            'checkStatus',
            'Need the documented status/requery endpoint (or confirmation that only a webhook resolves status).'
        );
    }
}

export default AirtimeBridgeProvider;
