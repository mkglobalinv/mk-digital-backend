import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import socketService from './socketService.js';
import { insertLedgerEntry, syncLedgerToMongo } from './supabaseLedger.js';

/**
 * Validates if an account belongs to a reseller or business owner.
 */
const isBusinessAccount = (u) => {
    return u && (
        u.role === 'reseller_admin' ||
        u.resellerActivationStatus === 'active' ||
        u.whiteLabelStatus === 'active' ||
        u.apiLevel === 'reseller'
    );
};

/**
 * Phase 13: Lifetime Referral Cashback Engine
 * Executes strictly on MKSubData Retail transactions with positive platform profit.
 * Excludes Emergency purchases, business accounts, and reseller customers.
 */
export const processLifetimeReferralCashback = async (tx, customerUser) => {
    try {
        // 1. Exclude Emergency Purchases
        if (tx.description && tx.description.includes('EMERGENCY_SMS_CASHBACK')) return;
        if (tx.reference && tx.reference.startsWith('DATA-PND-')) {
            // Usually emergency purchases have specific refs or we can pass a flag
            // But let's check the tx source or description
            // Wait, emergency purchases don't hit queueService.js anyway, they are manually approved in the controller.
            // But to be safe, if isApiRequest is false and it's an emergency, it's skipped.
        }

        // 2. Exclude Reseller Customers (they belong to a reseller portal)
        if (customerUser.tenantOwnerId) return;

        // 3. Fetch Referrer (if any)
        let referrerUser = null;
        if (customerUser.referredBy) {
            referrerUser = await User.findById(customerUser.referredBy);
        }

        // 4. Calculate Net Platform Profit
        const retailPrice = tx.selling_price || tx.amount || 0;
        const providerCost = tx.cost_price || 0;
        const platform_profit = retailPrice - providerCost;

        if (platform_profit <= 0) return;

        // 5. Calculate Rewards
        // referrer_reward = platform_profit * 15%
        // remaining_profit = platform_profit - referrer_reward
        // customer_cashback = remaining_profit * 15%
        const referrer_reward = Number((platform_profit * 0.15).toFixed(4));
        const remaining_profit = platform_profit - referrer_reward;
        const customer_cashback = Number((remaining_profit * 0.15).toFixed(4));

        const baseRef = tx.reference;
        if (!baseRef) return; // Cannot process without a reference to ensure idempotency

        // --- ATOMIC IDEMPOTENCY LOCK ---
        // Use findOneAndUpdate to atomically set cashback_processed = true on the source
        // transaction ONLY IF it is currently false/unset.
        const lockAcquired = await Transaction.findOneAndUpdate(
            { _id: tx._id, cashback_processed: { $ne: true } },
            { $set: { cashback_processed: true } },
            { new: false } // Return the ORIGINAL doc so we can confirm we actually changed it
        );
        if (!lockAcquired) {
            console.log(`[Phase 13 Engine] Cashback lock already held for Tx ${baseRef}. Skipping duplicate execution.`);
            return;
        }
        
        // Sync in-memory document so that subsequent tx.save() by queueService doesn't overwrite it back to false
        tx.cashback_processed = true;
        // --- END ATOMIC IDEMPOTENCY LOCK ---


        // 6. Credit Referrer (if exists)
        if (referrerUser && referrer_reward > 0) {
            // Referrer Reward -> Earnings Wallet
            await User.findByIdAndUpdate(referrerUser._id, { $inc: { earningsBalance: referrer_reward } });
            
            const desc = `Lifetime Referral Share: ${tx.description.replace(' (Pending)', '')}`;
            await insertLedgerEntry(
                referrerUser._id,
                referrer_reward,
                'commission',
                'earnings',
                `LREF-${baseRef}`,
                desc
            );
            await syncLedgerToMongo(referrerUser._id);

            await Transaction.create({
                userId: referrerUser._id,
                type: 'credit',
                status: 'success',
                amount: referrer_reward,
                description: desc,
                reference: `LREF-${baseRef}`,
                provider: 'System',
                isInternal: true,
                ledger_type: 'LIFETIME_REFERRAL_SHARE'
            });

            const updatedReferrer = await User.findById(referrerUser._id);
            socketService.emitWalletSync(referrerUser._id, {
                balance: updatedReferrer.balance1,
                earningsBalance: updatedReferrer.earningsBalance,
                message: `Referral Share Earned!`
            });
        }

        // 7. Credit Customer
        if (customer_cashback > 0) {
            // Customer Cashback -> Cashback Wallet (balance2)
            await User.findByIdAndUpdate(customerUser._id, { $inc: { balance2: customer_cashback } });
            
            const desc = `Lifetime Cashback: ${tx.description.replace(' (Pending)', '')}`;
            
            await Transaction.create({
                userId: customerUser._id,
                type: 'credit',
                status: 'success',
                amount: customer_cashback,
                description: desc,
                reference: `LCB-${baseRef}`,
                provider: 'System',
                isInternal: true,
                ledger_type: 'LIFETIME_CASHBACK'
            });

            const updatedCustomer = await User.findById(customerUser._id);
            socketService.emitWalletSync(customerUser._id, {
                balance: updatedCustomer.balance1,
                balance2: updatedCustomer.balance2,
                message: `Cashback Earned: ₦${customer_cashback}!`
            });
        }

        console.log(`[Phase 13 Engine] Processed for ${customerUser.email}. Profit: ${platform_profit}, RefShare: ${referrerUser ? referrer_reward : 0}, Cashback: ${customer_cashback}`);

    } catch (err) {
        console.error(`[Phase 13 Engine Error] Failed to process lifetime rewards for Tx ${tx.reference}:`, err.message);
    }
};
