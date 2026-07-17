import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User.js';
import Transaction from './models/Transaction.js';
import SubscriptionService from './services/subscriptionService.js';
import { getReferralAnalytics } from './controllers/userController.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    // Setup dummy users
    const referrer = new User({
        name: 'Test Referrer WO',
        email: `referrer_wo_${Date.now()}@test.com`,
        password: 'password123',
        role: 'reseller_admin', // Website Owner
        resellerTier: 'premium',
        earningsBalance: 0
    });
    await referrer.save();

    const referred = new User({
        name: 'Test Referred User',
        email: `referred_${Date.now()}@test.com`,
        password: 'password123',
        referredBy: referrer._id,
        role: 'user', // regular user
        resellerTier: 'basic',
        balance1: 10000,
        isResellerActivated: false
    });
    await referred.save();

    console.log(`Created referrer: ${referrer._id}, referred: ${referred._id}`);

    // Call subscription service to activate (targetTier: basic)
    try {
        const result = await SubscriptionService.processSubscription(referred._id, 'basic', null);
        console.log('Activation result:', result.success);
    } catch (err) {
        console.error('Activation failed:', err.message);
    }

    // Check balances
    const updatedReferrer = await User.findById(referrer._id);
    const updatedReferred = await User.findById(referred._id);
    console.log(`\n--- Verification ---`);
    console.log(`Referrer earningsBalance: ${updatedReferrer.earningsBalance} (Expected 2000)`);

    // Check transactions
    const txs = await Transaction.find({ userId: referrer._id });
    console.log('Referrer transactions:', txs.map(t => ({ amount: t.amount, type: t.type, desc: t.description })));

    // Check analytics manually (mocking req/res)
    const req = { user: { id: referrer._id.toString() } };
    const res = {
        json: (data) => console.log('Analytics response:', JSON.stringify(data.data, null, 2)),
        status: (code) => ({ json: (data) => console.log(`Error ${code}:`, data) })
    };
    await getReferralAnalytics(req, res);

    await mongoose.disconnect();
}

run().catch(console.error);
