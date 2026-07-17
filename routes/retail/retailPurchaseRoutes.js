import express from 'express';
import { auth as protect, restrictToRetailSession } from '../../middlewares/auth.js';
import { getRetailPrice } from '../../services/pricing/retailPricing.js';
import DataPlan from '../../models/DataPlan.js';
import User from '../../models/User.js';
import { checkProviderAvailability } from '../../services/providerMonitoringService.js';
import { transactionIdempotency } from '../../middlewares/idempotency.js';

const router = express.Router();

router.use(protect);
router.use(restrictToRetailSession);

/**
 * @route   POST /api/retail/purchase/data
 * @desc    Purchase data using the isolated retail pricing engine
 * @access  Private (Retail Users)
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

        // Calculate isolated pricing
        const { finalPrice, resellerProfit, resellerId } = await getRetailPrice(req.user._id.toString(), plan_id, 'data');

        // Verify balance
        const user = await User.findById(req.user._id);
        if (user.balance1 < finalPrice) {
            return res.status(400).json({ status: 'error', message: 'Insufficient balance' });
        }

        // Deduct balance
        user.balance1 -= finalPrice;
        await user.save();

        // ** Here we would call the actual provider API (e.g. ClubKonnect) **
        // For the sake of architecture isolation, we simulate success
        
        // If they have a reseller, log the profit to the reseller's ledger
        if (resellerProfit > 0 && resellerId) {
            const reseller = await User.findById(resellerId);
            if (reseller) {
                reseller.earningsBalance += resellerProfit;
                await reseller.save();
                
                // Add to new Supabase isolated ledger
                const { getSupabaseClient } = await import('../../services/supabaseClient.js');
                const supabase = getSupabaseClient();
                if (supabase) {
                    await supabase.from('reseller_profit_ledger').insert({
                        reseller_id: resellerId,
                        transaction_id: `TXN-${Date.now()}`,
                        amount: resellerProfit,
                        description: `Profit from Data purchase by ${user.email}`
                    });
                }
            }
        }

        res.json({
            status: 'success',
            message: 'Data purchase successful',
            data: {
                network,
                plan_id,
                phone,
                amount_charged: finalPrice,
                reference: clientRef || `REF-${Date.now()}`
            }
        });

    } catch (err) {
        console.error('[Retail Purchase] Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

export default router;
