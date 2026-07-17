import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from './models/User.js';

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({});
    console.log("Users found:", users.length);
    users.forEach(u => console.log(`- ${u.name || 'No Name'} (${u.email})`));
    process.exit();
}
check();
