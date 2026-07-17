import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import User from "./models/User.js";
import SystemSetting from "./models/SystemSetting.js";
import SubscriptionService from "./services/subscriptionService.js";

async function runTests() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB.");

    // Setup Settings
    let settings = await SystemSetting.findOne();
    if (!settings) settings = new SystemSetting({});
    
    // Backup old settings to restore later
    const oldSettings = settings.growthInfrastructure;
    
    settings.growthInfrastructure = {
        growthCampaignsEnabled: true,
        cashbackAmount: 2000,
        retailReferralReward: 2000,
        websiteOwnerReferralReward: 1000
    };
    settings.basicPricing = { activation: 5000 };
    await settings.save();

    console.log("\n=== SCENARIO 1: Independent Website Owner activation ===");
    // Create User 1
    const u1 = new User({
        name: "Test User 1",
        email: "test1@example.com",
        password: "pwd",
        balance1: 10000,
        cashbackBalance: 0,
        earningsBalance: 0
    });
    await u1.save();
    console.log(`Before Activation: Cashback=${u1.cashbackBalance}, Earnings=${u1.earningsBalance}`);
    await SubscriptionService.processSubscription(u1._id, 'basic', 0);
    const u1_after = await User.findById(u1._id);
    console.log(`After Activation : Cashback=${u1_after.cashbackBalance}, Earnings=${u1_after.earningsBalance}`);
    console.log(`Scenario 1 Success: ${u1_after.cashbackBalance === 2000 && u1_after.earningsBalance === 0 ? "YES" : "NO"}`);
    console.log(`Duplicate Prevention (activationRewardGiven = true): ${u1_after.activationRewardGiven ? "YES" : "NO"}`);

    console.log("\n=== SCENARIO 2: Retail referral activation ===");
    const referrerRetail = new User({
        name: "Retail Referrer",
        email: "retail_ref@example.com",
        password: "pwd",
        role: "user",
        earningsBalance: 0
    });
    await referrerRetail.save();
    
    const u2 = new User({
        name: "Test User 2",
        email: "test2@example.com",
        password: "pwd",
        balance1: 10000,
        cashbackBalance: 0,
        earningsBalance: 0,
        referredBy: referrerRetail._id
    });
    await u2.save();
    console.log(`Before Activation: U2 Cashback=${u2.cashbackBalance}, Referrer Earnings=${referrerRetail.earningsBalance}`);
    await SubscriptionService.processSubscription(u2._id, 'basic', 0);
    const u2_after = await User.findById(u2._id);
    const refRet_after = await User.findById(referrerRetail._id);
    console.log(`After Activation : U2 Cashback=${u2_after.cashbackBalance}, Referrer Earnings=${refRet_after.earningsBalance}`);
    console.log(`Scenario 2 Success: ${u2_after.cashbackBalance === 0 && refRet_after.earningsBalance === 2000 ? "YES" : "NO"}`);
    console.log(`Duplicate Prevention (activationRewardGiven = true): ${u2_after.activationRewardGiven ? "YES" : "NO"}`);

    console.log("\n=== SCENARIO 3: Website Owner referral activation ===");
    const referrerWO = new User({
        name: "WO Referrer",
        email: "wo_ref@example.com",
        password: "pwd",
        role: "reseller_admin",
        earningsBalance: 0
    });
    await referrerWO.save();
    
    const u3 = new User({
        name: "Test User 3",
        email: "test3@example.com",
        password: "pwd",
        balance1: 10000,
        cashbackBalance: 0,
        earningsBalance: 0,
        referredBy: referrerWO._id
    });
    await u3.save();
    console.log(`Before Activation: U3 Cashback=${u3.cashbackBalance}, Referrer Earnings=${referrerWO.earningsBalance}`);
    await SubscriptionService.processSubscription(u3._id, 'basic', 0);
    const u3_after = await User.findById(u3._id);
    const refWO_after = await User.findById(referrerWO._id);
    console.log(`After Activation : U3 Cashback=${u3_after.cashbackBalance}, Referrer Earnings=${refWO_after.earningsBalance}`);
    console.log(`Scenario 3 Success: ${u3_after.cashbackBalance === 0 && refWO_after.earningsBalance === 1000 ? "YES" : "NO"}`);
    console.log(`Duplicate Prevention (activationRewardGiven = true): ${u3_after.activationRewardGiven ? "YES" : "NO"}`);

    // Cleanup
    await User.deleteMany({ _id: { $in: [u1._id, u2._id, u3._id, referrerRetail._id, referrerWO._id] }});
    
    // Restore Settings
    settings.growthInfrastructure = oldSettings;
    await settings.save();

    mongoose.disconnect();
    console.log("\nTest Finished Successfully.");
}

runTests().catch(err => {
    console.error(err);
    mongoose.disconnect();
});
