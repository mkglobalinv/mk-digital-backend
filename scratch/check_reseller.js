import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from '../models/User.js';

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'ghcplaystore1@gmail.com';
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log(`User ${email} NOT found.`);
        } else {
            console.log(`User Found:`);
            console.log(`- ID: ${user._id}`);
            console.log(`- Name: ${user.name}`);
            console.log(`- Role: ${user.role}`);
            console.log(`- Verified: ${user.isEmailVerified}`);
            console.log(`- Signup Complete: ${user.isSignupComplete}`);
            console.log(`- Suspended: ${user.isSuspended}`);
            console.log(`- White Label Status: ${user.whiteLabelStatus}`);
            console.log(`- Subdomain: ${user.subdomain}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
checkUser();
