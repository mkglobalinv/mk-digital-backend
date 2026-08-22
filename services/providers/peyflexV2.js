import axios from "axios";

// Configuration
const PEYFLEX_API_URL = (process.env.PEYFLEX_API_URL || "https://client.peyflex.com.ng").replace(/\/$/, "");
const PEYFLEX_API_TOKEN = process.env.PEYFLEX_API_TOKEN || process.env.PEYFLEX_API_KEY;

// Base Axios Instance
const peyflexClient = axios.create({
    baseURL: PEYFLEX_API_URL,
    timeout: 120000,
    headers: {
        'Authorization': `Token ${PEYFLEX_API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

/**
 * Robust HTTP POST Wrapper with Retries and JSON Validation
 */
const postWithRetry = async (endpoint, payload, maxRetries = 2) => {
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            console.log(`\n======================================================`);
            console.log(`[BACKEND -> PEYFLEX] OUTBOUND REQUEST LOGGING`);
            console.log(`Endpoint: ${endpoint} (Attempt ${attempt + 1})`);
            console.log(`Headers:`, JSON.stringify(peyflexClient.defaults.headers, null, 2));
            console.log(`Payload:`, JSON.stringify(payload, null, 2));
            console.log(`======================================================\n`);

            const response = await peyflexClient.post(endpoint, payload);
            
            console.log(`\n======================================================`);
            console.log(`[PEYFLEX -> BACKEND] INBOUND RESPONSE SUCCESS`);
            console.log(`Status: ${response.status}`);
            console.log(`Body:`, JSON.stringify(response.data, null, 2));
            console.log(`======================================================\n`);

            // Validate JSON response
            if (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<')) {
                throw new Error("Received HTML instead of JSON");
            }
            
            return { success: true, status: response.status, data: response.data };
        } catch (error) {
            const isTimeout = error.code === 'ECONNABORTED';
            const status = error.response ? error.response.status : null;
            const errorData = error.response ? error.response.data : null;
            
            console.log(`\n======================================================`);
            console.log(`[PEYFLEX -> BACKEND] INBOUND RESPONSE ERROR`);
            console.log(`Status: ${status}`);
            console.log(`Body:`, JSON.stringify(errorData, null, 2));
            console.log(`======================================================\n`);

            console.error(`[PeyFlex V2] Error on ${endpoint}:`, error.message, status || '');

            // Retry on Timeout or 5xx server errors
            if (attempt < maxRetries && (isTimeout || (status >= 500 && status < 600))) {
                console.log(`[PeyFlex V2] Retrying in 2 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempt++;
                continue;
            }

            // If we are out of retries or it's a 4xx error, format the failure
            // Treat 4xx as definitive failure, others as unknown
            let finalStatus = "failed";
            if (isTimeout || (status >= 500 && status < 600)) {
                finalStatus = "unknown";
            } else if (typeof errorData === 'string' && errorData.trim().startsWith('<')) {
                finalStatus = "failed"; // HTML response on 4xx is a clear failure
            }

            return {
                success: false,
                status: finalStatus,
                message: (errorData && (errorData.message || errorData.msg || errorData.detail)) || error.message,
                data: errorData,
                httpStatus: status
            };
        }
    }
};

/**
 * Buy Airtime Service
 */
export const buyAirtimeWithPeyflex = async (network, amount, phone) => {
    if (!PEYFLEX_API_TOKEN) return { success: false, status: "failed", message: "API Token missing" };

    const payload = {
        network: String(network).toLowerCase(),
        amount: Number(amount),
        mobile_number: phone,
        Ported_number: true,
        airtime_type: "VTU"
    };

    const result = await postWithRetry('/api/airtime/topup/', payload);

    if (result.success) {
        const data = result.data;
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
            message: data.msg || data.message || "Transaction failed",
            data: data,
            provider: 'peyflex'
        };
    }

    return {
        success: false,
        status: result.status,
        message: result.message,
        data: result.data,
        provider: 'peyflex'
    };
};

/**
 * Buy Data Service
 */
export const buyDataWithPeyflex = async (network, dataPlan, phone, category = null) => {
    if (!PEYFLEX_API_TOKEN) return { success: false, status: "failed", message: "API Token missing" };

    let identifier = '';
    const netLower = String(network).toLowerCase();

    const catLower = category ? category.toLowerCase() : '';
    const planLower = String(dataPlan).toLowerCase();

    if (netLower.includes('mtn')) {
        if (catLower === 'sme' || planLower.includes('sme')) identifier = 'mtn_sme_data';
        else if (catLower === 'corporate' || catLower === 'data_share' || planLower.includes('corporate') || planLower.includes('cg')) identifier = 'mtn_data_share';
        else if (catLower === 'awoof' || planLower.includes('awoof')) identifier = 'mtn_awoof_gifting';
        else if (catLower === 'gifting' || planLower.includes('gifting')) identifier = 'mtn_gifting_data';
        else identifier = 'mtn_gifting_data'; // fallback default
    } else if (netLower.includes('airtel')) {
        identifier = 'airtel_data';
    } else if (netLower.includes('glo')) {
        identifier = 'glo_data';
    } else {
        identifier = '9mobile_data';
    }

    if (!identifier) {
        throw new Error('Could not determine PeyFlex network identifier for data purchase.');
    }

    // Extract actual plan code in case it's suffixed for uniqueness (e.g., M1GBS-Corporate)
    const actualPlanCode = dataPlan.includes('-') ? dataPlan.split('-')[0] : dataPlan;

    const payload = {
        network: identifier,
        plan_code: actualPlanCode,
        mobile_number: phone,
        Ported_number: true
    };

    const result = await postWithRetry('/api/data/purchase/', payload);

    if (result.success) {
        const data = result.data;
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
            message: data.msg || data.message || "Transaction failed",
            data: data,
            provider: 'peyflex'
        };
    }

    // Pass the standard status (failed/unknown) to the caller
    return {
        success: false,
        status: result.status,
        message: result.message,
        data: result.data,
        provider: 'peyflex'
    };
};

/**
 * Buy Cable TV Service
 */
export const buyCableTVWithPeyflex = async (cableName, packageId, smartcard, phone) => {
    if (!PEYFLEX_API_TOKEN) return { success: false, status: "failed", message: "API Token missing" };

    const payload = {
        identifier: String(cableName).toUpperCase(),
        plan: packageId,
        iuc: smartcard,
        phone: phone || "08000000000"
    };

    const result = await postWithRetry('/api/cable/subscribe/', payload);

    if (result.success) {
        const data = result.data;
        const statusValue = String(data.Status || data.status || "").toLowerCase();
        
        if (statusValue === "success" || data.status === true) {
            return {
                status: "success",
                data: data,
                reference: data.reference || data.id || `PFX-${Date.now()}`
            };
        }
        
        return { status: "failed", message: data.msg || data.message || "Transaction failed", data };
    }

    return { status: result.status, message: result.message, data: result.data };
};

/**
 * Get Education Prices from Peyflex
 */
let cachedEducationPrices = null;
let lastEducationPricesFetch = 0;

export const getEducationPricesFromPeyflex = async () => {
    if (!PEYFLEX_API_TOKEN) return null;

    // Cache for 10 minutes to avoid spamming the provider
    if (cachedEducationPrices && (Date.now() - lastEducationPricesFetch) < 600000) {
        return cachedEducationPrices;
    }

    try {
        const response = await peyflexClient.get('/api/education/providers/');
        const data = response.data;

        if (data && String(data.status).toUpperCase() === 'SUCCESS' && data.providers && data.providers.length > 0) {
            const eduProvider = data.providers.find(p => p.identifier === 'education');
            if (eduProvider && eduProvider.plans) {
                const prices = {};
                eduProvider.plans.forEach(plan => {
                    prices[String(plan.plan_id).toLowerCase()] = Number(plan.unit_price);
                });
                
                // Map aliases used by our frontend
                if (prices['waec']) {
                    prices['waecdirect'] = prices['waec'];
                    prices['waec-registration'] = prices['waec'];
                }

                cachedEducationPrices = prices;
                lastEducationPricesFetch = Date.now();
                return prices;
            }
        }
    } catch (error) {
        console.error(`[PeyFlex V2] Error fetching education prices:`, error.message);
    }
    
    // Return cached if fetch fails
    return cachedEducationPrices;
};

/**
 * Buy Education PIN Service
 */
export const buyEducationWithPeyflex = async (examType, phone, quantity = 1) => {
    if (!PEYFLEX_API_TOKEN) return { success: false, status: "failed", message: "API Token missing" };

    const examMap = {
        'waecdirect': 'waec',
        'waec-registration': 'waec',
        'waec': 'waec',
        'neco': 'neco',
        'nabteb': 'nabteb'
    };
    
    const plan_id = examMap[String(examType).toLowerCase()];
    if (!plan_id) {
        return { success: false, status: "failed", message: `Education service '${examType}' is not currently supported by Peyflex.` };
    }

    const payload = {
        identifier: "education",
        plan_id: plan_id,
        quantity: String(quantity),
        phone: phone || "08000000000" // fallback if phone is missing, though frontend provides it
    };

    const result = await postWithRetry('/api/education/purchase/', payload);

    if (result.success) {
        const data = result.data;
        const statusValue = String(data.Status || data.status || "").toLowerCase();
        
        if (statusValue === "success" || data.status === true || statusValue === "successful") {
            // Extract and validate the PIN/token from the provider response
            const rawToken = data.pin || data.token || data.carddetails || (data.pins ? JSON.stringify(data.pins) : null) || null;
            
            // Guard: reject well-known placeholder/fake tokens that Peyflex sometimes returns
            // when the PIN has not actually been dispensed
            const FAKE_TOKEN_PATTERNS = [
                /please\s+contact\s+admin/i,
                /contact.*for.*token/i,
                /^null$/i,
                /^undefined$/i
            ];
            const isFakeToken = rawToken && FAKE_TOKEN_PATTERNS.some(p => p.test(String(rawToken)));
            
            if (isFakeToken) {
                console.error(`[PeyFlex V2 Education] Fake/placeholder token detected from Peyflex: "${rawToken}". Treating as FAILED.`);
                return {
                    success: false,
                    status: "failed",
                    message: "Peyflex returned an invalid PIN placeholder. Please contact support.",
                    data: data,
                    provider: 'peyflex'
                };
            }
            
            return {
                status: "success",
                data: data,
                reference: data.reference || data.id || `PFX-${Date.now()}`,
                token: rawToken
            };
        }
        
        return { status: "failed", message: data.msg || data.message || "Transaction failed", data };
    }

    return { status: result.status, message: result.message, data: result.data };
};

/**
 * Buy Electricity Service
 */
export const buyElectricityWithPeyflex = async (discoId, meterType, meterNumber, amount, phone) => {
    if (!PEYFLEX_API_TOKEN) return { success: false, status: "failed", message: "API Token missing" };

    const payload = {
        identifier: "electricity",
        meter: meterNumber,
        plan: discoId,
        amount: String(amount),
        type: String(meterType).toLowerCase(),
        phone: phone || "08000000000"
    };

    const result = await postWithRetry('/api/electricity/subscribe/', payload);

    if (result.success) {
        const data = result.data;
        const statusValue = String(data.Status || data.status || "").toUpperCase();
        
        if (statusValue === "SUCCESS" || data.status === true) {
            return {
                status: "success",
                data: data,
                reference: data.reference || data.id || `PFX-${Date.now()}`,
                token: data.token || data.pin || null
            };
        }
        
        return { status: "failed", message: data.msg || data.message || "Transaction failed at provider", data };
    }

    return { status: result.status, message: result.message, data: result.data };
};

/**
 * Verification/Status Checking Service
 */
export const requeryPeyflex = async (reference) => {
    if (!PEYFLEX_API_TOKEN) return { status: "unknown", message: "API Token missing" };

    try {
        console.log(`[PeyFlex V2] Requery Reference: ${reference}`);
        const response = await peyflexClient.get(`/api/transaction/verify/?reference=${reference}`);
        const data = response.data;
        
        const statusValue = String(data.Status || data.status || "").toLowerCase();
        if (statusValue === "success" || statusValue === "successful") {
            return { status: "success", data };
        } else if (statusValue === "failed") {
            return { status: "failed", message: data.msg || "Transaction failed", data };
        }
        
        return { status: "pending", data };
    } catch (error) {
        console.error(`[PeyFlex V2] Requery Error:`, error.message);
        return { status: "unknown", message: error.message };
    }
};

/**
 * Helper to fetch API balance
 */
export const getPeyflexBalance = async () => {
    if (!PEYFLEX_API_TOKEN) return { success: false, message: "API Token missing" };

    try {
        const response = await peyflexClient.get('/api/user/profile/');
        if (typeof response.data === 'string' && response.data.startsWith('<')) {
            throw new Error("Received HTML");
        }
        return { success: true, balance: response.data.user?.wallet_balance || response.data.balance || 0 };
    } catch (error) {
        return { success: false, message: error.message };
    }
};
