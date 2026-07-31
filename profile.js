import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { performance } from 'perf_hooks';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function profileAdminLogin() {
    console.log("--- Performance Profiling ---");
    let totalStart = performance.now();
    let timings = {};

    // 1. Password Hashing (simulating compare)
    let start = performance.now();
    const hash = await bcrypt.hash("password123", 10);
    const isMatch = await bcrypt.compare("password123", hash);
    timings.passwordHashing = performance.now() - start;

    // 2. Database save simulation (skip actual DB, assume 50ms)
    start = performance.now();
    await new Promise(r => setTimeout(r, 50));
    timings.databaseSave = performance.now() - start;

    // 3. OTP Generation & Hashing
    start = performance.now();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    timings.otpGeneration = performance.now() - start;

    // 4. SMTP Connection
    start = performance.now();
    const emailPort = Number(process.env.EMAIL_PORT) || 465;
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: emailPort,
        secure: emailPort === 465, 
        pool: false,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
        family: 4,
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS,
        },
        tls: { rejectUnauthorized: false }
    });
    
    try {
        await transporter.verify();
    } catch(e) {
        console.log("Verify error:", e.message);
    }
    timings.smtpConnection = performance.now() - start;

    // 5. SMTP Send
    start = performance.now();
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: "Profile Test",
            html: "Test"
        });
    } catch(e) {
        console.log("Send error:", e.message);
    }
    timings.smtpSend = performance.now() - start;

    // 6. JWT Generation
    start = performance.now();
    jwt.sign(
        { id: "12345", step: 1, ip: "127.0.0.1", device: "test" }, 
        process.env.JWT_SECRET || 'test', 
        { expiresIn: '15m' }
    );
    timings.jwtGeneration = performance.now() - start;

    timings.totalRequestTime = performance.now() - totalStart;

    console.table(Object.keys(timings).map(k => ({ Operation: k, Time_ms: timings[k].toFixed(2) })));
}

profileAdminLogin();
