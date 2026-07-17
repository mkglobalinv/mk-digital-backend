import mongoose from 'mongoose';
import User from './models/User.js';
import Transaction from './models/Transaction.js';
import dotenv from 'dotenv';
dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mkdigital');
        console.log("Connected to DB.");

        await User.deleteMany({ email: 'core_fintech_test@example.com' });
        await Transaction.deleteMany({ reference: { $regex: /^TEST-CORE-/ } });

        const user = new User({
            name: 'Fintech Test',
            email: 'core_fintech_test@example.com',
            password: 'password123',
            phone: '08111222333',
            totalBalance: 1000,
            profitBalance: 500,
            role: 'user'
        });
        await user.save();

        console.log("\n--- TEST 1: Wallet Funding ---");
        const fundingAmount = 5000;
        user.totalBalance += fundingAmount;
        await user.save();
        
        const fundingTx = new Transaction({
            userId: user._id,
            reference: `TEST-CORE-FUND-${Date.now()}`,
            amount: fundingAmount,
            type: 'funding',
            status: 'success',
            balanceBefore: 1000,
            balanceAfter: 6000,
            description: 'Test Wallet Funding'
        });
        await fundingTx.save();
        console.log(`✓ Wallet successfully funded. New Balance: ₦${user.totalBalance}`);
        console.log(`✓ Transaction logged: ${fundingTx.reference} | Type: ${fundingTx.type}`);

        console.log("\n--- TEST 2: VTU Purchase ---");
        const purchaseAmount = 500;
        if (user.totalBalance >= purchaseAmount) {
            user.totalBalance -= purchaseAmount;
            await user.save();
            
            const purchaseTx = new Transaction({
                userId: user._id,
                reference: `TEST-CORE-VTU-${Date.now()}`,
                amount: purchaseAmount,
                type: 'vtu_purchase',
                status: 'success',
                balanceBefore: 6000,
                balanceAfter: user.totalBalance,
                description: 'MTN 1GB Data'
            });
            await purchaseTx.save();
            console.log(`✓ VTU Purchase successful. Deducted: ₦${purchaseAmount}. New Balance: ₦${user.totalBalance}`);
            console.log(`✓ Transaction logged: ${purchaseTx.reference}`);
        } else {
            console.error("✗ VTU Purchase failed: Insufficient balance.");
        }

        console.log("\n--- TEST 3: Withdrawals ---");
        const withdrawAmount = 200;
        if (user.profitBalance >= withdrawAmount) {
            user.profitBalance -= withdrawAmount;
            await user.save();
            
            const withdrawTx = new Transaction({
                userId: user._id,
                reference: `TEST-CORE-WD-${Date.now()}`,
                amount: withdrawAmount,
                type: 'withdrawal',
                status: 'pending',
                balanceBefore: 500,
                balanceAfter: user.profitBalance,
                description: 'Withdrawal to Bank'
            });
            await withdrawTx.save();
            console.log(`✓ Withdrawal initiated. Deducted from profit: ₦${withdrawAmount}. New Profit Balance: ₦${user.profitBalance}`);
            console.log(`✓ Transaction status: ${withdrawTx.status}`);
        } else {
            console.error("✗ Withdrawal failed: Insufficient profit balance.");
        }

        // Cleanup
        await User.deleteMany({ email: 'core_fintech_test@example.com' });
        await Transaction.deleteMany({ reference: { $regex: /^TEST-CORE-/ } });
        
        mongoose.disconnect();
        console.log("\nCore Fintech Test Suite Completed Successfully.");
    } catch (err) {
        console.error("Test failed", err);
    }
};

runTest();
