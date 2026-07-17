import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const updateAdminEmail = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const newEmail = 'unuktar1@gmail.com';

        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            console.log(`Found admin: ${admin.email}. Updating to ${newEmail}`);
            admin.email = newEmail;
            await admin.save();
            console.log("Admin email updated successfully.");
        } else {
            console.log("No admin user found in database.");
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("Update failed:", err);
        process.exit(1);
    }
};

updateAdminEmail();
