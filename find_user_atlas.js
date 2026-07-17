import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from './models/User.js';

async function find() {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'kundeenwasanni@gmail.com' });
    if (user) {
        console.log("User found in Atlas:", user.email);
        console.log("Verified:", user.isEmailVerified);
        console.log("Signup Complete:", user.isSignupComplete);
        console.log("Balances:", user.balance1, user.balance2);
    } else {
        console.log("User NOT found in Atlas");
    }
    process.exit();
}
find();
