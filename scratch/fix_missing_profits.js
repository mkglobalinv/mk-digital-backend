import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { applyResellerProfit } from '../services/resellerProfitService.js';

dotenv.config();

async function fixProfits() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Find the specific transactions the user complained about
        const txs = await Transaction.find({ reference: { $in: ['6711511429', '6711511199'] } });
        console.log(`Found ${txs.length} transactions to fix by reference.`);
        
        // Sometimes the reference is different but orderid matches
        if (txs.length < 2) {
            const moreTxs = await Transaction.find({ "api_response.orderid": { $in: ['6711511429', '6711511199'] } });
            for (const tx of moreTxs) {
                if (!txs.find(t => t.id === tx.id)) {
                    txs.push(tx);
                }
            }
            console.log(`Now have ${txs.length} transactions to fix.`);
        }
        
        for (const tx of txs) {
            console.log(`Fixing tx ${tx.reference}... profit currently: ${tx.profit}`);
            if (!tx.profit || tx.profit === 0) {
                const user = await User.findById(tx.userId);
                await applyResellerProfit(tx, user);
                await tx.save();
                console.log(`Fixed tx ${tx.reference}. New profit: ${tx.profit}`);
            } else {
                console.log(`Tx ${tx.reference} already has profit: ${tx.profit}`);
            }
        }
        
        console.log("Done.");
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
fixProfits();
