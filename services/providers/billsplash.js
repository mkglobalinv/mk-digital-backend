import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration — credentials loaded from environment only, never hardcoded.
// ─────────────────────────────────────────────────────────────────────────────
const BILLSPLASH_BASE_URL = (process.env.BILLSPLASH_BASE_URL || 'https://billsplash.com/api').replace(/\/$/, '');
const BILLSPLASH_API_KEY  = process.env.BILLSPLASH_API_KEY;

// ─────────────────────────────────────────────────────────────────────────────
// Axios instance — Bearer token auth, JSON headers, 30 s timeout.
// Source: "Authorization: Bearer YOUR_API_KEY" — documented in project brief.
// ─────────────────────────────────────────────────────────────────────────────
const billsplashClient = axios.create({
    baseURL: BILLSPLASH_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Accept':       'application/json'
    }
});

// Read API key at request time — avoids ESM module-load-time caching issues
// and supports test environment key overrides.
billsplashClient.interceptors.request.use((config) => {
    const key = process.env.BILLSPLASH_API_KEY;
    if (key) {
        config.headers['Authorization'] = `Bearer ${key}`;
    }
    return config;
});

// ─────────────────────────────────────────────────────────────────────────────
// Security helpers — strip secrets and sensitive fields before logging.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns headers safe to log — Authorization value is always redacted.
 * @param {object} headers
 * @returns {object}
 */
const maskHeaders = (headers = {}) => ({
    ...headers,
    Authorization: '[REDACTED]'
});

/**
 * Returns a payload safe to log — NIN, BVN, and full phone numbers are masked.
 * @param {object} payload
 * @returns {object}
 */
const maskPayload = (payload = {}) => {
    const safe = { ...payload };
    if (safe.nin)   safe.nin   = `****${String(safe.nin).slice(-4)}`;
    if (safe.bvn)   safe.bvn   = `****${String(safe.bvn).slice(-4)}`;
    if (safe.phone) safe.phone = `${String(safe.phone).slice(0, 4)}****${String(safe.phone).slice(-2)}`;
    return safe;
};

// ─────────────────────────────────────────────────────────────────────────────
// Request ID generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a unique Billsplash request reference.
 * @returns {string}
 */
const generateRequestId = () => 'BS' + Date.now() + Math.floor(Math.random() * 10000);

// ─────────────────────────────────────────────────────────────────────────────
// Exponential-backoff delay helper
// ─────────────────────────────────────────────────────────────────────────────
const backoffDelay = (attempt) => new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));

// ─────────────────────────────────────────────────────────────────────────────
// POST with retry — mirrors peyflexV2.js postWithRetry exactly.
// Retries on: 429, 500, 502, 503, 504, ECONNABORTED. Max 2 retries.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Robust HTTP POST wrapper with exponential backoff and JSON validation.
 * @param {string} endpoint - Relative path (e.g. '/airtime/topup')
 * @param {object} payload  - Request body
 * @param {number} [maxRetries=2]
 * @returns {Promise<{success: boolean, status: string, data: any, httpStatus: number|null}>}
 */
const postWithRetry = async (endpoint, payload, maxRetries = 2) => {
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            console.log(`\n======================================================`);
            console.log(`[BACKEND -> BILLSPLASH] OUTBOUND REQUEST LOGGING`);
            console.log(`Endpoint: ${endpoint} (Attempt ${attempt + 1})`);
            console.log(`Payload:`, JSON.stringify(maskPayload(payload), null, 2));
            console.log(`======================================================\n`);

            const response = await billsplashClient.post(endpoint, payload);

            // Guard against HTML error pages returned with 200
            if (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<')) {
                throw new Error('Received HTML instead of JSON');
            }

            console.log(`\n======================================================`);
            console.log(`[BILLSPLASH -> BACKEND] INBOUND RESPONSE SUCCESS`);
            console.log(`Status: ${response.status}`);
            console.log(`Body:`, JSON.stringify(response.data, null, 2));
            console.log(`======================================================\n`);

            return { success: true, status: response.status, data: response.data };
        } catch (error) {
            const isTimeout  = error.code === 'ECONNABORTED';
            const httpStatus = error.response ? error.response.status : null;
            const errorData  = error.response ? error.response.data  : null;

            console.log(`\n======================================================`);
            console.log(`[BILLSPLASH -> BACKEND] INBOUND RESPONSE ERROR`);
            console.log(`Status: ${httpStatus}`);
            console.log(`Body:`, JSON.stringify(errorData, null, 2));
            console.log(`======================================================\n`);

            console.error(`[Billsplash] POST ${endpoint} error:`, error.message, httpStatus || '');

            // Retry on rate-limit and server errors with exponential backoff
            const isRetryable = isTimeout ||
                                httpStatus === 429 ||
                                (httpStatus >= 500 && httpStatus <= 504);

            if (attempt < maxRetries && isRetryable) {
                console.log(`[Billsplash] Retrying (attempt ${attempt + 1}) after backoff...`);
                await backoffDelay(attempt);
                attempt++;
                continue;
            }

            // 4xx (except 429) = definitive failure; timeout/5xx = unknown
            let finalStatus = 'failed';
            if (isTimeout || (httpStatus >= 500 && httpStatus <= 504) || httpStatus === 429) {
                finalStatus = 'unknown';
            }

            return {
                success:    false,
                status:     finalStatus,
                message:    (errorData && (errorData.message || errorData.msg || errorData.error)) || error.message,
                data:       errorData,
                httpStatus
            };
        }
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET with retry — mirrors postWithRetry for read endpoints.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Robust HTTP GET wrapper with exponential backoff and JSON validation.
 * @param {string} endpoint  - Relative path
 * @param {object} [params]  - Query string params
 * @param {number} [maxRetries=2]
 * @returns {Promise<{success: boolean, status: string, data: any, httpStatus: number|null}>}
 */
const getWithRetry = async (endpoint, params = {}, maxRetries = 2) => {
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            console.log(`\n======================================================`);
            console.log(`[BACKEND -> BILLSPLASH] OUTBOUND GET REQUEST`);
            console.log(`Endpoint: ${endpoint} (Attempt ${attempt + 1})`);
            console.log(`Params:`, JSON.stringify(maskPayload(params), null, 2));
            console.log(`======================================================\n`);

            const response = await billsplashClient.get(endpoint, { params });

            if (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<')) {
                throw new Error('Received HTML instead of JSON');
            }

            console.log(`\n======================================================`);
            console.log(`[BILLSPLASH -> BACKEND] INBOUND RESPONSE SUCCESS`);
            console.log(`Status: ${response.status}`);
            console.log(`Body:`, JSON.stringify(response.data, null, 2));
            console.log(`======================================================\n`);

            return { success: true, status: response.status, data: response.data };
        } catch (error) {
            const isTimeout  = error.code === 'ECONNABORTED';
            const httpStatus = error.response ? error.response.status : null;
            const errorData  = error.response ? error.response.data  : null;

            console.error(`[Billsplash] GET ${endpoint} error:`, error.message, httpStatus || '');

            const isRetryable = isTimeout ||
                                httpStatus === 429 ||
                                (httpStatus >= 500 && httpStatus <= 504);

            if (attempt < maxRetries && isRetryable) {
                console.log(`[Billsplash] Retrying GET (attempt ${attempt + 1}) after backoff...`);
                await backoffDelay(attempt);
                attempt++;
                continue;
            }

            let finalStatus = 'failed';
            if (isTimeout || (httpStatus >= 500 && httpStatus <= 504) || httpStatus === 429) {
                finalStatus = 'unknown';
            }

            return {
                success:    false,
                status:     finalStatus,
                message:    (errorData && (errorData.message || errorData.msg || errorData.error)) || error.message,
                data:       errorData,
                httpStatus
            };
        }
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Response normalizer — converts Billsplash response into the project standard.
// Standard format: { success, status, reference, data, message?, provider_used }
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes a raw Billsplash API response into the platform's standard shape.
 * @param {object}  result      - Raw result from postWithRetry / getWithRetry
 * @param {string}  reference   - Our internal request ID
 * @param {boolean} [strict]    - When true, treats any non-success as failed
 * @returns {{success: boolean, status: string, reference: string, data: any, message?: string, provider_used: string}}
 */
const normalizeResponse = (result, reference, strict = false) => {
    if (!result.success) {
        return {
            success:      false,
            status:       result.status || 'failed',
            reference,
            message:      result.message || 'Provider communication error',
            data:         result.data,
            provider_used: 'billsplash'
        };
    }

    const data       = result.data;
    // Billsplash documented success indicators (from brief: status field)
    const statusStr  = String(data?.status || '').toLowerCase();
    const isSuccess  = statusStr === 'success' || statusStr === 'successful' ||
                       data?.status === true  || statusStr === 'completed';
    const isPending  = statusStr === 'pending' || statusStr === 'processing';

    if (isSuccess) {
        return {
            success:      true,
            status:       'success',
            reference:    data?.transaction_id || data?.reference || reference,
            data,
            provider_used: 'billsplash'
        };
    }

    if (isPending && !strict) {
        return {
            success:      false,
            status:       'unknown',
            reference:    data?.transaction_id || data?.reference || reference,
            message:      data?.message || data?.msg || 'Transaction is processing',
            data,
            provider_used: 'billsplash'
        };
    }

    return {
        success:      false,
        status:       'failed',
        reference,
        message:      data?.message || data?.msg || data?.error || 'Transaction failed',
        data,
        provider_used: 'billsplash'
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// Guard helper — returns early if API key is missing
// ─────────────────────────────────────────────────────────────────────────────
const guardApiKey = (reference) => {
    // Read at call time — not from module-level constant — so test overrides work.
    const key = process.env.BILLSPLASH_API_KEY;
    if (!key) {
        console.error('[Billsplash] BILLSPLASH_API_KEY is not set in environment variables.');
        return {
            success:      false,
            status:       'failed',
            reference,
            message:      'Billsplash API key not configured',
            provider_used: 'billsplash'
        };
    }
    return null;
};

// =============================================================================
// AIRTIME
// Documented source: billsplash.com public API section
//   POST /api/airtime_purchase.php
//   Body: { "network": "mtn", "phone": "08012345678", "amount": 500 }
// =============================================================================

/**
 * Purchase airtime via Billsplash.
 *
 * @param {string} network - Network code in lowercase (e.g. 'mtn', 'glo', 'airtel', '9mobile')
 * @param {number} amount  - Airtime amount in Naira
 * @param {string} phone   - Recipient phone number (e.g. '08012345678')
 * @returns {Promise<{success: boolean, status: string, reference: string, data: any, provider_used: string}>}
 */
export const buyAirtimeWithBillsplash = async (network, amount, phone) => {
    const reference = generateRequestId();
    const guard     = guardApiKey(reference);
    if (guard) return guard;

    const startTime = Date.now();

    // Billsplash uses network_id. Common mapping: mtn=1, glo=2, 9mobile=3, airtel=4
    const networkMap = { 'mtn': 1, 'glo': 2, '9mobile': 3, 'airtel': 4 };
    const networkId = networkMap[String(network).toLowerCase()] || 1;

    const payload = {
        network_id: networkId,
        phone,
        amount:  Number(amount)
    };

    console.log(`[Billsplash] AIRTIME REQ | Reference: ${reference} | Network: ${network} | Amount: ${amount}`);

    const result   = await postWithRetry('/airtime_purchase.php', payload);
    const duration = Date.now() - startTime;

    console.log(`[Billsplash] AIRTIME RES | Reference: ${reference} | Duration: ${duration}ms`);

    return normalizeResponse(result, reference);
};

// =============================================================================
// CABLE TV (Placeholder)
// =============================================================================
export const buyCableTVWithBillsplash = async (cableId, packageId, smartcard, phone) => {
    console.log(`[Billsplash] Cable TV not implemented yet.`);
    return { status: 'failed', message: 'Cable TV not implemented in Billsplash yet.' };
};

// =============================================================================
// ELECTRICITY (Placeholder)
// =============================================================================
export const buyElectricityWithBillsplash = async (discoId, meterType, meterNumber, amount, phone) => {
    console.log(`[Billsplash] Electricity not implemented yet.`);
    return { status: 'failed', message: 'Electricity not implemented in Billsplash yet.' };
};

// =============================================================================
// DATA — Fetch Plans
// Documented source: billsplash.com public API section
//   GET /api/get_data_plans
// =============================================================================

/**
 * Fetch available data plans from Billsplash.
 *
 * @param {string} network - Network identifier (e.g. 'mtn', 'glo')
 * @returns {Promise<{success: boolean, plans?: Array, message?: string}>}
 */
export const fetchDataPlansFromBillsplash = async (network) => {
    const guard = guardApiKey('fetch-plans');
    if (guard) return { success: false, message: guard.message };

    // User instructed to use the method the live server actually accepts (GET).
    // We pass network_id via query string if they accept it, or network.
    const networkMap = { 'mtn': 1, 'glo': 2, '9mobile': 3, 'airtel': 4 };
    const networkId = networkMap[String(network).toLowerCase()] || 1;

    // Use GET as the server mandated: "Method not allowed. Use GET request."
    const result = await getWithRetry('/get_data_plans.php', { network_id: networkId, network });
    
    if (!result.success) {
        return {
            success: false,
            plans: [],
            message: result.message || 'Failed to fetch data plans from Billsplash'
        };
    }
    
    // We expect an array of plans in result.data or result.data.plans based on typical APIs
    // Adjust mapping as soon as real response payload is confirmed.
    return {
        success: true,
        plans: Array.isArray(result.data) ? result.data : (result.data?.plans || []),
        message: 'Plans fetched successfully'
    };
};

// =============================================================================
// DATA — Purchase
// Documented source: billsplash.com public API section
//   POST /api/data_purchase.php
// =============================================================================

/**
 * Purchase a data bundle via Billsplash.
 *
 * @param {string} network - Network code (e.g. 'mtn', 'glo')
 * @param {string} planId  - Provider plan identifier
 * @param {string} phone   - Recipient phone number
 * @returns {Promise<{success: boolean, status: string, reference: string, data: any, provider_used: string}>}
 */
export const buyDataWithBillsplash = async (network, planId, phone) => {
    const reference = generateRequestId();
    const guard     = guardApiKey(reference);
    if (guard) return guard;

    const startTime = Date.now();
    
    // Billsplash uses network_id. Common mapping: mtn=1, glo=2, 9mobile=3, airtel=4
    const networkMap = { 'mtn': 1, 'glo': 2, '9mobile': 3, 'airtel': 4 };
    const networkId = networkMap[String(network).toLowerCase()] || 1;

    const payload = {
        network_id: networkId,
        phone,
        plan_id: planId
    };

    console.log(`[Billsplash] DATA REQ | Reference: ${reference} | Network: ${network} | Plan: ${planId}`);

    const result = await postWithRetry('/data_purchase.php', payload);
    const duration = Date.now() - startTime;

    console.log(`[Billsplash] DATA RES | Reference: ${reference} | Duration: ${duration}ms`);

    return normalizeResponse(result, reference);
};

// =============================================================================
// IDENTITY — NIN Verification
// Documented source: billsplash.com API docs
//   POST /api/nin_verification.php
// =============================================================================

/**
 * Verify a National Identification Number (NIN) via Billsplash.
 *
 * @param {string} nin - 11-digit NIN (will be masked in logs)
 * @returns {Promise<{success: boolean, status: string, reference: string, data: any, provider_used: string}>}
 */
export const verifyNINWithBillsplash = async (nin) => {
    const reference = generateRequestId();
    const guard     = guardApiKey(reference);
    if (guard) return guard;

    const payload = {
        nin: String(nin),
        slip_type: "regular"
    };

    // Strict implementation: as per instructions, use POST /nin_verification.php
    const result = await postWithRetry('/nin_verification.php', payload);
    return normalizeResponse(result, reference);
};

// =============================================================================
// IDENTITY — BVN Verification
// Documented source: billsplash.com API docs
//   POST /api/bvn_verification.php
// =============================================================================

/**
 * Verify a Bank Verification Number (BVN) via Billsplash.
 *
 * @param {string} bvn - 11-digit BVN (will be masked in logs)
 * @returns {Promise<{success: boolean, status: string, reference: string, data: any, provider_used: string}>}
 */
export const verifyBVNWithBillsplash = async (bvn) => {
    const reference = generateRequestId();
    const guard     = guardApiKey(reference);
    if (guard) return guard;

    const payload = {
        bvn: String(bvn),
        slip_type: "premium"
    };

    const result = await postWithRetry('/bvn_verification.php', payload);
    return normalizeResponse(result, reference);
};

// =============================================================================
// IDENTITY — NIN by Phone
// TODO(Billsplash):
//   NIN lookup by phone number — endpoint not publicly documented.
//   Implement after official documentation is available.
// =============================================================================

/**
 * Look up NIN by phone number via Billsplash.
 *
 * @param {string} phone - Phone number (will be partially masked in logs)
 * @returns {Promise<{success: boolean, status: string, reference: string, data: any, provider_used: string}>}
 */
export const verifyNINByPhoneWithBillsplash = async (phone) => {
    const reference = generateRequestId();
    const guard     = guardApiKey(reference);
    if (guard) return guard;

    // TODO(Billsplash):
    // Endpoint not documented.
    // Implement after official documentation is available.
    console.warn(`[Billsplash] verifyNINByPhoneWithBillsplash: endpoint not yet confirmed by documentation.`);
    return {
        success:      false,
        status:       'failed',
        reference,
        message:      'Billsplash NIN-by-phone endpoint not yet documented. Implement after official docs are received.',
        provider_used: 'billsplash'
    };
};

// =============================================================================
// IDENTITY — NIN by Demographics
// Documented source: billsplash.com API docs
//   POST /api/nin_verification.php
// =============================================================================

/**
 * Look up NIN by demographic data via Billsplash.
 *
 * @param {object} params - Demographic fields (e.g. firstname, lastname, dob)
 * @returns {Promise<{success: boolean, status: string, reference: string, data: any, provider_used: string}>}
 */
export const verifyNINByDemographicsWithBillsplash = async (params) => {
    const reference = generateRequestId();
    const guard     = guardApiKey(reference);
    if (guard) return guard;

    const payload = {
        slip_type: "premium",
        firstname: params.firstname || params.firstName,
        lastname: params.lastname || params.lastName || params.surname,
        dob: params.dob || params.birthDate,
        gender: params.gender ? String(params.gender).toLowerCase() : 'male',
        customer_reference: reference
    };

    const result = await postWithRetry('/nin_verification.php', payload);
    return normalizeResponse(result, reference);
};

// =============================================================================
// IDENTITY — IPE Clearance: Submit
// Documented source: billsplash.com API docs
//   POST /api/ipe_clearance.php (assuming /api/ prefix as per instructions)
// =============================================================================

/**
 * Submit an IPE (Identity and Population Enrollment) clearance request.
 *
 * Known response fields (from project brief): done, trackingID, transaction_id.
 * On success: done=true. On pending: done=false + trackingID for polling.
 *
 * @param {object} params - IPE clearance request parameters (trackingID, pin)
 * @returns {Promise<{success: boolean, status: string, reference: string, trackingID?: string, transaction_id?: string, data: any, provider_used: string}>}
 */
export const submitIPEClearanceWithBillsplash = async (params) => {
    const reference = generateRequestId();
    const guard     = guardApiKey(reference);
    if (guard) return guard;

    const payload = {
        trackingID: params.trackingID || params.trackingId,
        pin: params.pin
    };

    // Strict implementation: use POST /ipe_clearance.php
    const result = await postWithRetry('/ipe_clearance.php', payload);
    
    // IPE endpoints often return done: true/false at the root level
    if (result.success && result.data) {
        return {
            ...normalizeResponse(result, reference),
            done: result.data.done === true,
            trackingID: result.data.trackingID,
            transaction_id: result.data.transaction_id
        };
    }

    return normalizeResponse(result, reference);
};

// =============================================================================
// IDENTITY — IPE Clearance: Poll Status
// Partially documented: The project brief confirms polling uses:
//   done=true  → completed successfully
//   done=false → still processing, continue polling via trackingID
// Exact endpoint path is not confirmed in public documentation.
// =============================================================================

/**
 * Poll the status of a pending IPE clearance request.
 *
 * @param {string} trackingId - The trackingID returned from submitIPEClearanceWithBillsplash
 * @returns {Promise<{success: boolean, status: string, done: boolean, data: any, provider_used: string}>}
 */
export const pollIPEStatus = async (trackingId) => {
    const guard = guardApiKey(trackingId);
    if (guard) return { ...guard, done: false };

    // TODO(Billsplash):
    // Exact endpoint path not publicly documented.
    // Known fields from brief: done (boolean), trackingID, transaction_id.
    // Implement after official documentation is available.
    console.warn(`[Billsplash] pollIPEStatus: endpoint not yet confirmed by documentation. TrackingID: ${trackingId}`);
    return {
        success:      false,
        status:       'unknown',
        done:         false,
        message:      'Billsplash IPE poll endpoint not yet documented. Implement after official docs are received.',
        provider_used: 'billsplash'
    };
};

// =============================================================================
// REQUERY — Transaction Status
// TODO(Billsplash):
//   The endpoint and parameters for querying a transaction's status are not
//   publicly documented. Implement after official documentation is available.
// =============================================================================

/**
 * Check the status of a Billsplash transaction for requery resolution.
 * Used by requeryService.js to resolve pending/unknown transactions.
 *
 * @param {string} reference - The provider reference or transaction_id
 * @returns {Promise<{status: 'success'|'failed'|'pending'|'unknown', data?: any, message?: string}>}
 */
export const requeryBillsplash = async (reference) => {
    const guard = guardApiKey(reference);
    if (guard) return { status: 'unknown', message: guard.message };

    // TODO(Billsplash):
    // Transaction status endpoint not publicly documented.
    // Implement after official documentation is available.
    // Expected: returns { status, transaction_id, ... }
    console.warn(`[Billsplash] requeryBillsplash: endpoint not yet confirmed by documentation. Reference: ${reference}`);
    return {
        status:  'unknown',
        message: 'Billsplash requery endpoint not yet documented. Implement after official docs are received.'
    };
};

// =============================================================================
// WALLET BALANCE — Health / Monitoring
// TODO(Billsplash):
//   The wallet balance endpoint is not publicly documented.
//   Implement after official documentation is available.
// =============================================================================

/**
 * Fetch the Billsplash wallet balance for provider health monitoring.
 * Called by providerMonitoringService.js during scheduled polling.
 *
 * @returns {Promise<number>} Balance in Naira
 * @throws {Error} If the balance cannot be fetched or parsed
 */
export const fetchBillsplashBalance = async () => {
    // Read at call time so that runtime env changes are respected.
    if (!process.env.BILLSPLASH_API_KEY) {
        throw new Error('BILLSPLASH_API_KEY is not set in environment variables.');
    }

    // TODO(Billsplash):
    // Wallet balance endpoint not publicly documented.
    // Implement after official documentation is available.
    // Expected pattern from other providers: GET /wallet/balance → { balance: number }
    throw new Error(
        'Billsplash wallet balance endpoint not yet documented. ' +
        'Implement after official documentation is available. ' +
        'Provider monitoring will treat Billsplash as unknown until implemented.'
    );
};

// =============================================================================
// UNDOCUMENTED SERVICES — Explicit Placeholders
// The following Billsplash services are advertised on billsplash.com but their
// API endpoints, request fields, and response shapes are not publicly documented.
// These will be implemented only when official documentation is provided.
// =============================================================================

// TODO(Billsplash):
// Cable TV subscription — endpoint not documented.
// Implement after official documentation is available.

// TODO(Billsplash):
// Electricity bill payment — endpoint not documented.
// Implement after official documentation is available.

// TODO(Billsplash):
// Exam PINs (WAEC, NECO, NABTEB) — endpoint not documented.
// Implement after official documentation is available.

// TODO(Billsplash):
// Bulk SMS — endpoint not documented.
// Implement after official documentation is available.

// TODO(Billsplash):
// Transaction history — endpoint not documented.
// Implement after official documentation is available.

// TODO(Billsplash):
// CAC Registration, NPC Attestation, TIN Application, Newspaper Publication —
// all advertised on billsplash.com but API endpoints not publicly documented.
// Implement after official documentation is available.
