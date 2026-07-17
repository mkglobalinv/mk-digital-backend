import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User.js';
import Transaction from './models/Transaction.js';
import { getReferralAnalytics } from './controllers/userController.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    const referrer = await User.findOne({ referralCode: 'C119A8A0' });
    if (!referrer) throw new Error("Referrer not found");

    const referred = await User.findOne({ email: 'reffar34@gmail.com' });
    if (!referred) throw new Error("Referred user not found");

    // 1. Link referred user to referrer
    if (!referred.referredBy || referred.referredBy.toString() !== referrer._id.toString()) {
        referred.referredBy = referrer._id;
        await referred.save();
        console.log(`Linked referred user ${referred.email} to referrer ${referrer.email}`);
    }

    // 2. Add Reward
    const existingTx = await Transaction.findOne({
        userId: referrer._id,
        description: `Activation Reward for referring ${referred.name || 'New User'}`
    });

    if (!existingTx) {
        referrer.earningsBalance = (referrer.earningsBalance || 0) + 2000;
        await referrer.save();

        await Transaction.create({
            userId: referrer._id,
            resellerId: referrer.referredBy || referrer._id,
            amount: 2000,
            type: 'credit',
            status: 'success',
            description: `Activation Reward for referring ${referred.name || 'New User'}`,
            provider: 'System',
            reference: `REF-REWARD-${Date.now()}`
        });
        console.log("Credited 2000 to referrer and created transaction.");
    } else {
        console.log("Referral reward already credited.");
    }

    // 3. Print Final Analytics
    const updatedReferrer = await User.findById(referrer._id);
    console.log(`\nFinal Referrer earningsBalance: ${updatedReferrer.earningsBalance}`);

    const req = { user: { id: referrer._id.toString() } };
    const res = {
        json: (data) => console.log('Final Analytics response:', JSON.stringify(data.data, null, 2)),
        status: (code) => ({ json: (data) => console.log(`Error ${code}:`, data) })
    };
    await getReferralAnalytics(req, res);

    await mongoose.disconnect();
}

run().catch(console.error);
