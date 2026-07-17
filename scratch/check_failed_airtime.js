import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Transaction from '../models/Transaction.js';

async function main() {
    try {
        console.log("Connecting...");
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });
        console.log("Connected.");

        // Query the last 20 failed or success airtime transactions
        const txs = await Transaction.find({
            description: /Airtime/i
        }).sort({ createdAt: -1 }).limit(30);

        console.log(`Found ${txs.length} recent airtime transactions:`);
        for (const t of txs) {
            console.log(`TX: Time=${t.createdAt.toISOString()} | Network=${t.network} | Amount=${t.amount} | Status=${t.status} | Provider=${t.provider_used} | Desc=${t.description}`);
        }
        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

main();
