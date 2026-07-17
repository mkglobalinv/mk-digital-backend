const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/userpc/mk-digital-backend/.env' });
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const User = require('c:/Users/userpc/mk-digital-backend/models/User.js');
    const Transaction = require('c:/Users/userpc/mk-digital-backend/models/Transaction.js');
    
    // Find a user who has referrals
    const referrerId = await User.findOne({ referredBy: { $ne: null } }).then(u => u.referredBy);
    const referrer = await User.findById(referrerId);
    if (!referrer) { console.log('No referrer found'); process.exit(0); }
    
    console.log('Referrer ID:', referrer._id);
    
    // Run the exact logic from userController.js
    const userId = referrer._id;
    const referrals = await User.find({ referredBy: userId });
    const totalReferrals = referrals.length;
    const activatedReferrals = referrals.filter(r => r.totalBalance > 0 || r.activationRewardGiven).length;
    const pendingReferrals = totalReferrals - activatedReferrals;
    
    const activationRewards = await Transaction.aggregate([
        { $match: { userId: referrer._id, type: 'credit', $or: [{ description: { $regex: /Activation Reward/i } }, { reference: { $regex: /^REF-ACT-/i } }] } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalActivationRewards = activationRewards.length > 0 ? activationRewards[0].total : 0;
    
    const commissionRewards = await Transaction.aggregate([
        { $match: { userId: referrer._id, type: 'credit', $or: [ { reference: { $regex: /^LREF-/ } }, { ledger_type: 'LIFETIME_REFERRAL_SHARE' } ] } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const lifetimeReferralEarnings = commissionRewards.length > 0 ? commissionRewards[0].total : 0;
    
    console.log(JSON.stringify({
        totalReferrals,
        activatedReferrals,
        pendingReferrals,
        activationRewardsEarned: totalActivationRewards,
        lifetimeReferralEarnings,
        totalReferralIncome: lifetimeReferralEarnings + totalActivationRewards
    }, null, 2));
    process.exit(0);
});
