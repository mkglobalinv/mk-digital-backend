import { verifyBvnWithBillSplash } from '../services/providers/billSplashBvnService.js';

export const verifyBvn = async (req, res) => {
    try {
        let { bvn, slip_type } = req.body;

        // 1. Validate BVN
        if (!bvn) {
            return res.status(400).json({ status: 'error', message: 'BVN is required' });
        }

        bvn = String(bvn).trim();
        
        if (bvn.length !== 11) {
            return res.status(400).json({ status: 'error', message: 'BVN must be exactly 11 digits' });
        }

        if (!/^\d{11}$/.test(bvn)) {
            return res.status(400).json({ status: 'error', message: 'BVN must contain only numeric digits' });
        }

        // Validate slip_type (optional, defaults to standard)
        if (slip_type && !['standard', 'premium'].includes(slip_type)) {
            return res.status(400).json({ status: 'error', message: 'Invalid slip_type. Allowed values are standard or premium' });
        }

        const typeToUse = slip_type || 'standard';

        // 2. Call Service
        const providerData = await verifyBvnWithBillSplash(bvn, typeToUse);

        // 3. Return Success based on 9JASUB identity/vtu convention
        return res.json({
            status: 'success',
            message: 'BVN verification successful',
            data: providerData
        });

    } catch (error) {
        // 4. Handle Errors
        if (error.message === 'MISSING_API_KEY') {
            return res.status(500).json({
                status: 'error',
                message: 'BVN verification service is not configured'
            });
        }

        const statusCode = error.status || 500;
        const message = error.isProviderError || error.isNetworkError 
            ? error.message 
            : 'Internal Server Error';

        return res.status(statusCode).json({
            status: 'error',
            message: message
        });
    }
};
