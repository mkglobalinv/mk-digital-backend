import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Transaction from '../models/Transaction.js';

import bcrypt from 'bcrypt';

dotenv.config();

async function main() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const hashedPin = await bcrypt.hash('1234', 10);

        // 1. Create test user
        const uniqueSuffix = Date.now();
        const testUser = await User.create({
            name: `Validation User ${uniqueSuffix}`,
            email: `valuser_${uniqueSuffix}@test.com`,
            password: "TestPassword123!",
            balance1: 0,       // 0 Main Balance
            balance2: 1000,    // 1000 Cashback/Secondary Balance
            role: "user",
            transactionPin: hashedPin,
            isSignupComplete: true
        });
        console.log(`Created test user: ${testUser._id}`);

        // 2. Create Session
        const secret = process.env.JWT_SECRET || 'mk_sub_data_secret_2024_premium';
        const token = jwt.sign({ id: testUser._id.toString(), session_type: 'retail' }, secret, { expiresIn: '1h' });
        const session = await Session.create({
            userId: testUser._id,
            token: token,
            deviceInfo: "Validation Script",
            isValid: true
        });
        console.log(`Created Session: ${session._id}`);

        const headers = { Authorization: `Bearer ${token}` };

        // 3. Make HTTP request to purchase data plan
        const payload = {
            phone: "08012345678",
            network: "AIRTEL",
            plan_id: "AIRTEL_499.91",
            provider: "clubkonnect",
            option: "value",
            category: "Awoof",
            transactionPin: "1234",
            amount: 500
        };

        console.log("\nSending purchase request to HTTP server...");
        let errorCaught = false;
        try {
            const res = await axios.post('http://[::1]:8800/api/vtu/data/purchase', payload, { headers });
            console.log("Unexpected SUCCESS Response:", res.status, res.data);
        } catch (err) {
            errorCaught = true;
            const status = err.response ? err.response.status : 'No Status';
            const data = err.response ? err.response.data : err.message;
            console.log("\n==============================================");
            console.log(`RESPONSE CAPTURED (Expected Error):`);
            console.log(`  HTTP Status Code : ${status}`);
            console.log(`  Response Data    :`, JSON.stringify(data));
            console.log("==============================================");
        }

        // 4. Verify no transaction document exists
        const txCount = await Transaction.countDocuments({ userId: testUser._id });
        console.log(`\nTransaction documents count in DB for test user: ${txCount}`);
        
        // 5. Verify user processing lock was released
        const updatedUser = await User.findById(testUser._id);
        console.log(`User isProcessingTx lock status: ${updatedUser.isProcessingTx}`);

        // Cleanup
        await Session.deleteOne({ _id: session._id });
        await User.deleteOne({ _id: testUser._id });
        console.log("\nCleanup done. Verification test complete.");
        process.exit(0);

    } catch (e) {
        console.error("Critical Error during verification:", e);
        process.exit(1);
    }
}

main();
