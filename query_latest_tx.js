import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000 }).then(async () => {
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false, collection: 'transactions' }));
    
    // Get the latest data transaction
    const tx = await Transaction.findOne({ description: /Data/ }).sort({ createdAt: -1 }).lean();
    console.log(JSON.stringify(tx, null, 2));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
