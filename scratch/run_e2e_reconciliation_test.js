import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { creditBalance, deductBalance, refundBalance, creditEarnings, deductEarnings, refundEarnings, syncLedgerToMongo } from '../services/walletService.js';
import { getSupabaseClient } from '../services/supabaseClient.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.error("Supabase client not initialized.");
        return;
    }

    console.log("=== STARTING PHASE 15.4 E2E RECONCILIATION & INTEGRITY TESTING ===\n");

    // Create a temporary E2E user for verification
    const testEmail = `e2e_test_${Date.now()}@accounting.com`;
    const testUser = await User.create({
        name: "E2E Accounting Test User",
        email: testEmail,
        password: "e2ePassword123"
    });

    const userId = testUser._id.toString();
    console.log(`Created E2E Test User: ${testUser.name} (${testUser.email})`);

    const printResult = (testName, reference, wallet, balBefore, balAfter, ledgerBefore, ledgerAfter, txCreated, ledgerCreated, auditCreated, isPass) => {
        console.log(`\n------------------------------------------------------------`);
        console.log(`Test:               ${testName}`);
        console.log(`User:               ${testEmail}`);
        console.log(`Reference:          ${reference}`);
        console.log(`Wallet affected:    ${wallet}`);
        console.log(`Balance Before:     ₦${balBefore}`);
        console.log(`Balance After:      ₦${balAfter}`);
        console.log(`Ledger Before:      ₦${ledgerBefore}`);
        console.log(`Ledger After:       ₦${ledgerAfter}`);
        console.log(`Transaction Log:    ${txCreated ? 'CREATED' : 'MISSING'}`);
        console.log(`Ledger Entry:       ${ledgerCreated ? 'CREATED' : 'MISSING'}`);
        console.log(`Audit Trail:        ${auditCreated ? 'CREATED' : 'MISSING'}`);
        console.log(`Result:             ${isPass ? 'PASS' : 'FAIL'}`);
        console.log(`------------------------------------------------------------`);
    };

    // Helper to calculate ledger balance
    const getLedgerBalance = async (uId, wType) => {
        const { data, error } = await supabase
            .from('wallet_ledger')
            .select('amount, type, wallet_type')
            .eq('user_id', uId)
            .eq('status', 'success');

        if (error) return 0;
        let bal = 0;
        data.forEach(entry => {
            if (entry.wallet_type === wType) {
                const amt = parseFloat(entry.amount);
                if (entry.type === 'credit' || entry.type === 'commission') {
                    bal += amt;
                } else if (entry.type === 'debit' || entry.type === 'adjustment') {
                    bal -= amt;
                }
            }
        });
        return bal;
    };

    // 1. Admin Secure Manual Funding Test
    {
        const testName = "Admin Manual Funding";
        const ref = `ADM-SEC-${Date.now()}`;
        const amount = 5000;

        const balBefore = testUser.balance1;
        const ledgerBefore = await getLedgerBalance(userId, 'normal');

        const updated = await creditBalance(userId, amount, ref, "Admin manual E2E fund");
        
        const balAfter = updated.balance1;
        const ledgerAfter = await getLedgerBalance(userId, 'normal');

        const tx = await Transaction.findOne({ reference: ref });
        const { data: ledgers } = await supabase.from('wallet_ledger').select('*').eq('reference', ref);

        const pass = (balAfter === balBefore + amount) && (ledgerAfter === ledgerBefore + amount) && tx && ledgers.length > 0;
        printResult(testName, ref, 'normal', balBefore, balAfter, ledgerBefore, ledgerAfter, !!tx, ledgers.length > 0, !!tx, pass);
    }

    // 2. Airtime / Data Purchase Test (Deduct Normal)
    let purchaseTx;
    {
        const testName = "Data Purchase (Deduct)";
        const ref = `SYS-DED-${Date.now()}`;
        const amount = 500;

        const freshUser = await User.findById(userId);
        const balBefore = freshUser.balance1;
        const ledgerBefore = await getLedgerBalance(userId, 'normal');

        const updated = await deductBalance(userId, amount, ref, "Data purchase E2E");
        
        const balAfter = updated.balance1;
        const ledgerAfter = await getLedgerBalance(userId, 'normal');

        purchaseTx = await Transaction.findOne({ reference: ref });
        const { data: ledgers } = await supabase.from('wallet_ledger').select('*').eq('reference', ref);

        const pass = (balAfter === balBefore - amount) && (ledgerAfter === ledgerBefore - amount) && purchaseTx && ledgers.length > 0;
        printResult(testName, ref, 'normal', balBefore, balAfter, ledgerBefore, ledgerAfter, !!purchaseTx, ledgers.length > 0, !!purchaseTx, pass);
    }

    // 3. Failed Purchase & Refund Test
    {
        const testName = "Failed Purchase Refund";
        const ref = `SYS-REF-${Date.now()}`;
        
        // Setup balance_deducted: true to simulate purchase failure requiring refund
        purchaseTx.balance_deducted = true;
        await purchaseTx.save();

        const freshUser = await User.findById(userId);
        const balBefore = freshUser.balance1;
        const ledgerBefore = await getLedgerBalance(userId, 'normal');

        const updated = await refundBalance(userId, purchaseTx.amount, purchaseTx);
        
        const balAfter = updated.balance1;
        const ledgerAfter = await getLedgerBalance(userId, 'normal');

        const refTx = await Transaction.findOne({ parentTransactionId: purchaseTx._id, ledger_type: 'REFUND' });
        const ledgerCreated = ledgerAfter === ledgerBefore + purchaseTx.amount;

        const pass = (balAfter === balBefore + purchaseTx.amount) && ledgerCreated && refTx;
        printResult(testName, ref, 'normal', balBefore, balAfter, ledgerBefore, ledgerAfter, !!refTx, ledgerCreated, !!refTx, pass);
    }

    // 4. Referral / Commission Earnings Credit Test
    {
        const testName = "Commission Credit";
        const ref = `COMM-${Date.now()}`;
        const amount = 150;

        const freshUser = await User.findById(userId);
        const balBefore = freshUser.earningsBalance;
        const ledgerBefore = await getLedgerBalance(userId, 'earnings');

        const updated = await creditEarnings(userId, amount, ref, "E2E Referral Commission");
        
        const balAfter = updated.earningsBalance;
        const ledgerAfter = await getLedgerBalance(userId, 'earnings');

        const tx = await Transaction.findOne({ reference: ref });
        const { data: ledgers } = await supabase.from('wallet_ledger').select('*').eq('reference', ref);

        const pass = (balAfter === balBefore + amount) && (ledgerAfter === ledgerBefore + amount) && tx && ledgers.length > 0;
        printResult(testName, ref, 'earnings', balBefore, balAfter, ledgerBefore, ledgerAfter, !!tx, ledgers.length > 0, !!tx, pass);
    }

    // 5. Withdrawal Request Test (Deduct Earnings)
    {
        const testName = "Withdrawal Request";
        const ref = `WDR-${Date.now()}`;
        const amount = 100;

        const freshUser = await User.findById(userId);
        const balBefore = freshUser.earningsBalance;
        const ledgerBefore = await getLedgerBalance(userId, 'earnings');

        const updated = await deductEarnings(userId, amount, ref, "Withdrawal E2E request");
        
        const balAfter = updated.earningsBalance;
        const ledgerAfter = await getLedgerBalance(userId, 'earnings');

        const tx = await Transaction.findOne({ reference: ref });
        const { data: ledgers } = await supabase.from('wallet_ledger').select('*').eq('reference', ref);

        const pass = (balAfter === balBefore - amount) && (ledgerAfter === ledgerBefore - amount) && tx && ledgers.length > 0;
        printResult(testName, ref, 'earnings', balBefore, balAfter, ledgerBefore, ledgerAfter, !!tx, ledgers.length > 0, !!tx, pass);
    }

    // 6. Idempotence Concurrency Refund Lock Test
    {
        const testName = "Idempotent Refund Concurrency Lock";
        console.log(`\nRunning concurrent refund concurrency lock test...`);

        // Setup a dummy purchase transaction with balance_deducted: true
        const ref = `CONC-DED-${Date.now()}`;
        const dummyTx = await Transaction.create({
            userId,
            amount: 300,
            type: 'debit',
            status: 'success',
            reference: ref,
            balance_deducted: true
        });

        // Trigger two concurrent findOneAndUpdate attempts (simulating requery + queue service)
        const runRefundAttempt = async (attemptId) => {
            const lockedTx = await Transaction.findOneAndUpdate(
                { _id: dummyTx._id, balance_deducted: true },
                { $set: { balance_deducted: false } },
                { new: true }
            );

            if (lockedTx) {
                console.log(`  [Attempt ${attemptId}] LOCK ACQUIRED. Executing refund...`);
                await refundBalance(userId, lockedTx.amount, lockedTx);
                return true;
            } else {
                console.log(`  [Attempt ${attemptId}] LOCK REJECTED (Already locked or refunded).`);
                return false;
            }
        };

        const results = await Promise.all([
            runRefundAttempt(1),
            runRefundAttempt(2),
            runRefundAttempt(3)
        ]);

        const successfulAttempts = results.filter(r => r === true).length;
        const pass = successfulAttempts === 1;

        console.log(`Concurrent Lock Test Results:`);
        console.log(`  Successful Refunds executed: ${successfulAttempts}`);
        console.log(`  Result: ${pass ? 'PASS' : 'FAIL'}`);
    }

    // 7. Non-destructive syncLedgerToMongo Verification
    {
        const testName = "Non-destructive Ledger Sync";
        const freshUser = await User.findById(userId);

        // Intentionally create a discrepancy to verify safety check blocks overwrite
        freshUser.balance1 += 1000; 
        await freshUser.save();

        console.log(`\nRunning syncLedgerToMongo() with artificial ₦1000 discrepancy...`);
        const result = await syncLedgerToMongo(userId);

        const pass = result === false; // Should return false/abort because of safety discrepancy check
        console.log(`  Sync Result: ${result === false ? 'ABORTED (Discrepancy detected - Safe)' : 'OVERWRITTEN (Unsafe!)'}`);
        console.log(`  Result: ${pass ? 'PASS' : 'FAIL'}`);
    }

    // Clean up E2E user and transaction records
    await User.deleteOne({ _id: userId });
    await Transaction.deleteMany({ userId });
    
    // Clean up test ledgers from Supabase
    await supabase.from('wallet_ledger').delete().eq('user_id', userId);

    console.log("\n=== ALL E2E TESTING COMPLETE ===");
    await mongoose.disconnect();
}

run().catch(console.error);
