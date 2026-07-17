import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PricingRule from '../models/PricingRule.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const rules = await PricingRule.find();
    console.log(rules);
    process.exit(0);
}
run();
