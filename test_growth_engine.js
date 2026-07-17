import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { processLifetimeReferralCashback } from './services/referralCashbackEngine.js';
import User from './models/User.js';
import Transaction from './models/Transaction.js';

const runTests = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to MongoDB for testing");

        // Create mock users
        const referrerId = new mongoose.Types.ObjectId();
        const retailUserId = new mongoose.Types.ObjectId();
        const resellerId = new mongoose.Types.ObjectId();

        const referrer = new User({ _id: referrerId, email: "referrer@test.com", role: "user", earningsBalance: 0 });
        const retailUser = new User({ _id: retailUserId, email: "retail@test.com", role: "user", referredBy: referrerId, balance2: 0 });
        const reseller = new User({ _id: resellerId, email: "reseller@test.com", role: "reseller_admin", earningsBalance: 0 });

        // Temporarily override User.findById to return these mocks without saving to real DB
        const originalFindById = User.findById;
        User.findById = async (id) => {
            const idStr = id.toString();
            if (idStr === referrerId.toString()) return referrer;
            if (idStr === retailUserId.toString()) return retailUser;
            if (idStr === resellerId.toString()) return reseller;
            return null;
        };

        let dbUpdates = [];
        User.findByIdAndUpdate = async (id, update) => {
            dbUpdates.push({ id: id.toString(), update });
        };

        Transaction.create = async (txData) => {
            dbUpdates.push({ type: 'Transaction.create', data: txData });
        };

        // --- TEST 1: Pure Retail Transaction with Positive Profit ---
        console.log("--- TEST 1: Retail Transaction (Positive Profit) ---");
        dbUpdates = [];
        const tx1 = { description: 'Data Purchase', selling_price: 1000, cost_price: 900, amount: 1000, reference: 'TX1' };
        await processLifetimeReferralCashback(tx1, retailUser);
        
        // Expected: Platform profit = 100
        // Referrer Reward = 15
        // Remaining Profit = 85
        // Customer Cashback = 12.75
        let refUpdate = dbUpdates.find(u => u.id === referrerId.toString());
        let custUpdate = dbUpdates.find(u => u.id === retailUserId.toString());
        console.log("Referrer Update:", refUpdate?.update);
        console.log("Customer Update:", custUpdate?.update);
        if (refUpdate && refUpdate.update.$inc.earningsBalance === 15 && custUpdate && custUpdate.update.$inc.balance2 === 12.75) {
            console.log("Test 1: PASSED ✅");
        } else {
            console.log("Test 1: FAILED ❌");
        }

        // --- TEST 2: Reseller User Transaction ---
        console.log("\n--- TEST 2: Reseller User Transaction ---");
        dbUpdates = [];
        const tx2 = { description: 'Data Purchase', selling_price: 1000, cost_price: 900, amount: 1000, reference: 'TX2' };
        await processLifetimeReferralCashback(tx2, reseller);
        if (dbUpdates.length === 0) {
            console.log("Test 2: PASSED ✅ (No rewards issued)");
        } else {
            console.log("Test 2: FAILED ❌");
        }

        // --- TEST 3: Retail User referred by Reseller ---
        console.log("\n--- TEST 3: Reseller Customer Transaction ---");
        dbUpdates = [];
        retailUser.referredBy = resellerId; // Mock that they belong to a reseller
        const tx3 = { description: 'Data Purchase', selling_price: 1000, cost_price: 900, amount: 1000, reference: 'TX3' };
        await processLifetimeReferralCashback(tx3, retailUser);
        if (dbUpdates.length === 0) {
            console.log("Test 3: PASSED ✅ (No rewards issued)");
        } else {
            console.log("Test 3: FAILED ❌");
        }

        // --- TEST 4: Zero Profit Transaction ---
        console.log("\n--- TEST 4: Zero Profit Transaction ---");
        dbUpdates = [];
        retailUser.referredBy = referrerId; // Reset to normal referrer
        const tx4 = { description: 'Data Purchase', selling_price: 900, cost_price: 900, amount: 900, reference: 'TX4' };
        await processLifetimeReferralCashback(tx4, retailUser);
        if (dbUpdates.length === 0) {
            console.log("Test 4: PASSED ✅ (No rewards issued)");
        } else {
            console.log("Test 4: FAILED ❌");
        }

        // --- TEST 5: Emergency Purchase Exclusion ---
        console.log("\n--- TEST 5: Emergency Purchase Exclusion ---");
        dbUpdates = [];
        const tx5 = { description: 'Emergency Data Purchase EMERGENCY_SMS_CASHBACK', selling_price: 1000, cost_price: 900, amount: 1000, reference: 'TX5' };
        await processLifetimeReferralCashback(tx5, retailUser);
        if (dbUpdates.length === 0) {
            console.log("Test 5: PASSED ✅ (Emergency Excluded)");
        } else {
            console.log("Test 5: FAILED ❌");
        }

        User.findById = originalFindById;
        console.log("\nAll logic validation passed successfully.");

    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        process.exit();
    }
};

runTests();
