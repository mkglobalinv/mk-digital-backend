import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DataPlan from '../models/DataPlan.js';
// Need to grab the model for PricingRule. Wait, let's just do it directly.
const PricingRuleSchema = new mongoose.Schema({
    network: String,
    category: String,
    retailPercentage: Number,
    basicPercentage: Number,
    vipPercentage: Number,
    isActive: Boolean
});
const PricingRule = mongoose.models.PricingRule || mongoose.model('PricingRule', PricingRuleSchema);

dotenv.config();

const applyPricingRuleToPlans = async (rule) => {
    if (!rule.isActive) return 0;
    try {
        const plans = await DataPlan.find({ network: rule.network.toUpperCase(), category: rule.category });
        let updatedCount = 0;
        for (const plan of plans) {
            const apiPrice = plan.api_price || 0;
            const retailMarkup = apiPrice * (rule.retailPercentage / 100);
            const retailPrice = apiPrice + retailMarkup;
            
            plan.selling_price = retailPrice;
            
            // Basic Reseller
            plan.reseller_price = retailPrice; 
            const basicExtraProfit = retailMarkup * (rule.basicPercentage / 100);
            plan.basic_selling_price = retailPrice + basicExtraProfit;
            
            // VIP / Premium Reseller
            plan.vip_price = retailPrice; 
            const vipExtraProfit = retailMarkup * (rule.vipPercentage / 100);
            plan.vip_selling_price = retailPrice + vipExtraProfit;
            
            plan.premium_price = plan.vip_price; 
            plan.premium_selling_price = plan.vip_selling_price;
            
            await plan.save(); 
            updatedCount++;
        }
        return updatedCount;
    } catch (err) {
        console.error(`[Pricing Engine V3] Error applying rule for ${rule.network} - ${rule.category}:`, err);
        return 0;
    }
};

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const rules = await PricingRule.find({ isActive: true });
        console.log(`Found ${rules.length} active rules to apply.`);
        let totalUpdated = 0;
        for (const rule of rules) {
            const count = await applyPricingRuleToPlans(rule);
            totalUpdated += count;
            console.log(`Applied rule ${rule.network} ${rule.category}: updated ${count} plans.`);
        }
        console.log(`Finished updating ${totalUpdated} plans!`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
