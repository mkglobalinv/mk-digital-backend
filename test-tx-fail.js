import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from './models/Transaction.js';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        const failedTx = await Transaction.find({ 
            description: /Data/, 
            status: 'failed'
        }).sort({ createdAt: -1 }).limit(5);

        console.log(`Found ${failedTx.length} recent failed data transactions`);

        for (const tx of failedTx) {
            console.log(`\n--- Transaction ID: ${tx._id} ---`);
            console.log(`Reference: ${tx.reference}`);
            console.log(`User: ${tx.userId}`);
            console.log(`Network: ${tx.network}`);
            console.log(`Phone: ${tx.phone}`);
            console.log(`Cost: ${tx.cost_price}, Selling: ${tx.selling_price}`);
            console.log(`Description: ${tx.description}`);
            console.log(`Provider Used: ${tx.provider_used}`);
            console.log(`API Response (raw): ${JSON.stringify(tx.api_response)}`);
            console.log(`Date: ${tx.createdAt}`);
        }
    } catch (e) {
        console.error("Error", e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
