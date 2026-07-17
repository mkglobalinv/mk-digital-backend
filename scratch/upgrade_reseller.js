import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from '../models/User.js';

async function upgradeUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'ghcplaystore1@gmail.com';
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log(`User ${email} NOT found.`);
        } else {
            console.log(`Upgrading User ${email} to reseller_admin...`);
            user.role = 'reseller_admin';
            await user.save();
            console.log(`Upgrade SUCCESSFUL.`);
            console.log(`- New Role: ${user.role}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
upgradeUser();
