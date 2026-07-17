import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const API_URL = 'http://localhost:5005/api/v1'; 
const dbUrl = process.env.MONGO_URI;

const NEW_USER_EMAIL = "arewa973@gmail.com";

async function run() {
    await mongoose.connect(dbUrl);
    const db = mongoose.connection.db;

    // 1. Clean up
    await db.collection("users").deleteOne({ email: NEW_USER_EMAIL });
    await db.collection("otps").deleteMany({ email: NEW_USER_EMAIL });
    await db.collection("transactions").deleteMany({ description: { $regex: /arewa973/i } });
    console.log("Cleanup done.");

    // Wait, the referral code of kaftanluxer@gmail.com
    const kaftan = await db.collection("users").findOne({ email: "kaftanluxer@gmail.com" });
    console.log("Referrer:", kaftan?.email, "ReferralCode:", kaftan?.referralCode);
    const initialEarnings = kaftan?.earningsBalance || 0;

    // Make the Register Request
    console.log("\n--- TRACE: REGISTER ---");
    try {
        const res = await axios.post('http://localhost:5005/auth/register', {
            name: "Arewa Referral Test",
            email: NEW_USER_EMAIL,
            phone: "08098765432",
            password: "Password123!",
            referralCode: kaftan?.referralCode || "C119A8A0"
        });
        console.log("Register response:", res.status, res.data);
    } catch(err) {
        console.error("Register error:", err.response?.data || err.message);
    }

    // Get the OTP
    const user = await db.collection("users").findOne({ email: NEW_USER_EMAIL });
    console.log("\nUser created:", user ? { _id: user._id, email: user.email, role: user.role, referredBy: user.referredBy } : null);

    const traceLog = fs.readFileSync('c:/Users/userpc/.gemini/antigravity-ide/brain/f1be1f7a-852c-483b-8e3a-8e33135bd19f/.system_generated/tasks/task-462.log', 'utf8');
    const otpMatch = traceLog.match(new RegExp(`Preparing to send OTP email to ${NEW_USER_EMAIL} \\(OTP: (\\d+)\\)`, 'g'));
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
            email: NEW_USER_EMAIL,
            otp: generatedOtp
        });
        console.log("Verify response:", verifyRes.status, verifyRes.data.success);
    } catch(err) {
        console.error("Verify error:", err.response?.data || err.message);
    }

    // Make the Login Request
    console.log("\n--- TRACE: LOGIN ---");
    try {
        const loginRes = await axios.post('http://localhost:5005/auth/login', {
            email: NEW_USER_EMAIL,
            password: "Password123!"
        });
        console.log("Login response:", loginRes.status, !!loginRes.data.token);
    } catch(err) {
        console.error("Login error:", err.response?.data || err.message);
    }

    // Fund Account and Check Referral
    console.log("\n--- TRACE: FUNDING & REFERRAL CHECK ---");
    try {
        const { creditBalance } = await import('../services/walletService.js');
        await creditBalance(user._id, 1000, `TEST-FUND-${Date.now()}`, "Test Funding");
        console.log("Funded account via walletService.");
        
        const activatedUser = await db.collection("users").findOne({ email: NEW_USER_EMAIL });
        console.log("Is user activated (activationRewardGiven)?", activatedUser.activationRewardGiven);

        const updatedKaftan = await db.collection("users").findOne({ email: "kaftanluxer@gmail.com" });
        console.log("Referrer initial earnings:", initialEarnings);
        console.log("Referrer new earnings:", updatedKaftan.earningsBalance);
        console.log("Earnings increased by:", updatedKaftan.earningsBalance - initialEarnings);

        const rewardTx = await db.collection("transactions").findOne({ userId: kaftan._id, type: "credit", amount: { $gt: 0 }, description: { $regex: /Activation Reward/ } }, { sort: { createdAt: -1 } });
        console.log("Reward Transaction Created:", rewardTx ? "YES - " + rewardTx.amount : "NO");

    } catch (e) {
        console.error("Funding error:", e);
    }

    process.exit(0);
}

run();
