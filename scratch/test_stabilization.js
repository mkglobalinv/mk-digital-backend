import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import ProviderStatus from '../models/ProviderStatus.js';
import DataPlan from '../models/DataPlan.js';
import Transaction from '../models/Transaction.js';
import ReconciliationReport from '../models/ReconciliationReport.js';
import Session from '../models/Session.js';

import reconciliationService from '../services/reconciliationService.js';
import { smartBuyAirtime } from '../services/switcher.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";
const API_URL = "http://localhost:8800";
const JWT_SECRET = process.env.JWT_SECRET || 'mk_sub_data_secret_2024_premium';

// Intercept Axios to mock provider API requests
const originalGet = axios.get;
axios.get = async function(url, options) {
    if (url.includes('nellobytesystems.com') || url.includes('client.peyflex.com.ng')) {
        console.log(`[Mock Axios] Intercepted HTTP GET to provider API: ${url}`);
        return {
            status: 200,
            data: {
                status: "SUCCESS",
                orderid: "mock_order_id_12345",
                remark: "Mock Transaction Successful"
            }
        };
    }
    return originalGet.apply(this, arguments);
};

async function run() {
    try {
        console.log("Connecting to database at:", MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB successfully!");

        // Set up test user
        const testEmail = "stabilization-test@example.com";
        const testPin = "1234";
        const hashedPin = await bcrypt.hash(testPin, 10);
        const testPass = "TestPassword@123";
        const hashedPassword = await bcrypt.hash(testPass, 10);

        let user = await User.findOne({ email: testEmail });
        if (!user) {
            console.log("Creating test user...");
            user = await User.create({
                email: testEmail,
                password: hashedPassword,
                transactionPin: hashedPin,
                name: "Stabilization Tester",
                role: "user",
                isEmailVerified: true,
                isSignupComplete: true,
                balance1: 500,
                totalBalance: 500,
                apiKey: 'test_key_' + Math.random().toString(36).substring(2),
                apiSecret: 'test_secret_' + Math.random().toString(36).substring(2),
                testApiKey: 'test_sandbox_key_' + Math.random().toString(36).substring(2),
                testApiSecret: 'test_sandbox_secret_' + Math.random().toString(36).substring(2),
                failedPinAttempts: 0
            });
            console.log("Test user created.");
        } else {
            console.log("Updating existing test user...");
            user.transactionPin = hashedPin;
            user.balance1 = 500;
            user.totalBalance = 500;
            user.failedPinAttempts = 0;
            user.pinLockoutUntil = undefined;
            if (!user.testApiKey) {
                user.testApiKey = 'test_sandbox_key_' + Math.random().toString(36).substring(2);
                user.testApiSecret = 'test_sandbox_secret_' + Math.random().toString(36).substring(2);
            }
            await user.save();
            console.log("Test user updated.");
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, securityVerified: true }, 
            JWT_SECRET, 
            { expiresIn: '1h' }
        );

        const testApiKey = user.testApiKey;
        const testApiSecret = user.testApiSecret;

        // Clean up any old sessions and transactions for this user
        await Session.deleteMany({ userId: user._id });
        await Session.create({
            userId: user._id,
            token: token,
            isValid: true,
            deviceInfo: "Test Runner"
        });
        console.log("Session created for test user token.");

        await Transaction.deleteMany({ userId: user._id });
        console.log("Old test transactions cleaned up.");

        // ==========================================
        // TEST CASE 1: 3-Strike PIN Lockout Blocking
        // ==========================================
        console.log("\n--- TEST CASE 1: 3-Strike PIN Lockout ---");
        
        // Reset user state
        user.failedPinAttempts = 0;
        user.pinLockoutUntil = undefined;
        await user.save();

        const buyAirtimeUrl = `${API_URL}/buy-airtime`;

        // Strike 1
        console.log("Attempting Strike 1: Wrong PIN");
        try {
            await axios.post(buyAirtimeUrl, {
                amount: 100,
                phone: "08012345678",
                network: "MTN",
                transactionPin: "9999" // Wrong PIN
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            throw new Error("Expected request to fail with wrong PIN but it succeeded");
        } catch (err) {
            console.log("Strike 1 Response Status:", err.response?.status);
            console.log("Strike 1 Response Message:", err.response?.data?.message);
            if (err.response?.status !== 400 || !err.response?.data?.message?.includes("2 attempts remaining")) {
                throw new Error(`Unexpected Strike 1 response: ${JSON.stringify(err.response?.data)}`);
            }
            console.log("✅ Strike 1 correctly returned 400 and lockout attempts remaining.");
        }

        // Strike 2
        console.log("Attempting Strike 2: Wrong PIN");
        try {
            await axios.post(buyAirtimeUrl, {
                amount: 100,
                phone: "08012345678",
                network: "MTN",
                transactionPin: "9999"
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            throw new Error("Expected request to fail with wrong PIN but it succeeded");
        } catch (err) {
            console.log("Strike 2 Response Status:", err.response?.status);
            console.log("Strike 2 Response Message:", err.response?.data?.message);
            if (err.response?.status !== 400 || !err.response?.data?.message?.includes("1 attempts remaining")) {
                throw new Error(`Unexpected Strike 2 response: ${JSON.stringify(err.response?.data)}`);
            }
            console.log("✅ Strike 2 correctly returned 400 and lockout attempts remaining.");
        }

        // Strike 3: Lockout Trigger
        console.log("Attempting Strike 3: Wrong PIN");
        try {
            await axios.post(buyAirtimeUrl, {
                amount: 100,
                phone: "08012345678",
                network: "MTN",
                transactionPin: "9999"
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            throw new Error("Expected request to fail with wrong PIN but it succeeded");
        } catch (err) {
            console.log("Strike 3 Response Status:", err.response?.status);
            console.log("Strike 3 Response Message:", err.response?.data?.message);
            if (err.response?.status !== 403 || !err.response?.data?.message?.includes("Max attempts reached")) {
                throw new Error(`Unexpected Strike 3 response: ${JSON.stringify(err.response?.data)}`);
            }
            console.log("✅ Strike 3 correctly returned 403 and locked out the user.");
        }

        // Strike 4: Verify blocked user cannot proceed even with correct PIN
        console.log("Attempting Strike 4: Correct PIN on Locked User");
        try {
            await axios.post(buyAirtimeUrl, {
                amount: 100,
                phone: "08012345678",
                network: "MTN",
                transactionPin: testPin // Correct PIN
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            throw new Error("Expected request to be blocked due to lockout but it succeeded");
        } catch (err) {
            console.log("Strike 4 Response Status:", err.response?.status);
            console.log("Strike 4 Response Message:", err.response?.data?.message);
            if (err.response?.status !== 403 || !err.response?.data?.message?.includes("locked")) {
                throw new Error(`Unexpected Strike 4 response: ${JSON.stringify(err.response?.data)}`);
            }
            console.log("✅ Strike 4 blocked correctly with 403.");
        }

        // Reset lockout for other tests
        user.failedPinAttempts = 0;
        user.pinLockoutUntil = undefined;
        await user.save();
        console.log("Lockout reset successfully.");

        // ==========================================
        // TEST CASE 2: Idempotency Verification
        // ==========================================
        console.log("\n--- TEST CASE 2: Transaction Idempotency Protection ---");
        
        // Ensure test data plan exists
        let plan = await DataPlan.findOne({ api_plan_id: "test_plan_123" });
        if (!plan) {
            plan = await DataPlan.create({
                api_plan_id: "test_plan_123",
                network: "MTN",
                plan_name: "Test Data Plan",
                selling_price: 100,
                api_price: 80,
                category: "SME",
                provider: "peyflex",
                status: true
            });
        }
        
        // Ensure ProviderStatus is online for 'peyflex'
        await ProviderStatus.findOneAndUpdate(
            { providerName: 'peyflex' },
            { isAvailable: true, apiStatus: 'online', isUnderMaintenance: false, balance: 100000 },
            { upsert: true, new: true }
        );

        // A. Verify Unique Reference Check (Section 1 Rule)
        console.log("Running A: Unique Reference Duplicate Prevention");
        const clientRef = "ref_test_" + Math.random().toString(36).substring(2);
        const dataUrl = `${API_URL}/api/v1/data`;

        console.log("Sending first request with reference:", clientRef);
        const resIdemp1 = await axios.post(dataUrl, {
            network: "MTN",
            plan_id: "test_plan_123",
            phone: "08012345678",
            reference: clientRef
        }, {
            headers: {
                'x-api-key': testApiKey,
                'x-api-secret': testApiSecret
            }
        });
        console.log("First request status:", resIdemp1.status, "| message:", resIdemp1.data.message);

        console.log("Sending second request with identical reference:", clientRef);
        try {
            await axios.post(dataUrl, {
                network: "MTN",
                plan_id: "test_plan_123",
                phone: "08012345678",
                reference: clientRef
            }, {
                headers: {
                    'x-api-key': testApiKey,
                    'x-api-secret': testApiSecret
                }
            });
            throw new Error("Expected second request with identical reference to be rejected, but it succeeded!");
        } catch (err) {
            console.log("Second request status:", err.response?.status);
            console.log("Second request message:", err.response?.data?.message);
            console.log("Error message:", err.message);
            console.log("Error response data:", err.response?.data);
            if (err.response?.status !== 400 || !(err.response?.data?.message || err.response?.data?.error)?.includes("Duplicate transaction")) {
                throw new Error(`Unexpected duplicate reference check response. Status: ${err.response?.status}, Msg: ${JSON.stringify(err.response?.data) || err.message}`);
            }
            console.log("✅ Duplicate reference prevention working correctly.");
        }

        // B. Verify Concurrent Payload-hash Locking (Double-clicks prevention)
        console.log("\nRunning B: Concurrent Payload-hash Locking");
        const concurrentPayload = {
            network: "MTN",
            plan_id: "test_plan_123",
            phone: "08087654321" // different phone to prevent other standard duplicate logic, no reference
        };

        console.log("Sending 3 concurrent requests...");
        const makeConcurrentReq = () => axios.post(dataUrl, concurrentPayload, {
            headers: {
                'x-api-key': testApiKey,
                'x-api-secret': testApiSecret
            }
        });

        const results = await Promise.allSettled([
            makeConcurrentReq(),
            makeConcurrentReq(),
            makeConcurrentReq()
        ]);

        let successCount = 0;
        let conflictCount = 0;

        results.forEach((r, idx) => {
            if (r.status === 'fulfilled') {
                console.log(`Req ${idx + 1} Succeeded (Status: ${r.value.status})`);
                successCount++;
            } else {
                console.log(`Req ${idx + 1} Failed (Status: ${r.reason.response?.status} | Message: ${r.reason.response?.data?.message})`);
                if (r.reason.response?.status === 409 && r.reason.response?.data?.message?.includes("Duplicate request detected")) {
                    conflictCount++;
                }
            }
        });

        console.log(`Success Count: ${successCount}, Conflict (409) Count: ${conflictCount}`);
        if (conflictCount === 0) {
            throw new Error("No concurrent conflict detected! Expected at least one request to return 409.");
        }
        console.log("✅ Concurrent payload-hash double-click locking verified successfully.");

        // ==========================================
        // TEST CASE 3: Provider Failover System
        // ==========================================
        console.log("\n--- TEST CASE 3: Switcher Failover Skip ---");
        
        // 1. Seed providers state
        console.log("Setting Peyflex (Smart) to offline, ClubKonnect (Value) to online");
        await ProviderStatus.findOneAndUpdate(
            { providerName: 'peyflex' },
            { isAvailable: false, apiStatus: 'disconnected', isUnderMaintenance: true }
        );
        await ProviderStatus.findOneAndUpdate(
            { providerName: 'clubkonnect' },
            { isAvailable: true, apiStatus: 'online', isUnderMaintenance: false, balance: 50000 }
        );

        console.log("Executing smartBuyAirtime with option 'smart' (should prioritize Peyflex, skip it since offline, and execute via ClubKonnect)");
        const purchaseResult = await smartBuyAirtime("MTN", 100, "08012345678", "NG", null, "smart");
        
        console.log("Purchase Result Status:", purchaseResult.status);
        console.log("Provider Used:", purchaseResult.provider_used);

        if (purchaseResult.status !== 'success' || !['clubkonnect', 'value'].includes(purchaseResult.provider_used)) {
            throw new Error(`Expected failover to succeed via clubkonnect/value, but got provider: ${purchaseResult.provider_used}, status: ${purchaseResult.status}`);
        }
        console.log("✅ Switcher failover successfully skipped offline Peyflex and executed via ClubKonnect.");

        // ==========================================
        // TEST CASE 4: Financial Reconciliation Mismatch
        // ==========================================
        console.log("\n--- TEST CASE 4: Reconciliation Mismatch Detection ---");

        // Clean up old reports
        await ReconciliationReport.deleteMany({});

        // Set user's MongoDB balance directly in Mongo
        console.log("Setting user's balance1 in MongoDB directly to 5000 NGN");
        user.balance1 = 5000;
        await user.save();

        console.log("Running reconciliation audit...");
        const report = await reconciliationService.runReconciliation(new Date());

        console.log("Reconciliation Report Status:", report?.status);
        console.log("Total Inconsistencies Found:", report?.inconsistencies?.length);
        if (report?.inconsistencies?.length > 0) {
            console.log("Sample Inconsistency:", report.inconsistencies[0]);
        }

        if (!report || report.status !== 'unbalanced' || report.inconsistencies.length === 0) {
            throw new Error(`Expected reconciliation report status to be 'unbalanced' with inconsistencies, but got status: ${report?.status}, count: ${report?.inconsistencies?.length}`);
        }
        console.log("✅ Reconciliation report generated, correctly marked 'unbalanced', and flagged the balance mismatch.");

        console.log("\n==================================================");
        console.log("🎉 ALL PLATFORM STABILIZATION SYSTEMS SUCCESSFUL!");
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
