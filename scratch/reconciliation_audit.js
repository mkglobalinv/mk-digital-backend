import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runAudit() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const referrer = await User.findOne({ referralCode: "C119A8A0" });
    const userId = referrer._id;

    console.log(`\n=== 1. INDIVIDUAL REFERRAL BREAKDOWN ===`);
    const referrals = await User.find({ referredBy: userId }).sort({ createdAt: -1 });
    
    console.log(`Count: ${referrals.length}`);
    for (let u of referrals) {
        const isCountedActive = u.totalBalance > 0 || u.activationRewardGiven;
        console.log(`\n- User ID: ${u._id}`);
        console.log(`- Email: ${u.email}`);
        console.log(`- Registration Date: ${u.createdAt}`);
        console.log(`- referredBy: ${u.referredBy}`);
        console.log(`- referralCodeUsed: ${u.referralCodeUsed || 'N/A'}`);
        console.log(`- Wallet Balance: ₦${u.totalBalance}`);
        console.log(`- Subscription Status: ${u.resellerTier || 'Basic'}`);
        console.log(`- activationRewardGiven: ${u.activationRewardGiven}`);
        console.log(`- Counted In Total Referrals? Yes`);
        console.log(`- Counted In Active Referrals? ${isCountedActive ? 'Yes' : 'No'}`);
        console.log(`- Reward Generated? ${u.activationRewardGiven ? 'Yes' : 'No'}`);
    }

    console.log(`\n=== 2. ANALYTICS BREAKDOWN ===`);
    console.log(`\nActivation Rewards:`);
    const activationRewards = await Transaction.aggregate([
        { $match: { userId: referrer._id, type: 'credit', $or: [{ description: { $regex: /Activation Reward/i } }, { reference: { $regex: /^REF-ACT-/i } }] } },
    ]);
    for (let tx of activationRewards) {
        console.log(`- Transaction ID: ${tx._id}`);
        console.log(`- Reference: ${tx.reference}`);
        console.log(`- Amount: ₦${tx.amount}`);
        console.log(`- Description: ${tx.description}`);
    }

    console.log(`\n=== 3. DASHBOARD VALIDATION ===`);
    
    // Referral Dashboard Aggregation (userController.js logic)
    const totalReferralsDashboard = referrals.length;
    const exactActivatedDashboard = referrals.filter(r => r.totalBalance > 0 || r.activationRewardGiven).length;
    
    // Admin Dashboard Aggregation (adminRoutes.js logic for topReferrers)
    const topReferrersAggr = await User.aggregate([
        { $match: { referredBy: referrer._id } },
        { $group: { _id: "$referredBy", count: { $sum: 1 } } }
    ]);
    const adminTotalReferrals = topReferrersAggr.length > 0 ? topReferrersAggr[0].count : 0;

    console.log(`Referral Dashboard Total: ${totalReferralsDashboard}`);
    console.log(`Admin Analytics Total: ${adminTotalReferrals}`);
    console.log(`Match? ${totalReferralsDashboard === adminTotalReferrals ? 'YES' : 'NO'}`);

    process.exit(0);
}

runAudit();
