import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const promoteUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'unuktar1@gmail.com';
        const user = await User.findOne({ email });
        if (user) {
            console.log(`Promoting ${user.email} from ${user.role} to admin...`);
            user.role = 'admin';
            await user.save();
            console.log("Promotion successful.");
        } else {
            console.log("User not found.");
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

promoteUser();
