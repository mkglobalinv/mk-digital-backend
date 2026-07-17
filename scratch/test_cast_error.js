import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mksubdata");
    try {
        const referrer = await User.findOne({ 
            $or: [{ referralCode: "C119A8A0" }, { _id: "C119A8A0" }] 
        });
        console.log("Found:", referrer ? referrer.email : "none");
    } catch (e) {
        console.error("Error caught:", e.message);
    }
    process.exit(0);
}

test();
