import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PricingRule from '../models/PricingRule.js';
import DataPlan from '../models/DataPlan.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const rules = await PricingRule.find({ isActive: true });
    let count = 0;
    
    for (const rule of rules) {
        const query = { 
            network: rule.network.toUpperCase(),
            ...(rule.category && { category: rule.category }) 
        };
        const plans = await DataPlan.find(query);
        for (const plan of plans) {
            const apiPrice = plan.api_price || 0;
            const vipMarkup = apiPrice * (rule.vipPercentage / 100);
            plan.vip_price = apiPrice + vipMarkup;
            plan.vip_selling_price = plan.vip_price;
            plan.premium_price = plan.vip_price; 
            plan.premium_selling_price = plan.vip_selling_price;
            await plan.save();
            count++;
        }
    }
    
    console.log(`Updated ${count} plans with corrected VIP logic.`);
    process.exit(0);
}

run();
