import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vtuapp';
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    const count = await db.collection('transactions').countDocuments();
    const latestTransactions = await db.collection('transactions').find().sort({ createdAt: -1 }).limit(1).toArray();
    const latestTx = latestTransactions[0] || {};
    
    const result = {
      totalTransactionCount: count,
      latestTransaction_id: latestTx._id,
      latestTransactionStatus: latestTx.status,
      latestTransactionCreatedAt: latestTx.createdAt,
      queryExecuted: {
        countQuery: "db.collection('transactions').countDocuments()",
        latestDocumentQuery: "db.collection('transactions').find().sort({ createdAt: -1 }).limit(1)"
      }
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
