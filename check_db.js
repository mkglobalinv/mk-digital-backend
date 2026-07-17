import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const DataPlan = mongoose.model('DataPlan', new mongoose.Schema({}, {strict: false}), 'dataplans');
  const agg = await DataPlan.aggregate([{ $group: { _id: '$provider', count: { $sum: 1 } } }]);
  console.log('dataplans collection:', agg);
  
  const DataPlan2 = mongoose.model('DataPlan2', new mongoose.Schema({}, {strict: false}), 'data_plans');
  const agg2 = await DataPlan2.aggregate([{ $group: { _id: '$provider', count: { $sum: 1 } } }]);
  console.log('data_plans collection:', agg2);

  process.exit(0);
}

check();
