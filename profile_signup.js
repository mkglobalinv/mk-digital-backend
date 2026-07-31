import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { performance } from 'perf_hooks';
import User from './models/User.js';
import OTP from './models/OTP.js';
import { sendOTPEmail } from './services/emailService.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const profile = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const email = `profile${Date.now()}@test.com`;
        const password = "TestPassword123!";
        let startTime, endTime;

        console.log("--- PROFILING REGISTRATION FLOW ---");
        const totalStart = performance.now();

        // 1. Password hashing
        startTime = performance.now();
        const hashedPassword = await bcrypt.hash(password, 10);
        endTime = performance.now();
        console.log(`Password hashing: ${(endTime - startTime).toFixed(2)} ms`);

        // 2. Database save
        startTime = performance.now();
        const newUser = await User.create({
            name: "Profiler",
            email: email,
            phone: "08000000000",
            password: hashedPassword,
            role: 'user',
            isEmailVerified: false,
            isSignupComplete: false
        });
        endTime = performance.now();
        console.log(`Database save (User.create): ${(endTime - startTime).toFixed(2)} ms`);

        // 3. OTP generation
        startTime = performance.now();
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await OTP.create({
            userId: newUser._id,
            hashedOtp,
            expiresAt
        });
        endTime = performance.now();
        console.log(`OTP generation & DB storage: ${(endTime - startTime).toFixed(2)} ms`);

        // 4. SMTP connection & send
        startTime = performance.now();
        // sendOTPEmail wraps sendEmail which creates a connection and sends it.
        await sendOTPEmail(newUser.email, otp);
        endTime = performance.now();
        console.log(`SMTP connection & sendOTPEmail: ${(endTime - startTime).toFixed(2)} ms`);

        // 5. JWT Generation (simulate standard flow)
        startTime = performance.now();
        const token = jwt.sign(
            { id: newUser._id, role: newUser.role, email: newUser.email },
            process.env.JWT_SECRET || 'test_secret',
            { expiresIn: '30d' }
        );
        endTime = performance.now();
        console.log(`JWT generation: ${(endTime - startTime).toFixed(2)} ms`);

        const totalEnd = performance.now();
        console.log(`Total request time: ${(totalEnd - totalStart).toFixed(2)} ms`);

        await mongoose.connection.close();
    } catch (err) {
        console.error("Profiling error:", err);
        await mongoose.connection.close();
    }
};

profile();
