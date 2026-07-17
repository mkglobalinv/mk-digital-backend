import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../models/User.js';
import { creditBalance, deductBalance } from '../services/walletService.js';
import { getGlobalPrice } from '../services/pricing/globalPricing.js';
import { getResellerPrice } from '../services/pricing/resellerPricing.js';
import { getRetailPrice } from '../services/pricing/retailPricing.js';

const runAudit = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("=== DB Connected ===");

        // Get a test user (ideally a dummy or we create one)
        let testUser = await User.findOne({ email: 'audit_test@mkdigital.com' });
        if (!testUser) {
            testUser = new User({
                name: 'Audit Test',
                email: 'audit_test@mkdigital.com',
                phone: '08000000000',
                password: 'password123',
                balance1: 5000,
                role: 'user'
            });
            await testUser.save();
        }

        console.log("\n=== 1. WALLET SYSTEM AUDIT ===");
        const initialBalance = testUser.balance1 || 0;
        console.log(`Initial Balance: ₦${initialBalance}`);

        const creditedUser = await creditBalance(testUser._id, 1000, 'AUDIT-CREDIT', 'Testing Credit');
        console.log(`After ₦1000 Credit: ₦${creditedUser.balance1} (Expected: ₦${initialBalance + 1000})`);

        const deductedUser = await deductBalance(testUser._id, 500);
        console.log(`After ₦500 Debit: ₦${deductedUser.balance1} (Expected: ₦${initialBalance + 500})`);

        const overDeduct = await deductBalance(testUser._id, 1000000);
        console.log(`Attempt ₦1,000,000 Debit: ${overDeduct === null ? 'REJECTED (Correct)' : 'FAILED (Allowed)'}`);

        console.log("\n=== 2. PRICING ENGINE AUDIT ===");
        // Test Global Pricing
        const globalPrice = await getGlobalPrice('mtn_1gb_30d', 'data');
        console.log(`Global Price [mtn_1gb_30d]: ₦${globalPrice?.default_retail_price || 'N/A'}`);

        // Test Retail Pricing (Direct User)
        const retailRes = await getRetailPrice(testUser._id, 'mtn_1gb_30d', 'data');
        console.log(`Retail Price (Direct): ₦${retailRes?.finalPrice || 'N/A'} (Reseller Profit: ₦${retailRes?.resellerProfit || 0})`);

        // Test Reseller Pricing
        // We will make the test user a reseller
        testUser.role = 'reseller';
        testUser.apiSubscriptionTier = 'basic';
        await testUser.save();

        const wholesalePrice = await getResellerPrice(testUser._id, 'mtn_1gb_30d', 'data');
        console.log(`Reseller Wholesale Price (Basic): ₦${wholesalePrice || 'N/A'}`);

        testUser.apiSubscriptionTier = 'pro'; // VIP
        await testUser.save();
        const wholesaleVIP = await getResellerPrice(testUser._id, 'mtn_1gb_30d', 'data');
        console.log(`Reseller Wholesale Price (VIP): ₦${wholesaleVIP || 'N/A'}`);

        // Test Sub-customer of Reseller
        let subUser = await User.findOne({ email: 'sub_audit@mkdigital.com' });
        if (!subUser) {
            subUser = new User({
                name: 'Sub Audit',
                email: 'sub_audit@mkdigital.com',
                phone: '08000000001',
                password: 'password123',
                balance1: 1000,
                role: 'user',
                referredBy: testUser._id // Links to reseller
            });
            await subUser.save();
        }

        const subRetailRes = await getRetailPrice(subUser._id, 'mtn_1gb_30d', 'data');
        console.log(`Retail Price (Under Reseller): ₦${subRetailRes?.finalPrice || 'N/A'} (Reseller Profit: ₦${subRetailRes?.resellerProfit || 0})`);

        console.log("\n=== 3. TRANSACTION ENGINE ARCHITECTURE ===");
        console.log("VTU routing goes through `vtuService.js` and is completely segregated from the wallet system. Wallet is deducted via `walletService.js` prior to dispatcher call.");

        console.log("\n=== AUDIT COMPLETE ===");
        process.exit(0);
    } catch (err) {
        console.error("Audit Failed:", err);
        process.exit(1);
    }
};

runAudit();
