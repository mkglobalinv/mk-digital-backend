import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { processLifetimeReferralCashback } from '../services/referralCashbackEngine.js';

dotenv.config();

async function main() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const uniqueSuffix = Date.now();

        // 1. Create referrer
        const referrer = await User.create({
            name: `Referrer ${uniqueSuffix}`,
            email: `referrer_${uniqueSuffix}@test.com`,
            password: "TestPassword123!",
            balance1: 1000,
            balance2: 0,
            earningsBalance: 0,
            role: "user",
            isSignupComplete: true
        });
        console.log(`Created Referrer: ID=${referrer._id}, Email=${referrer.email}`);

        // 2. Create customer referred by referrer
        const customer = await User.create({
            name: `Customer ${uniqueSuffix}`,
            email: `customer_${uniqueSuffix}@test.com`,
            password: "TestPassword123!",
            balance1: 1000,
            balance2: 0,
            earningsBalance: 0,
            referredBy: referrer._id,
            role: "user",
            isSignupComplete: true
        });
        console.log(`Created Customer: ID=${customer._id}, Email=${customer.email}, referredBy=${customer.referredBy}`);

        // 3. Create a transaction simulating data purchase with positive platform profit
        // Selling Price: 500, Cost Price: 300 -> Profit = 200
        const tx = await Transaction.create({
            userId: customer._id,
            type: "debit",
            status: "success",
            amount: 500,
            cost_price: 300,
            selling_price: 500,
            phone: "08012345678",
            network: "MTN",
            reference: `REF-CB-${uniqueSuffix}`,
            description: "Data: MTN 1.5GB (Pending)",
            balance_deducted: true
        });
        console.log(`Created Transaction: ID=${tx._id}, Amount=${tx.amount}, Cost=${tx.cost_price}, Selling=${tx.selling_price}`);

        // 4. Run referral cashback engine
        console.log("\n--- RUNNING processLifetimeReferralCashback ---");
        await processLifetimeReferralCashback(tx, customer);
        console.log("--- processLifetimeReferralCashback COMPLETED ---\n");

        // 5. Fetch updated users
        const updatedCustomer = await User.findById(customer._id);
        const updatedReferrer = await User.findById(referrer._id);

        console.log("==============================================");
        console.log("POST-REWARD BALANCE SUMMARY:");
        console.log("----------------------------------------------");
        console.log(`Customer (Purchaser):`);
        console.log(`  ID              : ${updatedCustomer._id}`);
        console.log(`  balance1 (Main) : ${updatedCustomer.balance1}`);
        console.log(`  balance2 (Cash) : ${updatedCustomer.balance2}`);
        console.log(`  earningsBalance : ${updatedCustomer.earningsBalance}`);
        console.log(`Referrer:`);
        console.log(`  ID              : ${updatedReferrer._id}`);
        console.log(`  balance1 (Main) : ${updatedReferrer.balance1}`);
        console.log(`  balance2 (Cash) : ${updatedReferrer.balance2}`);
        console.log(`  earningsBalance : ${updatedReferrer.earningsBalance}`);
        console.log("==============================================");

        // Fetch transactions created for both users
        const customerTxs = await Transaction.find({ userId: customer._id });
        const referrerTxs = await Transaction.find({ userId: referrer._id });

        console.log(`Customer Transactions count: ${customerTxs.length}`);
        customerTxs.forEach(t => console.log(`  Tx: ${t.reference} | Type: ${t.type} | Amount: ${t.amount} | Desc: ${t.description}`));

        console.log(`Referrer Transactions count: ${referrerTxs.length}`);
        referrerTxs.forEach(t => console.log(`  Tx: ${t.reference} | Type: ${t.type} | Amount: ${t.amount} | Desc: ${t.description}`));

        // Cleanup
        await Transaction.deleteMany({ userId: { $in: [customer._id, referrer._id] } });
        await User.deleteMany({ _id: { $in: [customer._id, referrer._id] } });
        console.log("\nCleanup done. Test complete.");
        process.exit(0);

    } catch (e) {
        console.error("Critical error in test:", e);
        process.exit(1);
    }
}

main();
