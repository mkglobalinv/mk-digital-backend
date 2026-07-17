import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mk-digital');
    const db = mongoose.connection.db;
    const txId = new mongoose.Types.ObjectId('6a1d5eb0bed877f49dbbef47');
    
    // Get transaction
    const tx = await db.collection('transactions').findOne({ _id: txId });
    console.log("=== TRANSACTION ===");
    console.log(JSON.stringify(tx, null, 2));

    // Get any related logs
    if (tx) {
        const logs = await db.collection('api_logs').find({ 
            $or: [
                { transactionId: txId },
                { reference: tx.reference }
            ]
        }).toArray();
        console.log("=== API LOGS ===");
        console.log(JSON.stringify(logs, null, 2));
        
        // Also check clubkonnect provider logs
        const ckLogs = await db.collection('provider_logs').find({ reference: tx.reference }).toArray();
        console.log("=== PROVIDER LOGS ===");
        console.log(JSON.stringify(ckLogs, null, 2));
    }

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
main();
