import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User.js';
import Transaction from './models/Transaction.js';
import SystemSetting from './models/SystemSetting.js';
import SubscriptionService from './services/subscriptionService.js';
import { getReferralAnalytics } from './controllers/userController.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mkdigital');

    // Setup dummy users
    const referrer = new User({
        name: 'Test Referrer',
        email: `referrer_${Date.now()}@test.com`,
        password: 'password',
        role: 'reseller_admin',
        resellerTier: 'premium',
        earningsBalance: 0
    });
    await referrer.save();

    const referred = new User({
        name: 'Test Referred',
        email: `referred_${Date.now()}@test.com`,
        password: 'password',
        referredBy: referrer._id,
        role: 'retail',
        resellerTier: 'retail',
        balance1: 10000,
        isResellerActivated: false
    });
    await referred.save();

    console.log(`Created referrer: ${referrer._id}, referred: ${referred._id}`);

    // Set growth infrastructure
    let settings = await SystemSetting.findOne();
    if (!settings) {
        settings = new SystemSetting({});
    }
    settings.growthInfrastructure = {
        growthCampaignsEnabled: true,
        websiteOwnerReferralReward: 2000,
        retailReferralReward: 2000,
        cashbackAmount: 2000
    };
    await settings.save();

    // Call subscription service to activate
    try {
        const result = await SubscriptionService.processSubscription(referred._id, 'basic', null);
        console.log('Activation result:', result.success);
    } catch (err) {
        console.error('Activation failed:', err.message);
    }

    // Check balances
    const updatedReferrer = await User.findById(referrer._id);
    const updatedReferred = await User.findById(referred._id);
    console.log(`Referrer earningsBalance: ${updatedReferrer.earningsBalance}`);
    console.log(`Referred activationRewardGiven: ${updatedReferred.activationRewardGiven}`);

    // Check transactions
    const txs = await Transaction.find({ userId: referrer._id });
    console.log('Referrer transactions:', txs.map(t => ({ amount: t.amount, type: t.type, desc: t.description })));

    // Check analytics manually (mocking req/res)
    const req = { user: { id: referrer._id.toString() } };
    const res = {
        json: (data) => console.log('Analytics response:', JSON.stringify(data, null, 2)),
        status: (code) => ({ json: (data) => console.log(`Error ${code}:`, data) })
    };
    await getReferralAnalytics(req, res);

    await mongoose.disconnect();
}

run().catch(console.error);
