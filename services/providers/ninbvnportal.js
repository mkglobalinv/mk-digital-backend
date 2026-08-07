import axios from 'axios';
import crypto from 'crypto';

/**
 * NINBVNPORTAL Provider (Standalone Evaluation)
 * IMPORTANT: This file is strictly for isolated testing.
 * DO NOT integrate into production until approved.
 */

const BASE_URL = 'https://ninbvnportal.com.ng/api';

class NINBVNPortalProvider {
    constructor(apiKey) {
        if (!apiKey) {
            console.warn('[NINBVNPORTAL] Warning: API key is missing. Live requests will fail.');
        }
        this.apiKey = apiKey;
        this.client = axios.create({
            baseURL: BASE_URL,
            timeout: 20000, // 20 second request timeout
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey || 'MOCK_KEY_FOR_TESTS'
            }
        });

        // Structured Logging & Retry Interceptor
        this.client.interceptors.request.use((config) => {
            config.metadata = { startTime: new Date() };
            return config;
        });

        this.client.interceptors.response.use(
            (response) => {
                response.config.metadata.endTime = new Date();
                response.duration = response.config.metadata.endTime - response.config.metadata.startTime;
                this.logResponse(response);
                return response;
            },
            async (error) => {
                if (error.config) {
                    error.config.metadata.endTime = new Date();
                    error.duration = error.config.metadata.endTime - error.config.metadata.startTime;
                }
                this.logError(error);
                return this.handleRetry(error);
            }
        );
    }

    /**
     * Masks PII for secure logging
     */
    maskPII(data) {
        if (!data) return data;
        let masked = JSON.parse(JSON.stringify(data));
        
        const maskFields = ['number', 'phone', 'bvn', 'nin', 'tracking_id', 'trackingId', 'dob', 'firstName', 'lastName'];
        
        const recursiveMask = (obj) => {
            for (let key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    recursiveMask(obj[key]);
                } else if (maskFields.includes(key.toLowerCase()) && typeof obj[key] === 'string') {
                    if (obj[key].length > 4) {
                        obj[key] = obj[key].substring(0, 2) + '******' + obj[key].substring(obj[key].length - 2);
                    } else {
                        obj[key] = '***';
                    }
                }
            }
        };

        recursiveMask(masked);
        return masked;
    }

    logResponse(response) {
        console.log(`[NINBVNPORTAL] SUCCESS [${response.config.method.toUpperCase()} ${response.config.url}]`);
        console.log(`[NINBVNPORTAL] Headers:`, JSON.stringify({ ...response.config.headers, 'x-api-key': '***MASKED***' }));
        console.log(`[NINBVNPORTAL] Status: ${response.status}`);
        console.log(`[NINBVNPORTAL] Response Time: ${response.duration}ms`);
        let configData = response.config.data;
        if (typeof configData === 'string') {
            try { configData = JSON.parse(configData); } catch(e) {}
        }
        console.log(`[NINBVNPORTAL] Payload:`, JSON.stringify(this.maskPII(configData || {})));
        console.log(`[NINBVNPORTAL] Response:`, JSON.stringify(response.data)); 
    }

    logError(error) {
        console.error(`[NINBVNPORTAL] ERROR [${error.config?.method?.toUpperCase()} ${error.config?.url}]`);
        console.error(`[NINBVNPORTAL] Headers:`, JSON.stringify({ ...(error.config?.headers || {}), 'x-api-key': '***MASKED***' }));
        if (error.duration) {
            console.error(`[NINBVNPORTAL] Response Time: ${error.duration}ms`);
        }
        let configData = error.config?.data;
        if (typeof configData === 'string') {
            try { configData = JSON.parse(configData); } catch(e) {}
        }
        console.error(`[NINBVNPORTAL] Payload:`, JSON.stringify(this.maskPII(configData || {})));

        if (error.response) {
            console.error(`[NINBVNPORTAL] Status: ${error.response.status}`);
            console.error(`[NINBVNPORTAL] Response Data:`, JSON.stringify(error.response.data));
        } else if (error.request) {
            console.error(`[NINBVNPORTAL] No response received. Timeout or network error.`);
        } else {
            console.error(`[NINBVNPORTAL] Setup Error:`, error.message);
        }
    }

    async handleRetry(error, maxRetries = 2) {
        const config = error.config;
        if (!config || !config.retryCount) {
            config.retryCount = 0;
        }

        // Retry on network errors or 5xx server errors
        const shouldRetry = !error.response || (error.response.status >= 500 && error.response.status < 600);

        if (shouldRetry && config.retryCount < maxRetries) {
            config.retryCount += 1;
            console.log(`[NINBVNPORTAL] Retrying request (${config.retryCount}/${maxRetries})...`);
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, config.retryCount)));
            return this.client(config);
        }

        throw this.normalizeError(error);
    }

    normalizeError(error) {
        return {
            success: false,
            provider: 'NINBVNPORTAL',
            message: error.response?.data?.message || error.message || 'Unknown Provider Error',
            statusCode: error.response?.status || 500,
            originalError: error.response?.data || null
        };
    }

    async _post(endpoint, payload) {
        try {
            const start = Date.now();
            // Force consent: true as per documentation rules
            const finalPayload = { ...payload, consent: true };
            const response = await this.client.post(endpoint, finalPayload);
            return {
                success: true,
                data: response.data,
                responseTimeMs: Date.now() - start
            };
        } catch (error) {
            return error; // Normalized error returned from interceptor
        }
    }

    async _get(endpoint, params = {}) {
        try {
            const start = Date.now();
            const response = await this.client.get(endpoint, { params });
            return {
                success: true,
                data: response.data,
                responseTimeMs: Date.now() - start
            };
        } catch (error) {
            return error; // Normalized error
        }
    }

    // ==========================================
    // ENDPOINTS
    // ==========================================

    async verifyNIN(nin) {
        return this._post('/nin-verification', { nin: nin });
    }

    async searchNINByPhone(phone) {
        return this._post('/nin-phone', { phone: phone });
    }

    async searchNINByTracking(trackingId) {
        return this._post('/nin-tracking', { tracking_id: trackingId }); // Guessing based on pattern, but will test
    }

    async searchNINByDemography(demographyData) {
        return this._post('/nin-demography', demographyData);
    }

    async verifyBVN(bvn) {
        return this._post('/bvn-verification', { bvn: bvn });
    }

    async searchBVNByPhone(phone) {
        return this._post('/bvn-phone', { phone: phone });
    }

    async checkBalance() {
        return this._get('/balance');
    }
}

export default NINBVNPortalProvider;
