import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from '../models/User.js';

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtuapp').then(async () => {
  const users = await User.find({ 'branding.siteName': { $in: ['refferdata', 'recdata', 'findata', 'Datasub'] } });
  
  for (const u of users) {
    console.log(`Email: ${u.email}`);
    console.log(`Website Name: ${u.branding?.siteName}`);
    console.log(`Role: ${u.role}`);
    console.log(`Subdomain: ${u.subdomain}`);
    console.log(`Admin Subdomain: ${u.admin_subdomain}`);
    console.log(`------------------------`);
  }
  process.exit();
});
