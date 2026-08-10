import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import DataPlan from '../models/DataPlan.js';
import { getRetailPrice } from '../services/pricing/retailPricing.js';

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ role: 'user' }).lean();
        console.log('User:', user?.email, 'bal1:', user?.balance1, 'bal2:', user?.balance2);
        
        const plan = await DataPlan.findOne({ api_plan_id: 'nin-verify' }).lean();
        console.log('Plan:', plan?.plan_name, 'selling_price:', plan?.selling_price);
        
        const price = await getRetailPrice(user._id, 'nin-verify', 'identity');
        console.log('RetailPrice:', price);
    } catch(err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
run();
