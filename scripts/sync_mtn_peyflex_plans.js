import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import DataPlan from '../models/DataPlan.js';
import { fetchDataPlansFromPeyflex } from '../services/providers/peyflex.js';

const PEYFLEX_MTN_ENDPOINTS = {
    'mtn_gifting_data': 'Gifting',
    'mtn_data_share': 'Corporate',
    'mtn_awoof_gifting': 'Awoof'
};

async function syncPlans() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        let totalSynced = 0;

        for (const [endpoint, categoryName] of Object.entries(PEYFLEX_MTN_ENDPOINTS)) {
            console.log(`\nFetching ${endpoint}...`);
            const res = await fetchDataPlansFromPeyflex(endpoint);
            if (!res.success || !res.plans) {
                console.warn(`Failed to fetch ${endpoint}:`, res.message);
                continue;
            }
            
            console.log(`Found ${res.plans.length} plans for ${endpoint}.`);
            
            for (const livePlan of res.plans) {
                const apiPlanId = livePlan.plan_code;
                let dbPlan = await DataPlan.findOne({ 
                    api_plan_id: new RegExp(`^${apiPlanId}$`, 'i'), 
                    network: 'MTN', 
                    provider: 'peyflex' 
                });

                if (dbPlan) {
                    // Update existing plan
                    let updated = false;
                    if (!dbPlan.status) {
                        dbPlan.status = true;
                        updated = true;
                    }
                    if (dbPlan.category !== categoryName) {
                        dbPlan.category = categoryName;
                        updated = true;
                    }
                    
                    if (updated) {
                        await dbPlan.save();
                        console.log(`Updated and activated: ${dbPlan.plan_name}`);
                    }
                } else {
                    // Create new plan
                    console.log(`Creating missing plan: ${livePlan.plan_name}`);
                    dbPlan = new DataPlan({
                        network: 'MTN',
                        category: categoryName,
                        plan_name: livePlan.plan_name,
                        plan_size: livePlan.label || '',
                        api_plan_id: apiPlanId,
                        api_price: livePlan.price,
                        selling_price: livePlan.price,
                        provider: 'peyflex',
                        status: true,
                        validity: livePlan.validity || '30 Days'
                    });
                    await dbPlan.save();
                }
                totalSynced++;
            }
        }

        console.log(`\nSynchronization complete. Total plans processed: ${totalSynced}`);
        process.exit(0);

    } catch (err) {
        console.error('Sync failed:', err);
        process.exit(1);
    }
}

syncPlans();
