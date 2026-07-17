import axios from "axios";

// 1. Fix API Base URL
const PEYFLEX_API_URL = (process.env.PEYFLEX_API_URL || "https://client.peyflex.com.ng").replace(/\/$/, "");

// 2. Implement Proper Authentication (Token-based)
const PEYFLEX_API_TOKEN = process.env.PEYFLEX_API_TOKEN || process.env.PEYFLEX_API_KEY;

/**
 * 3. Fix Request Headers
 * Helper to generate standardized headers for Peyflex
 */
const getPeyflexHeaders = () => {
    return {
        'Authorization': `Token ${PEYFLEX_API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
};

/**
 * 5. Handle Non-JSON Responses
 * Detects if a response body is HTML instead of JSON
 */
const isHtmlResponse = (data) => {
    if (typeof data === 'string' && data.trim().toLowerCase().startsWith('<')) {
        return true;
    }
    // Sometimes Axios fails to parse, or the server returns bad JSON
    return false;
};

/**
 * 8. Provide Working Example (Fetch User Profile)
 */
export const fetchPeyflexUserProfile = async () => {
    if (!PEYFLEX_API_TOKEN) {
        return { success: false, message: "Peyflex API Token missing" };
    }

    const endpoint = `${PEYFLEX_API_URL}/api/user/profile/`;
    console.log(`[Peyflex] Fetching profile from: ${endpoint}`);

    try {
        const response = await axios.get(endpoint, {
            headers: getPeyflexHeaders(),
            timeout: 60000
        });

        if (isHtmlResponse(response.data)) {
            console.error("[Peyflex Profile Error] Received HTML instead of JSON. Preview:", response.data.substring(0, 100));
            return { success: false, message: "Invalid API response (expected JSON, received HTML)" };
        }

        console.log("[Peyflex Profile Success] Status:", response.status);
        return { success: true, data: response.data };

    } catch (error) {
        console.error("[Peyflex Profile Exception]", error.message);
        return {
            success: false,
            message: `Peyflex Request Failed: ${error.message}`
        };
    }
};

/**
 * Buy Airtime with Peyflex (Primary Provider)
 */
export const buyAirtimeWithPeyflex = async (network, amount, phone) => {
    if (!PEYFLEX_API_TOKEN) {
        return { success: false, message: "Peyflex API Token missing" };
    }

    const endpoint = `${PEYFLEX_API_URL}/api/topup/`; // Updated to standard /api/topup/ commonly used
    console.log(`[Peyflex Airtime] Request URL: ${endpoint} | Payload: { network: ${network}, amount: ${amount}, phone: ${phone} }`);

    try {
        const payload = {
            network: network.toLowerCase(),
            amount: Number(amount),
            mobile_number: phone,
            Ported_number: true,
            airtime_type: "VTU"
        };
        
        console.log(`[Peyflex Request] URL: ${PEYFLEX_API_URL}/api/airtime/topup/`);
        console.log(`[Peyflex Request] Payload:`, JSON.stringify(payload));
        console.log(`[Peyflex Request] Headers:`, JSON.stringify(getPeyflexHeaders()));

        const response = await axios.post(`${PEYFLEX_API_URL}/api/airtime/topup/`, payload, {
            headers: getPeyflexHeaders(),
            timeout: 60000
        });

        const data = response.data;
        console.log(`[Peyflex Response] HTTP Status: ${response.status}`);
        console.log(`[Peyflex Response] Body:`, JSON.stringify(data));

        const statusValue = String(data.Status || data.status || "").toLowerCase();
        if (statusValue === "success" || data.status === true) {
            return {
                success: true,
                status: "success",
                reference: data.reference || data.id || `PFX-${Date.now()}`,
                data: data,
                provider: 'peyflex'
            };
        }

        return {
            success: false,
            status: "failed",
            message: data.msg || data.message || "Peyflex: Transaction failed",
            data: data,
            provider: 'peyflex'
        };
    } catch (error) {
        const errorData = error.response?.data;
        const errorStatus = error.response?.status;
        
        console.error(`[Peyflex Exception] Status: ${errorStatus}`);
        console.error(`[Peyflex Exception] Data:`, JSON.stringify(errorData || error.message));

        // CRITICAL FIX: Treat 400 Bad Request or Timeout as UNKNOWN ONLY if we don't have a definitive error message
        const isDefinitiveFailure = errorData && (
            String(errorData.status).toLowerCase() === 'failed' || 
            String(errorData.Status).toLowerCase() === 'failed' ||
            String(errorData.message || '').toLowerCase().includes('insufficient') ||
            String(errorData.msg || '').toLowerCase().includes('insufficient')
        );

        if (!isDefinitiveFailure && (errorStatus === 400 || errorStatus === 422 || error.code === 'ECONNABORTED')) {
            return {
                success: false,
                status: "unknown",
                message: `Peyflex Unclear Response (${errorStatus || 'Timeout'}): ${JSON.stringify(errorData || error.message)}`,
                provider: 'peyflex'
            };
        }

        return {
            success: false,
            status: "failed",
            message: errorData?.message || errorData?.msg || `Peyflex Error: ${error.message}`,
            data: errorData || { error: error.message },
            provider: 'peyflex'
        };
    }
};

/**
 * Buy Data with Peyflex (Primary Provider)
 */
export const buyDataWithPeyflex = async (network, dataPlan, phone, category = null) => {
    if (!PEYFLEX_API_TOKEN) {
        return { success: false, message: "Peyflex API Token missing" };
    }

    console.log(`[Peyflex Data] Request URL: ${PEYFLEX_API_URL}/api/data/ | Payload: { network: ${network}, plan: ${dataPlan}, phone: ${phone}, category: ${category} }`);

    try {
        let identifier;
        const netLower = String(network).toLowerCase();
        const planLower = String(dataPlan).toLowerCase();

        if (category) {
            const catLower = category.toLowerCase();
            if (netLower.includes('mtn')) {
                if (catLower === 'sme' || planLower.includes('sme')) identifier = 'mtn_sme_data';
                else if (catLower === 'corporate' || catLower === 'data_share' || planLower.includes('corporate') || planLower.includes('cg')) identifier = 'mtn_data_share';
                else if (catLower === 'awoof' || planLower.includes('awoof')) identifier = 'mtn_awoof_gifting';
                else if (catLower === 'gifting') identifier = 'mtn_gifting_data';
                else identifier = 'mtn_gifting_data';
            } else if (netLower.includes('airtel')) {
                if (catLower === 'cg' || catLower === 'corporate' || planLower.includes('cg') || planLower.includes('corporate')) identifier = 'airtel_cg';
                else if (catLower === 'sme' || planLower.includes('sme')) identifier = 'airtel_sme_data';
                else identifier = 'airtel_data';
            } else if (netLower.includes('glo')) {
                if (catLower === 'sme' || planLower.includes('sme')) identifier = 'glo_sme_data';
                else if (catLower === 'cg' || catLower === 'corporate' || planLower.includes('cg') || planLower.includes('corporate')) identifier = 'glo_cg';
                else identifier = 'glo_data';
            } else {
                identifier = '9mobile_data';
            }
        } else {
            // Fallback for when category is not explicitly provided
            if (netLower.includes('mtn')) {
                identifier = planLower.includes('awoof') ? 'mtn_awoof_gifting' : 'mtn_gifting_data';
            } else if (netLower.includes('airtel')) {
                identifier = 'airtel_data';
            } else if (netLower.includes('glo')) {
                identifier = 'glo_data';
            } else {
                identifier = '9mobile_data';
            }
        }

        const payload = {
            network: identifier,
            plan_code: dataPlan,
            mobile_number: phone,
            Ported_number: true
        };

        console.log(`[Peyflex Request] URL: ${PEYFLEX_API_URL}/api/data/purchase/`);
        console.log(`[Peyflex Request] Payload:`, JSON.stringify(payload));
        console.log(`[Peyflex Request] Headers:`, JSON.stringify(getPeyflexHeaders()));

        const response = await axios.post(`${PEYFLEX_API_URL}/api/data/purchase/`, payload, {
            headers: getPeyflexHeaders(),
            timeout: 60000
        });

        const data = response.data;
        console.log(`[Peyflex Response] HTTP Status: ${response.status}`);
        console.log(`[Peyflex Response] Body:`, JSON.stringify(data));

        const statusValue = String(data.Status || data.status || "").toLowerCase();
        if (statusValue === "success" || statusValue === "successful" || data.status === true) {
            return {
                success: true,
                status: "success",
                reference: data.reference || data.id || `PFX-${Date.now()}`,
                data: data,
                provider: 'peyflex'
            };
        }

        return {
            success: false,
            status: "failed",
            message: data.msg || data.message || "Peyflex: Transaction failed",
            data: data,
            provider: 'peyflex'
        };
    } catch (error) {
        const errorData = error.response?.data;
        const errorStatus = error.response?.status;

        console.error(`[Peyflex Exception] Status: ${errorStatus}`);
        console.error(`[Peyflex Exception] Data:`, JSON.stringify(errorData || error.message));

        // CRITICAL FIX: Treat 400 Bad Request or Timeout as UNKNOWN ONLY if we don't have a definitive error message
        const isDefinitiveFailure = errorData && (
            String(errorData.status).toLowerCase() === 'failed' || 
            String(errorData.Status).toLowerCase() === 'failed' ||
            String(errorData.message || '').toLowerCase().includes('insufficient') ||
            String(errorData.msg || '').toLowerCase().includes('insufficient')
        );

        if (!isDefinitiveFailure && (errorStatus === 400 || errorStatus === 422 || error.code === 'ECONNABORTED')) {
            return {
                success: false,
                status: "unknown",
                message: `Peyflex Unclear Response (${errorStatus || 'Timeout'}): ${JSON.stringify(errorData || error.message)}`,
                provider: 'peyflex'
            };
        }

        return {
            success: false,
            status: "failed",
            message: errorData?.message || errorData?.msg || `Peyflex Error: ${error.message}`,
            data: errorData || { error: error.message },
            provider: 'peyflex'
        };
    }
};

/**
 * Get Peyflex Data Networks
 */
export const getPeyflexDataNetworks = async () => {
    if (!PEYFLEX_API_TOKEN) return { success: false, message: "Peyflex API Token missing" };
    
    try {
        const response = await axios.get(`${PEYFLEX_API_URL}/api/data/networks/`, {
            headers: getPeyflexHeaders(),
            timeout: 10000
        });
        return { success: true, data: response.data.networks };
    } catch (error) {
        console.error("[Peyflex Networks Error]", error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Fetch Data Plans for a specific network identifier
 */
export const fetchDataPlansFromPeyflex = async (networkIdentifier) => {
    if (!PEYFLEX_API_TOKEN) return { success: false, message: "Peyflex API Token missing" };

    try {
        const response = await axios.get(`${PEYFLEX_API_URL}/api/data/plans/`, {
            params: { network: networkIdentifier },
            headers: getPeyflexHeaders(),
            timeout: 60000
        });

        const data = response.data;
        if (data && data.plans) {
            return {
                success: true,
                plans: data.plans.map(p => ({
                    plan_code: p.plan_code,
                    network_id: networkIdentifier,
                    plan_name: p.label,
                    price: p.amount,
                    label: p.label,
                    validity: p.label.match(/\(([^)]+)\)/)?.[1] || "30 days"
                }))
            };
        }
        return { success: false, message: "No plans found for this network" };
    } catch (error) {
        console.error("[Peyflex Plans Error]", error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Get Peyflex Price for a specific plan
 */
/**
 * Requery Peyflex Transaction
 */
export const requeryPeyflex = async (reference) => {
    // Note: Peyflex typically doesn't have a direct public verify endpoint.
    // We will attempt to find the transaction in the user's profile if possible,
    // but for now, we'll return pending to avoid false failures.
    // Ideally, we'd use GET /api/data/status/ or similar if found.
    return { status: "pending", message: "Manual verification required for Peyflex" };
};
