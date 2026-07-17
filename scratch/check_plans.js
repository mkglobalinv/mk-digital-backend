import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DataPlan from '../models/DataPlan.js';

dotenv.config();

async function checkPlans() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await DataPlan.countDocuments();
        console.log(`Total DataPlans in DB: ${count}`);
        const samples = await DataPlan.find().limit(5);
        console.log('Sample plans:', JSON.stringify(samples, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPlans();
