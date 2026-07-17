import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    const REFERRER_ID = '6a410974d95fcfbdaa1fb278'; // Abdul basi

    console.log("=== SEARCHING TRANSACTIONS OF REFERRER CONTAINING FAILED PURCHASE DETAILS ===");
    // Find all transactions for referrer
    const txs = await Transaction.find({ userId: REFERRER_ID });
    
    for (const tx of txs) {
        console.log(`\nTransaction: ${tx._id}`);
        console.log(`  reference:   ${tx.reference}`);
        console.log(`  type:        ${tx.type}`);
        console.log(`  amount:      ${tx.amount}`);
        console.log(`  status:      ${tx.status}`);
        console.log(`  description: ${tx.description}`);
        console.log(`  ledger_type: ${tx.ledger_type}`);
    }

    await mongoose.disconnect();
}

run().catch(console.error);
