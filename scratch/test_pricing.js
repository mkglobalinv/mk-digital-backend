import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PricingRule from '../models/PricingRule.js';
import DataPlan from '../models/DataPlan.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Simulate updating pricing rule
    const rule = await PricingRule.findOneAndUpdate(
        { network: 'MTN', category: 'SME' },
        { 
            retailPercentage: 10,
            basicPercentage: 20,
            vipPercentage: 15,
            isActive: true
        },
        { new: true, upsert: true }
    );
    
    // Manually apply logic
    const plans = await DataPlan.find({ network: 'MTN', category: 'SME' });
    for (const plan of plans) {
        const apiPrice = plan.api_price || 0;
        const retailMarkup = apiPrice * (rule.retailPercentage / 100);
        const retailPrice = apiPrice + retailMarkup;
        
        plan.selling_price = retailPrice;
        
        plan.reseller_price = retailPrice;
        const basicExtraProfit = retailMarkup * (rule.basicPercentage / 100);
        plan.basic_selling_price = retailPrice + basicExtraProfit;

        plan.vip_price = retailPrice;
        const vipExtraProfit = retailMarkup * (rule.vipPercentage / 100);
        plan.vip_selling_price = retailPrice + vipExtraProfit;
        
        await plan.save();
    }
    
    // Check results
    const updatedPlan = await DataPlan.findOne({ network: 'MTN', category: 'SME' });
    console.log("DB Plan:", {
        api_price: updatedPlan.api_price,
        selling_price: updatedPlan.selling_price,
        basic_selling_price: updatedPlan.basic_selling_price
    });
    
    // Simulate /api/vtu/data-plans/MTN for Retail User
    let retailFinalPrice = updatedPlan.selling_price;
    console.log("Retail User sees:", retailFinalPrice);
    
    // Simulate /api/vtu/data-plans/MTN for Basic Reseller User
    let basicFinalPrice = updatedPlan.basic_selling_price || updatedPlan.selling_price;
    console.log("Basic Reseller sees:", basicFinalPrice);
    
    process.exit(0);
}
run();
