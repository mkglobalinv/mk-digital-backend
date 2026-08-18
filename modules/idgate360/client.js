import axios from 'axios';

/**
 * IDGate360 API Client (Standalone Module)
 *
 * STATUS: ISOLATED / NOT WIRED INTO PRODUCTION
 *
 * Thin wrapper around the IDGate360 developer API (NIN/BVN verification
 * slips, bank account verification, IPE clearance, NIN validation).
 * Base URL: https://idgate360.com.ng/api
 * Auth: api_key included in every JSON request body.
 *
 * This client is only ever imported by files inside modules/idgate360/.
 * Nothing in the existing VTU codebase (routes/, services/, controllers/,
 * server.js) imports from here.
 */

const API_KEY = process.env.IDGATE360_API_KEY || '';
const BASE_URL = process.env.IDGATE360_BASE_URL || 'https://idgate360.com.ng/api';
const TIMEOUT = 30000;

if (!API_KEY) {
    console.warn('[IDGate360] IDGATE360_API_KEY is not set — requests will fail with 401 Unauthorized.');
}

const client = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT,
    headers: {
        'Content-Type': 'application/json'
    }
});

const SENSITIVE_KEYS = ['nin', 'bvn', 'phone', 'trackingID', 'bankAccount', 'dob', 'api_key'];

const maskPayload = (payload = {}) => {
    const masked = { ...payload };
    for (const key of SENSITIVE_KEYS) {
        if (typeof masked[key] === 'string' && masked[key].length > 4) {
            masked[key] = '****' + masked[key].slice(-4);
        } else if (masked[key]) {
            masked[key] = '****';
        }
    }
    return masked;
};

client.interceptors.request.use((config) => {
    console.log(`[IDGate360 -> OUT] POST ${config.url}`, JSON.stringify(maskPayload(config.data)));
    return config;
}, (error) => Promise.reject(error));

client.interceptors.response.use((response) => {
    const body = { ...(response.data || {}) };
    if (body.pdf_base64) body.pdf_base64 = `<${body.pdf_base64.length} base64 chars omitted>`;
    console.log(`[IDGate360 <- IN] ${response.status} ${response.config.url}`, JSON.stringify(body));
    return response;
}, (error) => {
    const status = error.response?.status || 0;
    const body = error.response?.data || { message: error.message };
    console.error(`[IDGate360 <- ERROR] ${status || 'network'} ${error.config?.url}`, JSON.stringify(body));
    return Promise.reject({
        isIdgate360Error: true,
        status: status || 502,
        body
    });
});

/**
 * POST to an IDGate360 endpoint, automatically injecting the api_key.
 * @param {string} path - e.g. '/nin/premium'
 * @param {object} data - endpoint-specific fields (api_key is added here)
 */
export const idgate360Post = async (path, data = {}) => {
    const response = await client.post(path, { api_key: API_KEY, ...data });
    return response.data;
};

export default client;
