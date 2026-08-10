import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import DataPlan from '../models/DataPlan.js';
import { deductBalance, refundBalance } from '../services/walletService.js';
import { smartBuyIdentity } from '../services/switcher.js';
import idempotencyService from '../services/idempotencyService.js';
import { getRetailPrice } from '../services/pricing/retailPricing.js';
import { getAssistedServiceConfig, calculateProfitSplit } from '../services/pricing/assistedServicesPricing.js';
import { uploadPrivateDocument } from '../services/storageService.js';
import ServiceRequest from '../models/ServiceRequest.js';
import { maskPII } from '../services/providers/checkmyninbvn.js';

/**
 * GET /api/retail/identity/service/:serviceId
 * Returns a single identity plan from MongoDB — the frontend's single source of truth.
 */
export const getIdentityService = async (req, res) => {
    const { serviceId } = req.params;
    const userId = req.user._id;

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

        // Dynamically fetch authoritative pricing (overrides deprecated static DB price)
        const pricingResult = await getRetailPrice(userId, plan.api_plan_id, 'identity');
        plan.selling_price = pricingResult.finalPrice;

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
    const txReference = reference || `IDT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const walletReference = reference ? `W-${reference}` : `W-${txReference}`;

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
            
            console.log(`
=========================================
IDENTITY SERVICE: ${serviceId.toUpperCase()}
SELECTED PROVIDER: ${plan.provider}
PROVIDER METHOD: N/A
ENDPOINT: N/A
WALLET DEDUCTION: REJECTED (Insufficient user balance: ${user.balance1 + (user.balance2 || 0)} < ${cost})
PROVIDER REQUEST SENT: NO
PROVIDER RESPONSE STATUS: N/A
PROVIDER RESPONSE MESSAGE: Insufficient balance
=========================================`);

            return res.status(400).json({ status: 'error', message: 'Insufficient balance' });
        }

        // 2. Deduct Wallet securely
        const deductResult = await deductBalance(userId, cost, walletReference, `Identity Service: ${plan.plan_name}`);
        if (!deductResult) {
            idempotencyService.releaseLock(idempotencyKey);

            console.log(`
=========================================
IDENTITY SERVICE: ${serviceId.toUpperCase()}
SELECTED PROVIDER: ${plan.provider}
PROVIDER METHOD: N/A
ENDPOINT: N/A
WALLET DEDUCTION: FAILED (₦${cost})
PROVIDER REQUEST SENT: NO
PROVIDER RESPONSE STATUS: N/A
PROVIDER RESPONSE MESSAGE: Wallet deduction failed
=========================================`);

            return res.status(400).json({ status: 'error', message: 'Wallet deduction failed. Please try again.' });
        }
        isDeducted = true;

        // 3. Create Transaction (Pending)
        const transaction = await Transaction.create({
            userId: userId,
            reference: txReference,
            amount: cost,
            type: 'debit',
            description: plan.plan_name,
            provider_used: plan.provider,
            status: 'pending'
        });

        // 4. Call Switcher
        const providerResponse = await smartBuyIdentity(serviceId, params, plan.provider);

        if (providerResponse.status === 'success') {
            transaction.status = 'success';
            transaction.api_response = providerResponse.message || 'Verification successful';
            await transaction.save();
            idempotencyService.releaseLock(idempotencyKey);

            console.log(`
=========================================
IDENTITY SERVICE: ${serviceId.toUpperCase()}
SELECTED PROVIDER: ${plan.provider}
PROVIDER METHOD: POST
ENDPOINT: /api/${serviceId === 'nin' ? 'nin_verification.php' : 'bvn_verification.php'}
WALLET DEDUCTION: SUCCESS (₦${cost})
PROVIDER REQUEST SENT: YES
PROVIDER RESPONSE STATUS: SUCCESS
PROVIDER RESPONSE MESSAGE: ${providerResponse.message || 'OK'}
=========================================`);

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

            console.log(`
=========================================
IDENTITY SERVICE: ${serviceId.toUpperCase()}
SELECTED PROVIDER: ${plan.provider}
PROVIDER METHOD: POST
ENDPOINT: /api/${serviceId === 'nin' ? 'nin_verification.php' : 'bvn_verification.php'}
WALLET DEDUCTION: SUCCESS (₦${cost}) -> REFUNDED
PROVIDER REQUEST SENT: YES
PROVIDER RESPONSE STATUS: FAILED
PROVIDER RESPONSE MESSAGE: ${providerResponse.message}
=========================================`);

            let displayMessage = providerResponse.message || 'Service failed. Amount refunded.';
            
            // Do not leak platform API balance or gateway issues to the retail customer
            const lowerMsg = displayMessage.toLowerCase();
            if ((lowerMsg.includes('insufficient') || lowerMsg.includes('insuffient')) && lowerMsg.includes('balance')) {
                displayMessage = 'Service temporarily unavailable from provider. Amount refunded.';
            } else if (lowerMsg.includes('upstreem') || lowerMsg.includes('upstream') || lowerMsg.includes('500')) {
                displayMessage = 'Connection to Identity Provider failed. Please try again later. Amount refunded.';
            }

            return res.status(400).json({
                status: 'error',
                message: displayMessage
            });
        }
    } catch (err) {
        console.error('[Identity Service] Error:', err);
        
        // 6. Rollback / Refund on Internal Exception (Atomicity safeguard)
        if (isDeducted) {
            try {
                await refundBalance(userId, cost);
                
                // Try to mark transaction as failed if it was created
                const tx = await Transaction.findOne({ reference: txReference });
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

        console.log(`
=========================================
IDENTITY SERVICE: ${serviceId.toUpperCase()}
SELECTED PROVIDER: UNKNOWN
PROVIDER METHOD: UNKNOWN
ENDPOINT: UNKNOWN
WALLET DEDUCTION: ${isDeducted ? 'SUCCESS -> REFUNDED' : 'FAILED'}
PROVIDER REQUEST SENT: NO
PROVIDER RESPONSE STATUS: N/A
PROVIDER RESPONSE MESSAGE: Internal Server Error (${err.message})
=========================================`);

        return res.status(500).json({ status: 'error', message: 'Internal Server Error. Amount refunded if deducted.' });
    }
};


export const processAssistedIdentityService = async (req, res) => {
    const { serviceType, whatsappNumber, reference, ...submittedData } = req.body;
    const userId = req.user._id;

    const config = getAssistedServiceConfig(serviceType);

    if (!serviceType || !config) {
        return res.status(400).json({ status: 'error', message: 'Invalid or missing serviceType' });
    }
    if (!whatsappNumber) {
        return res.status(400).json({ status: 'error', message: 'WhatsApp number is required' });
    }
    if (!reference) {
        return res.status(400).json({ status: 'error', message: 'Reference is required' });
    }

    const tenantId = req.reseller ? req.reseller._id : null;
    const resellerTier = req.reseller ? req.reseller.resellerTier : null;
    const profitData = calculateProfitSplit(serviceType, resellerTier);

    const cost = profitData.amount;

    // 1. Idempotency (Using transactionIdempotency middleware handles uniqueness & lock)
    // The transactionIdempotency middleware already verified lock and uniqueness before this controller hits.

    let isDeducted = false;
    let uploadedDocs = [];
    const txReference = reference;
    const walletReference = `W-${reference}`;

    try {
        // 2. Validate Balance
        const user = await User.findById(userId);
        if ((user.balance1 + (user.balance2 || 0)) < cost) {
            return res.status(400).json({ status: 'error', message: 'Insufficient balance' });
        }

        // 3. Process Document Uploads
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const mimeType = file.mimetype;
                const originalName = file.originalname;
                const storageKey = await uploadPrivateDocument(file.buffer, originalName, mimeType, 'assisted-services');
                uploadedDocs.push({
                    storageKey,
                    documentType: 'UPLOADED_FILE',
                    mimeType,
                    size: file.size
                });
            }
        }

        // 4. Deduct Wallet
        const deductResult = await deductBalance(userId, cost, walletReference, `Assisted Service: ${config.name}`);
        if (!deductResult) {
            return res.status(400).json({ status: 'error', message: 'Wallet deduction failed. Please try again.' });
        }
        isDeducted = true;

        // 5. Create Transaction (SUCCESS - since wallet logic committed its own transaction)
        const transaction = await Transaction.create({
            userId: userId,
            reference: txReference,
            amount: cost,
            type: 'debit',
            description: config.name,
            provider_used: 'System Admin',
            status: 'success',
            api_response: 'Pending Admin Processing'
        });

        // 6. Create ServiceRequest
        let serviceRequest;
        try {
            serviceRequest = await ServiceRequest.create({
                userId,
                serviceType,
                reference: txReference,
                whatsappNumber,
                submittedData,
                documents: uploadedDocs,
                amount: cost,
                status: 'PENDING_REVIEW',
                expectedProcessingTime: config.expectedProcessingTime,
                transactionId: transaction._id,
                
                // Profit & Multi-Tenant Snapshot
                tenantId: tenantId,
                resellerTierAtPurchase: resellerTier,
                underlyingCost: profitData.cost,
                grossProfit: profitData.profit,
                resellerProfitShare: profitData.resellerShare,
                resellerProfitAmount: profitData.resellerProfit,
                platformProfitShare: profitData.platformShare,
                platformProfitAmount: profitData.platformProfit,
                profitDistributed: false
            });
        } catch (dbErr) {
            console.error('[Assisted Service] Failed to create ServiceRequest after deduction', dbErr);
            // ROLLBACK COMPENSATING TRANSACTION
            try {
                await refundBalance(userId, cost, transaction);
                transaction.status = 'failed';
                transaction.api_response = 'Internal System Error - Refunded';
                await transaction.save();
                console.log(`[Assisted Service] Successfully refunded ₦${cost} for ${txReference} due to ServiceRequest creation failure.`);
            } catch (refundErr) {
                console.error(`[Assisted Service] HIGH SEVERITY: Refund exception for ${txReference}`, refundErr);
                transaction.status = 'failed';
                transaction.api_response = 'Internal System Error - Refund FAILED (Reconciliation Required)';
                await transaction.save();
            }
            return res.status(500).json({ status: 'error', message: 'System Error during processing.' });
        }

        return res.json({
            status: 'success',
            message: `${config.name} submitted successfully`,
            data: {
                reference: serviceRequest.reference,
                service: config.name,
                amount: cost,
                status: serviceRequest.status,
                expectedProcessingTime: serviceRequest.expectedProcessingTime
            }
        });

    } catch (err) {
        console.error('[Assisted Service] Error:', err);
        
        if (isDeducted) {
            try {
                const tx = await Transaction.findOne({ reference: txReference });
                await refundBalance(userId, cost, tx);
                if (tx) {
                    tx.status = 'failed';
                    tx.api_response = 'Internal System Error - Refunded';
                    await tx.save();
                }
                console.log(`[Assisted Service] Successfully refunded ₦${cost} for ${txReference} due to exception.`);
            } catch (refundErr) {
                console.error(`[Assisted Service] HIGH SEVERITY: Refund failed after exception for ${txReference}`, refundErr);
                const tx = await Transaction.findOne({ reference: txReference });
                if (tx) {
                    tx.status = 'failed';
                    tx.api_response = 'Internal System Error - Refund FAILED (Reconciliation Required)';
                    await tx.save();
                }
            }
        }

        return res.status(500).json({ status: 'error', message: 'Internal Server Error.' });
    }
};

