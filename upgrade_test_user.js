import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from './models/User.js';

async function upgrade() {
    await mongoose.connect(process.env.MONGO_URI);
    const email = 'kundeenwasann@gmail.com';
    const user = await User.findOne({ email });
    if (user) {
        user.role = 'reseller_admin';
        user.features.apk_generation = true;
        await user.save();
        console.log("User upgraded to Reseller Admin with APK feature!");
    } else {
        console.log("User not found!");
    }
    process.exit();
}
upgrade();
