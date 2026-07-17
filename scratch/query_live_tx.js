import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from '../models/Transaction.js';
import DataPlan from '../models/DataPlan.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find the most recent basic reseller customer data purchase
    const recentTxs = await Transaction.find({ type: 'debit', status: 'success', description: { $regex: /Data:/ } })
        .sort({ createdAt: -1 })
        .limit(10);
        
    for (let tx of recentTxs) {
        if (tx.resellerId) {
            console.log("\nFound Reseller Transaction:", tx.reference);
            console.log("Amount paid by customer (tx.amount/selling_price):", tx.selling_price || tx.amount);
            console.log("Cost to reseller (tx.cost_price):", tx.cost_price);
            console.log("Profit recorded on tx:", tx.profit);
            
            // Try to find the exact DataPlan
            const planCodeMatch = tx.description.match(/Data: (.*)/);
            if (planCodeMatch) {
                const planCode = planCodeMatch[1];
                const plan = await DataPlan.findOne({ api_plan_id: planCode, network: tx.network?.toUpperCase() });
                if (plan) {
                    console.log("\n--- Plan Details ---");
                    console.log("plan.api_price (providerCost):", plan.api_price);
                    console.log("plan.selling_price (adminSellingPrice):", plan.selling_price);
                    console.log("plan.reseller_price:", plan.reseller_price);
                    console.log("plan.basic_selling_price (customerSellingPrice):", plan.basic_selling_price);
                } else {
                    console.log("Plan not found for code:", planCode);
                }
            }
            break;
        }
    }

    process.exit();
}

run().catch(console.error);
