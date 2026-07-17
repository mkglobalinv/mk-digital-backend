import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async m => {
    const DataPlan = m.model('DataPlan', new m.Schema({}, {strict: false}), 'dataplans');
    const plans = await DataPlan.find({ provider: 'clubkonnect', network: { $in: ['GLO', 'AIRTEL', '9MOBILE'] } });
    plans.forEach(p => console.log(p.network + ' | ' + p.api_plan_id + ' | ' + p.plan_name));
    process.exit(0);
});
