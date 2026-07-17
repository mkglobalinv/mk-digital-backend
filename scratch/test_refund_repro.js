import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { deductBalance, refundBalance } from '../services/walletService.js';

dotenv.config();

async function main() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        // 1. Create a mock customer for testing the bug
        const uniqueSuffix = Date.now();
        const testUser = await User.create({
            name: `Test Bug User ${uniqueSuffix}`,
            email: `buguser_${uniqueSuffix}@test.com`,
            password: "TestPassword123!",
            balance1: 0,       // 0 Main Balance
            balance2: 1000,    // 1000 Cashback/Secondary Balance
            role: "user"
        });
        console.log(`Created test user ID: ${testUser._id}`);

        const derivedPrice = 500; // Plan price
        
        // ---------------- QUESTION 4: Wallet values before deductBalance ----------------
        console.log("\n==============================================");
        console.log("WALLET VALUES BEFORE DEDUCTION:");
        console.log(`  balance1 (Main)    : ${testUser.balance1}`);
        console.log(`  balance2 (Cashback): ${testUser.balance2}`);
        console.log(`  totalBalance       : ${testUser.totalBalance}`);
        console.log("==============================================");

        // ---------------- QUESTION 1 & 2: Return value and type of deductBalance ----------------
        console.log("\nExecuting: const deducted = await deductBalance(userId, derivedPrice)...");
        const deducted = await deductBalance(testUser._id, derivedPrice);
        
        console.log("----------------------------------------------");
        console.log(`Returned Value:`, deducted);
        console.log(`Type of deducted: ${deducted === null ? 'null' : typeof deducted}`);
        console.log("----------------------------------------------");

        // Fetch user from DB to check if main balance changed in MongoDB
        const afterDeductUser = await User.findById(testUser._id);

        // ---------------- QUESTION 3: Did balance1 actually decrease in MongoDB? ----------------
        console.log("\n==============================================");
        console.log("WALLET VALUES AFTER DEDUCTION:");
        console.log(`  balance1 (Main)    : ${afterDeductUser.balance1}`);
        console.log(`  balance2 (Cashback): ${afterDeductUser.balance2}`);
        console.log(`  totalBalance       : ${afterDeductUser.totalBalance}`);
        console.log(`  Did balance1 decrease? : ${afterDeductUser.balance1 < testUser.balance1 ? "YES" : "NO"}`);
        console.log("==============================================");

        // ---------------- QUESTION 5: Show whether balance_deducted was set manually ----------------
        console.log("\nCreating transaction document manually...");
        const transaction = await Transaction.create({ 
            userId: testUser._id, 
            type: "debit", 
            status: "pending", 
            amount: derivedPrice, 
            phone: "08012345678", 
            network: "AIRTEL", 
            reference: `DATA-BUG-${Date.now()}`,
            provider_used: "smart",
            description: `Data: AIRTEL_500`,
            balance_deducted: true, // MANUALLY set to true without checking if deducted is truthy
            isApiRequest: true
        });

        // ---------------- QUESTION 6: Show transaction document immediately after Transaction.create() ----------------
        console.log("\n==============================================");
        console.log("TRANSACTION DOCUMENT IMMEDIATELY AFTER CREATE:");
        console.log(JSON.stringify(transaction, null, 2));
        console.log("==============================================");

        // ---------------- QUESTION 4: Wallet values after refundBalance ----------------
        console.log("\nExecuting: await refundBalance(userId, transaction.amount)...");
        await refundBalance(testUser._id, transaction.amount);

        const afterRefundUser = await User.findById(testUser._id);
        console.log("\n==============================================");
        console.log("WALLET VALUES AFTER REFUND:");
        console.log(`  balance1 (Main)    : ${afterRefundUser.balance1}`);
        console.log(`  balance2 (Cashback): ${afterRefundUser.balance2}`);
        console.log(`  totalBalance       : ${afterRefundUser.totalBalance}`);
        console.log("==============================================");

        // Cleanup
        await User.deleteOne({ _id: testUser._id });
        await Transaction.deleteOne({ _id: transaction._id });
        console.log("\nCleanup done. Test complete.");
        process.exit(0);

    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

main();
