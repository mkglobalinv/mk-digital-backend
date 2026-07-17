import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || process.env.VITE_MONGO_URI).then(async () => {
    const db = mongoose.connection;
    const DataPlan = db.collection('dataplans');
    const result = await DataPlan.aggregate([
        { $group: { _id: { network: '$network', category: '$category', provider: '$provider' }, count: { $sum: 1 } } }
    ]).toArray();
    console.log(JSON.stringify(result, null, 2));
    process.exit();
}).catch(console.error);
