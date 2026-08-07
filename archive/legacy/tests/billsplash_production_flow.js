import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const runValidation = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB.');

        // 1. Create a dummy test user with 5000 NGN balance
        const testUser = await User.findOneAndUpdate(
            { email: 'billsplashtest@example.com' },
            { 
                email: 'billsplashtest@example.com',
                first_name: 'Billsplash',
                last_name: 'Test',
                phone: '08012345678',
                wallet_balance: 5000,
                role: 'user',
                status: 'active'
            },
            { upsert: true, new: true }
        );
        console.log(`Test user wallet balance: ₦${testUser.wallet_balance}`);

        // 2. Simulate Airtime Transaction
        console.log('\n--- Validating Airtime Purchase Flow ---');
        const airtimeTx = await Transaction.create({
            user: testUser._id,
            transaction_type: 'airtime',
            network: 'MTN',
            amount: 100,
            api_price: 98,
            selling_price: 100,
            status: 'processing',
            phone: '08012345678',
            reference: 'VAL-AIR-' + Date.now(),
            provider_used: 'billsplash'
        });

        // Deduct wallet for airtime
        await User.updateOne({ _id: testUser._id }, { $inc: { wallet_balance: -100 } });
        console.log(`Wallet deducted. Expected Balance: ₦4900`);

        const { buyAirtimeWithBillsplash, verifyBVNWithBillsplash } = await import('../services/providers/billsplash.js');
        
        const airtimeRes = await buyAirtimeWithBillsplash('mtn', 100, '08012345678');
        console.log('Provider Response Normalized:', airtimeRes);

        // Refund logic simulation (normally done by transactionController)
        if (!airtimeRes.success) {
            airtimeTx.status = 'failed';
            airtimeTx.provider_response = airtimeRes.message;
            await airtimeTx.save();
            await User.updateOne({ _id: testUser._id }, { $inc: { wallet_balance: 100 } });
            console.log('Wallet refunded. (Airtime Failed as expected due to dummy credentials/balance on Billsplash)');
        }

        // 3. BVN Validation
        console.log('\n--- Validating BVN Flow ---');
        const bvnRes = await verifyBVNWithBillsplash('12345678901');
        console.log('Provider Response Normalized:', bvnRes);

        const finalUser = await User.findById(testUser._id);
        console.log(`\nFinal Test User Balance: ₦${finalUser.wallet_balance} (Should be 5000 if refunded properly)`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

runValidation();
