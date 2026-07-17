import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import User from "../models/User.js";
import SystemSetting from "../models/SystemSetting.js";
import { creditBalance } from "../services/walletService.js";
import SubscriptionService from "../services/subscriptionService.js";

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    await db.collection("users").deleteMany({ email: { $regex: /rewardtest/i } });
    await db.collection("transactions").deleteMany({ description: { $regex: /rewardtest/i } });

    const settings = await SystemSetting.findOne();
    if (settings) {
        settings.growthInfrastructure.retailReferralReward = 2000;
        settings.growthInfrastructure.websiteOwnerReferralReward = 5000;
        settings.growthInfrastructure.growthCampaignsEnabled = true; // Ensure campaigns are enabled
        await settings.save();
    }

    const defaultUserParams = { password: "Password123!", phone: "08012345678" };

    const r1 = await User.create({ email: "rewardtest_retail_ref@gmail.com", role: "user", name: "Retail Ref", earningsBalance: 0, ...defaultUserParams });
    const r2 = await User.create({ email: "rewardtest_website_ref@gmail.com", role: "reseller_admin", name: "Web Ref", earningsBalance: 0, ...defaultUserParams });

    const u1 = await User.create({ email: "rewardtest_u1@gmail.com", role: "user", referredBy: r1._id, name: "rewardtest_u1", ...defaultUserParams });
    const u2 = await User.create({ email: "rewardtest_u2@gmail.com", role: "user", referredBy: r2._id, name: "rewardtest_u2", ...defaultUserParams });
    const u3 = await User.create({ email: "rewardtest_u3@gmail.com", role: "user", referredBy: r1._id, name: "rewardtest_u3", ...defaultUserParams });
    const u4 = await User.create({ email: "rewardtest_u4@gmail.com", role: "user", referredBy: r2._id, name: "rewardtest_u4", ...defaultUserParams });

    // 1. Retail -> Retail Activation
    await creditBalance(u1._id, 1000, `TEST-REF-${Date.now()}-1`, "Test Funding");
    // 2. Website Owner -> Retail Activation
    await creditBalance(u2._id, 1000, `TEST-REF-${Date.now()}-2`, "Test Funding");

    // 3. Retail -> Website Owner Basic Activation
    await User.findByIdAndUpdate(u3._id, { balance1: 5000 });
    await SubscriptionService.processSubscription(u3._id, "basic", null);
    
    // 4. Website Owner -> Website Owner Basic Activation
    await User.findByIdAndUpdate(u4._id, { balance1: 5000 });
    await SubscriptionService.processSubscription(u4._id, "basic", null);

    const fetchRef = await User.find({ _id: { $in: [r1._id, r2._id] } });
    const updatedR1 = fetchRef.find(u => u.email === r1.email);
    const updatedR2 = fetchRef.find(u => u.email === r2.email);

    console.log("--- RESULTS ---");
    console.log("Retail Referrer (r1) Earnings:", updatedR1.earningsBalance);
    // Should be: 2000 (Retail Activation) + 5000 (Website Owner Activation) = 7000
    console.log("Website Owner Referrer (r2) Earnings:", updatedR2.earningsBalance);
    // Should be: 2000 (Retail Activation) + 5000 (Website Owner Activation) = 7000

    process.exit(0);
}

run();
