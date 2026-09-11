import axios from "axios";
import ProviderStatus from "../../models/ProviderStatus.js";

// ============================================================================
// SmePlug provider adapter, implemented against the vendor's own published
// Postman API documentation (Base URL / Authentication / Endpoints / Response
// shapes, as supplied directly by the user -- not inferred, not guessed).
//
// Isolated by design, same pattern as services/providers/ogdams.js: this file
// is the ONLY place that knows SmePlug's request/response shapes.
// services/switcher.js and everything above it only ever sees the same
// {success, status, reference, data, message, provider} shape every other
// provider file in services/providers/ already returns.
// ============================================================================

const SMEPLUG_API_BASE_URL = (process.env.SMEPLUG_API_BASE_URL || "https://smeplug.ng/api/v1").replace(/\/$/, "");
const SMEPLUG_API_KEY = process.env.SMEPLUG_API_KEY;
const SMEPLUG_ENABLED = process.env.SMEPLUG_ENABLED === "true";

// Documented (GET /networks response): {"1":"MTN","2":"Airtel","3":"9Mobile","4":"Glo"}.
// Deliberately NOT the same mapping as Ogdams (which has 3=Glo/4=9mobile) --
// each provider adapter owns its own network-ID table, never shared.
const NETWORK_NAME_TO_ID = { MTN: 1, AIRTEL: 2, "9MOBILE": 3, GLO: 4 };
const NETWORK_ID_TO_NAME = { 1: "MTN", 2: "AIRTEL", 3: "9MOBILE", 4: "GLO" };

export class SmeplugConfigError extends Error {
    constructor(message) {
        super(message);
        this.name = "SmeplugConfigError";
    }
}

function networkNameToId(network) {
    const id = NETWORK_NAME_TO_ID[String(network).toUpperCase()];
    if (!id) throw new Error(`Unsupported network for SmePlug: ${network}`);
    return id;
}

// Never log a raw phone number -- mask everything but the first 5 and last 2
// digits, matching the masking convention used elsewhere in this codebase
// (services/airtimeToCash/security.js's maskPhone, services/providers/ogdams.js).
function maskPhone(phone) {
    const str = String(phone || "");
    if (str.length <= 7) return str;
    return `${str.slice(0, 5)}${"*".repeat(str.length - 7)}${str.slice(-2)}`;
}

function assertConfigured() {
    if (!SMEPLUG_ENABLED) {
        throw new SmeplugConfigError("SmePlug provider is disabled (SMEPLUG_ENABLED is not 'true').");
    }
    if (!SMEPLUG_API_KEY) {
        throw new SmeplugConfigError("SmePlug provider is enabled but SMEPLUG_API_KEY is not configured.");
    }
}

/**
 * Called once at startup (see server.js) so a misconfiguration is visible in
 * logs immediately rather than surfacing as a confusing per-transaction error
 * the first time a customer tries to use it.
 */
export function validateSmeplugConfig() {
    if (!SMEPLUG_ENABLED) return { enabled: false };
    if (!SMEPLUG_API_KEY) {
        console.error("[SmePlug] SMEPLUG_ENABLED=true but SMEPLUG_API_KEY is missing. SmePlug purchases will fail until this is set.");
        return { enabled: true, configured: false };
    }
    return { enabled: true, configured: true };
}

/**
 * Idempotent upsert so the existing admin provider list/monitoring (GET/PUT
 * /api/admin/providers, models/ProviderStatus.js) has a 'smeplug' document to
 * show, without ever overwriting one that already exists. priority:3, same
 * "not automatically primary" posture used for Ogdams.
 */
export async function ensureSmeplugProviderStatus() {
    try {
        await ProviderStatus.findOneAndUpdate(
            { providerName: "smeplug" },
            { $setOnInsert: { providerName: "smeplug", priority: 3, apiStatus: SMEPLUG_ENABLED ? "online" : "offline", isAvailable: SMEPLUG_ENABLED } },
            { upsert: true, setDefaultsOnInsert: true }
        );
    } catch (err) {
        console.error("[SmePlug] Failed to ensure ProviderStatus document:", err.message);
    }
}

const smeplugClient = axios.create({
    baseURL: SMEPLUG_API_BASE_URL,
    timeout: 30000
});

function authHeaders() {
    return { Authorization: `Bearer ${SMEPLUG_API_KEY}`, Accept: "application/json", "Content-Type": "application/json" };
}

// Clean, customer-safe messages -- never the raw provider message (same
// posture as ogdams.js's CUSTOMER_MESSAGE table).
const CUSTOMER_MESSAGE = {
    PROVIDER_AUTH_ERROR: "This service is temporarily unavailable. Please try again shortly.",
    PROVIDER_TIMEOUT: "We could not confirm this transaction in time. It is being processed -- check your transaction history shortly.",
    PROVIDER_UNAVAILABLE: "This service is temporarily unavailable. Please try again shortly.",
    TRANSACTION_FAILED: "Transaction failed. You have not been charged.",
    TRANSACTION_PENDING: "Your transaction is processing.",
    UNKNOWN_PROVIDER_ERROR: "Something went wrong. Please try again."
};

/**
 * GET wrapper for read-only, side-effect-free calls (balance, networks,
 * plans, transaction status) -- safe to retry on timeout/5xx since nothing is
 * being vended.
 */
async function smeplugGet(path, maxRetries = 2) {
    try {
        assertConfigured();
    } catch (err) {
        return { success: false, errorCode: "PROVIDER_UNAVAILABLE", message: CUSTOMER_MESSAGE.PROVIDER_UNAVAILABLE, configError: err.message };
    }
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            const response = await smeplugClient.get(path, { headers: authHeaders() });
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
            const errorCode = isTimeout ? "PROVIDER_TIMEOUT" : (isNetworkError ? "PROVIDER_UNAVAILABLE" : (httpStatus === 401 ? "PROVIDER_AUTH_ERROR" : "UNKNOWN_PROVIDER_ERROR"));
            console.error(`[SmePlug] GET ${path} failed:`, errorCode, err.message);
            if (err.response?.data) {
                // SmePlug's actual error body -- logged server-side only (never
                // returned to the customer), same posture as ogdams.js, so a real
                // failure is diagnosable from logs instead of only ever seeing a
                // generic HTTP status.
                console.error(`[SmePlug] GET ${path} error body:`, JSON.stringify(err.response.data));
            }
            return { success: false, errorCode, message: CUSTOMER_MESSAGE[errorCode], httpStatus };
        }
    }
}

/**
 * POST wrapper for vending calls (/data/purchase, /airtime/purchase) --
 * deliberately NEVER retries on timeout or network error, same reasoning as
 * ogdams.js's ogdamsVend(): a request that times out cannot be safely
 * distinguished from one that succeeded server-side, so retrying could
 * double-vend. On any ambiguous outcome this returns status:'unknown' and
 * relies on the SmePlug webhook (or requerySmeplug(), which SmePlug does
 * document unlike Ogdams) to resolve it later.
 */
async function smeplugVend(path, payload, label) {
    try {
        assertConfigured();
    } catch (err) {
        return { success: false, status: "failed", errorCode: "PROVIDER_UNAVAILABLE", message: CUSTOMER_MESSAGE.PROVIDER_UNAVAILABLE, configError: err.message };
    }
    const loggable = { ...payload, phone: payload.phone ? maskPhone(payload.phone) : undefined };
    console.log(`[SmePlug] -> ${label}`, JSON.stringify(loggable));
    try {
        const response = await smeplugClient.post(path, payload, { headers: authHeaders() });
        const body = response.data;
        console.log(`[SmePlug] <- ${label} HTTP ${response.status} status=${body?.status}`);
        if (body?.status === true) {
            // Documented: "We will return a data.current_status field for Sim &
            // Device medium transaction." No enumerated values were supplied for
            // that field, so it is only trusted when it clearly spells out a
            // non-final state; anything else (including its absence, which is
            // the documented example for a wallet-medium purchase) is treated as
            // a definite success -- never guessed beyond what's actually shown.
            const currentStatus = String(body.data?.current_status || "").toLowerCase();
            if (["pending", "processing", "queued"].includes(currentStatus)) {
                return { success: false, status: "unknown", reference: body.data?.reference, message: CUSTOMER_MESSAGE.TRANSACTION_PENDING, errorCode: "TRANSACTION_PENDING", data: body };
            }
            return { success: true, status: "success", reference: body.data?.reference, message: body.data?.msg, data: body };
        }
        // status:false in a 200 body -- a clean, definite failure per docs' own
        // {status,data} envelope. No documented sub-error-codes were supplied
        // for this shape, so this maps to the generic TRANSACTION_FAILED rather
        // than a guessed distinction.
        console.error(`[SmePlug] ${label} returned a failure body:`, JSON.stringify(body));
        return { success: false, status: "failed", message: CUSTOMER_MESSAGE.TRANSACTION_FAILED, errorCode: "TRANSACTION_FAILED", data: body };
    } catch (err) {
        const isTimeout = err.code === "ECONNABORTED";
        const httpStatus = err.response ? err.response.status : null;
        const isNetworkError = !err.response && !isTimeout;
        console.error(`[SmePlug] ${label} threw:`, err.message, httpStatus || "");
        if (err.response?.data) {
            console.error(`[SmePlug] ${label} error body:`, JSON.stringify(err.response.data));
        }

        if (httpStatus === 401) {
            return { success: false, status: "failed", message: CUSTOMER_MESSAGE.PROVIDER_AUTH_ERROR, errorCode: "PROVIDER_AUTH_ERROR", data: err.response?.data };
        }
        if (httpStatus && httpStatus >= 400 && httpStatus < 500) {
            // A definite 4xx (bad request/insufficient balance/invalid plan etc.)
            // raised as an HTTP error by axios -- no documented sub-codes were
            // supplied to distinguish these further, so treated as a clean,
            // non-ambiguous failure rather than 'unknown'.
            return { success: false, status: "failed", message: CUSTOMER_MESSAGE.TRANSACTION_FAILED, errorCode: "TRANSACTION_FAILED", data: err.response?.data };
        }

        // Timeout, network error, or 5xx: the request may or may not have
        // reached SmePlug. Never guessed, never retried here -- 'unknown', for
        // the webhook/requerySmeplug()/admin to resolve.
        const errorCode = isTimeout ? "PROVIDER_TIMEOUT" : (isNetworkError ? "PROVIDER_UNAVAILABLE" : "UNKNOWN_PROVIDER_ERROR");
        return { success: false, status: "unknown", message: CUSTOMER_MESSAGE[errorCode] || CUSTOMER_MESSAGE.UNKNOWN_PROVIDER_ERROR, errorCode, data: err.response?.data };
    }
}

/** GET /account/balance -- {balance: number}. */
export async function getSmeplugBalance() {
    const result = await smeplugGet("/account/balance");
    if (!result.success) return result;
    return { success: true, balance: Number(result.data?.balance ?? 0) };
}

/**
 * GET /data/plans -- documented shape: {status, data: {"<networkId>": [{id,
 * name, price, telco_price}, ...], ...}}, plans grouped by network ID string.
 * Flattened here into the same flat {network, planId, name, price} shape
 * every other provider adapter in this codebase returns.
 */
export async function getSmeplugDataPlans() {
    const result = await smeplugGet("/data/plans");
    if (!result.success) return result;
    const byNetwork = result.data?.data || {};
    const normalized = [];
    for (const [networkIdStr, plans] of Object.entries(byNetwork)) {
        const networkName = NETWORK_ID_TO_NAME[Number(networkIdStr)] || String(networkIdStr);
        for (const p of plans || []) {
            normalized.push({
                network: networkName,
                planId: String(p.id),
                name: p.name,
                price: Number(p.price),
                telcoPrice: Number(p.telco_price ?? 0)
            });
        }
    }
    const mtnPlanIds = normalized.filter((p) => p.network === "MTN").map((p) => p.planId);
    console.log(`[SmePlug] /data/plans returned ${normalized.length} plan(s) total, ${mtnPlanIds.length} for MTN: [${mtnPlanIds.join(", ")}]`);
    return { success: true, plans: normalized };
}

// Selected directly by the user from SmePlug's real, live MTN Gifting catalog
// (not inferred, not guessed) -- the same "explicit whitelist" enforcement
// point used for Ogdams' MTN_DATA_GIFTING_PLAN_IDS. SmePlug's /data/plans
// response mixes [SME] and [Gifting]-tagged plans together with no separate
// category field, so this whitelist is what keeps this integration strictly
// to Gifting, matching current scope (no SME, no other SmePlug service).
export const MTN_DATA_GIFTING_PLAN_IDS = Object.freeze({
    "11": "1GB - Daily",
    "13": "2.5GB - 2 Days",
    "15": "750MB - 2 Weeks",
    "16": "1GB - Weekly",
    "17": "2GB - Weekly",
    "18": "6GB - Weekly",
    "19": "1.5GB - Monthly",
    "20": "2GB - Monthly"
});

/**
 * Live MTN plan catalog from SmePlug, filtered to ONLY the confirmed Data
 * Gifting plan IDs above. Real price/name still come from the live API
 * response (never fabricated) -- this only restricts WHICH plan IDs are
 * allowed through, it doesn't invent data for them.
 */
export async function getSmeplugMtnGiftingPlans() {
    const result = await getSmeplugDataPlans();
    if (!result.success) return result;
    const plans = result.plans
        .filter((p) => p.network === "MTN" && Object.prototype.hasOwnProperty.call(MTN_DATA_GIFTING_PLAN_IDS, p.planId))
        // /data/plans returns no separate validity field (only id/name/price/
        // telco_price) -- the whitelist's own "<size> - <validity>" description
        // (chosen directly from the plan's real name text, not fabricated) is
        // the only source for it.
        .map((p) => ({ ...p, validity: MTN_DATA_GIFTING_PLAN_IDS[p.planId].split(" - ")[1] || "" }));
    return { success: true, plans };
}

/**
 * POST /data/purchase -- {network_id, plan_id, phone, customer_reference}.
 * customer_reference is documented optional but always sent -- it's this
 * app's own idempotency key (models/Transaction.js's unique `reference`
 * field), same convention as every other provider adapter here.
 */
export async function buyDataWithSmeplug(network, planId, phone, reference) {
    const trimmedRef = String(reference).slice(0, 100);
    const result = await smeplugVend(
        "/data/purchase",
        { network_id: networkNameToId(network), plan_id: planId, phone, customer_reference: trimmedRef },
        "data/purchase"
    );
    return { ...result, reference: result.reference || trimmedRef, provider: "smeplug", sourceType: "unknown" };
}

/** POST /airtime/purchase -- {network_id, phone, amount, customer_reference}. */
export async function buyAirtimeWithSmeplug(network, amount, phone, reference) {
    const trimmedRef = String(reference).slice(0, 100);
    const result = await smeplugVend(
        "/airtime/purchase",
        { network_id: networkNameToId(network), amount: Number(amount), phone, customer_reference: trimmedRef },
        "airtime/purchase"
    );
    return { ...result, reference: result.reference || trimmedRef, provider: "smeplug", sourceType: "unknown" };
}

/**
 * GET /transactions/{reference} -- unlike Ogdams, SmePlug documents a real
 * transaction-status endpoint, keyed by either SmePlug's own reference or the
 * customer_reference we sent. Documented response: {status, reference,
 * customer_reference, type, beneficiary, memo, response, price}. `status` is
 * a free-text field in the one example supplied ("success") -- normalized
 * here to this codebase's success/failed/pending convention, never guessing
 * beyond what's actually documented.
 */
export async function requerySmeplug(reference) {
    const result = await smeplugGet(`/transactions/${encodeURIComponent(reference)}`);
    if (!result.success) {
        return { status: "pending", message: "Could not reach SmePlug to check transaction status; will retry." };
    }
    const raw = String(result.data?.status || "").toLowerCase();
    if (["success", "successful", "completed", "delivered"].includes(raw)) {
        return { status: "success", message: result.data?.response || result.data?.memo, data: result.data };
    }
    if (["failed", "failure", "declined", "error", "cancelled", "canceled"].includes(raw)) {
        return { status: "failed", message: result.data?.response || result.data?.memo, data: result.data };
    }
    // Unrecognized/pending status text -- never guessed as a final outcome.
    return { status: "pending", message: "SmePlug has not reported a final outcome for this transaction yet.", data: result.data };
}

export const SMEPLUG_ERROR_CODES = Object.freeze([
    "PROVIDER_AUTH_ERROR",
    "PROVIDER_TIMEOUT",
    "PROVIDER_UNAVAILABLE",
    "TRANSACTION_FAILED",
    "TRANSACTION_PENDING",
    "UNKNOWN_PROVIDER_ERROR"
]);

export { networkNameToId, maskPhone as maskSmeplugPhone };
