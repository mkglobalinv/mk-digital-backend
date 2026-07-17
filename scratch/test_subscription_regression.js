import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '../models/User.js';
dotenv.config();

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Find a valid unactivated reseller
        const user = await User.findOne({ isResellerActivated: { $ne: true } });
        if (!user) {
            console.log("No unactivated user found.");
            process.exit(0);
        }
        
        user.balance1 = 50000;
        await user.save();
        
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        console.log(`Testing HTTP POST /api/reseller/pay-activation for user ${user._id}`);
        
        try {
            const res = await axios.post('http://localhost:8800/api/reseller/pay-activation', {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log("HTTP Response Data:", JSON.stringify(res.data, null, 2));
        } catch(err) {
            console.error("HTTP Error Status:", err.response?.status);
            console.error("HTTP Error Data:", err.response?.data);
            console.error("HTTP Error Message:", err.message);
        }
        
    } catch(e) {
        console.error("Fatal Error:", e);
    } finally {
        process.exit(0);
    }
})();
