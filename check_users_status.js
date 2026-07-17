import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from './models/User.js';

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}).sort({ createdAt: -1 }).limit(10);
    console.log("Last 10 Users Status:");
    users.forEach(u => {
        console.log(`- ${u.email}: Verified: ${u.isEmailVerified}, Complete: ${u.isSignupComplete}`);
    });
    process.exit();
}
check();
