import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OTP from './models/OTP.js';
import User from './models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const otps = await OTP.find().sort({ createdAt: -1 }).limit(5);
        console.log("Recent OTPs:", otps);
        
        const users = await User.find({ role: { $in: ['admin', 'reseller'] } }).limit(5);
        console.log("Users:", users.map(u => ({ email: u.email, role: u.role, name: u.name, id: u._id })));
        
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
