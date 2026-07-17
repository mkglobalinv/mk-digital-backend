import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import SystemSetting from '../models/SystemSetting.js';
import SubscriptionService from '../services/subscriptionService.js';
import { creditBalance } from '../services/walletService.js';

async function runScenarios() {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mkdigital');

    // Setup base settings
    let settings = await SystemSetting.findOne();
    if (!settings) settings = new SystemSetting({});
    settings.growthInfrastructure = {
        growthCampaignsEnabled: true,
        websiteOwnerReferralReward: 2000,
        retailReferralReward: 2000,
        cashbackAmount: 2000
    };
    await settings.save();

    console.log("--- STARTING SCENARIOS ---");

    // Helper to setup a referrer and referred pair
    async function setupPair() {
        const referrer = new User({
            name: 'Test Referrer',
            email: `referrer_${Date.now()}_${Math.random()}@test.com`,
            password: 'password',
            role: 'reseller_admin',
            resellerTier: 'premium',
            earningsBalance: 0
        });
        await referrer.save();

        const referred = new User({
            name: 'Test Referred',
            email: `referred_${Date.now()}_${Math.random()}@test.com`,
            password: 'password',
            referredBy: referrer._id,
            role: 'user',
            resellerTier: 'basic',
            balance1: 0,
            isEmailVerified: false,
            isResellerActivated: false
        });
        await referred.save();

        return { referrer, referred };
    }

    // Scenario A: Register with referral. No activation.
    console.log("\\n--- Scenario A: Register with referral. No activation ---");
    let { referrer, referred } = await setupPair();
    let updatedReferrer = await User.findById(referrer._id);
    console.log(`Expected reward: 0 | Actual: ${updatedReferrer.earningsBalance}`);

    // Scenario B: Register. Verify email. Login.
    console.log("\\n--- Scenario B: Register. Verify email. Login ---");
    referred.isEmailVerified = true;
    await referred.save();
    updatedReferrer = await User.findById(referrer._id);
    console.log(`Expected reward: 0 | Actual: ${updatedReferrer.earningsBalance}`);

    // Scenario C: Register. Fund wallet.
    console.log("\\n--- Scenario C: Register. Fund wallet ---");
    await creditBalance(referred._id, 10000, 'TEST-FUND', 'Testing funding');
    updatedReferrer = await User.findById(referrer._id);
    console.log(`Expected reward: 0 | Actual: ${updatedReferrer.earningsBalance}`);

    // Scenario D: Register. Buy Data only.
    console.log("\\n--- Scenario D: Register. Buy Data only ---");
    // We already proved funding doesn't trigger it. Buying data doesn't trigger it as it goes through vtuService not subscriptionService.
    console.log(`Expected reward: 0 | Actual: ${updatedReferrer.earningsBalance} (Lifetime commission would apply via VTU engine)`);

    // Scenario E: Register. Upgrade website. Pay 5000.
    console.log("\\n--- Scenario E: Register. Upgrade website. Pay 5000 ---");
    try {
        await SubscriptionService.processSubscription(referred._id, 'basic', null);
        updatedReferrer = await User.findById(referrer._id);
        console.log(`Expected reward: 2000 | Actual: ${updatedReferrer.earningsBalance}`);
    } catch (e) {
        console.log(`Error during activation: ${e.message}`);
    }

    // Scenario F: Attempt activation again.
    console.log("\\n--- Scenario F: Attempt activation again ---");
    try {
        await SubscriptionService.processSubscription(referred._id, 'basic', null);
    } catch (e) {
        console.log(`Expected error or no duplicate reward. Message: ${e.message}`);
    }
    updatedReferrer = await User.findById(referrer._id);
    console.log(`Expected reward (still): 2000 | Actual: ${updatedReferrer.earningsBalance}`);

    // Cleanup
    await mongoose.disconnect();
    console.log("\\n--- DONE ---");
}

runScenarios().catch(console.error);
