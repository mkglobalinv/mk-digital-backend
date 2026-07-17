import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const TransactionSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    type: String,
    status: String,
    amount: Number,
    phone: String,
    network: String,
    reference: String,
    provider_used: String,
    api_response: Object,
    createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

async function checkTransactions() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp");
        console.log("Connected to DB.");
        const txs = await Transaction.find({ provider_used: /premium/i }).sort({ createdAt: -1 }).limit(10);
        console.log("Last 10 Premium Transactions:");
        txs.forEach(t => {
            console.log(`- ${t.createdAt}: ${t.status} | Plan: ${t.api_response?.plan || 'N/A'} | Msg: ${t.api_response?.message || 'N/A'}`);
            if (t.status === 'failed') {
                console.log(`  Full Error: ${JSON.stringify(t.api_response)}`);
            }
        });
        process.exit(0);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}

checkTransactions();
