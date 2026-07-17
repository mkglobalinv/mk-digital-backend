import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
dotenv.config();

import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { creditBalance } from '../services/walletService.js';
import { getReferrals, getReferralAnalytics } from '../controllers/userController.js';

// Mock Express req/res
const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    return res;
};

const runTest = async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtuapp');
    console.log("Connected to DB.");

    try {
        const uniqueId = Date.now().toString().slice(-6);
        const referrerEmail = `e2e_referrer_${uniqueId}@test.com`;
        const referredEmail = `e2e_referred_${uniqueId}@test.com`;
        const referralCode = `TEST${uniqueId}`;

        // 1. Create Referrer
        const referrer = await User.create({
            name: "E2E Referrer",
            email: referrerEmail,
            phone: "08000000001",
            password: "hashedpassword",
            role: "user",
            referralCode: referralCode,
            isEmailVerified: true,
            isSignupComplete: true
        });
        console.log(`[+] Created Referrer: ${referrerEmail} (Code: ${referralCode})`);

        // 2. Create Referred User
        const referred = await User.create({
            name: "E2E Referred",
            email: referredEmail,
            phone: "08000000002",
            password: "hashedpassword",
            role: "user",
            referredBy: referrer._id, // This simulates the authController logic where referrer is found by code
            isEmailVerified: true,
            isSignupComplete: true
        });
        console.log(`[+] Created Referred User: ${referredEmail}`);

        // 3. Verify Pre-Deposit Status
        console.log("\n--- PRE-DEPOSIT CHECKS ---");
        let req1 = { user: { id: referrer._id.toString() } };
        let res1 = mockRes();
        await getReferrals(req1, res1);
        console.log("Pre-Deposit Referrals:", JSON.stringify(res1.data.data, null, 2));

        let res2 = mockRes();
        await getReferralAnalytics(req1, res2);
        console.log("Pre-Deposit Analytics:", JSON.stringify(res2.data.data, null, 2));

        // 4. Simulate Deposit
        console.log("\n--- SIMULATING DEPOSIT ---");
        await creditBalance(referred._id, 10000, `DEP-${uniqueId}`, "E2E Test Deposit");
        console.log(`[+] Deposited ₦10,000 to ${referredEmail}`);

        // 5. Verify Post-Deposit Status
        console.log("\n--- POST-DEPOSIT CHECKS ---");
        let req3 = { user: { id: referrer._id.toString() } };
        let res3 = mockRes();
        await getReferrals(req3, res3);
        console.log("Post-Deposit Referrals:", JSON.stringify(res3.data.data, null, 2));

        let res4 = mockRes();
        await getReferralAnalytics(req3, res4);
        console.log("Post-Deposit Analytics:", JSON.stringify(res4.data.data, null, 2));

        // 6. Verify Admin Analytics
        console.log("\n--- ADMIN ANALYTICS ---");
        const totalReferrals = await User.countDocuments({ referredBy: { $exists: true, $ne: null } });
        const rewardTxs = await Transaction.find({
            reference: { $regex: /^(REF-REWARD-|REF-ACT-|CASHBACK-)/i },
            status: "success"
        });
        const totalRewardsIssued = rewardTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        console.log(`Admin Total Referrals: ${totalReferrals}`);
        console.log(`Admin Total Rewards Issued: ₦${totalRewardsIssued}`);

        process.exit(0);
    } catch (err) {
        console.error("Test failed:", err);
        process.exit(1);
    }
};

runTest();
