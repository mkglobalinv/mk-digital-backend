import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from '../models/User.js';

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtuapp').then(async () => {
  const users = await User.find({ email: { $in: ['reffar34@gmail.com', 'unuktar1@gmail.com', 'mkcollectn@gmail.com', 'reciprocaltech@gmail.com', 'unuktar@gmail.com'] } });
  
  for (const u of users) {
    console.log(u.email, u._id, 'referralCode:', u.referralCode);
  }
  process.exit();
});
