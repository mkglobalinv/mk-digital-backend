import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DataPlan from '../models/DataPlan.js';
import { fetchDataPlansFromBillsplash } from '../services/providers/billsplash.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("MONGO_URI is missing from environment variables.");
    process.exit(1);
}

const importBillsplashPlans = async () => {
    try {
        console.log(`Connecting to MongoDB...`);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB successfully.');

        const networks = ['mtn', 'airtel', 'glo', '9mobile'];
        let importedCount = 0;

        for (const network of networks) {
            console.log(`\nFetching ${network.toUpperCase()} plans from Billsplash...`);
            const result = await fetchDataPlansFromBillsplash(network);

            if (!result.success || !result.plans) {
                console.error(`Failed to fetch ${network.toUpperCase()} plans: ${result.message}`);
                continue;
            }

            console.log(`Found ${result.plans.length} plans for ${network.toUpperCase()}.`);

            for (const plan of result.plans) {
                // Determine category and validity based on plan string or API fields
                // Billsplash docs aren't clear on the exact schema returned.
                // Assuming typical shape: { plan_id: "...", name: "1GB", price: 500, validity: "30 Days" }
                // Fallback to defaults if specific fields are missing.
                const category = plan.category || 'SME';
                const validity = plan.validity || '30 Days';
                const planName = plan.name || plan.plan_name || 'Unknown Plan';
                const planId = plan.plan_id || plan.id;
                const apiPrice = plan.price || plan.api_price || 0;

                if (!planId) {
                    console.warn(`Skipping plan with missing ID: ${JSON.stringify(plan)}`);
                    continue;
                }

                const query = { api_plan_id: String(planId), provider: 'billsplash', network: network.toUpperCase() };
                const update = {
                    plan_name: planName,
                    category,
                    validity,
                    api_price: Number(apiPrice),
                    status: true
                };

                // The new option is deprecated but this is an importer script, we can just use new: true safely
                // Or better, just don't use it if we don't need the returned document
                await DataPlan.updateOne(query, { $set: update }, { upsert: true });
                importedCount++;
            }
        }

        console.log(`\nImport complete! Upserted ${importedCount} Billsplash data plans.`);
        process.exit(0);
    } catch (error) {
        console.error('Error importing plans:', error);
        process.exit(1);
    }
};

importBillsplashPlans();
