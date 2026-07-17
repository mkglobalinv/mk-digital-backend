import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    // The 2 real LREF transactions from the live system (Abdul basi receiving referral share)
    const lrefIds = [
        '6a460db7eecceecc1ad3dca7',
        '6a461a85f26c50afeb19e6f5'
    ];

    // The 2 base purchase transactions (loca worke buying data)
    const baseIds = [
        '6a460d95eecceecc1ad3dc01',
        '6a461a67f26c50afeb19e64d'
    ];

    console.log("===== LREF TRANSACTIONS (Referral Share - recipient should be REFERRER) =====");
    for (const id of lrefIds) {
        const tx = await Transaction.findById(id).populate('userId', 'name email');
        if (!tx) { console.log(`NOT FOUND: ${id}`); continue; }
        console.log(`\n--- Transaction ID: ${tx._id} ---`);
        console.log(`  transaction._id:        ${tx._id}`);
        console.log(`  transaction.userId:      ${tx.userId?._id || tx.userId}`);
        console.log(`  populated user.name:     ${tx.userId?.name}`);
        console.log(`  populated user.email:    ${tx.userId?.email}`);
        console.log(`  transaction.reference:   ${tx.reference}`);
        console.log(`  transaction.amount:      ${tx.amount}`);
        console.log(`  transaction.type:        ${tx.type}`);
        console.log(`  transaction.status:      ${tx.status}`);
        console.log(`  transaction.description: ${tx.description}`);
        console.log(`  transaction.ledger_type: ${tx.ledger_type}`);
    }

    console.log("\n===== BASE PURCHASE TRANSACTIONS (Data purchase - should be CUSTOMER) =====");
    for (const id of baseIds) {
        const tx = await Transaction.findById(id).populate('userId', 'name email');
        if (!tx) { console.log(`NOT FOUND: ${id}`); continue; }
        console.log(`\n--- Transaction ID: ${tx._id} ---`);
        console.log(`  transaction._id:        ${tx._id}`);
        console.log(`  transaction.userId:      ${tx.userId?._id || tx.userId}`);
        console.log(`  populated user.name:     ${tx.userId?.name}`);
        console.log(`  populated user.email:    ${tx.userId?.email}`);
        console.log(`  transaction.reference:   ${tx.reference}`);
        console.log(`  transaction.amount:      ${tx.amount}`);
        console.log(`  transaction.type:        ${tx.type}`);
        console.log(`  transaction.status:      ${tx.status}`);
        console.log(`  transaction.description: ${tx.description}`);
        console.log(`  transaction.ledger_type: ${tx.ledger_type}`);
    }

    await mongoose.disconnect();
}

run().catch(console.error);
