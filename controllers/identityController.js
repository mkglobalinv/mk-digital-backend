import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import DataPlan from '../models/DataPlan.js';
import { deductBalance, refundBalance } from '../services/walletService.js';
import { smartBuyIdentity } from '../services/switcher.js';
import idempotencyService from '../services/idempotencyService.js';
import { getRetailPrice } from '../services/pricing/retailPricing.js';
import { maskPII } from '../services/providers/checkmyninbvn.js';

/**
 * GET /api/retail/identity/service/:serviceId
 * Returns a single identity plan from MongoDB — the frontend's single source of truth.
 */
export const getIdentityService = async (req, res) => {
    const { serviceId } = req.params;
    if (!serviceId) {
        return res.status(400).json({ status: 'error', message: 'serviceId is required' });
    }
    try {
        const plan = await DataPlan.findOne(
            { api_plan_id: serviceId, network: 'IDENTITY' },
            { plan_name: 1, api_plan_id: 1, selling_price: 1, status: 1, provider: 1, network: 1, _id: 0 }
        ).lean();
        if (!plan) {
            return res.status(404).json({ status: 'error', message: `Identity service '${serviceId}' not found` });
        }
        if (!plan.status) {
            return res.status(400).json({ status: 'error', message: 'This service is currently unavailable' });
        }
        return res.json({ status: 'success', data: plan });
    } catch (err) {
        console.error('[Identity Service] getIdentityService error:', err);
        return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};


export const processIdentityService = async (req, res) => {
    const { serviceId, params, reference } = req.body;
    const userId = req.user._id;
    
    if (!serviceId) {
        return res.status(400).json({ status: 'error', message: 'Service ID is required' });
    }

    // 1. Idempotency Check (Concurrency Lock)
    const idempotencyKey = reference || idempotencyService.generatePayloadKey(userId.toString(), '/api/retail/identity/purchase', req.body);
    if (!idempotencyService.acquireLock(idempotencyKey, 15000)) {
        return res.status(429).json({ status: 'error', message: 'Duplicate transaction detected. Please wait.' });
    }

    let isDeducted = false;
    let cost = 0;

    try {
        // Fetch the Identity plan from the database
        const plan = await DataPlan.findOne({ api_plan_id: serviceId, network: 'IDENTITY' });
        if (!plan) {
            idempotencyService.releaseLock(idempotencyKey);
            return res.status(404).json({ status: 'error', message: 'Identity service not found' });
        }

        if (!plan.status) {
            idempotencyService.releaseLock(idempotencyKey);
            return res.status(400).json({ status: 'error', message: 'Service not yet available' });
        }

        // Apply pricing - Dynamically fetch from Pricing Engine V3
        const pricingResult = await getRetailPrice(userId, plan.api_plan_id, 'identity');
        cost = pricingResult.finalPrice;

        // Ensure user has balance
        const user = await User.findById(userId);
        if ((user.balance1 + (user.balance2 || 0)) < cost) {
            idempotencyService.releaseLock(idempotencyKey);
            return res.status(400).json({ status: 'error', message: 'Insufficient balance' });
        }

        // 2. Deduct Wallet securely
        const deductResult = await deductBalance(userId, cost, idempotencyKey, `Identity Service: ${plan.plan_name}`);
        if (!deductResult) {
            idempotencyService.releaseLock(idempotencyKey);
            return res.status(400).json({ status: 'error', message: 'Wallet deduction failed. Please try again.' });
        }
        isDeducted = true;

        // 3. Create Transaction (Pending)
        const transaction = await Transaction.create({
            userId: userId,
            reference: `${idempotencyKey}-${Date.now()}`,
            amount: cost,
            type: 'debit',
            description: plan.plan_name,
            provider_used: plan.provider,
            status: 'pending'
        });

        // 4. Call Switcher
        const providerResponse = await smartBuyIdentity(serviceId, params);

        if (providerResponse.status === 'success') {
            transaction.status = 'success';
            transaction.api_response = providerResponse.message || 'Verification successful';
            await transaction.save();
            idempotencyService.releaseLock(idempotencyKey);

            return res.json({
                status: 'success',
                message: `${plan.plan_name} completed successfully`,
                data: providerResponse.data || providerResponse
            });
        } else {
            // 5. Refund on Provider Failure
            await refundBalance(userId, cost, transaction);
            transaction.status = 'failed';
            transaction.api_response = providerResponse.message;
            await transaction.save();
            idempotencyService.releaseLock(idempotencyKey);

            return res.status(400).json({
                status: 'error',
                message: providerResponse.message || 'Service failed. Amount refunded.'
            });
        }
    } catch (err) {
        console.error('[Identity Service] Error:', err);
        
        // 6. Rollback / Refund on Internal Exception (Atomicity safeguard)
        if (isDeducted) {
            try {
                await refundBalance(userId, cost);
                
                // Try to mark transaction as failed if it was created
                const tx = await Transaction.findOne({ reference: idempotencyKey });
                if (tx) {
                    tx.status = 'failed';
                    tx.api_response = 'Internal System Error - Refunded';
                    await tx.save();
                }
            } catch (refundErr) {
                console.error('[Identity Service] CRITICAL: Refund failed after internal error:', refundErr);
            }
        }

        idempotencyService.releaseLock(idempotencyKey);
        return res.status(500).json({ status: 'error', message: 'Internal Server Error. Amount refunded if deducted.' });
    }
};
