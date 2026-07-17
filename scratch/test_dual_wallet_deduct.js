import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { deductBalance, refundBalance } from '../services/walletService.js';

dotenv.config();

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`[FAIL] ${message} | Expected ${expected}, got ${actual}`);
    }
    console.log(`[PASS] ${message}`);
}

async function runTests() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.\n");

        const uniqueSuffix = Date.now();

        // Helper to create test user
        async function createTestUser(b1, b2) {
            return await User.create({
                name: `Test User ${uniqueSuffix}`,
                email: `test_${Date.now()}_${Math.floor(Math.random()*1000)}@test.com`,
                password: "Password123!",
                balance1: b1,
                balance2: b2,
                role: "user"
            });
        }

        // =====================================================================
        // TEST 1: Main wallet only purchase
        // =====================================================================
        console.log("--- TEST 1: Main wallet only purchase ---");
        let u1 = await createTestUser(500, 200);
        let res1 = await deductBalance(u1._id, 400);
        
        assertEqual(res1.balance1, 100, "balance1 should be 100");
        assertEqual(res1.balance2, 200, "balance2 should be 200");
        assertEqual(res1.mainDeducted, 400, "mainDeducted should be 400");
        assertEqual(res1.cashbackDeducted, 0, "cashbackDeducted should be 0");
        
        await User.deleteOne({ _id: u1._id });

        // =====================================================================
        // TEST 2: Cashback wallet only purchase
        // =====================================================================
        console.log("\n--- TEST 2: Cashback wallet only purchase ---");
        let u2 = await createTestUser(0, 500);
        let res2 = await deductBalance(u2._id, 400);
        
        assertEqual(res2.balance1, 0, "balance1 should be 0");
        assertEqual(res2.balance2, 100, "balance2 should be 100");
        assertEqual(res2.mainDeducted, 0, "mainDeducted should be 0");
        assertEqual(res2.cashbackDeducted, 400, "cashbackDeducted should be 400");
        
        await User.deleteOne({ _id: u2._id });

        // =====================================================================
        // TEST 3: Split wallet purchase
        // =====================================================================
        console.log("\n--- TEST 3: Split wallet purchase ---");
        let u3 = await createTestUser(300, 200);
        let res3 = await deductBalance(u3._id, 450);
        
        assertEqual(res3.balance1, 0, "balance1 should be 0");
        assertEqual(res3.balance2, 50, "balance2 should be 50");
        assertEqual(res3.mainDeducted, 300, "mainDeducted should be 300");
        assertEqual(res3.cashbackDeducted, 150, "cashbackDeducted should be 150");
        
        // =====================================================================
        // TEST 4 & 5: Successful transaction + Failed transaction refund
        // =====================================================================
        console.log("\n--- TEST 4 & 5: Successful transaction + Failed transaction refund ---");
        // Create Transaction record representing this split purchase
        const tx = await Transaction.create({
            userId: u3._id,
            type: "debit",
            status: "pending",
            amount: 450,
            reference: `TX-${uniqueSuffix}`,
            main_wallet_deducted: res3.mainDeducted,
            cashback_wallet_deducted: res3.cashbackDeducted,
            balance_deducted: true
        });
        
        assertEqual(tx.main_wallet_deducted, 300, "Stored main_wallet_deducted should be 300");
        assertEqual(tx.cashback_wallet_deducted, 150, "Stored cashback_wallet_deducted should be 150");
        
        // Perform refund using the transaction object (no DB queries inside refundBalance)
        let refRes = await refundBalance(u3._id, tx.amount, tx);
        
        assertEqual(refRes.balance1, 300, "Refund balance1 should be restored to 300");
        assertEqual(refRes.balance2, 200, "Refund balance2 should be restored to 200");
        
        await Transaction.deleteOne({ _id: tx._id });
        await User.deleteOne({ _id: u3._id });

        // =====================================================================
        // TEST 6: Duplicate refund prevention
        // =====================================================================
        console.log("\n--- TEST 6: Duplicate refund prevention ---");
        // In queueService.js:
        // if (tx.balance_deducted) { await refundBalance(...); tx.balance_deducted = false; }
        // We verify that resetting tx.balance_deducted to false guards against second refunds.
        let u6 = await createTestUser(100, 100);
        const tx6 = await Transaction.create({
            userId: u6._id,
            amount: 150,
            balance_deducted: true,
            main_wallet_deducted: 100,
            cashback_wallet_deducted: 50
        });
        
        // Simulation of failure/refund worker block
        if (tx6.balance_deducted) {
            await refundBalance(u6._id, tx6.amount, tx6);
            tx6.balance_deducted = false;
            await tx6.save();
        }
        
        let userAfterFirstRefund = await User.findById(u6._id);
        assertEqual(userAfterFirstRefund.balance1, 200, "First refund: balance1 = 200");
        assertEqual(userAfterFirstRefund.balance2, 150, "First refund: balance2 = 150");
        
        // Trigger second call - it should skip because balance_deducted is false
        if (tx6.balance_deducted) {
            await refundBalance(u6._id, tx6.amount, tx6);
        }
        
        let userAfterSecondRefund = await User.findById(u6._id);
        assertEqual(userAfterSecondRefund.balance1, 200, "Second call skipped: balance1 remains 200");
        assertEqual(userAfterSecondRefund.balance2, 150, "Second call skipped: balance2 remains 150");
        
        await Transaction.deleteOne({ _id: tx6._id });
        await User.deleteOne({ _id: u6._id });

        // =====================================================================
        // TEST 7: Backward compatibility
        // =====================================================================
        console.log("\n--- TEST 7: Backward compatibility ---");
        let u7 = await createTestUser(100, 100);
        // Create an old transaction without split fields
        const oldTx = await Transaction.create({
            userId: u7._id,
            amount: 150,
            balance_deducted: true
        });
        
        // Refund old transaction - should restore full amount to balance1 (existing logic)
        let refOldRes = await refundBalance(u7._id, oldTx.amount, oldTx);
        assertEqual(refOldRes.balance1, 250, "Old tx refund: balance1 should gain full amount (250)");
        assertEqual(refOldRes.balance2, 100, "Old tx refund: balance2 should remain unchanged (100)");
        
        await Transaction.deleteOne({ _id: oldTx._id });
        await User.deleteOne({ _id: u7._id });

        // =====================================================================
        // TEST 8: Requery refund simulation
        // =====================================================================
        console.log("\n--- TEST 8: Requery refund simulation ---");
        let u8 = await createTestUser(100, 100);
        const tx8 = await Transaction.create({
            userId: u8._id,
            amount: 150,
            balance_deducted: true,
            main_wallet_deducted: 100,
            cashback_wallet_deducted: 50
        });
        
        // requeryService path: calls refundBalance with transaction object directly
        if (tx8.balance_deducted) {
            await refundBalance(tx8.userId, tx8.amount, tx8);
            tx8.balance_deducted = false;
            await tx8.save();
        }
        
        let u8After = await User.findById(u8._id);
        assertEqual(u8After.balance1, 200, "Requery refund: balance1 = 200");
        assertEqual(u8After.balance2, 150, "Requery refund: balance2 = 150");
        
        await Transaction.deleteOne({ _id: tx8._id });
        await User.deleteOne({ _id: u8._id });

        // =====================================================================
        // TEST 9: Concurrent purchase safety
        // =====================================================================
        console.log("\n--- TEST 9: Concurrent purchase safety ---");
        let u9 = await createTestUser(300, 100); // totalAvailable = 400
        
        // Trigger two concurrent deductions of 300 each (which total 600 > 400)
        console.log("Triggering 2 concurrent deductBalance calls of 300 each on total balance of 400...");
        const p1 = deductBalance(u9._id, 300);
        const p2 = deductBalance(u9._id, 300);
        
        const [r1, r2] = await Promise.all([p1, p2]);
        
        console.log(`  Call 1 result: ${r1 ? "SUCCESS (New balance: " + (r1.balance1 + r1.balance2) + ")" : "FAILED"}`);
        console.log(`  Call 2 result: ${r2 ? "SUCCESS (New balance: " + (r2.balance1 + r2.balance2) + ")" : "FAILED"}`);
        
        // One must succeed, one must fail
        const successCount = (r1 ? 1 : 0) + (r2 ? 1 : 0);
        assertEqual(successCount, 1, "Only one concurrent request must succeed");
        
        const finalUser9 = await User.findById(u9._id);
        assertEqual(finalUser9.balance1 + finalUser9.balance2, 100, "Final balance must be exactly 100");
        
        await User.deleteOne({ _id: u9._id });

        console.log("\n==============================================");
        console.log("[ALL TESTS PASSED SUCCESSFULLY!]");
        console.log("==============================================");
        process.exit(0);
    } catch (e) {
        console.error("\nTEST FAILED:", e.message);
        console.error(e.stack);
        process.exit(1);
    }
}

runTests();
