import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProviderStatus from '../models/ProviderStatus.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");
  const providers = await ProviderStatus.find();
  console.log("Provider Statuses in DB:");
  console.log(JSON.stringify(providers, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);
