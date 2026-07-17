import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('Connected to DB');

        const code = 'C119A8A0';
        
        // 1. Find the referrer
        const referrer = await User.findOne({ referralCode: code });
        if (!referrer) {
            console.log(`Referrer with code ${code} not found.`);
            return;
        }

        console.log(`--- REFERRER ---`);
        console.log(`ID: ${referrer._id}`);
        console.log(`Email: ${referrer.email}`);
        console.log(`referralCode: ${referrer.referralCode}`);

        // 2. Find real users who registered with this referral code
        // How are we tracking it? Either referredBy is their ID, OR referralCodeUsed is the code.
        const referredUsers = await User.find({
            $or: [
                { referredBy: referrer._id },
                { referralCodeUsed: code },
                { 'metadata.referralCode': code }
            ]
        });

        console.log(`\n--- REFERRED USERS FOUND: ${referredUsers.length} ---`);
        for (const u of referredUsers) {
            console.log(`\nUser ID: ${u._id}`);
            console.log(`Email: ${u.email}`);
            console.log(`Registration date: ${u.createdAt}`);
            console.log(`referredBy: ${u.referredBy}`);
            console.log(`referralCodeUsed: ${u.referralCodeUsed}`);
            console.log(`isResellerActivated: ${u.isResellerActivated}`);
            console.log(`resellerTier: ${u.resellerTier}`);
            console.log(`activationRewardGiven: ${u.activationRewardGiven}`);

            // Find subscription purchases for activation
            const actTxs = await Transaction.find({ 
                userId: u._id, 
                $or: [
                    { type: 'subscription' },
                    { type: 'activation' },
                    { description: /activation|subscription|plan/i }
                ]
            });
            console.log(`Activation Txs for this user: ${actTxs.length}`);
            for (const tx of actTxs) {
                console.log(`  Tx ID: ${tx._id}, Amount: ${tx.amount}, Date: ${tx.createdAt}, Desc: ${tx.description}, Status: ${tx.status}`);
            }

            // Find rewards credited to the referrer for this user
            const rewardTxs = await Transaction.find({
                userId: referrer._id,
                $or: [
                    { description: new RegExp(u.email, 'i') },
                    { description: new RegExp(u._id.toString(), 'i') }
                ]
            });
            console.log(`Reward Txs for referrer for this user: ${rewardTxs.length}`);
            for (const tx of rewardTxs) {
                console.log(`  Tx ID: ${tx._id}, Amount: ${tx.amount}, Date: ${tx.createdAt}, Desc: ${tx.description}, Status: ${tx.status}`);
            }
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
