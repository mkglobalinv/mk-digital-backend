import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Withdrawal from '../models/Withdrawal.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import { getSupabaseClient } from '../services/supabaseClient.js';
import { insertLedgerEntry, syncLedgerToMongo } from '../services/supabaseLedger.js';

dotenv.config();

async function runTest() {
    console.log("=== STARTING RESELLER WITHDRAWAL FLOW TEST ===");
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error("Supabase client failed to initialize.");
        }
        console.log("Supabase Client initialized.");

        // 1. Create Mock Reseller
        const pinHash = await bcrypt.hash("1234", 10);
        const resellerEmail = `reseller_wd_${Date.now()}@test.com`;
        const reseller = await User.create({
            name: "Test WD Reseller",
            email: resellerEmail,
            password: "hashedpassword123",
            withdrawalPin: pinHash,
            role: "reseller_admin",
            resellerTier: "basic",
            balance1: 500,
            earningsBalance: 3000
        });
        console.log(`[OK] Mock Reseller created: ${resellerEmail} with ₦3000 profit.`);

        // 2. Simulate requestBankWithdrawal
        console.log("Simulating withdrawal request for ₦1000...");
        const withdrawAmount = 1000;
        
        // Assert balance check
        if (reseller.earningsBalance < withdrawAmount) {
            throw new Error("Insufficient profit balance check failed.");
        }

        // Deduct from earningsBalance immediately
        await User.findByIdAndUpdate(reseller._id, { $inc: { earningsBalance: -withdrawAmount } });
        console.log("[OK] Deducted ₦1000 from earnings balance immediately.");

        const reference = `WD-TEST-${Date.now()}`;

        // Create transaction history log in MongoDB first
        const desc = `Bank Withdrawal Request to Access Bank (1234567890)`;
        const tx = await Transaction.create({
            userId: reseller._id,
            type: 'debit',
            status: 'pending',
            amount: withdrawAmount,
            description: desc,
            reference,
            provider: 'System',
            isInternal: false,
            resellerId: reseller._id
        });
        console.log(`[OK] Pending Transaction created. ID: ${tx._id}`);

        // Create Withdrawal request, linking transactionId
        const w = await Withdrawal.create({
            userId: reseller._id,
            amount: withdrawAmount,
            bankName: "Access Bank",
            accountNumber: "1234567890",
            accountName: "Test Account",
            reference,
            status: 'pending',
            transactionId: tx._id
        });
        console.log(`[OK] Withdrawal Request created. ID: ${w._id}`);

        // Sync with Supabase Ledger
        await insertLedgerEntry(reseller._id, withdrawAmount, 'debit', 'earnings', reference, `Pending Bank Withdrawal to Access Bank`);
        console.log("[OK] Supabase ledger entry inserted.");

        // Assert transactionId link
        if (!w.transactionId || w.transactionId.toString() !== tx._id.toString()) {
            throw new Error("Withdrawal transactionId is not correctly linked to the Transaction document!");
        }
        console.log("[SUCCESS] Verification: transactionId linkage is correct.");

        // 3. Test Admin Approval Simulation
        console.log("Simulating Admin Approval of withdrawal...");
        const pendingW = await Withdrawal.findById(w._id);
        if (!pendingW || pendingW.status !== 'pending') {
            throw new Error("Invalid withdrawal document for approval.");
        }

        pendingW.status = 'approved';
        await pendingW.save();

        if (pendingW.transactionId) {
            await Transaction.findByIdAndUpdate(pendingW.transactionId, { status: 'success' });
        }

        // Verify state after approval
        const approvedTx = await Transaction.findById(tx._id);
        const approvedW = await Withdrawal.findById(w._id);
        console.log(`Approved Withdrawal Status: ${approvedW.status}`);
        console.log(`Linked Transaction Status: ${approvedTx.status}`);

        if (approvedW.status !== 'approved' || approvedTx.status !== 'success') {
            throw new Error("Withdrawal approval state propagation failed!");
        }
        console.log("[SUCCESS] Verification: Approval status propagation succeeded.");

        // 4. Test Admin Rejection Simulation (Re-debit & Reject)
        console.log("Simulating a new withdrawal request for rejection test...");
        
        // Setup state: reseller has 2000 left
        const withdrawAmount2 = 500;
        await User.findByIdAndUpdate(reseller._id, { $inc: { earningsBalance: -withdrawAmount2 } });

        const reference2 = `WD-TEST-2-${Date.now()}`;
        const tx2 = await Transaction.create({
            userId: reseller._id,
            type: 'debit',
            status: 'pending',
            amount: withdrawAmount2,
            description: "Second Bank Withdrawal Request",
            reference: reference2,
            provider: 'System',
            isInternal: false,
            resellerId: reseller._id
        });

        const w2 = await Withdrawal.create({
            userId: reseller._id,
            amount: withdrawAmount2,
            bankName: "GTBank",
            accountNumber: "0987654321",
            accountName: "Test Account 2",
            reference: reference2,
            status: 'pending',
            transactionId: tx2._id
        });

        console.log("Simulating Admin Rejection of second withdrawal...");
        const pendingW2 = await Withdrawal.findById(w2._id);
        pendingW2.status = 'rejected';
        pendingW2.adminComment = "Incorrect account details";
        await pendingW2.save();

        // Refund earningsBalance
        await User.findByIdAndUpdate(pendingW2.userId, { $inc: { earningsBalance: pendingW2.amount } });

        if (pendingW2.transactionId) {
            await Transaction.findByIdAndUpdate(pendingW2.transactionId, { status: 'failed', description: `Rejected: Incorrect account details` });
        }

        // Verify state after rejection
        const rejectedTx = await Transaction.findById(tx2._id);
        const rejectedW = await Withdrawal.findById(w2._id);
        const finalReseller = await User.findById(reseller._id);
        console.log(`Rejected Withdrawal Status: ${rejectedW.status}`);
        console.log(`Linked Transaction Status: ${rejectedTx.status}`);
        console.log(`Reseller Final Earnings Balance: ₦${finalReseller.earningsBalance} (Expected: ₦2000)`);

        if (rejectedW.status !== 'rejected' || rejectedTx.status !== 'failed' || finalReseller.earningsBalance !== 2000) {
            throw new Error("Withdrawal rejection or refund logic failed!");
        }
        console.log("[SUCCESS] Verification: Rejection refund and status propagation succeeded.");

        // 5. Cleanup
        console.log("Cleaning up mock records...");
        await User.deleteOne({ _id: reseller._id });
        await Withdrawal.deleteMany({ userId: reseller._id });
        await Transaction.deleteMany({ userId: reseller._id });
        await Notification.deleteMany({ userId: reseller._id });

        // Clean Supabase ledger entries
        const { error: deleteErr } = await supabase
            .from('wallet_ledger')
            .delete()
            .eq('user_id', reseller._id.toString());
        if (deleteErr) {
            console.error("Failed to clean Supabase wallet_ledger:", deleteErr);
        } else {
            console.log("[OK] Supabase wallet_ledger cleaned.");
        }

        console.log("=== ALL TESTS PASSED SUCCESSFULLY ===");
        process.exit(0);

    } catch (err) {
        console.error("=== TEST FAILED ===");
        console.error(err);
        process.exit(1);
    }
}

runTest();
