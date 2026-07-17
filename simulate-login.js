import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function simulateLogin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'unuktar1@gmail.com';
        const user = await User.findOne({ email, role: 'admin' });
        
        if (!user) {
            console.log("Admin user not found");
            return process.exit(0);
        }
        
        console.log("Found user, checking loginActivity:", Array.isArray(user.loginActivity));
        
        user.failedLoginAttempts = 0;
        user.lockoutUntil = undefined;
        try {
            user.loginActivity.unshift({ ip: '127.0.0.1', device: 'Test', status: 'step1_success', timestamp: new Date() });
            if (user.loginActivity.length > 20) user.loginActivity.pop();
        } catch(e) {
            console.error("Error unshifting loginActivity:", e);
        }
        
        try {
            await user.save();
            console.log("User saved successfully!");
        } catch (e) {
            console.error("Error saving user:", e);
        }
        
    } catch(e) {
        console.error("DB Error:", e);
    }
    process.exit(0);
}
simulateLogin();
