import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import axios from 'axios';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { settleTransaction } from '../controllers/flutterwaveController.js';

// Resolve .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGO_URI = process.env.MONGO_URI;
const TEST_EMAIL = 'test_settlement_reseller@example.com';
const DUMMY_GATEWAY_ID = `FLW-MOCK-ID-${Date.now()}`;
const DUMMY_REF = `TX-MOCK-REF-${Date.now()}`;

async function runTest() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    // 1. Setup Test User
    let user = await User.findOne({ email: TEST_EMAIL });
    if (!user) {
        user = await User.create({
            name: "Test Reseller",
            email: TEST_EMAIL,
            password: "password123",
            balance1: 1000,
            role: "reseller_admin"
        });
        console.log(`Created test user: ${TEST_EMAIL}`);
    } else {
        user.balance1 = 1000;
        await user.save();
        console.log(`Reset test user balance to 1000`);
    }

    // 2. Monkey-patch Axios Get to mock Flutterwave Verification API
    const originalGet = axios.get;
    axios.get = async (url, config) => {
        if (url.includes('api.flutterwave.com/v3/transactions')) {
            console.log(`[Mock Axios] Intercepted Flutterwave verification request: ${url}`);
            return {
                data: {
                    status: "success",
                    message: "Tx verified",
                    data: {
                        id: DUMMY_GATEWAY_ID,
                        tx_ref: DUMMY_REF,
                        amount: 5000, // Funding amount: 5000 NGN
                        currency: "NGN",
                        status: "successful",
                        customer: {
                            email: TEST_EMAIL,
                            name: "Test Reseller"
                        }
                    }
                }
            };
        }
        return originalGet(url, config);
    };

    console.log("\n--- TEST CASE 1: Concurrent Settlement Request (Race Condition Mock) ---");
    console.log(`Triggering 3 concurrent settlement calls for gateway_id: ${DUMMY_GATEWAY_ID}, ref: ${DUMMY_REF}`);

    // Clean up any existing transaction for this reference
    await Transaction.deleteMany({ reference: DUMMY_REF });

    // Execute concurrently
    const p1 = settleTransaction(DUMMY_GATEWAY_ID, DUMMY_REF, user._id);
    const p2 = settleTransaction(DUMMY_GATEWAY_ID, DUMMY_REF, user._id);
    const p3 = settleTransaction(DUMMY_GATEWAY_ID, DUMMY_REF, user._id);

    const results = await Promise.allSettled([p1, p2, p3]);

    console.log("\nExecution Results:");
    results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
            console.log(`Call ${i + 1} succeeded: alreadyProcessed = ${res.value.alreadyProcessed}`);
        } else {
            console.error(`Call ${i + 1} failed: ${res.reason.message}`);
        }
    });

    // Verify database state
    const transactions = await Transaction.find({ reference: DUMMY_REF });
    console.log(`\nTransactions found in MongoDB: ${transactions.length}`);
    transactions.forEach(t => {
        console.log(`- Ref: ${t.reference}, Status: ${t.status}, gateway_id: ${t.gateway_id}, Amount: ${t.amount}`);
    });

    const updatedUser = await User.findById(user._id);
    console.log(`\nInitial Balance: 1000`);
    console.log(`Final Balance (MongoDB): ${updatedUser.balance1}`);
    console.log(`Expected Balance: 6000 (Initial 1000 + 5000 single credit)`);

    if (updatedUser.balance1 === 6000 && transactions.length === 1) {
        console.log("\n=========================");
        console.log("✅ CONCURRENCY TEST PASSED");
        console.log("=========================");
    } else {
        console.error("\n=========================");
        console.error("❌ CONCURRENCY TEST FAILED");
        console.error("=========================");
    }

    // Restore Axios
    axios.get = originalGet;
    
    // Cleanup test data
    await Transaction.deleteMany({ reference: DUMMY_REF });
    await User.deleteOne({ email: TEST_EMAIL });
    
    await mongoose.connection.close();
    console.log("\nDatabase connection closed.");
}

runTest().catch(async (err) => {
    console.error("Test Error:", err);
    await mongoose.connection.close();
});
