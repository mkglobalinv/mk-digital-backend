import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
    console.error("Missing Supabase URL or Service Key in .env");
    process.exit(1);
}

const supabase = createClient(url, key);

async function inspect() {
    console.log("Supabase Client initialized.");
    const testUserId = "6a12c70cf6f5c5b02744800c"; // Example user ID
    
    // 1. Fetch some records from wallet_ledger to see columns
    console.log("\n1. Querying wallet_ledger columns...");
    const { data: ledgerData, error: ledgerErr } = await supabase
        .from('wallet_ledger')
        .select('*')
        .limit(1);

    if (ledgerErr) {
        console.error("Error reading wallet_ledger:", ledgerErr.message);
    } else {
        console.log("Success! Columns found in wallet_ledger:", ledgerData.length > 0 ? Object.keys(ledgerData[0]) : "No rows in table to inspect");
    }

    // 2. Querying transactions columns
    console.log("\n2. Querying transactions columns...");
    const { data: txData, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .limit(1);

    if (txErr) {
        console.error("Error reading transactions:", txErr.message);
    } else {
        console.log("Success! Columns found in transactions:", txData.length > 0 ? Object.keys(txData[0]) : "No rows in table");
    }

    // 3. Try to insert directly into wallet_ledger
    console.log("\n3. Testing direct insert into wallet_ledger...");
    const { data: insertData, error: insertErr } = await supabase
        .from('wallet_ledger')
        .insert({
            user_id: testUserId,
            amount: 10,
            type: 'credit',
            wallet_type: 'normal',
            reference: `TEST-REF-DIRECT-${Date.now()}`,
            description: 'Inspection direct insert test'
        })
        .select();

    if (insertErr) {
        console.error("Direct insert failed:", insertErr.message, insertErr.details, insertErr.hint);
    } else {
        console.log("Direct insert Success! Data returned:", insertData);
    }

    // 4. Try to call process_wallet_adjustment RPC
    console.log("\n4. Testing process_wallet_adjustment RPC call...");
    const { data: rpcData, error: rpcErr } = await supabase.rpc('process_wallet_adjustment', {
        p_user_id: testUserId,
        p_amount: 10,
        p_type: 'credit',
        p_wallet_type: 'normal',
        p_reference: `TEST-REF-RPC-${Date.now()}`,
        p_description: 'Inspection test adjustment'
    });

    if (rpcErr) {
        console.error("RPC failed:", rpcErr.message, rpcErr.details, rpcErr.hint);
    } else {
        console.log("RPC Success! Result:", rpcData);
    }
}

inspect().catch(console.error);
