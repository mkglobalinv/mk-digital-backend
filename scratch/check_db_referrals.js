import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("=== Lifetime Referral Share Transactions ===");
    const txs = await Transaction.find({ ledger_type: 'LIFETIME_REFERRAL_SHARE' })
        .populate('userId', 'name email referredBy')
        .sort({ createdAt: -1 })
        .limit(10);

    if (txs.length === 0) {
        console.log("No LIFETIME_REFERRAL_SHARE transactions found.");
    }

    for (const tx of txs) {
        console.log(`\nTransaction ID: ${tx._id}`);
        console.log(`Amount: ${tx.amount}`);
        console.log(`Description: ${tx.description}`);
        console.log(`Reference: ${tx.reference}`);
        
        if (tx.userId) {
            console.log(`Assigned User (tx.userId):`);
            console.log(`  ID: ${tx.userId._id}`);
            console.log(`  Name: ${tx.userId.name}`);
            console.log(`  Email: ${tx.userId.email}`);
            console.log(`  Referred By (ObjectId): ${tx.userId.referredBy}`);
            
            // Try to find if there is a customer user whose reference matches or who purchased
            // The reference is like LREF-TX_REF or LREF-timestamp.
            // Let's find a transaction with reference equal to tx.reference without 'LREF-' or 'LCB-'
            const baseRef = tx.reference.replace('LREF-', '');
            const purchaseTx = await Transaction.findOne({ 
                reference: baseRef 
            }).populate('userId', 'name email');
            
            if (purchaseTx && purchaseTx.userId) {
                console.log(`Purchasing Customer (from base transaction):`);
                console.log(`  ID: ${purchaseTx.userId._id}`);
                console.log(`  Name: ${purchaseTx.userId.name}`);
                console.log(`  Email: ${purchaseTx.userId.email}`);
            } else {
                console.log(`Base purchase transaction with reference ${baseRef} not found.`);
            }
        } else {
            console.log(`No user assigned to transaction.`);
        }
    }

    await mongoose.disconnect();
}

run().catch(console.error);
