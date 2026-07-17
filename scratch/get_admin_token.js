import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Session from '../models/Session.js';
import User from '../models/User.js';

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = await User.findOne({ email: 'mkcollectn@gmail.com' });
        if (!admin) {
            console.log("Admin not found");
            process.exit(1);
        }
        const session = await Session.findOne({ userId: admin._id, isValid: true }).sort({ updatedAt: -1 });
        if (!session) {
            console.log("No valid session found for admin");
            process.exit(1);
        }
        console.log("TOKEN:" + session.token);
        console.log("USER:" + JSON.stringify(admin));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
