import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import DataPlan from '../models/DataPlan.js';

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const plans = await DataPlan.find({ api_plan_id: 'M1GBA' });
    console.log(`Found ${plans.length} M1GBA plans`);
    for (const p of plans) {
        console.log(`- _id: ${p._id}, provider: ${p.provider}, network: ${p.network}, category: ${p.category}, status: ${p.status}`);
    }
    process.exit(0);
}
check();
