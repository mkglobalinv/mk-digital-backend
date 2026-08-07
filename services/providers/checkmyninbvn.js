import axios from 'axios';

const BASE_URL = 'https://checkmyninbvn.com.ng/api';

// Masking utility for security
const maskPII = (str) => {
    if (!str || typeof str !== 'string') return '***';
    if (str.length <= 4) return '***';
    return str.substring(0, 2) + '*'.repeat(str.length - 4) + str.substring(str.length - 2);
};

const maskApiKey = (key) => {
    if (!key) return 'MISSING_KEY';
    if (key.length <= 8) return '***';
    return key.substring(0, 4) + '...' + key.substring(key.length - 4);
};

// Retry logic with exponential backoff
const axiosWithRetry = async (config, maxRetries = 3) => {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            return await axios(config);
        } catch (error) {
            const status = error.response ? error.response.status : null;
            // Retry on network errors or 5xx server errors, not on 4xx (except maybe 429)
            if (!status || status >= 500 || status === 429) {
                retries++;
                if (retries >= maxRetries) {
                    throw error;
                }
                const delay = Math.pow(2, retries) * 1000; // Exponential backoff: 2s, 4s, 8s
                console.log(`[CheckMyNINBVN] Request failed (${status || 'Network Error'}). Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
};

/**
 * Base method to make normalized API requests.
 */
const makeRequest = async (endpoint, method, payload = null, customApiKey = null) => {
    const apiKey = customApiKey || process.env.CHECKMYNINBVN_API_KEY;
    if (!apiKey) {
        return { status: 'error', message: 'CheckMyNINBVN API Key is not configured' };
    }

    const config = {
        method,
        url: `${BASE_URL}${endpoint}`,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        timeout: 15000 // 15s timeout
    };

    if (method.toUpperCase() === 'POST' && payload) {
        // Enforce consent on all POST requests per documentation
        config.data = { ...payload, consent: true };
    }

    try {
        const response = await axiosWithRetry(config);
        return {
            status: 'success',
            data: response.data
        };
    } catch (error) {
        let errorMsg = 'Unknown error occurred';
        let statusCode = 500;

        if (error.response) {
            statusCode = error.response.status;
            errorMsg = error.response.data?.message || `API Error: ${statusCode}`;
        } else if (error.request) {
            errorMsg = 'No response received from API (Timeout or Network Error)';
        } else {
            errorMsg = error.message;
        }

        // Masking logic in error logs
        let safePayload = { ...payload };
        if (safePayload.nin) safePayload.nin = maskPII(safePayload.nin);
        if (safePayload.bvn) safePayload.bvn = maskPII(safePayload.bvn);
        if (safePayload.phone) safePayload.phone = maskPII(safePayload.phone);

        console.error(`[CheckMyNINBVN Error] Endpoint: ${endpoint} | Status: ${statusCode} | Message: ${errorMsg} | Key: ${maskApiKey(apiKey)}`);
        
        return {
            status: 'failed',
            message: errorMsg,
            code: statusCode
        };
    }
};

// ---------------------------------------------------------
// 1. NIN Verification
// ---------------------------------------------------------
const verifyNIN = async (nin, customApiKey = null) => {
    return await makeRequest('/nin-verification', 'POST', { nin }, customApiKey);
};

// ---------------------------------------------------------
// 2. NIN Phone Search
// ---------------------------------------------------------
const verifyNINByPhone = async (phone, customApiKey = null) => {
    return await makeRequest('/nin-phone', 'POST', { phone }, customApiKey);
};

// ---------------------------------------------------------
// 3. NIN Tracking Search
// ---------------------------------------------------------
const verifyNINByTracking = async (trackingId, customApiKey = null) => {
    return await makeRequest('/nin-tracking', 'POST', { tracking_id: trackingId }, customApiKey);
};

// ---------------------------------------------------------
// 4. NIN Demography Search
// ---------------------------------------------------------
const verifyNINByDemography = async (firstname, lastname, gender, dob, customApiKey = null) => {
    const payload = { firstname, lastname, gender, dob };
    return await makeRequest('/nin-demography', 'POST', payload, customApiKey);
};

// ---------------------------------------------------------
// 5. BVN Verification
// ---------------------------------------------------------
const verifyBVN = async (bvn, customApiKey = null) => {
    return await makeRequest('/bvn-verification', 'POST', { bvn }, customApiKey);
};

// ---------------------------------------------------------
// 6. BVN Phone Search
// ---------------------------------------------------------
const verifyBVNByPhone = async (phone, customApiKey = null) => {
    return await makeRequest('/bvn-phone', 'POST', { phone }, customApiKey);
};

// ---------------------------------------------------------
// 7. Account Balance
// ---------------------------------------------------------
const getBalance = async (customApiKey = null) => {
    return await makeRequest('/balance', 'GET', null, customApiKey);
};

// ---------------------------------------------------------
// 8. NIN Modification Orders
// ---------------------------------------------------------
const submitNINModification = async (modificationData, customApiKey = null) => {
    // modificationData should contain service_type and other required fields based on type
    return await makeRequest('/nin-modification', 'POST', modificationData, customApiKey);
};

// ---------------------------------------------------------
// 9. Modification Order Status
// ---------------------------------------------------------
const getModificationStatus = async (referenceId, customApiKey = null) => {
    return await makeRequest(`/nin-modification-status?reference_id=${encodeURIComponent(referenceId)}`, 'GET', null, customApiKey);
};

export {
    verifyNIN,
    verifyNINByPhone,
    verifyNINByTracking,
    verifyNINByDemography,
    verifyBVN,
    verifyBVNByPhone,
    getBalance,
    submitNINModification,
    getModificationStatus,
    maskPII,
    maskApiKey
};
