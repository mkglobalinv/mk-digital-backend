import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000 }).then(async () => {
    const { default: Transaction } = await import('./models/Transaction.js');
    
    // Find the latest transaction
    const tx = await Transaction.findOne({}).sort({ createdAt: -1 }).lean();
    console.log("Latest Transaction:", JSON.stringify(tx, null, 2));
    
    // Check if there are any transactions stuck in processing
    const processingTx = await Transaction.findOne({ status: 'processing' }).sort({ createdAt: -1 }).lean();
    console.log("Latest Processing Transaction:", JSON.stringify(processingTx, null, 2));

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
