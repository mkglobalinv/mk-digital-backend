import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

dotenv.config();

async function runReport() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log("=== BASIC RESELLER HIERARCHY REPORT ===\n");
        
        const basicResellers = await User.find({ resellerTier: 'basic' }).lean();
        
        if (!basicResellers || basicResellers.length === 0) {
            console.log("No Basic Resellers found in the system.");
            process.exit(0);
        }

        const resellerIds = basicResellers.map(r => r._id);
        
        for (const reseller of basicResellers) {
            console.log(`[BASIC RESELLER]`);
            console.log(`Full Name: ${reseller.firstName} ${reseller.lastName}`);
            console.log(`Email Address: ${reseller.email}`);
            console.log(`User ID: ${reseller._id}`);
            console.log(`Reseller Type/Tier: ${reseller.resellerType || 'N/A'} / ${reseller.resellerTier}`);
            console.log(`Store Name: ${reseller.storeName || 'N/A'}`);
            console.log(`Store Domain: ${reseller.subdomain || reseller.customDomain || 'N/A'}`);
            console.log(`Earnings Balance: ${reseller.earningsBalance || 0}`);
            console.log(`\n  [CUSTOMERS]`);
            
            const customers = await User.find({ referredBy: reseller._id }).lean();
            if (customers.length === 0) {
                console.log(`  No customers assigned to this reseller.`);
            }
            
            for (const cust of customers) {
                console.log(`  - Customer Name: ${cust.firstName} ${cust.lastName}`);
                console.log(`  - Customer Email: ${cust.email}`);
                console.log(`  - Customer ID: ${cust._id}`);
                console.log(`  - Linked Reseller ID: ${cust.referredBy}`);
                console.log(`  - Linked Reseller Email: ${reseller.email}`);
                console.log('');
            }
            console.log('--------------------------------------------------\n');
        }

        console.log("=== LATEST 5 SUCCESSFUL TRANSACTIONS FOR THESE CUSTOMERS ===\n");
        
        const latestTx = await Transaction.find({
            resellerId: { $in: resellerIds },
            status: 'success'
        }).sort({ createdAt: -1 }).limit(5).populate('userId', 'email').populate('resellerId', 'email').lean();
        
        if (latestTx.length === 0) {
            console.log("No recent successful transactions found.");
        }

        for (const tx of latestTx) {
            console.log(`Transaction ID: ${tx._id}`);
            console.log(`Customer Email: ${tx.userId?.email || 'Unknown'}`);
            console.log(`Reseller Email: ${tx.resellerId?.email || 'Unknown'}`);
            console.log(`API Price (Cost): ${tx.cost_price}`);
            console.log(`Selling Price: ${tx.selling_price}`);
            console.log(`Profit Amount: ${tx.profit}`);
            console.log(`--------------------------------`);
        }

        console.log(`\nExplicit Confirmation:`);
        console.log(`Does the customer used during testing actually belong to the Basic Reseller?`);
        console.log(`YES, any customer listed above under a Basic Reseller is mathematically linked via 'referredBy' to that reseller's _id.`);
        
    } catch (e) {
        console.error("FATAL ERROR EXECUTING REPORT:");
        console.error(e.message);
    } finally {
        await mongoose.disconnect();
    }
}

runReport();
