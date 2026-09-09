// Contract every Airtime-to-Cash provider must implement. AirtimeToCashService.js
// (the business logic) calls only these methods -- it never knows which concrete
// provider is behind them, so a second provider can be added later (see
// providers/index.js) without touching the service, controllers, or routes.
//
// Every method must resolve to the same normalized shape:
//   { success: boolean, status: 'success'|'failed'|'pending'|'ambiguous', message: string, data?: object, raw?: object }
// `raw` is the provider's original response, kept for admin/audit purposes only --
// callers must never forward `raw` to a customer-facing response, and must never let
// `raw` contain (or must strip) the OTP/PIN values that were sent in the request that
// produced it.
//
// This mirrors the normalized-response convention already used by the existing VTU
// providers (see services/providers/reloadly.js: `{success, reference, message, data}`).
export class AirtimeToCashProviderInterface {
    /**
     * Ask the provider to send an OTP to the customer's phone for this network.
     * @returns {Promise<{success, status, message, data:{sessionId?}}>}
     */
    async requestOtp({ network, phone, amount, sandbox }) {
        throw new Error('requestOtp() not implemented');
    }

    /**
     * Verify the OTP the customer entered against the provider's session.
     * @returns {Promise<{success, status, message, data:object}>}
     */
    async verifyOtp({ sessionId, otp, phone, network }) {
        throw new Error('verifyOtp() not implemented');
    }

    /**
     * Check whether the provider can currently accept a transfer of this size/network
     * (quota / recipient availability), before the customer commits.
     * @returns {Promise<{success, status, message, data:object}>}
     */
    async checkAvailability({ sessionId, network, phone, amount }) {
        throw new Error('checkAvailability() not implemented');
    }

    /**
     * Submit the actual airtime transfer. `transferPin` is the customer's airtime
     * transfer PIN -- pass-through only, must never be logged, stored, or echoed back.
     * `reference` is 9jaSub's own transaction reference; AirtimeBridge's documented
     * /transfer/airtime endpoint requires a caller-supplied unique reference
     * (10-40 chars), which is also what lets a provider that supports it dedupe a
     * retried call -- always pass the transaction's own `reference`, never a
     * freshly generated one.
     * @returns {Promise<{success, status, message, data:{providerReference?}}>}
     */
    async transfer({ sessionId, network, phone, amount, transferPin, reference }) {
        throw new Error('transfer() not implemented');
    }

    /**
     * Re-query the status of a previously submitted transfer (used by the
     * reconciliation job for PROCESSING/MANUAL_REVIEW transactions).
     * @returns {Promise<{success, status, message, data:object}>}
     */
    async checkStatus({ providerReference, sessionId }) {
        throw new Error('checkStatus() not implemented');
    }
}

export const AIRTIME_CASH_STATUS = Object.freeze({
    SUCCESS: 'success',
    FAILED: 'failed',
    PENDING: 'pending',
    AMBIGUOUS: 'ambiguous'
});
