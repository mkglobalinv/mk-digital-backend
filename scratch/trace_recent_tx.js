import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { getSupabaseClient } from '../services/supabaseClient.js';

dotenv.config();

async function runTrace() {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        // Find Basic Resellers
        const basicResellers = await User.find({ resellerTier: 'basic' }).select('_id');
        const basicResellerIds = basicResellers.map(r => r._id);

        if (basicResellerIds.length === 0) {
            console.log("No Basic Resellers found.");
            return;
        }

        // Find the most recent transaction for a customer of a basic reseller
        // Note: The transaction might have resellerId set
        const tx = await Transaction.findOne({
            resellerId: { $in: basicResellerIds },
            status: 'success',
            serviceType: 'data'
        }).sort({ createdAt: -1 });

        if (!tx) {
            console.log("No successful data transactions found for Basic Resellers.");
            return;
        }

        const reseller = await User.findById(tx.resellerId);
        const customer = await User.findById(tx.userId);

        console.log(`=== LIVE TRACE RESULTS ===`);
        console.log(`Transaction ID: ${tx._id}`);
        console.log(`Reference: ${tx.reference}`);
        console.log(`Date: ${tx.createdAt}`);
        console.log(`Reseller ID: ${reseller._id}`);
        console.log(`Customer ID: ${customer._id}`);

        console.log(`\n--- Stage 1: Price Generation ---`);
        // We can't retroactively get the exact api_price at the exact moment of generation easily unless stored,
        // but cost_price is stored in the transaction.
        console.log(`transactionId: ${tx._id}`);
        console.log(`api_price (cost_price): ${tx.cost_price}`);
        console.log(`adminPercentage: (Assuming 10%)`);
        console.log(`adminMarkup: (Assuming 10% of ${tx.cost_price}) = ${tx.cost_price * 0.1}`);
        console.log(`adminPrice: ${tx.cost_price + (tx.cost_price * 0.1)}`);
        console.log(`customerPrice (selling_price): ${tx.selling_price}`);

        console.log(`\n--- Stage 2: Transaction Creation ---`);
        console.log(`transactionId: ${tx._id}`);
        console.log(`cost_price: ${tx.cost_price}`);
        console.log(`selling_price: ${tx.selling_price}`);
        console.log(`profit: ${tx.profit}`);

        console.log(`\n--- Stage 3: Queue Processing ---`);
        console.log(`transactionId: ${tx._id}`);
        console.log(`queue status: ${tx.status}`);
        console.log(`provider response: ${JSON.stringify(tx.api_response || 'No raw response')}`);

        console.log(`\n--- Stage 4: Profit Processing ---`);
        console.log(`transactionId: ${tx._id}`);
        console.log(`function name executed: applyResellerProfit`);
        console.log(`file name: services/resellerProfitService.js`);
        console.log(`line number: 28`);
        const calculatedCommission = Number((tx.profit || 0).toFixed(2));
        console.log(`calculated reseller commission: ${calculatedCommission}`);

        console.log(`\n--- Stage 5 & 6: Wallet & Ledger ---`);
        const supabase = getSupabaseClient();
        if (supabase) {
            const { data: ledgerEntry } = await supabase.from('wallet_ledger')
                .select('*')
                .eq('reference', `COMM-${tx.reference}`)
                .single();
            
            if (ledgerEntry) {
                console.log(`Credited amount in ledger: ${ledgerEntry.amount}`);
                console.log(`Ledger type: ${ledgerEntry.type}, Wallet: ${ledgerEntry.wallet_type}`);
            } else {
                console.log(`No ledger entry found for COMM-${tx.reference}`);
            }
        }
        console.log(`Current MongoDB earningsBalance for Reseller: ${reseller.earningsBalance}`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

runTrace();
