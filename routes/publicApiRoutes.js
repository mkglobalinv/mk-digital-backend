import express from 'express';
import { apiAuth } from '../middlewares/apiAuth.js';
import { subscriptionLimiter } from '../middlewares/apiLimiter.js';
import { transactionIdempotency } from '../middlewares/idempotency.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import DataPlan from '../models/DataPlan.js';
import ApiLog from '../models/ApiLog.js';
import AnalyticsService from '../services/analyticsService.js';
import { buyAirtime, buyData, buyElectricity, buyCableTV } from '../services/vtuService.js';
import { checkProviderAvailability } from '../services/providerMonitoringService.js';
import crypto from 'crypto';
import axios from 'axios';
import { insertLedgerEntry } from '../services/supabaseLedger.js';
import PriceOverride from '../models/PriceOverride.js';
import AdminPricingOverride from '../models/AdminPricingOverride.js';
import SystemSetting from '../models/SystemSetting.js';

const router = express.Router();

// Helper for Webhooks
const triggerWebhook = async (user, transaction) => {
    if (!user.webhookUrl) return;
    try {
        console.log(`[Webhook] Triggering for ${user.email} | Ref: ${transaction.reference}`);
        await axios.post(user.webhookUrl, {
            status: 'success',
            data: {
                reference: transaction.reference,
                amount: transaction.amount,
                status: transaction.status,
                phone: transaction.phone,
                network: transaction.network,
                token: transaction.token,
                createdAt: transaction.createdAt
            }
        }, { timeout: 5000 });
    } catch (err) {
        console.error(`[Webhook Failed] ${user.email}: ${err.message}`);
    }
};

// Helper for generating internal references
const generateRef = () => 'api_' + crypto.randomBytes(8).toString('hex');

// Middleware to log API requests
const apiLogger = async (req, res, next) => {
    const start = Date.now();
    const originalJson = res.json;
    
    res.json = function(body) {
        const duration = Date.now() - start;
        ApiLog.create({
            userId: req.user?._id,
            endpoint: req.originalUrl,
            method: req.method,
            requestBody: req.body,
            responseBody: body,
            statusCode: res.statusCode,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            responseTime: duration
        }).catch(err => console.error('[ApiLogger Error]', err.message));
        
        return originalJson.call(this, body);
    };
    next();
};

router.use(apiAuth);
router.use(subscriptionLimiter);
router.use(apiLogger);

/**
 * GET /balance
 */
router.get('/balance', async (req, res) => {
    res.json({
        status: 'success',
        balance: req.isSandbox ? req.user.sandboxBalance : req.user.totalBalance,
        isSandbox: req.isSandbox,
        currency: 'NGN'
    });
});

/**
 * GET /analytics
 */
router.get('/analytics', async (req, res) => {
    try {
        const stats = await AnalyticsService.getUserStats(req.user._id);
        res.json({ status: 'success', data: stats });
    } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

/**
 * GET /user/details
 */
router.get('/user/details', async (req, res) => {
    res.json({
        status: 'success',
        data: {
            name: req.user.name,
            email: req.user.email,
            apiLevel: req.user.apiLevel,
            kycVerified: req.user.kycVerified,
            tier: req.user.apiSubscriptionTier || 'free'
        }
    });
});

/**
 * POST /data
 */
router.post('/data', transactionIdempotency, async (req, res) => {
    const { network, plan_id, phone, reference: clientRef } = req.body;

    if (!network || !plan_id || !phone) {
        return res.status(400).json({ status: 'error', message: 'Missing required fields: network, plan_id, phone' });
    }

    try {
        const plan = await DataPlan.findOne({ api_plan_id: plan_id, network: network.toUpperCase() });
        if (!plan) return res.status(404).json({ status: 'error', message: 'Data plan not found' });

        // Safety guard: check provider status before debiting wallet
        const isAvailable = await checkProviderAvailability('data', network, 'smart', 'NG');
        if (!isAvailable) {
            return res.status(400).json({ status: 'error', message: 'Service temporarily unavailable. Please try again later.' });
        }

        const { sellingPrice, basePrice, reseller } = await calculateVtuPrice(req.user._id, 'data', network, plan_id);
        const price = sellingPrice;
        const profit = Math.max(0, sellingPrice - basePrice);
        const resellerUser = reseller;

        const balanceField = req.isSandbox ? 'sandboxBalance' : 'balance1';
        if (req.user[balanceField] < price) {
            return res.status(402).json({ status: 'error', message: 'Insufficient wallet balance' });
        }

        const internalRef = clientRef || generateRef();
        const transaction = await Transaction.create({
            userId: req.user._id,
            resellerId: req.user.referredBy || null,
            amount: price,
            type: 'debit',
            status: 'processing',
            reference: internalRef,
            description: `API: Data ${plan.plan_name} to ${phone}`,
            phone,
            network,
            profit,
            isApiRequest: true,
            isSandbox: req.isSandbox,
            provider_used: plan.provider,
            api_response: { planCode: plan_id, networkId: null, operatorId: null, provider: plan.provider, payload: req.body }
        });

        await User.findByIdAndUpdate(req.user._id, { $inc: { [balanceField]: -price } });
        transaction.balance_deducted = true;
        await transaction.save();

        if (req.isSandbox) {
            transaction.status = 'success';
            transaction.api_response = { ...(transaction.api_response || {}), message: "Sandbox Success", test: true };
            await transaction.save();
            return res.json({ status: 'success', message: 'Sandbox Transaction Successful', reference: internalRef, client_reference: clientRef, isSandbox: true });
        }

        const result = await buyData(network, plan_id, phone, price, 'NG', null, null, 'smart', plan.category);

        if (result.status === 'success' || result.status === 'unknown') {
            transaction.status = result.status;
            transaction.api_response = { ...(transaction.api_response || {}), provider_response: result.data };
            await transaction.save();
            
            // Credit profit to reseller atomically
            if (result.status === 'success' && profit > 0 && resellerUser) {
                await User.findByIdAndUpdate(resellerUser._id, { $inc: { earningsBalance: profit } });
                await insertLedgerEntry(resellerUser._id, profit, 'commission', 'earnings', internalRef, `Profit from Data purchase by ${req.user.name}`);
            }

            if (result.status === 'success') triggerWebhook(req.user, transaction);
            return res.json({ status: 'success', message: 'Transaction processing', reference: internalRef, client_reference: clientRef, network, amount: price });
        } else {
            await User.findByIdAndUpdate(req.user._id, { $inc: { [balanceField]: price } });
            transaction.status = 'failed';
            transaction.balance_deducted = false;
            transaction.api_response = { ...(transaction.api_response || {}), provider_response: result.data || { error: result.message } };
            await transaction.save();
            return res.status(400).json({ status: 'error', message: result.message || 'Transaction failed', reference: internalRef });
        }
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

/**
 * POST /airtime
 */
router.post('/airtime', transactionIdempotency, async (req, res) => {
    const { network, amount, phone, reference: clientRef } = req.body;
    if (!network || !amount || !phone) return res.status(400).json({ status: 'error', message: 'Missing fields' });

    try {
        // Safety guard: check provider status before debiting wallet
        const isAvailable = await checkProviderAvailability('airtime', network, 'smart', 'NG');
        if (!isAvailable) {
            return res.status(400).json({ status: 'error', message: 'Service temporarily unavailable. Please try again later.' });
        }
        const { sellingPrice, basePrice, reseller } = await calculateVtuPrice(req.user._id, 'airtime', network, null, amount);
        const price = sellingPrice;
        const profit = Math.max(0, sellingPrice - basePrice);
        const resellerUser = reseller;

        const balanceField = req.isSandbox ? 'sandboxBalance' : 'balance1';
        if (req.user[balanceField] < price) return res.status(402).json({ status: 'error', message: 'Insufficient balance' });

        const internalRef = clientRef || generateRef();
        const transaction = await Transaction.create({
            userId: req.user._id, 
            resellerId: req.user.referredBy || null,
            amount: price, 
            type: 'debit', 
            status: 'processing',
            reference: internalRef, 
            description: `API: Airtime ${network} to ${phone}`,
            phone, 
            network, 
            profit, 
            isApiRequest: true, 
            isSandbox: req.isSandbox,
            api_response: { inputAmount: price, networkId: null, operatorId: null, provider: 'smart', payload: req.body }
        });

        await User.findByIdAndUpdate(req.user._id, { $inc: { [balanceField]: -price } });
        transaction.balance_deducted = true;
        await transaction.save();

        if (req.isSandbox) {
            transaction.status = 'success'; transaction.api_response = { ...(transaction.api_response || {}), message: "Sandbox Success", test: true };
            await transaction.save();
            return res.json({ status: 'success', message: 'Sandbox Transaction Successful', reference: internalRef, isSandbox: true });
        }

        try {
            const result = await buyAirtime(network, price, phone);
            if (result.status === 'success') {
                transaction.status = 'success'; transaction.api_response = { ...(transaction.api_response || {}), provider_response: result.data };
                await transaction.save();

                if (profit > 0 && resellerUser) {
                    await User.findByIdAndUpdate(resellerUser._id, { $inc: { earningsBalance: profit } });
                    await insertLedgerEntry(resellerUser._id, profit, 'commission', 'earnings', internalRef, `Profit from Airtime purchase by ${req.user.name}`);
                }

                triggerWebhook(req.user, transaction);
                return res.json({ status: 'success', message: 'Transaction processing', reference: internalRef, amount: price });
            } else {
                await User.findByIdAndUpdate(req.user._id, { $inc: { [balanceField]: price } });
                transaction.status = 'failed'; transaction.balance_deducted = false;
                transaction.api_response = { ...(transaction.api_response || {}), provider_response: result.data || { error: result.message } };
                await transaction.save();
                return res.status(400).json({ status: 'error', message: result.message || 'Transaction failed' });
            }
        } catch (providerErr) {
            await User.findByIdAndUpdate(req.user._id, { $inc: { [balanceField]: price } });
            transaction.status = 'failed'; transaction.balance_deducted = false;
            transaction.api_response = { ...(transaction.api_response || {}), provider_response: { error: providerErr.message } };
            await transaction.save();
            return res.status(500).json({ status: 'error', message: 'Provider/Internal error: ' + providerErr.message });
        }
    } catch (err) { res.status(500).json({ status: 'error', message: 'Internal error' }); }
});

/**
 * GET /data/plans
 */
router.get('/data/plans', async (req, res) => {
    try {
        const plans = await DataPlan.find({ status: true }).sort({ network: 1, selling_price: 1 });
        const bulkPrices = await calculateBulkDataPrices(req.user._id, plans);

        res.json({
            status: 'success',
            count: bulkPrices.filter(p => p.sellingPrice !== null).length,
            data: bulkPrices.filter(p => p.sellingPrice !== null).map(({ plan: p, sellingPrice }) => {
                let displayNetwork = p.network;
                if (displayNetwork === 'AIRTEL') displayNetwork = 'Airtel';
                if (displayNetwork === 'GLO') displayNetwork = 'Glo';

                return {
                    plan_id: p.api_plan_id,
                    network: displayNetwork,
                    category: p.category,
                    name: p.plan_name,
                    price: sellingPrice,
                    validity: p.validity
                };
            })
        });
    } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

/**
 * GET /status/:reference
 */
router.get('/status/:reference', async (req, res) => {
    const { reference } = req.params;
    const transaction = await Transaction.findOne({ reference, userId: req.user._id });
    if (!transaction) return res.status(404).json({ status: 'error', message: 'Not found' });
    res.json({
        status: 'success',
        data: { reference: transaction.reference, amount: transaction.amount, status: transaction.status, phone: transaction.phone, createdAt: transaction.createdAt, token: transaction.token }
    });
});

/**
 * GET /history
 */
router.get('/history', async (req, res) => {
    const transactions = await Transaction.find({ userId: req.user._id, isApiRequest: true }).sort({ createdAt: -1 }).limit(50);
    const seenCashbacks = new Set();
    const filteredTransactions = transactions.filter(tx => {
        if (tx.isInternal) {
            const isCashback = tx.ledger_type === 'LIFETIME_CASHBACK' || (tx.description && tx.description.toLowerCase().includes('cashback'));
            if (!isCashback) return false;
        }
        if (tx.description) {
            const desc = tx.description.toLowerCase();
            if (desc.includes('system wallet deduction') || 
                desc.includes('internal ledger') || 
                desc.includes('internal accounting') || 
                desc.includes('internal balance sync')) {
                return false;
            }
            if (desc.includes('cashback') || tx.ledger_type === 'LIFETIME_CASHBACK') {
                const dateStr = tx.createdAt ? new Date(tx.createdAt).toISOString().split('T')[0] : '';
                const descBase = tx.description.split('-')[0].trim();
                const key = `${tx.amount}_${descBase}_${dateStr}`;
                if (seenCashbacks.has(key)) return false;
                seenCashbacks.add(key);
            }
        }
        return true;
    });
    res.json({
        status: 'success',
        count: filteredTransactions.length,
        data: filteredTransactions.map(t => ({ reference: t.reference, amount: t.amount, status: t.status, description: t.description, phone: t.phone, createdAt: t.createdAt }))
    });
});

export default router;
