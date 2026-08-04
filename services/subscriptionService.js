import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Notification from "../models/Notification.js";
import SystemSetting from "../models/SystemSetting.js";
import { deductBalance, deductEarnings, creditEarnings } from "./walletService.js";
import socketService from "./socketService.js";

/**
 * Subscription Service
 * Centralized Engine for Activations, Upgrades, Renewals, and Trials.
 */
class SubscriptionService {
    
    /**
     * Determine exact subscription action type
     */
    static getActionType(user, targetTier) {
        if (!user.isResellerActivated && user.resellerTier === 'basic') return 'activation';
        if (user.resellerTier === 'basic' && (targetTier === 'premium' || targetTier === 'vip')) return 'upgrade';
        if (user.resellerTier === targetTier && user.subscriptionExpiresAt) return 'renewal';
        if (targetTier === 'basic') return 'downgrade';
        return 'upgrade';
    }

    /**
     * Process Activation or Upgrade atomically
     */
    static async processSubscription(userId, targetTier, durationMonths) {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const actionType = this.getActionType(user, targetTier);
        
        // 1. Fetch Pricing
        const settings = await SystemSetting.findOne() || {};
        const premiumPricing = settings.premiumPricing || { sixMonths: 20000, yearly: 35000 };
        const basicPricing = settings.basicPricing || { activation: 5000 };

        let cost = 0;
        let description = '';

        if (targetTier === 'premium' || targetTier === 'vip') {
            cost = durationMonths === 6 ? premiumPricing.sixMonths : premiumPricing.yearly;
            description = `Premium Reseller ${actionType === 'renewal' ? 'Renewal' : 'Upgrade'} (${durationMonths} months)`;
        } else if (targetTier === 'basic' && actionType === 'activation') {
            cost = basicPricing.activation;
            description = "Basic Reseller Lifetime Activation";
        }

        // 2. Wallet Deductions & Transactions
        let walletUsed = '';
        if (cost > 0) {
            if (user.earningsBalance >= cost) {
                // Deduct from earnings securely and atomically via walletService
                const deductSuccess = await deductEarnings(user._id, cost, `SUB-DED-${Date.now()}`, `Payment for ${description}`);
                if (!deductSuccess) throw new Error("Earnings Wallet deduction failed. Please try again.");
                walletUsed = 'Earnings Wallet';
            } else if (user.balance1 >= cost) {
                // Deduct atomically from normal wallet
                const deductionSuccess = await deductBalance(user._id, cost);
                if (!deductionSuccess) throw new Error("Wallet deduction failed. Please try again.");
                walletUsed = 'Main Wallet';
            } else {
                throw new Error(`Insufficient balance. Cost is ₦${cost.toLocaleString()}.`);
            }

            await Transaction.create({
                userId: user._id,
                resellerId: user.referredBy || user._id, // Assign to tenant if applicable
                amount: cost,
                type: 'debit',
                status: 'success',
                description: `${description} via ${walletUsed}`,
                provider: 'System',
                reference: `SUB-${actionType.toUpperCase()}-${Date.now()}`
            });
        }

        // 3. Apply State Changes
        user.resellerTier = targetTier;
        user.isResellerActivated = true;
        user.resellerActivationStatus = 'active';
        
        let willGiveReferralReward = false;
        let willGiveCashback = false;
        let growthSettings = settings.growthInfrastructure || {};
        let referrer = null;
        let rewardAmount = 0;
        let cashbackAmount = 0;

        // Growth Engine: Referral Reward & Cashback on first activation
        if (actionType === 'activation' && targetTier === 'basic' && !user.activationRewardGiven) {
            // ATOMIC LOCK to prevent double-crediting
            const lockCheck = await User.findOneAndUpdate(
                { _id: user._id, activationRewardGiven: { $ne: true } },
                { $set: { activationRewardGiven: true } }
            );

            if (lockCheck) {
                user.activationRewardGiven = true; // update in memory for the subsequent save

                // 1. Referral Reward: Always issue when a referrer exists (not gated by growthCampaignsEnabled)
                if (user.referredBy && user.referredBy.toString() !== user._id.toString()) {
                    referrer = await User.findById(user.referredBy);
                    if (referrer) {
                        willGiveReferralReward = true;
                        rewardAmount = growthSettings.websiteOwnerReferralReward || 2000;
                    }
                }
            }
        }

        if (targetTier === 'premium' || targetTier === 'vip') {
            // Update Expiry Date
            const currentExpiry = user.subscriptionExpiresAt && user.subscriptionExpiresAt > new Date() 
                ? new Date(user.subscriptionExpiresAt) 
                : new Date();
            currentExpiry.setMonth(currentExpiry.getMonth() + durationMonths);
            user.subscriptionExpiresAt = currentExpiry;
            user.premiumActivatedAt = user.premiumActivatedAt || new Date();

            // Unlock Premium Features
            user.features = {
                ...(user.features || {}),
                custom_domain: true,
                apk_generation: true,
                premium_branding: true,
                dedicated_support: true,
                push_notifications: true
            };
        }

        // COMMIT ACTIVATED USER STATE FIRST (Consistency Fix - Option B)
        await user.save();

        // 4. PROCESS REFERRAL REWARD (Only executes if user.save() succeeded)
        if (willGiveReferralReward && referrer) {
            await creditEarnings(
                referrer._id, 
                rewardAmount, 
                `REF-REWARD-${Date.now()}`, 
                `Activation Reward for referring ${user.name || 'New User'}`
            );
            
            await Notification.create({
                userId: referrer._id,
                title: `Referral Reward Earned!`,
                message: `You earned ₦${rewardAmount} because your referral successfully activated their Basic plan.`,
                type: "system"
            });
        }

        // 4. Notifications
        await Notification.create({
            userId: user._id,
            title: `Subscription ${actionType === 'activation' ? 'Activated' : 'Updated'}`,
            message: `Your ${targetTier.toUpperCase()} Business Console is now active.`,
            type: "system"
        });

        // 5. Realtime Sync
        socketService.emitBrandingSync(user._id, user.branding);
        
        return {
            success: true,
            user,
            cost,
            tier: targetTier,
            expiresAt: user.subscriptionExpiresAt
        };
    }
}

export default SubscriptionService;
