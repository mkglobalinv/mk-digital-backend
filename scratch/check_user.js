import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'mksubdata@gmail.com' });
        console.log('User:', JSON.stringify(user, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
};

checkUser();
