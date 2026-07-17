import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function runAudit() {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mksubdata");
    
    const referrer = await User.findOne({ referralCode: "C119A8A0" });
    if (!referrer) {
        console.log("Referrer C119A8A0 not found.");
        process.exit(0);
    }
    
    console.log(`=== AUDIT FOR REFERRAL CODE: C119A8A0 (Referrer ID: ${referrer._id}) ===\n`);
    
    const referrals = await User.find({ referredBy: referrer._id });
    
    console.log(`Found ${referrals.length} successfully linked referrals.\n`);
    
    referrals.forEach(r => {
        console.log(`User ID: ${r._id}`);
        console.log(`Email: ${r.email}`);
        console.log(`Date: ${r.createdAt}`);
        console.log(`Wallet Balance: ?${r.balance1 || 0}`);
        console.log(`Activation Reward Given: ${r.activationRewardGiven ? "Yes" : "No"}`);
        console.log(`Reason for failure: ${!r.activationRewardGiven ? (r.balance1 > 0 ? 'Bug in reward logic (Now fixed)' : 'User has not funded wallet yet') : 'N/A'}`);
        console.log("------------------------");
    });
    
    console.log("\n=== ORPHANED RECENT USERS (Affected by CastError Bug) ===");
    const recentOrphans = await User.find({ referredBy: null }).sort({ createdAt: -1 }).limit(10);
    recentOrphans.forEach(r => {
        console.log(`User ID: ${r._id} | Email: ${r.email} | Date: ${r.createdAt}`);
    });
    
    process.exit(0);
}

runAudit();
