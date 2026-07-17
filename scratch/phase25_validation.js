import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import DataPlan from '../models/DataPlan.js';
import PricingSettings from '../models/PricingSettings.js';
import AdminPricingOverride from '../models/AdminPricingOverride.js';
import PriceOverride from '../models/PriceOverride.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const serverFile = fs.readFileSync(path.join(process.cwd(), 'server.js'), 'utf-8');
const match = serverFile.match(/const calculateVtuPrice = async \((.*?)\) => {([\s\S]*?)return { basePrice, sellingPrice, pricingSource, reseller };\n};/);

if (!match) {
    console.error("Could not extract calculateVtuPrice from server.js");
    process.exit(1);
}

const funcBody = match[2] + "return { basePrice, sellingPrice, pricingSource, reseller };";
const calculateVtuPrice = async function(userId, serviceType, network, planId, amount = 0) {
    // This executes the logic directly against the real connected DB models
    return eval(`(async () => { ${funcBody} })()`);
};

async function runValidation() {
    console.log("Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.\n");

    const usersToClean = [];
    const settingsToClean = [];
    const overridesToClean = [];

    try {
        // Find a real data plan to use as reference
        const plan = await DataPlan.findOne({ network: 'MTN', category: 'SME', status: true });
        if (!plan) throw new Error("No active MTN SME plan found in DB.");
        const providerCost = plan.api_price;
        console.log(`[Target] Plan: ${plan.plan_name} | api_plan_id: ${plan.api_plan_id} | Provider Cost: ₦${providerCost}`);

        // Setup mock users
        const retailUser = await User.create({ email: 'val_retail@test.com', role: 'user', name: 'Retail', totalBalance: 10000, password: 'x' });
        const basicReseller = await User.create({ email: 'val_basic_res@test.com', role: 'reseller_admin', resellerType: 'basic', name: 'Basic Reseller', totalBalance: 10000, password: 'x' });
        const basicCust = await User.create({ email: 'val_basic_cust@test.com', role: 'user', referredBy: basicReseller._id, name: 'Basic Cust', totalBalance: 10000, password: 'x' });
        const premiumReseller = await User.create({ email: 'val_prem_res@test.com', role: 'reseller_admin', resellerType: 'premium', name: 'Premium Reseller', totalBalance: 10000, password: 'x' });
        const premiumCust = await User.create({ email: 'val_prem_cust@test.com', role: 'user', referredBy: premiumReseller._id, name: 'Premium Cust', totalBalance: 10000, password: 'x' });
        
        usersToClean.push(retailUser._id, basicReseller._id, basicCust._id, premiumReseller._id, premiumCust._id);

        const runTest = async (testName, userId, expectedPrice) => {
            const result = await calculateVtuPrice(userId, 'data', plan.network, plan.api_plan_id);
            // Verify if wallet deduction (sellingPrice) matches expected
            const status = result.sellingPrice === expectedPrice ? 'PASS' : 'FAIL';
            console.log(`==================================================`);
            console.log(testName);
            console.log(`==================================================`);
            console.log(`User             : ${userId}`);
            console.log(`Provider Cost    : ₦${providerCost}`);
            console.log(`Expected Price   : ₦${expectedPrice}`);
            console.log(`Calculated Price : ₦${result.sellingPrice} (Source: ${result.pricingSource})`);
            console.log(`Status           : ${status}`);
            console.log('');
            return status;
        };

        // TEST 1 - RETAIL (5% Markup)
        const s1 = await PricingSettings.create({ serviceType: 'data', markupPercentage: 5, status: 'active', resellerId: null });
        settingsToClean.push(s1._id);
        const expectedRetail = providerCost + (providerCost * 5 / 100);
        await runTest('TEST 1 - RETAIL', retailUser._id, expectedRetail);

        // TEST 2 - BASIC RESELLER PURCHASE (3% Markup)
        const s2 = await PricingSettings.create({ resellerId: basicReseller._id, serviceType: 'data', markupPercentage: 3, status: 'active' });
        settingsToClean.push(s2._id);
        const expectedBasicBuy = providerCost + (providerCost * 3 / 100);
        await runTest('TEST 2 - BASIC RESELLER PURCHASE PRICE', basicReseller._id, expectedBasicBuy);

        // TEST 3 - BASIC CUSTOMER PRICE (6% Markup)
        const s3 = await PricingSettings.create({ resellerId: basicReseller._id, serviceType: 'data', markupPercentage: 6, status: 'active' });
        settingsToClean.push(s3._id);
        const expectedBasicCust = providerCost + (providerCost * 6 / 100);
        await runTest('TEST 3 - BASIC CUSTOMER PRICE', basicCust._id, expectedBasicCust);

        // TEST 4 - PREMIUM RESELLER PURCHASE (2% Markup)
        const s4 = await PricingSettings.create({ resellerId: premiumReseller._id, serviceType: 'data', markupPercentage: 2, status: 'active' });
        settingsToClean.push(s4._id);
        const expectedPremiumBuy = providerCost + (providerCost * 2 / 100);
        await runTest('TEST 4 - PREMIUM RESELLER PURCHASE', premiumReseller._id, expectedPremiumBuy);

        // TEST 5 - PREMIUM CUSTOMER PRICE (5% Markup)
        const s5 = await PricingSettings.create({ resellerId: premiumReseller._id, serviceType: 'data', markupPercentage: 5, status: 'active' });
        settingsToClean.push(s5._id);
        const expectedPremiumCust = expectedPremiumBuy + (expectedPremiumBuy * 5 / 100);
        await runTest('TEST 5 - PREMIUM CUSTOMER PRICE', premiumCust._id, expectedPremiumCust);

        // TEST 6 - MANUAL OVERRIDE (₦145)
        const o1 = await AdminPricingOverride.create({ resellerId: basicReseller._id, serviceType: 'data', network: plan.network, planId: plan.api_plan_id, assignedSellingPrice: 145, status: 'enabled' });
        overridesToClean.push(o1._id);
        await runTest('TEST 6 - MANUAL OVERRIDE (Basic Customer)', basicCust._id, 145);

        // TEST 7 - LEGACY FALLBACK
        await PricingSettings.deleteMany({});
        await AdminPricingOverride.deleteMany({});
        const resultLegacy = await calculateVtuPrice(basicCust._id, 'data', plan.network, plan.api_plan_id);
        const expectedLegacy = plan.basic_selling_price || plan.selling_price; // Expected legacy logic fallback
        console.log(`==================================================`);
        console.log(`TEST 7 - LEGACY FALLBACK`);
        console.log(`==================================================`);
        console.log(`Expected Legacy Price: ₦${expectedLegacy}`);
        console.log(`Calculated Price     : ₦${resultLegacy.sellingPrice} (Source: ${resultLegacy.pricingSource})`);
        console.log(`Status               : ${resultLegacy.sellingPrice === expectedLegacy || resultLegacy.sellingPrice === plan.selling_price ? 'PASS' : 'FAIL'}`);

    } catch (e) {
        console.error("Error during validation:", e);
    } finally {
        console.log("Cleaning up mock data...");
        await User.deleteMany({ _id: { $in: usersToClean } });
        await PricingSettings.deleteMany({ _id: { $in: settingsToClean } });
        await AdminPricingOverride.deleteMany({ _id: { $in: overridesToClean } });
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

runValidation();
