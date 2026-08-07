import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import DataPlan from '../models/DataPlan.js';
import Transaction from '../models/Transaction.js';
import { smartBuyAirtime, smartBuyData, smartBuyIdentity } from '../services/switcher.js';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

const verifySystem = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('--- SYSTEM VERIFICATION STARTED ---\n');

        // 1. Data Plans Audit
        console.log('=== DATA PLANS AUDIT ===');
        const billsplashCount = await DataPlan.countDocuments({ provider: 'billsplash' });
        const peyflexCount = await DataPlan.countDocuments({ provider: 'peyflex' });
        const clubkonnectCount = await DataPlan.countDocuments({ provider: 'clubkonnect' });
        
        console.log(`Billsplash Plans in DB: ${billsplashCount}`);
        console.log(`Peyflex Plans in DB: ${peyflexCount}`);
        console.log(`ClubKonnect Plans in DB: ${clubkonnectCount}`);

        if (billsplashCount === 0) {
            console.log('CONCLUSION: Billsplash data plans are currently empty. The frontend will likely show no Value plans for data because the API returned 500 during import and no manual seeding was done.');
        } else {
            console.log('CONCLUSION: Billsplash plans exist in DB.');
        }

        // 2. Routing Audit
        console.log('\n=== ROUTING AUDIT (Airtime) ===');
        // Ensure test user exists
        let testUser = await User.findOneAndUpdate(
            { email: 'billsplashtest@example.com' },
            { wallet_balance: 5000, status: 'active', role: 'user', first_name: 'Test', phone: '08012345678' },
            { upsert: true, new: true }
        );

        console.log('-> Testing Smart Option Routing');
        const smartRes = await smartBuyAirtime('MTN', 50, testUser.phone, 'NG', null, 'smart');
        console.log(`Smart Option Provider Used: ${smartRes.provider_used} (Expected: peyflex)`);

        console.log('\n-> Testing Value Option Routing');
        const valueRes = await smartBuyAirtime('MTN', 50, testUser.phone, 'NG', null, 'value');
        console.log(`Value Option Provider Used: ${valueRes.provider_used} (Expected: billsplash)`);

        // 3. Wallet Integrity (using a simulated transaction loop like before but asserting DB values)
        console.log('\n=== WALLET & TRANSACTION INTEGRITY ===');
        const startBalance = testUser.wallet_balance;
        console.log(`Starting Balance: ₦${startBalance}`);
        
        // Simulating the controller logic for Value Option Airtime
        const txAmount = 100;
        await User.updateOne({ _id: testUser._id }, { $inc: { wallet_balance: -txAmount } });
        console.log(`Deducted ₦${txAmount} for pending transaction. Expected DB Balance: ₦${startBalance - txAmount}`);
        
        let tx = await Transaction.create({
            user: testUser._id,
            transaction_type: 'airtime',
            network: 'MTN',
            amount: txAmount,
            status: 'processing',
            phone: testUser.phone,
            reference: 'E2E-VAL-' + Date.now(),
            provider_used: 'billsplash'
        });

        // Call Billsplash natively via switcher
        const bsRes = await smartBuyAirtime('MTN', txAmount, testUser.phone, 'NG', null, 'value');
        
        if (!bsRes.success && bsRes.status !== 'success') {
            tx.status = 'failed';
            await tx.save();
            await User.updateOne({ _id: testUser._id }, { $inc: { wallet_balance: txAmount } });
            console.log('Transaction failed natively (due to test creds). Refund applied.');
        }

        const endUser = await User.findById(testUser._id);
        console.log(`Final DB Balance: ₦${endUser.wallet_balance}`);
        console.log(`Wallet match expected? ${endUser.wallet_balance === startBalance}`);

        console.log('\n=== IDENTITY VERIFICATION AUDIT ===');
        const ninRes = await smartBuyIdentity('nin', { nin: '12345678901' });
        console.log(`NIN routing via identity switcher returned status: ${ninRes.status}`);
        
        const bvnRes = await smartBuyIdentity('bvn', { bvn: '12345678901' });
        console.log(`BVN routing via identity switcher returned status: ${bvnRes.status}`);

        console.log('\n--- SYSTEM VERIFICATION COMPLETE ---');
        process.exit(0);

    } catch (e) {
        console.error('VERIFICATION ERROR:', e);
        process.exit(1);
    }
};

verifySystem();
