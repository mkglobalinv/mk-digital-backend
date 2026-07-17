import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from '../models/User.js';

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({ biometricEnabled: true });
    console.log(`Found ${users.length} users with biometric enabled.`);
    for (const user of users) {
        console.log(`User: ${user.email}, Credentials: ${user.webauthnCredentials?.length || 0}`);
    }
    process.exit(0);
}
check();
