import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
    const DataPlan = mongoose.model('DataPlan', new mongoose.Schema({}, { strict: false, collection: 'dataplans' }));
    
    const missingIds = ['100.01', '200.01', '350.01', '500.01', '1000.01', '500.02', '2500.01', '1500.02', '2000.01', '5000.01'];
    
    const plans = await DataPlan.find({ api_plan_id: { $in: missingIds }, network: 'MTN' }).lean();
    console.log(`Found ${plans.length} MTN plans.`);
    plans.forEach(p => console.log(`- ${p.api_plan_id}: ${p.plan_name}`));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
