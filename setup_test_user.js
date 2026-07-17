import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from './models/User.js';
import bcrypt from 'bcrypt';

async function setup() {
    await mongoose.connect(process.env.MONGO_URI);
    const email = 'kundeenwasann@gmail.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await User.deleteOne({ email });
    const user = new User({
        name: 'Test User',
        email,
        password: hashedPassword,
        isEmailVerified: true,
        isSignupComplete: true
    });
    await user.save();
    console.log("User created and verified!");
    process.exit();
}
setup();
