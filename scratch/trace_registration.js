import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const API_URL = 'http://localhost:5005/api/v1'; // Wait, what is the base path?

// Let's just use mongoose directly to delete the user, and then make axios requests.
const dbUrl = process.env.MONGO_URI;

async function run() {
    await mongoose.connect(dbUrl);
    const db = mongoose.connection.db;

    // 1. Clean up
    await db.collection("users").deleteOne({ email: "arewa971@gmail.com" });
    await db.collection("otps").deleteMany({ email: "arewa971@gmail.com" });
    console.log("Cleanup done.");

    // Wait, the referral code of kaftanluxer@gmail.com
    const kaftan = await db.collection("users").findOne({ email: "kaftanluxer@gmail.com" });
    console.log("Referrer:", kaftan?.email, "ReferralCode:", kaftan?.referralCode);

    // Make the Register Request
    console.log("\n--- TRACE: REGISTER ---");
    try {
        // Wait, the API routes are mapped in server.js: app.use("/auth", authRoutes);
        // So it's http://localhost:5005/auth/register
        const res = await axios.post('http://localhost:5005/auth/register', {
            name: "Arewa Test",
            email: "arewa971@gmail.com", // testing exact lowercase
            phone: "08012345678",
            password: "Password123!",
            referralCode: kaftan?.referralCode || "C119A8A0"
        });
        console.log("Register response:", res.status, res.data);
    } catch(err) {
        console.error("Register error:", err.response?.data || err.message);
    }

    // Get the OTP
    const user = await db.collection("users").findOne({ email: "arewa971@gmail.com" });
    console.log("\nUser created:", user ? { _id: user._id, email: user.email, role: user.role, referredBy: user.referredBy } : null);

    const traceLog = fs.readFileSync('c:/Users/userpc/.gemini/antigravity-ide/brain/f1be1f7a-852c-483b-8e3a-8e33135bd19f/.system_generated/tasks/task-462.log', 'utf8');
    const otpMatch = traceLog.match(/Preparing to send OTP email to arewa971@gmail\.com \(OTP: (\d+)\)/g);
    let generatedOtp = null;
    if (otpMatch) {
        const lastMatch = otpMatch[otpMatch.length - 1];
        generatedOtp = lastMatch.match(/OTP: (\d+)/)[1];
    }
    console.log("Generated OTP:", generatedOtp);

    // Make the Verify OTP Request
    console.log("\n--- TRACE: VERIFY EMAIL OTP ---");
    try {
        const verifyRes = await axios.post('http://localhost:5005/auth/verify-email', {
            email: "arewa971@gmail.com",
            otp: generatedOtp
        });
        console.log("Verify response:", verifyRes.status, verifyRes.data);
    } catch(err) {
        console.error("Verify error:", err.response?.data || err.message);
    }

    // Make the Login Request
    console.log("\n--- TRACE: LOGIN ---");
    try {
        const loginRes = await axios.post('http://localhost:5005/auth/login', {
            email: "arewa971@gmail.com",
            password: "Password123!"
        });
        console.log("Login response:", loginRes.status, loginRes.data);
    } catch(err) {
        console.error("Login error:", err.response?.data || err.message);
    }

    process.exit(0);
}

run();
