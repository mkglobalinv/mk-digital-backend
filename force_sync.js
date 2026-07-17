import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB error", err));

// Define generic schema to pull all data
const DataPlanSchema = new mongoose.Schema({
    network: String,
    category: String,
    plan_name: String,
    api_plan_id: String,
    api_price: Number,
    status: Boolean
}, { strict: false, collection: 'dataplans' }); // It might be named dataplans or data_plans, check exact name later

const DataPlan = mongoose.models.DataPlan || mongoose.model('DataPlan', DataPlanSchema);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncToSupabase() {
    try {
        console.log("Fetching plans from MongoDB...");
        const allPlans = await DataPlan.find({ status: true });
        console.log(`Found ${allPlans.length} active plans. Syncing to Supabase...`);

        let success = 0;
        let errors = 0;

        for (const p of allPlans) {
            const payload = {
                network: (p.network || 'UNKNOWN').toUpperCase(),
                provider_plan_id: p.api_plan_id || 'UNKNOWN',
                plan_name: p.plan_name || 'Unknown Plan',
                category: p.category || 'Direct',
                api_price: p.api_price || 0,
                status: p.status
            };

            const { error } = await supabase.from('data_plans_master').upsert(payload, { onConflict: 'network, provider_plan_id' });
            
            if (error) {
                console.error("Failed to sync:", payload.plan_name, error.message);
                errors++;
            } else {
                success++;
            }
        }
        
        console.log(`Sync Complete! Success: ${success}, Errors: ${errors}`);
    } catch (err) {
        console.error("Script failed:", err);
    } finally {
        process.exit();
    }
}

setTimeout(syncToSupabase, 2000); // Wait for Mongo connection
