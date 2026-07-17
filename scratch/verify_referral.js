import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtuapp').then(async () => {
  const referrer = await User.findOne({ email: 'referrer_wo_1782212219600@test.com' });
  const referred = await User.findOne({ email: 'referred_1782212221296@test.com' });
  
  if (!referrer || !referred) {
    console.log('Test users not found');
    process.exit(1);
  }

  // 1. Referral Center Data
  const referrals = await User.find({ referredBy: referrer._id });
  const formattedReferrals = referrals.map(ref => {
      const totalBalance = (ref.balance1 || 0) + (ref.balance2 || 0);
      const isActivated = totalBalance > 0 || ref.activationRewardGiven;
      return {
          id: ref._id,
          name: ref.name,
          email: ref.email,
          activationStatus: isActivated ? 'Activated' : 'Pending',
          rewardStatus: ref.activationRewardGiven ? 'Paid' : 'Pending'
      };
  });
  
  // 2. Admin Referral Analytics Data
  const totalReferrals = await User.countDocuments({ referredBy: { $exists: true, $ne: null } });
  const rewardTxs = await Transaction.find({
      reference: { $regex: /^(REF-REWARD-|REF-ACT-|CASHBACK-)/i },
      status: "success"
  });
  const totalRewardsIssued = rewardTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  
  console.log("=== REFERRAL CENTER UI ===");
  console.log(`Total Referrals: ${referrals.length}`);
  console.log(`Active Referrals: ${formattedReferrals.filter(r => r.activationStatus === 'Activated').length}`);
  console.log(`Activation Rewards: ₦${referrer.earningsBalance}`);
  console.log(`Total Earnings: ₦${referrer.earningsBalance}`);
  
  console.log("\n=== REFERRED USER DETAILS ===");
  console.log(`Email: ${referred.email}`);
  console.log(`Status: ${formattedReferrals.find(r => r.email === referred.email).activationStatus}`);
  console.log(`Reward Status: ${formattedReferrals.find(r => r.email === referred.email).rewardStatus}`);

  console.log("\n=== ADMIN REFERRAL ANALYTICS ===");
  console.log(`Total System-Wide Referrals: ${totalReferrals}`);
  console.log(`Total Rewards Issued (All Time): ₦${totalRewardsIssued}`);
  
  process.exit(0);
});
