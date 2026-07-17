import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import PricingRule from '../models/PricingRule.js';

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");
        
        const rules = await PricingRule.find({});
        console.log(`Found ${rules.length} pricing rules:`);
        for (const rule of rules) {
            console.log({
                _id: rule._id,
                network: rule.network,
                category: rule.category,
                isActive: rule.isActive,
                margin: rule.margin,
                description: rule.description
            });
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
