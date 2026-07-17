import mongoose from 'mongoose';
import User from './models/User.js';
import OTP from './models/OTP.js';
import dotenv from 'dotenv';
dotenv.config();

async function simulateOTP() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'unuktar1@gmail.com';
        const user = await User.findOne({ email, role: 'admin' });
        
        if (!user) {
            console.log("Admin user not found");
            return process.exit(0);
        }
        
        const hashedOtp = "test-hash";
        
        try {
            await OTP.deleteMany({ userId: user._id });
            await OTP.create({ 
                userId: user._id, 
                hashedOtp, 
                expiresAt: new Date(Date.now() + 10 * 60000) 
            });
            console.log("OTP created successfully!");
        } catch(e) {
            console.error("Error creating OTP:", e);
        }
        
    } catch(e) {
        console.error("DB Error:", e);
    }
    process.exit(0);
}
simulateOTP();
