import mongoose from 'mongoose';

import User from '../models/User.js';
import OTP from '../models/OTP.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runTests() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const ts = Date.now();
    const email = `test_auth_${ts}@test.com`;
    const password = "Password123!";
    const referralCode = "C119A8A0";

    console.log(`\n--- 1. Testing Registration ---`);
    const regRes = await fetch('http://127.0.0.1:8800/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Test ${ts}`, email, password, referralCode })
    });
    const regData = await regRes.json();
    console.log("Registration Response:", regData);
    
    const user = await User.findOne({ email });
    console.log(`User created. ID: ${user._id}, referredBy: ${user.referredBy}`);
    
    console.log(`\n--- 2. Testing OTP Verification ---`);
    const otpData = await OTP.findOne({ userId: user._id });
    // Note: OTP is hashed, so we can't extract it directly. But wait, we can just update the user manually for the test, or wait, we can't test OTP verification via API if we don't know the plain OTP?
    // Let's just bypass it for the test by manually verifying email so we can test Login.
    user.isEmailVerified = true;
    await user.save();
    console.log(`Manually verified email for test purposes.`);

    console.log(`\n--- 3. Testing Login ---`);
    const loginRes = await fetch('http://127.0.0.1:8800/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    console.log("Login Response Status:", loginRes.status);
    console.log("Login Response Data:", loginData);

    console.log(`\n--- 4. Testing Duplicate Account Protection ---`);
    const dupRes = await fetch('http://127.0.0.1:8800/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Duplicate Test`, email, password })
    });
    const dupData = await dupRes.json();
    console.log("Duplicate Registration Response:", dupRes.status, dupData);

    process.exit(0);
}

runTests();
