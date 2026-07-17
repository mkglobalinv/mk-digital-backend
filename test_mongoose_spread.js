import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
    const { default: Transaction } = await import('./models/Transaction.js');
    
    const tx = await Transaction.create({
        amount: 100,
        type: 'debit',
        status: 'pending',
        api_response: { planCode: '100.01', provider: 'clubkonnect' }
    });
    
    console.log("Original api_response:", tx.api_response);
    
    const resultData = { status: 'ORDER_RECEIVED' };
    tx.api_response = { ...(tx.api_response || {}), provider_response: resultData };
    
    console.log("After update before save:", tx.api_response);
    
    await tx.save();
    
    const fetched = await Transaction.findById(tx._id).lean();
    console.log("Fetched api_response:", fetched.api_response);
    
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
