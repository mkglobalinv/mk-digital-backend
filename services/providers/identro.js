import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Identro Merchant API Provider (Standalone Module)
 * 
 * STATUS: DORMANT / UNINTEGRATED
 * 
 * This module is built against the official Identro Developer Documentation:
 * Base URL: https://api.identro.ng
 * API Prefix: /merchant-api
 * Auth: x-api-key header
 */

const IDENTRO_API_KEY = process.env.IDENTRO_API_KEY || ''; // NEVER HARDCODE
const BASE_URL = process.env.IDENTRO_BASE_URL || 'https://api.identro.ng/merchant-api';
const TIMEOUT = 30000;

// Create Axios Instance
const identroClient = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request Interceptor (Authentication & Logging)
identroClient.interceptors.request.use((config) => {
    if (IDENTRO_API_KEY) {
        config.headers['x-api-key'] = IDENTRO_API_KEY;
    }
    
    // Auto-generate idempotency key for POST requests if not provided
    if (config.method?.toLowerCase() === 'post' && !config.headers['idempotencyKey']) {
        config.headers['idempotencyKey'] = uuidv4();
    }

    // Mask sensitive data for logging
    const logPayload = { ...config.data };
    if (logPayload.nin) logPayload.nin = '****' + logPayload.nin.slice(-4);
    if (logPayload.bvn) logPayload.bvn = '****' + logPayload.bvn.slice(-4);

    console.log('\n======================================================');
    console.log('[BACKEND -> IDENTRO] OUTBOUND REQUEST LOGGING');
    console.log(`Endpoint: ${config.url}`);
    console.log(`Payload:`, JSON.stringify(logPayload, null, 2));
    console.log('======================================================\n');

    return config;
}, (error) => Promise.reject(error));

// Response Interceptor (Error Normalization)
identroClient.interceptors.response.use((response) => {
    return response;
}, (error) => {
    const status = error.response?.status || 500;
    const body = error.response?.data || { message: error.message };

    console.log('\n======================================================');
    console.log('[IDENTRO -> BACKEND] INBOUND RESPONSE ERROR');
    console.log(`Status: ${status}`);
    console.log(`Body:`, JSON.stringify(body, null, 2));
    console.log('======================================================\n');

    return Promise.reject({
        success: false,
        status: status,
        message: body.message || 'Unknown Identro API Error',
        data: body,
        reference: body.reference || null
    });
});

/**
 * Standardizes API responses to the 9JASUB internal format.
 */
const normalizeResponse = (res) => {
    return {
        success: res.data?.status || (res.status >= 200 && res.status < 300),
        status: 'successful',
        reference: res.data?.reference || null,
        message: res.data?.message || 'Transaction successful',
        data: res.data || {},
        provider_used: 'identro'
    };
};

/**
 * Utility wrapper for POST requests with built-in retry logic
 */
const postWithRetry = async (url, payload, retries = 2) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await identroClient.post(url, payload);
            return response;
        } catch (error) {
            console.error(`[Identro] POST ${url} error (Attempt ${attempt}):`, error.message);
            // Don't retry on client errors (400, 401, 403, 404, 422) or Insufficient Balance
            if (error.status >= 400 && error.status < 500) {
                throw error; 
            }
            if (attempt === retries) throw error;
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
    }
};


// =============================================================================
// IDENTITY SERVICES
// =============================================================================

export const verifyNIN = async (nin, slipType = "vnin") => {
    try {
        const result = await postWithRetry('/nin/verify', { nin: String(nin), slip_type: slipType });
        return normalizeResponse(result);
    } catch (error) {
        return error;
    }
};

export const verifyBVN = async (bvn, slipType = "premium") => {
    try {
        const result = await postWithRetry('/bvn/verify', { bvn: String(bvn), slip_type: slipType });
        return normalizeResponse(result);
    } catch (error) {
        return error;
    }
};

export const searchCACName = async (name) => {
    try {
        const result = await postWithRetry('/cac/name-search', { name: String(name) });
        return normalizeResponse(result);
    } catch (error) {
        return error;
    }
};

export const verifyCACBasic = async (rcNumber, companyName) => {
    try {
        const result = await postWithRetry('/cac/basic', { rc_number: rcNumber, company_name: companyName });
        return normalizeResponse(result);
    } catch (error) {
        return error;
    }
};

export const verifyCACAdvanced = async (rcNumber, companyName) => {
    try {
        const result = await postWithRetry('/cac/advance', { rc_number: rcNumber, company_name: companyName });
        return normalizeResponse(result);
    } catch (error) {
        return error;
    }
};

export const verifyTIN = async (tinOrRcNumber) => {
    try {
        const result = await postWithRetry('/tin/verify', { identifier: tinOrRcNumber });
        return normalizeResponse(result);
    } catch (error) {
        return error;
    }
};

export const verifyCreditHistory = async (bvn) => {
    try {
        const result = await postWithRetry('/credit-history/verify', { bvn: String(bvn) });
        return normalizeResponse(result);
    } catch (error) {
        return error;
    }
};

export const lookupMeterAddress = async (meterNumber, disco) => {
    try {
        const result = await postWithRetry('/address-lookup/verify', { meter_number: meterNumber, disco: disco });
        return normalizeResponse(result);
    } catch (error) {
        return error;
    }
};

export const verifyDriverLicense = async (licenseNumber, dob) => {
    try {
        const result = await postWithRetry('/driver-license/verify', { license_number: licenseNumber, dob: dob });
        return normalizeResponse(result);
    } catch (error) {
        return error;
    }
};

export const verifyVotersCard = async (vin, state) => {
    try {
        const result = await postWithRetry('/voters-card/verify', { vin: vin, state: state });
        return normalizeResponse(result);
    } catch (error) {
        return error;
    }
};


// =============================================================================
// VTU & DIGITAL SERVICES
// =============================================================================

export const getDigitalProducts = async () => {
    try {
        const result = await identroClient.get('/digital-services/products');
        return normalizeResponse(result);
    } catch (error) {
        return error;
    }
};

export const purchaseAirtime = async (phone, amount, network) => {
    try {
        const result = await postWithRetry('/digital-services/airtime', { phone, amount, network });
        return normalizeResponse(result);
    } catch (error) {
        return error;
    }
};

export const purchaseDataBundle = async (phone, productCode, network) => {
    try {
        const result = await postWithRetry('/digital-services/data-bundle', { phone, product_code: productCode, network });
        return normalizeResponse(result);
    } catch (error) {
        return error;
    }
};

export const payElectricity = async (meterNumber, disco, amount, meterType) => {
    try {
        const result = await postWithRetry('/digital-services/electricity', { meter_number: meterNumber, disco, amount, meter_type: meterType });
        return normalizeResponse(result);
    } catch (error) {
        return error;
    }
};

export const payCableTV = async (smartcard, productCode, provider) => {
    try {
        const result = await postWithRetry('/digital-services/cable-tv', { smartcard, product_code: productCode, provider });
        return normalizeResponse(result);
    } catch (error) {
        return error;
    }
};

export const requeryTransaction = async (reference) => {
    try {
        const result = await postWithRetry('/digital-services/transactions/requery', { reference });
        return normalizeResponse(result);
    } catch (error) {
        return error;
    }
};


// =============================================================================
// UNSUPPORTED / PENDING SERVICES
// =============================================================================

// TODO: NIN Modification (Not documented by Identro)
export const modifyNIN = async (payload) => {
    return { success: false, status: 'failed', message: 'Endpoint not documented by Identro.' };
}

// TODO: BVN Modification (Not documented by Identro)
export const modifyBVN = async (payload) => {
    return { success: false, status: 'failed', message: 'Endpoint not documented by Identro.' };
}

// TODO: CAC Registration (Not documented by Identro)
export const registerCAC = async (payload) => {
    return { success: false, status: 'failed', message: 'Endpoint not documented by Identro.' };
}


// =============================================================================
// WEBHOOK VERIFICATION (Utility)
// =============================================================================

export const verifyWebhookSignature = (signature, rawBody, webhookSecret) => {
    if (!signature || !rawBody || !webhookSecret) return false;
    const hash = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    return hash === signature;
};
