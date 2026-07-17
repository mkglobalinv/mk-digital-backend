import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import DataPlan from '../models/DataPlan.js';
import { smartBuyData } from '../services/switcher.js';

async function trace() {
    console.log("=== End-to-End Purchase Trace ===");
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const plan = await DataPlan.findOne({ api_plan_id: 'M1GBA' }).lean();
        console.log("1. Plan Document from MongoDB:", plan);
        
        console.log("\n2. Calling smartBuyData...");
        console.log(`Provider selected: ${plan.provider}`);
        console.log(`Network selected: ${plan.network}`);
        console.log(`Category selected: ${plan.category}`);
        console.log(`Internal plan ID: ${plan._id}`);
        console.log(`Provider plan ID: ${plan.api_plan_id}`);
        
        const res = await smartBuyData(plan.network, plan.api_plan_id, '08133131020', plan.api_price, 'NG', null, null, 'smart', plan.category);
        console.log("\n3. Result from smartBuyData:", res);
        
    } catch(e) {
        console.error("Error during trace:", e);
    } finally {
        process.exit(0);
    }
}
trace();
