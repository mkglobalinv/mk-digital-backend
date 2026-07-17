import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from '../models/User.js';

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtuapp').then(async () => {
  const count = await User.countDocuments({ referredBy: { $exists: true, $ne: null } });
  console.log('Count:', count);
  process.exit();
});
