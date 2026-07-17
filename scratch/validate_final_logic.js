import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

dotenv.config();

async function runLiveTestValidation() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log("=== FINAL APPROVED LOGIC: LIVE TRANSACTION VALIDATOR ===\n");
        
        // Find basic resellers
        const basicResellers = await User.find({ resellerTier: 'basic' }).lean();
        const basicResellerIds = basicResellers.map(r => r._id);

        // Fetch the absolute latest successful transaction for a basic reseller
        const latestTx = await Transaction.findOne({
            resellerId: { $in: basicResellerIds },
            status: 'success'
        }).sort({ createdAt: -1 }).populate('userId', 'email').populate('resellerId', 'email').lean();
        
        if (!latestTx) {
            console.log("No recent successful transactions found for any Basic Reseller.");
            process.exit(0);
        }

        console.log(`[LATEST TRANSACTION IDENTIFIED]`);
        console.log(`Transaction ID: ${latestTx._id}`);
        console.log(`Customer: ${latestTx.userId?.email || 'Unknown'}`);
        console.log(`Reseller: ${latestTx.resellerId?.email || 'Unknown'}`);
        console.log(`Date: ${latestTx.createdAt}`);

        console.log(`\n[BUSINESS LOGIC VALIDATION]`);
        
        const providerCost = latestTx.cost_price;
        const customerPays = latestTx.selling_price;
        const totalProfitPool = customerPays - providerCost;
        
        const resellerProfitCredited = latestTx.profit;
        const expectedCommission = totalProfitPool * 0.50;

        console.log(`Provider Cost: ₦${providerCost}`);
        console.log(`Admin Price (Customer Pays): ₦${customerPays}`);
        console.log(`Total System Profit: ₦${totalProfitPool}`);
        console.log(`Basic Reseller Earned: ₦${resellerProfitCredited}`);
        
        const adminRetained = totalProfitPool - resellerProfitCredited;
        console.log(`Admin Retained: ₦${adminRetained}`);

        console.log(`\n[AUDIT RESULTS]`);
        if (customerPays > 0) {
            if (resellerProfitCredited === expectedCommission) {
                console.log(`✅ SUCCESS: Basic Reseller earned exactly 50% of the Admin markup!`);
            } else {
                console.log(`❌ FAILURE: Reseller earned ₦${resellerProfitCredited}, but expected ₦${expectedCommission}`);
            }
        } else {
            console.log(`⚠️ Transaction was for ₦0. Please run a real monetary test purchase.`);
        }

    } catch (e) {
        console.error("FATAL ERROR EXECUTING VALIDATION:");
        console.error(e.message);
    } finally {
        await mongoose.disconnect();
    }
}

runLiveTestValidation();
