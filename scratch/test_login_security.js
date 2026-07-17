import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";
const API_URL = "http://localhost:8800";

async function run() {
    try {
        console.log("Connecting to database at:", MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB successfully!");

        // 1. Create or Find test user
        const testEmail = "security-test@example.com";
        const testPass = "TestPassword@123";
        let user = await User.findOne({ email: testEmail });
        
        if (!user) {
            console.log("Creating test user...");
            const hashedPassword = await bcrypt.hash(testPass, 10);
            user = await User.create({
                email: testEmail,
                password: hashedPassword,
                name: "Security Tester",
                role: "user",
                isEmailVerified: true,
                isSignupComplete: true,
                totalBalance: 1000,
                loginActivity: []
            });
            console.log("Test user created successfully!");
        } else {
            console.log("Found existing test user.");
            // Ensure email verified and active
            user.isEmailVerified = true;
            user.isSignupComplete = true;
            user.isSuspended = false;
            await user.save();
        }

        // Clean up previous test notifications
        await Notification.deleteMany({ userId: user._id });
        console.log("Cleaned up old test notifications.");

        // 2. SUSPICIOUS LOGIN CASE
        // Set user's lastLoginIp to a static address
        user.lastLoginIp = "1.1.1.1";
        await user.save();
        console.log("\n--- TEST CASE 1: Suspicious Login Detection (IP Mismatch) ---");
        console.log("User's lastLoginIp in DB set to: 1.1.1.1");
        console.log("Simulating login request with X-Forwarded-For IP: 2.2.2.2");

        const loginRes1 = await axios.post(`${API_URL}/auth/login`, {
            email: testEmail,
            password: testPass
        }, {
            headers: {
                'X-Forwarded-For': '2.2.2.2',
                'User-Agent': 'SecurityTestBot'
            }
        });

        console.log("HTTP Response Status:", loginRes1.status);
        console.log("HTTP Response loginAlertStatus:", loginRes1.data.loginAlertStatus);
        
        // Assertions for Case 1
        if (loginRes1.data.loginAlertStatus !== 'suspicious') {
            throw new Error(`Expected loginAlertStatus to be 'suspicious' but got: ${loginRes1.data.loginAlertStatus}`);
        }
        console.log("✅ API correctly returned status 'suspicious'");

        // Retrieve latest notification in DB
        const latestNotif1 = await Notification.findOne({ userId: user._id }).sort({ createdAt: -1 });
        if (!latestNotif1) {
            throw new Error("No notification created in database!");
        }
        console.log("Database Notification Title:", latestNotif1.title);
        console.log("Database Notification Type:", latestNotif1.type);
        console.log("Database Notification Message:", latestNotif1.message);
        
        if (latestNotif1.type !== 'warning' || !latestNotif1.title.includes('Suspicious')) {
            throw new Error("❌ Database notification properties incorrect for suspicious login!");
        }
        console.log("✅ Database notification successfully verified as type 'warning'");


        // 3. SUCCESS/NORMAL LOGIN CASE
        // The previous login saved the user's lastLoginIp as '2.2.2.2'
        console.log("\n--- TEST CASE 2: Normal Login Detection (IP Matches) ---");
        console.log("User's lastLoginIp in DB is now: 2.2.2.2");
        console.log("Simulating login request with X-Forwarded-For IP: 2.2.2.2");

        const loginRes2 = await axios.post(`${API_URL}/auth/login`, {
            email: testEmail,
            password: testPass
        }, {
            headers: {
                'X-Forwarded-For': '2.2.2.2',
                'User-Agent': 'SecurityTestBot'
            }
        });

        console.log("HTTP Response Status:", loginRes2.status);
        console.log("HTTP Response loginAlertStatus:", loginRes2.data.loginAlertStatus);
        
        // Assertions for Case 2
        if (loginRes2.data.loginAlertStatus !== 'success') {
            throw new Error(`Expected loginAlertStatus to be 'success' but got: ${loginRes2.data.loginAlertStatus}`);
        }
        console.log("✅ API correctly returned status 'success'");

        // Retrieve latest notification in DB
        const latestNotif2 = await Notification.findOne({ userId: user._id }).sort({ createdAt: -1 });
        console.log("Database Notification Title:", latestNotif2.title);
        console.log("Database Notification Type:", latestNotif2.type);
        console.log("Database Notification Message:", latestNotif2.message);
        
        if (latestNotif2.type !== 'success' || !latestNotif2.title.includes('New Login')) {
            throw new Error("❌ Database notification properties incorrect for normal login!");
        }
        console.log("✅ Database notification successfully verified as type 'success'");

        console.log("\n==================================================");
        console.log("🎉 ALL LOGIN SECURITY AUDITS VERIFIED SUCCESSFUL!");
        console.log("==================================================");

    } catch (err) {
        console.error("\n❌ TEST FAILED:", err.response?.data || err.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log("Database connection closed.");
    }
}

run();
