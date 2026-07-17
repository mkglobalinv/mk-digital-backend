import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DataPlan from '../models/DataPlan.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const plan = await DataPlan.findOne({ network: 'MTN', category: 'SME' });
    console.log(plan);
    process.exit(0);
}
run();
