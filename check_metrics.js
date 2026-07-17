import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Transaction from './models/Transaction.js';
import ProviderStatus from './models/ProviderStatus.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vtuapp');
  
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const success = await Transaction.countDocuments({ status: 'Successful', createdAt: { $gte: oneDayAgo } });
  const failed = await Transaction.countDocuments({ status: 'Failed', createdAt: { $gte: oneDayAgo } });
  
  const providers = await ProviderStatus.find({});
  
  console.log({ success, failed, providers });
  await mongoose.disconnect();
}
run();
