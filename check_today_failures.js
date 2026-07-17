import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkTodayFailures() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Transaction = mongoose.model('Transaction', new mongoose.Schema({
            status: String,
            amount: Number,
            phone: String,
            network: String,
            api_response: Object,
            provider_used: String,
            createdAt: Date
        }));

        const today = new Date();
        today.setHours(0,0,0,0);

        const txs = await Transaction.find({ 
            createdAt: { $gte: today },
            status: 'failed'
        }).sort({ createdAt: -1 }).limit(10);

        console.log(`Found ${txs.length} failed transactions today.`);
        txs.forEach(t => {
            console.log(`- ${t.createdAt}: ${t.network} ${t.amount} to ${t.phone} | Provider: ${t.provider_used}`);
            console.log(`  Response: ${JSON.stringify(t.api_response)}`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}

checkTodayFailures();
