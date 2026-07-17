import { indexRepository } from './services/codeIndexerService.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vtuapp');
  const result = await indexRepository(path.resolve('./'));
  console.log("Index Result:", result);
  await mongoose.disconnect();
}
run();
