import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const users = await User.find({}, 'email name referralCode referredBy role');
        console.log("\n--- All Users ---");
        users.forEach(u => {
            console.log(`User: ${u.email} | ID: ${u._id} | RefCode: ${u.referralCode || 'None'} | ReferredBy: ${u.referredBy || 'None'} | Role: ${u.role}`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
