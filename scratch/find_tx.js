import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const TransactionSchema = new mongoose.Schema({}, { strict: false });
const Transaction = mongoose.model('Transaction', TransactionSchema);

async function findLatestJara() {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp");
    const tx = await Transaction.findOne({ provider_used: /premium/i }).sort({ createdAt: -1 });
    console.log(JSON.stringify(tx, null, 2));
    process.exit(0);
}
findLatestJara();
