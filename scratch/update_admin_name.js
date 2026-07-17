import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const updateAdminName = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'unuktar1@gmail.com' });
        if (user) {
            console.log(`Current name: "${user.name}"`);
            user.name = 'MK Global Admin';
            await user.save();
            console.log(`Name updated to: "${user.name}"`);
        } else {
            console.log("Admin user not found.");
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

updateAdminName();
