import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    const userId = '6a385e3cd0a8003b8a9a6c73';
    console.log(`=== Transactions for User ID: ${userId} (Retail A) ===`);
    
    const txs = await Transaction.find({ userId });
    console.log(`Found ${txs.length} transactions:`);
    for (const tx of txs) {
        console.log(`\nTransaction ID: ${tx._id}`);
        console.log(`  Reference: ${tx.reference}`);
        console.log(`  Amount: ${tx.amount}`);
        console.log(`  Type: ${tx.type}`);
        console.log(`  Status: ${tx.status}`);
        console.log(`  Description: ${tx.description}`);
        console.log(`  ledger_type: ${tx.ledger_type}`);
    }

    await mongoose.disconnect();
}

run().catch(console.error);
