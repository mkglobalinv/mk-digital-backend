import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import DataPlan from '../models/DataPlan.js';
import { buyDataWithPeyflex } from '../services/providers/peyflex.js';
import { buyDataWithClubkonnect } from '../services/providers/clubkonnect.js';

const TEST_PHONE = '08133131020'; // From previous test scripts

async function runTests() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB.');

        // Get one active plan from each category (limit to MTN to be safe, or across networks?)
        // Let's test 1 SME, 1 Gifting, 1 Corporate/Share, 1 Awoof (if exists) from Peyflex
        const categories = ['SME', 'Gifting', 'Corporate', 'Awoof'];
        
        for (const cat of categories) {
            // Find an active MTN plan in this category
            // We use regex to match category loosely
            const plan = await DataPlan.findOne({
                network: 'MTN',
                category: { $regex: new RegExp(cat, 'i') },
                status: true,
                provider: 'peyflex'
            });

            if (!plan) {
                console.log(`[Skip] No active MTN PayFlex plan found for category: ${cat}`);
                continue;
            }

            console.log(`\n--- Testing Category: ${cat} ---`);
            console.log(`Plan: ${plan.plan_name} (${plan.api_plan_id})`);
            console.log(`Provider: ${plan.provider} | Price: ${plan.api_price}`);

            console.log(`Executing buyDataWithPeyflex...`);
            const result = await buyDataWithPeyflex('MTN', plan.api_plan_id, TEST_PHONE, plan.category);
            console.log(`Result: ${JSON.stringify(result, null, 2)}`);
        }

        console.log('\nTesting complete.');
        process.exit(0);

    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

runTests();
