import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';

async function getResellerAdmins() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const users = await User.find({ role: 'reseller_admin' }).lean();
    
    console.log("=== RESELLER ADMIN ACCOUNTS ===");
    if (users.length === 0) {
      console.log("No reseller_admin accounts found.");
    } else {
      for (const u of users) {
        const created = u.createdAt ? u.createdAt : (u._id ? u._id.getTimestamp() : "Unknown");
        console.log(`Email: ${u.email}`);
        console.log(`Username: ${u.name}`);
        console.log(`Created Date: ${created}`);
        console.log("-----------------------");
      }
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

getResellerAdmins();
