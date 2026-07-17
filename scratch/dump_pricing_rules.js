import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import PricingRule from '../models/PricingRule.js';

async function main() {
    try {
        console.log("Connecting...");
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });
        console.log("Connected. Querying...");
        const rules = await PricingRule.find({}).maxTimeMS(5000);
        console.log(`RESULT:Found ${rules.length} rules.`);
        for (const rule of rules) {
            console.log("RULE:" + JSON.stringify(rule));
        }
        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

main();
