import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { applyResellerProfit } from '../services/resellerProfitService.js';
import { getSupabaseClient } from '../services/supabaseClient.js';
import * as supabaseLedger from '../services/supabaseLedger.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log("Forensic DB Connected");

    const sb = getSupabaseClient();
    console.log("Supabase Client initialized:", !!sb);

    // 1. Get a basic reseller
    const reseller = await User.findOne({ resellerTier: 'basic' });
    if (!reseller) {
        console.log("No basic reseller found.");
        process.exit();
    }
    console.log(`Found Basic Reseller: ${reseller.email} (${reseller._id})`);
    
    // 2. Create a mock transaction for a purchase
    const mockTx = new Transaction({
        userId: new mongoose.Types.ObjectId(), // customer
        amount: 115,
        selling_price: 115,
        cost_price: 100,
        type: 'debit',
        status: 'success',
        reference: `MOCK-${Date.now()}`,
        description: 'Test Data Purchase',
        resellerId: reseller._id,
        profit: 0
    });

    console.log("\n--- Transaction Details ---");
    console.log("providerCost:", mockTx.cost_price);
    console.log("customerSellingPrice:", mockTx.selling_price);
    console.log("Initial profit set:", mockTx.profit);

    // 3. Capture the original earnings balance
    const originalEarnings = reseller.earningsBalance || 0;
    console.log("Original Reseller earningsBalance:", originalEarnings);
    console.log("Original Reseller balance1:", reseller.balance1);

    // 4. Run the profit logic
    console.log("\n--- Executing applyResellerProfit ---");
    await applyResellerProfit(mockTx, { email: 'customer@test.com' });

    console.log("\n--- After applyResellerProfit ---");
    const updatedReseller = await User.findById(reseller._id);
    console.log("Updated Reseller earningsBalance:", updatedReseller.earningsBalance);
    console.log("Updated Reseller balance1:", updatedReseller.balance1);

    // 5. Look for the newly created transaction
    const commissionTx = await Transaction.findOne({ userId: reseller._id, type: 'credit', status: 'success' }).sort({ createdAt: -1 });
    console.log("\n--- Commission Transaction ---");
    if (commissionTx) {
        console.log("Found:", commissionTx.amount, commissionTx.description);
    } else {
        console.log("NOT FOUND");
    }

    // 6. Look at Supabase ledger
    if (sb) {
        console.log("\n--- Supabase Ledger Entries ---");
        const { data, error } = await sb.from('wallet_ledger').select('*').eq('user_id', reseller._id.toString()).order('created_at', { ascending: false }).limit(2);
        if (error) {
            console.error("Supabase Error:", error);
        } else {
            console.log("Latest Entries:", data);
        }
    }

    process.exit();
}

run().catch(console.error);
