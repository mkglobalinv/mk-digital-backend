import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { getSupabaseClient } from '../services/supabaseClient.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.error("Supabase not initialized");
        return;
    }

    console.log("=== STARTING HISTORICAL LEDGER RECONCILIATION & BACKFILL ===");

    // 1. Fetch all existing ledger references from Supabase to prevent duplication
    const { data: existingLedgers, error } = await supabase
        .from('wallet_ledger')
        .select('reference');
    
    if (error) {
        console.error("Error fetching existing ledgers:", error.message);
        return;
    }

    const existingRefs = new Set(existingLedgers.map(l => l.reference));
    console.log(`Found ${existingRefs.size} existing ledger entries in Supabase.`);

    // 2. Fetch all MongoDB transactions that might be missing from ledger
    const candidateTxs = await Transaction.find({
        $or: [
            { reference: { $regex: /^ADM-SEC-/ } },
            { reference: { $regex: /^REF-ACT-/ } },
            { reference: { $regex: /^REF-REWARD-/ } },
            { reference: { $regex: /^WD-/ } },
            { reference: { $regex: /^WDR-/ } }
        ]
    });

    console.log(`Found ${candidateTxs.length} candidate MongoDB transactions for reconciliation.`);
    let backfillCount = 0;

    for (const tx of candidateTxs) {
        if (!existingRefs.has(tx.reference)) {
            console.log(`[Backfill] Missing ledger for reference: ${tx.reference} (Amount: ₦${tx.amount}, Type: ${tx.type}, Description: ${tx.description})`);
            
            let walletType = 'normal';
            let ledgerType = tx.type; // credit/debit

            if (tx.reference.startsWith('REF-ACT') || tx.reference.startsWith('REF-REWARD') || tx.reference.startsWith('WD-') || tx.reference.startsWith('WDR-')) {
                walletType = 'earnings';
            }
            if (tx.reference.startsWith('REF-ACT') || tx.reference.startsWith('REF-REWARD')) {
                ledgerType = 'commission';
            }

            const { error: insertErr } = await supabase.from('wallet_ledger').insert({
                user_id: tx.userId.toString(),
                amount: tx.amount,
                type: ledgerType,
                wallet_type: walletType,
                reference: tx.reference,
                description: tx.description || 'Historical Backfilled Transaction',
                status: 'success',
                created_at: tx.createdAt.toISOString()
            });

            if (insertErr) {
                console.error(`  [FAILED] to insert ledger for ${tx.reference}:`, insertErr.message);
            } else {
                console.log(`  [SUCCESS] Backfilled ledger for ${tx.reference}`);
                backfillCount++;
            }
        }
    }

    console.log(`\n=== RECONCILIATION SUMMARY ===`);
    console.log(`Total ledger entries backfilled: ${backfillCount}`);
    
    // 3. For users affected, let's sync their MongoDB balances to the newly restored ledger totals
    const affectedUserIds = [...new Set(candidateTxs.map(tx => tx.userId.toString()))];
    console.log(`Re-calculating and syncing balances for ${affectedUserIds.length} affected users...`);

    for (const uId of affectedUserIds) {
        // Fetch ledger totals dynamically
        const { data: userLedgers, error: queryErr } = await supabase
            .from('wallet_ledger')
            .select('amount, type, wallet_type')
            .eq('user_id', uId)
            .eq('status', 'success');

        if (queryErr) {
            console.error(`  Failed to query ledger for user ${uId}:`, queryErr.message);
            continue;
        }

        let normal = 0;
        let vip = 0;
        let earnings = 0;

        userLedgers.forEach(entry => {
            const amt = parseFloat(entry.amount);
            if (entry.type === 'credit' || entry.type === 'commission') {
                if (entry.wallet_type === 'normal') normal += amt;
                else if (entry.wallet_type === 'vip') vip += amt;
                else if (entry.wallet_type === 'earnings') earnings += amt;
            } else if (entry.type === 'debit' || entry.type === 'adjustment') {
                if (entry.wallet_type === 'normal') normal -= amt;
                else if (entry.wallet_type === 'vip') vip -= amt;
                else if (entry.wallet_type === 'earnings') earnings -= amt;
            }
        });

        // Safe repair - update MongoDB to match the complete rebuilt ledger
        const repairedUser = await User.findByIdAndUpdate(uId, {
            balance1: normal,
            balance2: vip,
            earningsBalance: earnings
        }, { new: true });

        console.log(`  User ${repairedUser?.name || uId} (${repairedUser?.email}) repaired: balance1 = ₦${repairedUser?.balance1}, earningsBalance = ₦${repairedUser?.earningsBalance}`);
    }

    await mongoose.disconnect();
    console.log("=== MIGRATION COMPLETE ===");
}

run().catch(console.error);
