import axios from 'axios';
import { getReloadlyAccessToken } from '../reloadlyAuth.js';

const RELOADLY_BASE_URL = process.env.RELOADLY_BASE_URL || 'https://topups.reloadly.com';

/**
 * Buy International Airtime with Reloadly
 */
export const buyAirtimeWithReloadly = async (countryCode, operatorId, amount, phone) => {
    try {
        const token = await getReloadlyAccessToken();
        
        const response = await axios.post(`${RELOADLY_BASE_URL}/topups`, {
            operatorId: operatorId,
            amount: amount,
            useLocalAmount: false,
            recipientPhone: {
                countryCode: countryCode,
                number: phone
            }
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/com.reloadly.topups-v1+json',
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        if (response.data && response.data.status === 'SUCCESSFUL') {
            return {
                success: true,
                reference: response.data.transactionId,
                data: response.data
            };
        } else {
            return {
                success: false,
                message: response.data?.message || "Reloadly airtime purchase failed",
                data: response.data
            };
        }
    } catch (error) {
        console.error("[Reloadly] Airtime Purchase Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || "Failed to process international airtime",
            data: error.response?.data || { error: error.message }
        };
    }
};

/**
 * Buy International Data with Reloadly
 */
export const buyDataWithReloadly = async (countryCode, operatorId, amount, phone) => {
    // Reloadly Topups API also handles bundles via the same /topups endpoint if operatorId supports it
    // But usually data bundles have specific IDs. 
    // For this implementation, we assume the amount is the bundle price if it's a fixed bundle.
    try {
        const token = await getReloadlyAccessToken();
        
        const response = await axios.post(`${RELOADLY_BASE_URL}/topups`, {
            operatorId: operatorId,
            amount: amount,
            useLocalAmount: false,
            recipientPhone: {
                countryCode: countryCode,
                number: phone
            }
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/com.reloadly.topups-v1+json',
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        if (response.data && response.data.status === 'SUCCESSFUL') {
            return {
                success: true,
                reference: response.data.transactionId,
                data: response.data
            };
        } else {
            return {
                success: false,
                message: response.data?.message || "Reloadly data purchase failed",
                data: response.data
            };
        }
    } catch (error) {
        console.error("[Reloadly] Data Purchase Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || "Failed to process international data",
            data: error.response?.data || { error: error.message }
        };
    }
};

/**
 * Helper to fetch operators for a country
 */
export const getReloadlyOperators = async (countryCode) => {
    try {
        console.log(`[Reloadly] Fetching operators for: ${countryCode}`);
        const token = await getReloadlyAccessToken();
        const response = await axios.get(`${RELOADLY_BASE_URL}/operators/countries/${countryCode}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            timeout: 30000 // 30 seconds timeout
        });
        
        console.log(`[Reloadly] SUCCESS: Found ${response.data?.length || 0} operators`);
        return response.data;
    } catch (error) {
        console.error("[Reloadly] Get Operators FAILED:", error.response?.status, error.response?.data || error.message);
        throw new Error(`Reloadly API Error: ${error.message}`);
    }
};
