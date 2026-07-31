import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import crypto from 'crypto';

export const getReferralLink = async (req, res) => {
    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.referralCode) {
            user.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
            await user.save();
        }

        // Determine base URL dynamically from request or env
        const reqHost = req.headers['x-forwarded-host'] ? req.headers['x-forwarded-host'].split(',')[0].trim() : req.get('host');
        const reqProtocol = req.headers['x-forwarded-proto'] ? req.headers['x-forwarded-proto'].split(',')[0].trim() : 'https';
        const dynamicBase = reqHost ? `${reqProtocol}://${reqHost}` : 'https://9jasub.com';
        const baseUrl = process.env.FRONTEND_URL || dynamicBase;
        const referralUrl = `${baseUrl}/register?ref=${user.referralCode}`;

        res.json({
            status: 'success',
            data: {
                referralCode: user.referralCode,
                referralUrl
            }
        });
    } catch (error) {
        console.error("Error in getReferralLink:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const getReferrals = async (req, res) => {
    try {
        const referrals = await User.find({ referredBy: req.user.id })
            .select('name email createdAt isSignupComplete balance1 balance2 activationRewardGiven apiSubscriptionTier isResellerActivated whiteLabelStatus')
            .sort({ createdAt: -1 });

        const formattedReferrals = referrals.map(ref => {
            // A referral is "Activated" only when they have completed conversion
            // and the referral reward has been issued (activationRewardGiven = true).
            // Using balance > 0 as a proxy was incorrect — it flagged funded-but-not-converted
            // users as "Activated" while reward remained "Pending".
            const rewardIssued = ref.activationRewardGiven == true || !!ref.activationRewardGiven || ref.isResellerActivated == true || (ref.apiSubscriptionTier && ref.apiSubscriptionTier !== 'free') || ref.whiteLabelStatus === 'active';
            return {
                id: ref._id,
                name: ref.name,
                email: ref.email,
                date: ref.createdAt,
                activationStatus: rewardIssued ? 'Activated' : 'Pending',
                rewardStatus: rewardIssued ? 'Paid' : 'Pending'
            };
        });

        res.json({
            status: 'success',
            data: formattedReferrals
        });
    } catch (error) {
        console.error("Error in getReferrals:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const getReferralAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const referrals = await User.find({ referredBy: userId });
        const totalReferrals = referrals.length;
        
        const activatedReferrals = referrals.filter(ref => ref.activationRewardGiven == true || !!ref.activationRewardGiven || ref.isResellerActivated == true || (ref.apiSubscriptionTier && ref.apiSubscriptionTier !== 'free') || ref.whiteLabelStatus === 'active').length;
        const pendingReferrals = totalReferrals - activatedReferrals;
        
        const user = await User.findById(userId);
        
        // Sum up activation rewards
        const activationRewards = await Transaction.aggregate([
            { $match: { userId: user._id, type: 'credit', $or: [{ description: { $regex: /Activation Reward/i } }, { reference: { $regex: /^REF-ACT-/i } }] } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalActivationRewards = activationRewards.length > 0 ? activationRewards[0].total : 0;
        
        // Lifetime referral earnings: Calculate directly from immutable ledger records (Phase 13 LREF- prefix)
        const commissionRewards = await Transaction.aggregate([
            { $match: { userId: user._id, type: 'credit', $or: [ { reference: { $regex: /^LREF-/ } }, { ledger_type: 'LIFETIME_REFERRAL_SHARE' } ] } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const lifetimeReferralEarnings = commissionRewards.length > 0 ? commissionRewards[0].total : 0;
        
        const totalReferralIncome = lifetimeReferralEarnings + totalActivationRewards;

        res.json({
            status: 'success',
            data: {
                totalReferrals,
                activatedReferrals,
                pendingReferrals,
                activationRewardsEarned: totalActivationRewards,
                lifetimeReferralEarnings,
                totalReferralIncome
            }
        });
    } catch (error) {
        console.error("Error in getReferralAnalytics:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
