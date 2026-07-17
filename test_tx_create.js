import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000 }).then(async () => {
    const { default: Transaction } = await import('./models/Transaction.js');
    
    console.log("Creating transaction...");
    const transaction = await Transaction.create({
        amount: 100,
        type: 'debit',
        status: 'pending',
        description: `Data: Test`,
        isApiRequest: true,
        api_response: { planCode: '123', networkId: null, operatorId: null, provider: 'clubkonnect', payload: {} }
    });
    
    console.log("Returned from create:", transaction.api_response);
    
    console.log("Fetching from DB...");
    const fetched = await Transaction.findById(transaction._id).lean();
    console.log("Fetched api_response:", fetched.api_response);
    
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
