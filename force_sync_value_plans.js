import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { smartFetchDataPlans } from './services/switcher.js';

dotenv.config();

const syncValuePlans = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const DataPlan = mongoose.models.DataPlan || mongoose.model('DataPlan', new mongoose.Schema({}, { strict: false }), 'dataplans');
        
        const networks = ['MTN', 'GLO', 'AIRTEL', '9MOBILE'];
        
        for (const network of networks) {
            console.log(`\nFetching Value plans for ${network}...`);
            const plans = await smartFetchDataPlans(network, 'value');
            
            if (plans && plans.length > 0) {
                console.log(`Found ${plans.length} plans for ${network}.`);
                for (const p of plans) {
                    const planId = String(p.plan_code || p.plan_id);
                    const provider = p.provider;
                    
                    const sizeMatch = (p.name || '').match(/(\d+(?:\.\d+)?\s*(?:MB|GB|TB))/i);
                    const planSize = sizeMatch ? sizeMatch[1].toUpperCase() : '';
                    const apiPrice = Number(p.price) || 0;
                    
                    const existingPlan = await DataPlan.findOne({ api_plan_id: planId, provider, network: network.toUpperCase() });
                    
                    if (existingPlan) {
                        const oldName = existingPlan.plan_name;
                        existingPlan.api_price = apiPrice;
                        existingPlan.plan_name = p.name;
                        existingPlan.plan_size = planSize;
                        await existingPlan.save();
                        console.log(`[UPDATED] ${network} | ID: ${planId} | Old: ${oldName} => New: ${p.name} | Size: ${planSize}`);
                    } else {
                        console.log(`[SKIPPED - Not in DB] ${network} | ID: ${planId} | Name: ${p.name}`);
                    }
                }
            } else {
                console.log(`No plans found for ${network}.`);
            }
        }
        
        console.log("\nSync complete!");
        process.exit(0);
    } catch (error) {
        console.error("Sync error:", error);
        process.exit(1);
    }
};

syncValuePlans();
