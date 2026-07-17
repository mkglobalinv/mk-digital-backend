import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User.js';
import Transaction from './models/Transaction.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("=== DB Evidence ===");

    // 1. Find Referrer by code C119A8A0
    const referrer = await User.findOne({ referralCode: 'C119A8A0' });
    if (!referrer) {
        console.log("Referrer with code C119A8A0 not found.");
        process.exit(1);
    }
    console.log(`Referrer User ID: ${referrer._id}`);
    console.log(`Referrer Name: ${referrer.name}`);
    console.log(`Referrer Role: ${referrer.role}`);
    console.log(`Referrer earningsBalance (Current): ${referrer.earningsBalance}`);

    // 2. Find Referred User(s)
    const referredUsers = await User.find({ referredBy: referrer._id });
    console.log(`\nReferred Users Found: ${referredUsers.length}`);
    for (const ref of referredUsers) {
        console.log(`- ID: ${ref._id}, Name: ${ref.name}, Tier: ${ref.resellerTier}, Activated: ${ref.isResellerActivated}, ActivationRewardGiven: ${ref.activationRewardGiven}`);
    }

    // 3. Find Transactions for Referrer
    const txs = await Transaction.find({ userId: referrer._id, type: 'credit' }).sort({ createdAt: -1 });
    console.log(`\nTransactions for Referrer (Credits): ${txs.length}`);
    for (const tx of txs) {
        console.log(`- Amount: ${tx.amount}, Desc: ${tx.description}, Ref: ${tx.reference}, Date: ${tx.createdAt}`);
    }

    // 4. Manual calculation of referral analytics to match getReferralAnalytics logic
    const activationRewards = await Transaction.aggregate([
        { $match: { userId: referrer._id, type: 'credit', description: { $regex: /Activation Reward/i } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalActivationRewards = activationRewards.length > 0 ? activationRewards[0].total : 0;

    const commissionRewards = await Transaction.aggregate([
        { $match: { userId: referrer._id, type: 'credit', $or: [ { reference: { $regex: /^LREF-/ } }, { ledger_type: 'LIFETIME_REFERRAL_SHARE' } ] } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const lifetimeReferralEarnings = commissionRewards.length > 0 ? commissionRewards[0].total : 0;

    console.log(`\nAnalytics Aggregation Results:`);
    console.log(`Total Referrals: ${referredUsers.length}`);
    console.log(`Active Referrals (ActivationRewardGiven = true or Balance > 0): ${referredUsers.filter(r => r.totalBalance > 0 || r.activationRewardGiven).length}`);
    console.log(`Activation Rewards (DB Sum): ${totalActivationRewards}`);
    console.log(`Lifetime Referral Earnings: ${lifetimeReferralEarnings}`);
    console.log(`Total Referral Income: ${totalActivationRewards + lifetimeReferralEarnings}`);

    await mongoose.disconnect();
}

run().catch(console.error);
