import dotenv from 'dotenv';
dotenv.config();

import { getSupabaseClient } from '../services/supabaseClient.js';

async function run() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.log("Supabase client not initialized.");
        return;
    }

    const userId = '6a410974d95fcfbdaa1fb278'; // Abdul basi

    console.log(`=== Supabase Ledger Rows for User ${userId} ===`);
    const { data, error } = await supabase
        .from('wallet_ledger')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Supabase query error:", error);
        return;
    }

    console.log(`Found ${data.length} ledger rows in Supabase.`);
    let sumNormal = 0;
    let sumVip = 0;
    let sumEarnings = 0;

    for (const row of data) {
        console.log(`\nRow:`);
        console.log(`  id: ${row.id}`);
        console.log(`  amount: ${row.amount}`);
        console.log(`  type: ${row.type}`);
        console.log(`  wallet_type: ${row.wallet_type}`);
        console.log(`  reference: ${row.reference}`);
        console.log(`  description: ${row.description}`);
        console.log(`  status: ${row.status}`);
        console.log(`  created_at: ${row.created_at}`);

        const amt = parseFloat(row.amount);
        if (row.status === 'success') {
            if (row.type === 'credit' || row.type === 'commission') {
                if (row.wallet_type === 'normal') sumNormal += amt;
                else if (row.wallet_type === 'vip') sumVip += amt;
                else if (row.wallet_type === 'earnings') sumEarnings += amt;
            } else if (row.type === 'debit' || row.type === 'adjustment') {
                if (row.wallet_type === 'normal') sumNormal -= amt;
                else if (row.wallet_type === 'vip') sumVip -= amt;
                else if (row.wallet_type === 'earnings') sumEarnings -= amt;
            }
        }
    }

    console.log("\n=== Ledger Sum Totals ===");
    console.log(`  Normal Wallet:   ${sumNormal}`);
    console.log(`  VIP Wallet:      ${sumVip}`);
    console.log(`  Earnings Wallet: ${sumEarnings}`);
}

run().catch(console.error);
