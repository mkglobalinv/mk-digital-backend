import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from '../models/User.js';

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtuapp').then(async () => {
  const referredUsers = await User.find({ referredBy: { $ne: null } }).limit(20);
  for (const u of referredUsers) {
    if (!u.referredBy) continue;
    const referrer = await User.findById(u.referredBy);
    if (referrer) {
      console.log('Referred User:', u.email, 'Referred By:', referrer.email, 'Referrer ID:', referrer._id);
    }
  }
  process.exit();
});
