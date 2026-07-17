import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('Connected to DB');

        const recentUsers = await User.find().sort({ createdAt: -1 }).limit(10);
        
        console.log(`--- LATEST 10 REGISTERED USERS ---`);
        for (const u of recentUsers) {
            console.log(`\nID: ${u._id}`);
            console.log(`Name: ${u.name}`);
            console.log(`Email: ${u.email}`);
            console.log(`Phone: ${u.phone}`);
            console.log(`Date: ${u.createdAt}`);
            console.log(`referredBy: ${u.referredBy}`);
            console.log(`referralCodeUsed: ${u.referralCodeUsed}`);
            console.log(`metadata.referralCode: ${u.metadata?.referralCode}`);
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
