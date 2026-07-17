import 'dotenv/config';
import mongoose from 'mongoose';
import PricingRule from '../models/PricingRule.js';

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to DB');

const rules = await PricingRule.find({});
console.log(JSON.stringify(rules, null, 2));

await mongoose.disconnect();
console.log('Disconnected');
