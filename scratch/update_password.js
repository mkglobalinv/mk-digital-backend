import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

dotenv.config();

const updatePassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'unuktar1@gmail.com';
        const newPassword = '@Zainab1?!mksubdata';

        const user = await User.findOne({ email });
        if (user) {
            console.log(`Updating password for ${user.email}...`);
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            await user.save();
            console.log("Password updated successfully.");
        } else {
            console.log("User not found.");
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

updatePassword();
