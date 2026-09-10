import axios from "axios";
import ProviderStatus from "../../models/ProviderStatus.js";

// ============================================================================
// Ogdams SimHosting provider adapter, implemented against the vendor's own
// published API documentation (Base URL / Authentication / Network IDs /
// Endpoints / Response Format & Codes / Webhooks sections, as supplied
// directly -- not inferred, not guessed).
//
// Isolated by design: this file is the ONLY place that knows Ogdams' request/
// response shapes. services/switcher.js and everything above it only ever
// sees the same {success, status, reference, data, message, provider} shape
// every other provider file in services/providers/ already returns.
// ============================================================================

const OGDAMS_API_BASE_URL = (process.env.OGDAMS_API_BASE_URL || "https://simhosting.ogdams.ng/api/v1").replace(/\/$/, "");
const OGDAMS_API_KEY = process.env.OGDAMS_API_KEY;
const OGDAMS_ENABLED = process.env.OGDAMS_ENABLED === "true";

// Documented: Network IDs 1=MTN, 2=Airtel, 3=Glo, 4=T2Mobile (formerly 9mobile,
// API may still return "9mobile" for this network). Internal network strings
// follow this codebase's existing convention (models/DataPlan.js:8): 'MTN',
// 'AIRTEL', 'GLO', '9MOBILE'.
const NETWORK_NAME_TO_ID = { MTN: 1, AIRTEL: 2, GLO: 3, "9MOBILE": 4 };
const NETWORK_ID_TO_NAME = { 1: "MTN", 2: "AIRTEL", 3: "GLO", 4: "9MOBILE" };

// Documented response codes (Response Format & Codes section).
const CODE = Object.freeze({
    SUCCESS: 200,
    QUEUED: 201,
    PROCESSING: 202,
    FAILED: 424,
    AUTH_ERROR: 401,
    NOT_FOUND: 404
});

export class OgdamsConfigError extends Error {
    constructor(message) {
        super(message);
        this.name = "OgdamsConfigError";
    }
}

function networkNameToId(network) {
    const id = NETWORK_NAME_TO_ID[String(network).toUpperCase()];
    if (!id) throw new Error(`Unsupported network for Ogdams: ${network}`);
    return id;
}

// Never log a raw phone number -- mask everything but the first 5 and last 2
// digits, matching the masking convention used elsewhere in this codebase
// (services/airtimeToCash/security.js's maskPhone).
function maskPhone(phone) {
    const str = String(phone || "");
    if (str.length <= 7) return str;
    return `${str.slice(0, 5)}${"*".repeat(str.length - 7)}${str.slice(-2)}`;
}

function assertConfigured() {
    if (!OGDAMS_ENABLED) {
        throw new OgdamsConfigError("Ogdams provider is disabled (OGDAMS_ENABLED is not 'true').");
    }
    if (!OGDAMS_API_KEY) {
        throw new OgdamsConfigError("Ogdams provider is enabled but OGDAMS_API_KEY is not configured.");
    }
}

/**
 * Called once at startup (see server.js) so a misconfiguration is visible in
 * logs immediately rather than surfacing as a confusing per-transaction error
 * the first time a customer tries to use it.
 */
export function validateOgdamsConfig() {
    if (!OGDAMS_ENABLED) return { enabled: false };
    if (!OGDAMS_API_KEY) {
        console.error("[Ogdams] OGDAMS_ENABLED=true but OGDAMS_API_KEY is missing. Ogdams purchases will fail until this is set.");
        return { enabled: true, configured: false };
    }
    return { enabled: true, configured: true };
}

/**
 * Idempotent upsert so the existing admin provider list/monitoring (GET/PUT
 * /api/admin/providers, models/ProviderStatus.js) has an 'ogdams' document to
 * show, without ever overwriting one that already exists (an admin's
 * manualDisabled/priority choices are never clobbered by a restart).
 * priority:3 by default -- lowest priority among peyflex(1)/clubkonnect(2)/
 * ogdams(3) -- consistent with "Do NOT automatically make Ogdams the primary
 * provider until testing is complete."
 */
export async function ensureOgdamsProviderStatus() {
    try {
        await ProviderStatus.findOneAndUpdate(
            { providerName: "ogdams" },
            { $setOnInsert: { providerName: "ogdams", priority: 3, apiStatus: OGDAMS_ENABLED ? "online" : "offline", isAvailable: OGDAMS_ENABLED } },
            { upsert: true, setDefaultsOnInsert: true }
        );
    } catch (err) {
        console.error("[Ogdams] Failed to ensure ProviderStatus document:", err.message);
    }
}

const ogdamsClient = axios.create({
    baseURL: OGDAMS_API_BASE_URL,
    timeout: 30000
});

function authHeaders() {
    return { Authorization: `Bearer ${OGDAMS_API_KEY}`, Accept: "application/json", "Content-Type": "application/json" };
}

/**
 * Maps a raw Ogdams response (or thrown axios error) into one of the internal
 * error categories requested for this integration. Only categorizes what the
 * documented response actually distinguishes (HTTP code + the native
 * {status,code,data:{msg}} envelope) -- 424 is documented as a generic
 * "provider returned an error" with no finer-grained sub-codes in the
 * supplied docs, so it maps to the generic TRANSACTION_FAILED rather than a
 * guessed INSUFFICIENT_PROVIDER_BALANCE / INVALID_RECIPIENT / INVALID_PLAN
 * distinction the docs don't actually give us. The raw body is logged
 * server-side (never returned to the customer) so real 424 message text can
 * be observed and this mapping refined later with evidence, not guesses.
 */
function categorizeError({ httpStatus, bodyCode, timedOut, networkError }) {
    if (timedOut) return "PROVIDER_TIMEOUT";
    if (networkError) return "PROVIDER_UNAVAILABLE";
    const code = bodyCode || httpStatus;
    if (code === CODE.AUTH_ERROR) return "PROVIDER_AUTH_ERROR";
    if (code === CODE.FAILED) return "TRANSACTION_FAILED";
    if (code === CODE.QUEUED || code === CODE.PROCESSING) return "TRANSACTION_PENDING";
    if (code === CODE.NOT_FOUND) return "UNKNOWN_PROVIDER_ERROR";
    return "UNKNOWN_PROVIDER_ERROR";
}

// Clean, customer-safe messages per internal error category -- never the raw
// provider message (per "Do not expose raw provider error messages directly
// to customers").
const CUSTOMER_MESSAGE = {
    PROVIDER_AUTH_ERROR: "This service is temporarily unavailable. Please try again shortly.",
    PROVIDER_TIMEOUT: "We could not confirm this transaction in time. It is being processed -- check your transaction history shortly.",
    PROVIDER_UNAVAILABLE: "This service is temporarily unavailable. Please try again shortly.",
    TRANSACTION_FAILED: "Transaction failed. You have not been charged.",
    TRANSACTION_PENDING: "Your transaction is processing.",
    UNKNOWN_PROVIDER_ERROR: "Something went wrong. Please try again."
};

/**
 * GET wrapper for read-only, side-effect-free calls (balances, plans) --
 * safe to retry on timeout/5xx since nothing is being vended.
 */
async function ogdamsGet(path, maxRetries = 2) {
    try {
        assertConfigured();
    } catch (err) {
        return { success: false, errorCode: "PROVIDER_UNAVAILABLE", message: CUSTOMER_MESSAGE.PROVIDER_UNAVAILABLE, configError: err.message };
    }
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            const response = await ogdamsClient.get(path, { headers: authHeaders() });
            return { success: true, httpStatus: response.status, data: response.data };
        } catch (err) {
            const isTimeout = err.code === "ECONNABORTED";
            const httpStatus = err.response ? err.response.status : null;
            const isNetworkError = !err.response && !isTimeout;
            if (attempt < maxRetries && (isTimeout || isNetworkError || (httpStatus >= 500 && httpStatus < 600))) {
                await new Promise((resolve) => setTimeout(resolve, 1500));
                attempt++;
                continue;
            }
            const errorCode = categorizeError({ httpStatus, bodyCode: err.response?.data?.code, timedOut: isTimeout, networkError: isNetworkError });
            console.error(`[Ogdams] GET ${path} failed:`, errorCode, err.message);
            if (err.response?.data) {
                // Ogdams' actual error message/body -- logged server-side only
                // (never returned to the customer) so a real failure like "SIM
                // not connected" or "account not activated" is diagnosable
                // instead of only ever seeing the generic HTTP status/code.
                console.error(`[Ogdams] GET ${path} error body:`, JSON.stringify(err.response.data));
            }
            return { success: false, errorCode, message: CUSTOMER_MESSAGE[errorCode], httpStatus };
        }
    }
}

/**
 * POST wrapper for vending calls (/vend/data, /vend/airtime) -- deliberately
 * NEVER retries on timeout or network error. Ogdams documents no
 * transaction-status/requery-by-reference endpoint (the response-code table
 * references a 404 "Transaction not found" case, but no endpoint that could
 * return it is documented among the listed endpoints), so unlike the GET
 * wrapper above, a request that times out here cannot be safely distinguished
 * from one that succeeded server-side -- retrying could double-vend. On any
 * ambiguous outcome this returns status:'unknown' and relies entirely on the
 * Ogdams webhook to resolve it later, exactly the same posture already used
 * for PeyFlex in this codebase (services/providers/peyflex.js's requery stub,
 * peyflexV2.js's 'unknown' status) for the same underlying reason: no real
 * status-check endpoint exists.
 */
async function ogdamsVend(path, payload, label) {
    try {
        assertConfigured();
    } catch (err) {
        return { success: false, status: "failed", errorCode: "PROVIDER_UNAVAILABLE", message: CUSTOMER_MESSAGE.PROVIDER_UNAVAILABLE, configError: err.message };
    }
    const loggable = { ...payload, phoneNumber: payload.phoneNumber ? maskPhone(payload.phoneNumber) : undefined };
    console.log(`[Ogdams] -> ${label}`, JSON.stringify(loggable));
    try {
        const response = await ogdamsClient.post(path, payload, { headers: authHeaders() });
        const body = response.data;
        console.log(`[Ogdams] <- ${label} HTTP ${response.status} code=${body?.code}`);
        if (body?.status === true && body?.code === CODE.SUCCESS) {
            return { success: true, status: "success", reference: body.data?.ref, message: body.data?.msg, data: body };
        }
        if (body?.code === CODE.QUEUED || body?.code === CODE.PROCESSING) {
            // Documented: "Transaction recorded. Expect response in 5 secs" -- this
            // is Ogdams' own way of saying the outcome is not yet final. Never
            // guessed as success; only the webhook (or an admin) can resolve this.
            return { success: false, status: "unknown", reference: body.data?.ref, message: CUSTOMER_MESSAGE.TRANSACTION_PENDING, errorCode: "TRANSACTION_PENDING", data: body };
        }
        // code:false or 424 in the body -- a clean, definite failure. No money
        // was vended (per docs, this is "provider returned an error"), safe to
        // treat as a normal refundable failure.
        const errorCode = categorizeError({ httpStatus: response.status, bodyCode: body?.code });
        console.error(`[Ogdams] ${label} returned a failure body:`, JSON.stringify(body));
        return { success: false, status: "failed", message: CUSTOMER_MESSAGE[errorCode] || CUSTOMER_MESSAGE.TRANSACTION_FAILED, errorCode, data: body };
    } catch (err) {
        const isTimeout = err.code === "ECONNABORTED";
        const httpStatus = err.response ? err.response.status : null;
        const isNetworkError = !err.response && !isTimeout;
        const bodyCode = err.response?.data?.code;
        console.error(`[Ogdams] ${label} threw:`, err.message, httpStatus || "");
        if (err.response?.data) {
            console.error(`[Ogdams] ${label} error body:`, JSON.stringify(err.response.data));
        }

        if (httpStatus === CODE.FAILED) {
            // A definite, documented failure code raised as an HTTP error by axios
            // (non-2xx) -- still a clean failure, not an ambiguous one.
            return { success: false, status: "failed", message: CUSTOMER_MESSAGE.TRANSACTION_FAILED, errorCode: "TRANSACTION_FAILED", data: err.response.data };
        }
        if (httpStatus === CODE.AUTH_ERROR) {
            return { success: false, status: "failed", message: CUSTOMER_MESSAGE.PROVIDER_AUTH_ERROR, errorCode: "PROVIDER_AUTH_ERROR", data: err.response?.data };
        }

        // Timeout, network error, or an unrecognized/5xx response to a VEND call:
        // the request may or may not have reached Ogdams. Never guessed, never
        // retried here -- 'unknown', for the webhook/admin to resolve.
        const errorCode = categorizeError({ httpStatus, bodyCode, timedOut: isTimeout, networkError: isNetworkError });
        return { success: false, status: "unknown", message: CUSTOMER_MESSAGE[errorCode] || CUSTOMER_MESSAGE.UNKNOWN_PROVIDER_ERROR, errorCode, data: err.response?.data };
    }
}

/**
 * GET /get/balances -- wallet & stock balances. vtuMtn/smeMtn/dgMtn are
 * documented as separate stock buckets per vending method; there is no
 * per-network (Airtel/Glo/9mobile) or per-SIM/device breakdown documented.
 */
export async function getOgdamsBalances() {
    const result = await ogdamsGet("/get/balances");
    if (!result.success) return result;
    return { success: true, balances: result.data?.data?.msg || {} };
}

/**
 * GET /get/data/plans -- v1 shape (networkId, planId, name, price, validity).
 * v2-v4 are documented to exist with different grouping/extra fields but
 * their exact shape was not supplied -- only v1 is implemented here.
 */
export async function getOgdamsDataPlans() {
    const result = await ogdamsGet("/get/data/plans");
    if (!result.success) return result;
    const plans = result.data?.data?.msg || [];
    return {
        success: true,
        plans: plans.map((p) => ({
            network: NETWORK_ID_TO_NAME[p.networkId] || String(p.networkId),
            planId: String(p.planId),
            name: p.name,
            price: Number(p.price),
            validity: p.validity
        }))
    };
}

// Confirmed directly by Ogdams support (not inferred, not guessed): these are
// the account's official MTN Data Gifting plan IDs. Gifting is fulfilled from
// the connected MTN SIM's own airtime/MoMo balance -- the Ogdams wallet is
// only charged a small automation fee -- confirming /vend/data (used below
// and in buyDataWithOgdams) is the correct, and only, endpoint for this.
//
// /get/data/plans documents no category/type field, so there is no way to
// distinguish a Gifting plan from an SME/other-method plan in that response
// by inspection alone. This whitelist is the enforcement point: only these
// three plan IDs can ever be synced as Ogdams MTN plans, regardless of what
// else /get/data/plans happens to return mixed in -- keeping this
// integration strictly to Data Gifting, per current scope (no DataShare, no
// SME, no other Ogdams service).
export const MTN_DATA_GIFTING_PLAN_IDS = Object.freeze({
    "20000": "75MB - 1 Day",
    "20002": "1GB - 1 Day",
    "20006": "2GB - 2 Days",
    "20007": "2.5GB - 2 Days",
    "20008": "3.2GB - 2 Days",
    "20013": "1GB - 7 Days",
    "20014": "1.2GB - 7 Days",
    "20015": "1.5GB - 7 Days",
    "20017": "11GB - 7 Days"
});

/**
 * Live MTN plan catalog from Ogdams, filtered to ONLY the confirmed Data
 * Gifting plan IDs above. Real price/name/validity still come from the live
 * API response (never fabricated) -- this only restricts WHICH plan IDs are
 * allowed through, it doesn't invent data for them.
 */
export async function getOgdamsMtnGiftingPlans() {
    const result = await getOgdamsDataPlans();
    if (!result.success) return result;
    const plans = result.plans.filter((p) => p.network === "MTN" && Object.prototype.hasOwnProperty.call(MTN_DATA_GIFTING_PLAN_IDS, p.planId));
    return { success: true, plans };
}

/**
 * POST /vend/data -- vend a data bundle. `reference` is our own internal
 * transaction reference, used as Ogdams' idempotency-relevant reference field
 * (max 40 chars per docs) -- the same reference this app already treats as
 * its own idempotency key (models/Transaction.js's unique `reference` field).
 */
export async function buyDataWithOgdams(network, planId, phone, reference) {
    const trimmedRef = String(reference).slice(0, 40);
    const result = await ogdamsVend(
        "/vend/data",
        { networkId: networkNameToId(network), planId: Number(planId), phoneNumber: phone, reference: trimmedRef },
        "vend/data"
    );
    return { ...result, reference: result.reference || trimmedRef, provider: "ogdams", sourceType: "unknown" };
}

/**
 * POST /vend/airtime -- vend airtime. `type` selects the vending method:
 * vtu (default), momo, sns (share & sell), or awuf4u -- documented options,
 * passed through as given, never guessed beyond the default.
 */
export async function buyAirtimeWithOgdams(network, amount, phone, reference, type = "vtu") {
    const trimmedRef = String(reference).slice(0, 40);
    const result = await ogdamsVend(
        "/vend/airtime",
        { networkId: networkNameToId(network), amount: Number(amount), phoneNumber: phone, type, reference: trimmedRef },
        "vend/airtime"
    );
    return { ...result, reference: result.reference || trimmedRef, provider: "ogdams", sourceType: "unknown" };
}

/**
 * No transaction-status/requery-by-reference endpoint is documented for
 * Ogdams (see the ogdamsVend() comment above). This mirrors
 * services/providers/peyflex.js's requeryPeyflex() stub exactly -- a
 * transaction left 'unknown' can only be resolved by the Ogdams webhook, or
 * by admin manual review. Returning 'pending' here (rather than guessing at
 * an outcome) is the same documented-gap handling already established in
 * this codebase for a provider with the same limitation.
 */
export async function requeryOgdams(_reference) {
    return { status: "pending", message: "Ogdams does not document a transaction-status endpoint; resolution depends on the webhook or admin review." };
}

export const OGDAMS_ERROR_CODES = Object.freeze([
    "PROVIDER_AUTH_ERROR",
    "PROVIDER_TIMEOUT",
    "PROVIDER_UNAVAILABLE",
    "INSUFFICIENT_PROVIDER_BALANCE",
    "INVALID_RECIPIENT",
    "INVALID_PLAN",
    "TRANSACTION_FAILED",
    "TRANSACTION_PENDING",
    "UNKNOWN_PROVIDER_ERROR"
]);

export { networkNameToId, maskPhone as maskOgdamsPhone };
