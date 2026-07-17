import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import Transaction from '../models/Transaction.js';
import { confirmWalletAction } from '../controllers/adminController.js';
import { deductBalance } from '../services/walletService.js';

dotenv.config();

// Mock req and res objects for Express controllers
const createMockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

async function verifyOTPLogic() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB...");

        // 1. Create Mock Users
        const adminUser = await User.findOneAndUpdate(
            { email: "testadminotp@example.com" },
            { name: "Admin Test", role: "admin", balance1: 0 },
            { upsert: true, new: true }
        );

        const targetUser = await User.findOneAndUpdate(
            { email: "testuserotp@example.com" },
            { name: "Target Test", role: "user", balance1: 1000 },
            { upsert: true, new: true }
        );

        const secret = process.env.JWT_SECRET || 'mk_sub_data_secret_2024_premium';
        
        // Scenario Helper
        async function runScenario(scenarioName, otpValue, expectedCode, intentPayload) {
            console.log(`\n--- Scenario: ${scenarioName} ---`);
            
            // Clean up any old OTPs
            await OTP.deleteMany({ userId: adminUser._id });

            // Generate an OTP in DB
            const correctOTP = "123456";
            const hashedOtp = await bcrypt.hash(correctOTP, 10);
            await OTP.create({
                userId: adminUser._id,
                otp: "mocked", // Not used for comparison since we compare hash
                hashedOtp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            });

            // Generate Intent Token
            const intentToken = jwt.sign(intentPayload, secret, { expiresIn: '10m' });

            const req = {
                body: { intentToken, otp: otpValue },
                ip: '127.0.0.1'
            };
            const res = createMockRes();

            const balanceBefore = targetUser.balance1;
            
            // Run the actual controller function
            await confirmWalletAction(req, res);
            
            console.log(`Status Code: ${res.statusCode} | Expected: ${expectedCode}`);
            console.log(`Response: ${JSON.stringify(res.data)}`);

            if (res.statusCode !== expectedCode) {
                console.error(`❌ FAILED. Expected ${expectedCode}, got ${res.statusCode}`);
            } else {
                console.log(`✅ PASSED.`);
            }

            // Fetch target user to check balance
            const userAfter = await User.findById(targetUser._id);
            console.log(`Balance before: ${balanceBefore} | Balance after: ${userAfter.balance1}`);
        }

        // Scenario 1: Wrong OTP
        await runScenario("Wrong OTP", "000000", 401, {
            type: 'funding_intent',
            adminId: adminUser._id.toString(),
            userId: targetUser._id.toString(),
            action: 'credit',
            amount: 500,
            reason: 'Test wrong otp'
        });

        // Scenario 2: Correct OTP (Wallet Funded)
        await runScenario("Correct OTP - Credit 500", "123456", 200, {
            type: 'funding_intent',
            adminId: adminUser._id.toString(),
            userId: targetUser._id.toString(),
            action: 'credit',
            amount: 500,
            reason: 'Test correct otp'
        });

        // Scenario 3: Verify OTP cannot be reused
        console.log(`\n--- Scenario: OTP Reuse Check ---`);
        const reqReuse = {
            body: { 
                intentToken: jwt.sign({
                    type: 'funding_intent',
                    adminId: adminUser._id.toString(),
                    userId: targetUser._id.toString(),
                    action: 'credit',
                    amount: 500,
                    reason: 'Reuse test'
                }, secret, { expiresIn: '10m' }), 
                otp: "123456" 
            },
            ip: '127.0.0.1'
        };
        const resReuse = createMockRes();
        await confirmWalletAction(reqReuse, resReuse);
        console.log(`Reuse Status: ${resReuse.statusCode}`);
        if (resReuse.statusCode === 401) {
            console.log(`✅ PASSED. OTP cannot be reused.`);
        } else {
            console.error(`❌ FAILED. OTP was reused!`);
        }

        console.log("\n--- Audit Logs ---");
        const txs = await Transaction.find({ userId: targetUser._id, description: /Test correct otp/ });
        console.log(`Transactions logged for credit: ${txs.length}`);
        if (txs.length === 1) {
            console.log(`✅ PASSED. Exactly one transaction logged.`);
        } else {
            console.error(`❌ FAILED. Expected 1 transaction, got ${txs.length}`);
        }

        console.log("\n--- DONE ---");
        process.exit(0);

    } catch (e) {
        console.error("Test failed:", e);
        process.exit(1);
    }
}

verifyOTPLogic();
