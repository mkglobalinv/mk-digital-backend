import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const DataPlan = mongoose.model('DataPlan', new mongoose.Schema({}, { strict: false, collection: 'dataplans' }));
    
    const missingIds = ['100.01', '200.01', '350.01', '500.01', '1000.01', '500.02', '2500.01', '1500.02', '2000.01', '5000.01'];
    
    const plans = await DataPlan.find({ api_plan_id: { $in: missingIds } }).lean();
    console.log(JSON.stringify(plans, null, 2));
    process.exit(0);
});
