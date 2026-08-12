import axios from 'axios';

/**
 * Service to handle BillSplash BVN Verification
 * Documentation: https://billsplash.com/api_documentation.php
 */
export const verifyBvnWithBillSplash = async (bvn, slipType = 'standard') => {
    // 1. Missing API Key check (Fail-safe)
    const apiKey = process.env.BILLSPLASH_API_KEY;
    if (!apiKey) {
        throw new Error('MISSING_API_KEY');
    }

    // 2. Redact BVN for secure logging (e.g., ********901)
    const maskedBvn = bvn && bvn.length === 11 
        ? '********' + bvn.substring(8) 
        : '***********';

    try {
        console.log(`[BillSplashService] Initiating BVN Verification for ${maskedBvn} (Type: ${slipType})`);
        
        const response = await axios.post(
            'https://billsplash.com/api/bvn_verification.php',
            {
                bvn,
                slip_type: slipType
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 10000 // 10-second timeout to prevent hanging
            }
        );

        // Standardize provider success
        return response.data;
    } catch (error) {
        // Redact any sensitive information in the error before it bubbles up
        console.error(`[BillSplashService] Error verifying BVN ${maskedBvn}:`, error.message);
        
        if (error.response) {
            // Provider responded with an HTTP error status
            const status = error.response.status;
            const message = error.response.data?.message || error.response.data?.error || `Provider Error ${status}`;
            
            const err = new Error(message);
            err.status = status;
            err.isProviderError = true;
            throw err;
        } else if (error.request) {
            // Request was made but no response received (Network/Timeout)
            const err = new Error('Unable to connect to BVN verification provider');
            err.status = 502;
            err.isNetworkError = true;
            throw err;
        } else {
            // Internal client error
            const err = new Error('Internal validation/client error before sending request');
            err.status = 500;
            throw err;
        }
    }
};
