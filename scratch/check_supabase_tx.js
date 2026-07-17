import dotenv from 'dotenv';
dotenv.config();

import { getSupabaseClient } from '../services/supabaseClient.js';

async function run() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.log("Supabase client not initialized.");
        return;
    }

    console.log("=== Supabase Transactions (LREF) ===");
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .like('reference', 'LREF-%')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Supabase query error:", error);
        return;
    }

    console.log(`Found ${data.length} transactions starting with LREF- in Supabase.`);
    for (const tx of data) {
        console.log(`\nSupabase Row:`);
        console.log(`  mongo_id: ${tx.mongo_id}`);
        console.log(`  user_id: ${tx.user_id}`);
        console.log(`  reseller_id: ${tx.reseller_id}`);
        console.log(`  reference: ${tx.reference}`);
        console.log(`  description: ${tx.description}`);
        console.log(`  amount: ${tx.amount}`);
        console.log(`  type: ${tx.type}`);
        console.log(`  status: ${tx.status}`);
    }
}

run().catch(console.error);
