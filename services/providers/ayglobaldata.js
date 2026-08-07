import axios from 'axios';
import crypto from 'crypto';

/**
 * AY Global Data Provider (Standalone Evaluation)
 * IMPORTANT: This file is strictly for isolated testing.
 * DO NOT integrate into production until approved.
 */

const BASE_URL = 'https://ayglobaldata.com/api';

class AYGlobalDataProvider {
    constructor(apiKey) {
        if (!apiKey) {
            console.warn('[AYGLOBALDATA] Warning: API key is missing. Live requests will fail.');
        }
        this.apiKey = apiKey;
        this.client = axios.create({
            baseURL: BASE_URL,
            timeout: 20000, // 20 second request timeout
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${this.apiKey || 'MOCK_KEY_FOR_TESTS'}`
            }
        });

        // Interceptors for structured logging and retries
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
        let masked;
        
        // Handle FormData masking if necessary (for CAC)
        if (typeof data.get === 'function') {
            masked = { '[FormData]': 'Data masked' };
            return masked;
        }

        masked = JSON.parse(JSON.stringify(data));
        const maskFields = ['phone', 'phone_numbers', 'bvn', 'nin', 'meternumber', 'iucnumber', 'pin', 'firstName', 'lastName', 'owner_fullname'];
        
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
        console.log(`\n[AYGLOBALDATA] SUCCESS [${response.config.method.toUpperCase()} ${response.config.url}]`);
        console.log(`[AYGLOBALDATA] Headers:`, JSON.stringify({ ...response.config.headers, 'Authorization': 'Token ***MASKED***' }));
        console.log(`[AYGLOBALDATA] Status: ${response.status}`);
        console.log(`[AYGLOBALDATA] Response Time: ${response.duration}ms`);
        
        let configData = response.config.data;
        if (typeof configData === 'string' && response.config.headers['Content-Type'] === 'application/json') {
            try { configData = JSON.parse(configData); } catch(e) {}
        }
        
        console.log(`[AYGLOBALDATA] Payload:`, JSON.stringify(this.maskPII(configData || {})));
        console.log(`[AYGLOBALDATA] Response (unmasked for audit):`, JSON.stringify(response.data)); 
    }

    logError(error) {
        console.error(`\n[AYGLOBALDATA] ERROR [${error.config?.method?.toUpperCase()} ${error.config?.url}]`);
        console.error(`[AYGLOBALDATA] Headers:`, JSON.stringify({ ...(error.config?.headers || {}), 'Authorization': 'Token ***MASKED***' }));
        
        if (error.duration) {
            console.error(`[AYGLOBALDATA] Response Time: ${error.duration}ms`);
        }
        
        let configData = error.config?.data;
        if (typeof configData === 'string' && error.config?.headers['Content-Type'] === 'application/json') {
            try { configData = JSON.parse(configData); } catch(e) {}
        }
        
        console.error(`[AYGLOBALDATA] Payload:`, JSON.stringify(this.maskPII(configData || {})));

        if (error.response) {
            console.error(`[AYGLOBALDATA] Status: ${error.response.status}`);
            console.error(`[AYGLOBALDATA] Response Data:`, JSON.stringify(error.response.data));
        } else if (error.request) {
            console.error(`[AYGLOBALDATA] No response received. Timeout or network error.`);
        } else {
            console.error(`[AYGLOBALDATA] Setup Error:`, error.message);
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
            console.log(`[AYGLOBALDATA] Retrying request (${config.retryCount}/${maxRetries})...`);
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, config.retryCount)));
            return this.client(config);
        }

        throw this.normalizeError(error);
    }

    normalizeError(error) {
        return {
            success: false,
            provider: 'AYGLOBALDATA',
            message: error.response?.data?.message || error.message || 'Unknown Provider Error',
            statusCode: error.response?.status || 500,
            originalError: error.response?.data || null
        };
    }

    async _post(endpoint, payload, customHeaders = {}) {
        try {
            const response = await this.client.post(endpoint, payload, {
                headers: { ...customHeaders }
            });
            return {
                success: true,
                data: response.data,
                statusCode: response.status
            };
        } catch (error) {
            return error;
        }
    }

    async _get(endpoint, params = {}) {
        try {
            const response = await this.client.get(endpoint, { params });
            return {
                success: true,
                data: response.data,
                statusCode: response.status
            };
        } catch (error) {
            return error;
        }
    }

    // ==========================================
    // WALLET
    // ==========================================
    async getUserDetails() {
        return this._get('/user/');
    }

    // ==========================================
    // VTU SERVICES
    // ==========================================
    async buyAirtime(network, phone, amount, ref, ported_number = false) {
        return this._post('/airtime/', { network, phone, amount, ref, ported_number: String(ported_number) });
    }

    async buyData(network, phone, data_plan, ref) {
        return this._post('/data/', { network, phone, data_plan, ref });
    }

    async verifyElectricity(provider, meternumber, metertype) {
        return this._post('/electricity/verify/', { provider, meternumber, metertype });
    }

    async payElectricity(provider, meternumber, metertype, amount, ref) {
        return this._post('/electricity/', { provider, meternumber, metertype, amount, ref });
    }

    async verifyCable(provider, iucnumber) {
        return this._post('/cabletv/verify/', { provider, iucnumber });
    }

    async payCable(provider, iucnumber, plan, ref) {
        return this._post('/cabletv/', { provider, iucnumber, plan, ref });
    }

    async generateExamPin(provider, quantity, ref) {
        return this._post('/exam/', { provider, quantity, ref });
    }

    // ==========================================
    // IDENTITY & BUSINESS SERVICES
    // ==========================================
    
    // type: "bvn" or "nin"
    // method: "bvn", "nin", or "phone"
    // slip_type: "information", "standard", "premium"
    async verifyIdentity(type, method, value, slip_type = 'information') {
        return this._post('/verify/', { type, method, value, slip_type });
    }

    // This requires multipart/form-data. Using a generic approach since FormData varies between Node and Browser.
    // In Node (testing env), we pass a generic FormData object payload.
    async registerCAC(formDataPayload, headers = {}) {
        return this._post('/cac/', formDataPayload, {
            ...headers,
            'Content-Type': 'multipart/form-data'
        });
    }

    // ==========================================
    // SMS
    // ==========================================
    async sendBulkSMS(sender_id, phone_numbers, message_body) {
        // Can be URL encoded or JSON. Using URLSearchParams for url-encoded form as per docs
        const params = new URLSearchParams();
        params.append('sender_id', sender_id);
        params.append('phone_numbers', phone_numbers);
        params.append('message_body', message_body);

        return this._post('/sms/', params, {
            'Content-Type': 'application/x-www-form-urlencoded'
        });
    }
}

export default AYGlobalDataProvider;
