import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User.js';

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        // Find locked admins
        const admins = await User.find({ role: 'admin' });
        let unlockedCount = 0;

        for (const admin of admins) {
            console.log(`\nAdmin Account Found:`);
            console.log(`Email: ${admin.email}`);
            console.log(`Name/Username: ${admin.name || admin.username || 'N/A'}`);
            console.log(`Password: [SECURELY HASHED - CANNOT BE VIEWED]`);
            
            if (admin.failedLoginAttempts > 0 || admin.lockoutUntil) {
                admin.failedLoginAttempts = 0;
                admin.lockoutUntil = undefined;
                await admin.save();
                console.log(`-> Account unlocked successfully.`);
                unlockedCount++;
            } else {
                console.log(`-> Account was not locked.`);
            }
        }
        
        console.log(`\nOperation complete. Unlocked ${unlockedCount} admin account(s).`);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        mongoose.connection.close();
    }
}

run();
