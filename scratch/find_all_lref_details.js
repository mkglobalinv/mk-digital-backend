import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    const txs = await Transaction.find({ ledger_type: 'LIFETIME_REFERRAL_SHARE' });
    console.log(`Total LIFETIME_REFERRAL_SHARE transactions: ${txs.length}`);

    for (const tx of txs) {
        console.log(`\n--------------------------------------------`);
        console.log(`LREF Transaction ID: ${tx._id}`);
        console.log(`Amount: ${tx.amount}`);
        console.log(`Reference: ${tx.reference}`);
        
        // Find user assigned to this LREF transaction (the recipient in DB)
        const recipientUser = await User.findById(tx.userId);
        console.log(`Assigned User (Recipient in DB):`);
        console.log(`  ID: ${recipientUser?._id}`);
        console.log(`  Name: ${recipientUser?.name}`);
        console.log(`  Email: ${recipientUser?.email}`);
        console.log(`  Referred By: ${recipientUser?.referredBy}`);

        // Let's find the base transaction
        const baseRef = tx.reference.replace('LREF-', '');
        // Search by reference or partial reference
        const baseTx = await Transaction.findOne({
            $or: [
                { reference: baseRef },
                { reference: baseRef.replace('LCB-', '') }
            ]
        });

        if (baseTx) {
            console.log(`Base Transaction Found:`);
            console.log(`  ID: ${baseTx._id}`);
            console.log(`  Reference: ${baseTx.reference}`);
            console.log(`  Amount: ${baseTx.amount}`);
            console.log(`  Description: ${baseTx.description}`);
            
            const purchaser = await User.findById(baseTx.userId);
            console.log(`Purchasing Customer:`);
            console.log(`  ID: ${purchaser?._id}`);
            console.log(`  Name: ${purchaser?.name}`);
            console.log(`  Email: ${purchaser?.email}`);
            console.log(`  Referred By: ${purchaser?.referredBy}`);
        } else {
            console.log(`No base transaction found for reference: ${baseRef}`);
        }
    }

    await mongoose.disconnect();
}

run().catch(console.error);
