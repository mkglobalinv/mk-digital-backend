import fs from 'fs';
import path from 'path';

// Extract calculateVtuPrice from server.js
const serverFile = fs.readFileSync(path.join(process.cwd(), 'server.js'), 'utf-8');
const match = serverFile.match(/const calculateVtuPrice = async \((.*?)\) => {([\s\S]*?)return { basePrice, sellingPrice, pricingSource, reseller };\n};/);

if (!match) {
    console.error("Could not extract calculateVtuPrice from server.js");
    process.exit(1);
}

const funcBody = match[2] + "return { basePrice, sellingPrice, pricingSource, reseller };";
const params = match[1];

// Create Mock Models
class MockModel {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
    async findById(id) { return this.data.find(d => d._id === id); }
    async findOne(query) { 
        return this.data.find(d => {
            for (let k in query) {
                if (d[k] !== query[k]) return false;
            }
            return true;
        });
    }
}

const db = {
    User: [
        { _id: 'retail1', role: 'user', email: 'retail@test.com' },
        { _id: 'resellerBasic', role: 'reseller_admin', resellerType: 'basic', email: 'basic@test.com' },
        { _id: 'customerBasic', role: 'user', referredBy: 'resellerBasic', email: 'custB@test.com' },
        { _id: 'resellerPremium', role: 'reseller_admin', resellerType: 'premium', email: 'premium@test.com' },
        { _id: 'customerPremium', role: 'user', referredBy: 'resellerPremium', email: 'custP@test.com' }
    ],
    DataPlan: [
        { api_plan_id: 'plan1', network: 'MTN', status: true, selling_price: 1000, api_price: 800, basic_selling_price: 950, vip_selling_price: 900 }
    ],
    AdminPricingOverride: [],
    PriceOverride: [],
    PricingSettings: [
        { resellerId: 'resellerBasic', serviceType: 'data', network: 'MTN', markupPercentage: 5, status: 'active' },
        { resellerId: 'resellerPremium', serviceType: 'data', network: 'MTN', markupPercentage: 10, status: 'active' }
    ]
};

const User = new MockModel('User', db.User);
const DataPlan = new MockModel('DataPlan', db.DataPlan);
const AdminPricingOverride = new MockModel('AdminPricingOverride', db.AdminPricingOverride);
const PriceOverride = new MockModel('PriceOverride', db.PriceOverride);
const PricingSettings = new MockModel('PricingSettings', db.PricingSettings);

const calculateVtuPrice = async function(userId, serviceType, network, planId, amount = 0) {
    return eval(`(async () => { ${funcBody} })()`);
};

async function runTests() {
    console.log("Running Percentage Engine Validation Tests...");
    let passed = 0;
    let failed = 0;

    const assert = (name, expectedPrice, expectedSource, result) => {
        if (result.sellingPrice === expectedPrice && result.pricingSource === expectedSource) {
            console.log(`✅ [PASS] ${name}`);
            passed++;
        } else {
            console.error(`❌ [FAIL] ${name} | Expected: ${expectedPrice} (${expectedSource}) | Got: ${result.sellingPrice} (${result.pricingSource})`);
            failed++;
        }
    };

    try {
        // Scenario 1: Retail user pays standard system price
        const r1 = await calculateVtuPrice('retail1', 'data', 'MTN', 'plan1');
        assert("Retail User Price", 1000, "system", r1);

        // Scenario 2: Percentage Engine kicks in for Basic Customer
        // Base Price for basic is DataPlan.reseller_price or selling_price.
        // DataPlan has selling_price=1000, no reseller_price, so basePrice = 1000.
        // Markup 5% -> 1000 * 1.05 = 1050
        const r2 = await calculateVtuPrice('customerBasic', 'data', 'MTN', 'plan1');
        assert("Basic Customer Percentage Engine", 1050, "percentage_engine", r2);

        // Scenario 3: Percentage Engine for Premium Customer
        // Premium basePrice = premium_price || vip_price || reseller_price || selling_price
        // DataPlan has vip_selling_price=900, but base is vip_price... wait, no vip_price. Base is selling_price 1000.
        // Markup 10% -> 1000 * 1.10 = 1100
        const r3 = await calculateVtuPrice('customerPremium', 'data', 'MTN', 'plan1');
        assert("Premium Customer Percentage Engine", 1100, "percentage_engine", r3);

        // Scenario 4: Manual Override takes precedence over percentage
        db.User.find(u => u._id === 'resellerBasic').assignedPrices = new Map([['plan1', 1200]]);
        const r4 = await calculateVtuPrice('customerBasic', 'data', 'MTN', 'plan1');
        assert("Basic Customer Manual Override", 1200, "basic_assigned", r4);

        // Scenario 5: Legacy Field fallback when no percentage and no manual override
        db.User.find(u => u._id === 'resellerBasic').assignedPrices = undefined;
        db.PricingSettings.length = 0; // Clear settings array properly
        const r5 = await calculateVtuPrice('customerBasic', 'data', 'MTN', 'plan1');
        assert("Basic Customer Legacy Fallback", 1000, "basic_central", r5); // Clamped from 950 to 1000 due to basePrice=1000

    } catch(e) {
        console.error(e);
        failed++;
    }

    console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
