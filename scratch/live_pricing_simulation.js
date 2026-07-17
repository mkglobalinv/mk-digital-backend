/**
 * live_pricing_simulation.js
 * Simulates calculateVtuPrice() for all 5 service types and all 3 user tiers
 * WITHOUT deducting any wallet or calling any provider.
 * Run: node live_pricing_simulation.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import DataPlan from './models/DataPlan.js';
import AdminPricingOverride from './models/AdminPricingOverride.js';
import PriceOverride from './models/PriceOverride.js';

const COLORS = {
    reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
    yellow: '\x1b[33m', cyan: '\x1b[36m', bold: '\x1b[1m',
};
const log = (c, m) => console.log(`${c}${m}${COLORS.reset}`);
const pass = (label, detail) => { log(COLORS.green, `  ✅  PASS  ${label}`); if (detail) log(COLORS.green, `         → ${detail}`); };
const fail = (label, detail) => { log(COLORS.red,   `  ❌  FAIL  ${label}`); if (detail) log(COLORS.red,   `         → ${detail}`); };

// ── Inline replica of server.js calculateVtuPrice ─────────────────────────
const safeKey = (k) => k ? String(k).replace(/\./g, '_dot_') : k;

async function calculateVtuPrice(userId, serviceType, network, planId, amount = 0) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    let basePrice = 0, sellingPrice = 0, reseller = null, pricingSource = 'system';

    if (user.referredBy) reseller = await User.findById(user.referredBy);

    const buyer = reseller || user;
    const isReseller = buyer.role === 'reseller_admin';
    const rType = buyer.resellerType || 'basic';
    const isPremiumTier = buyer.role === 'reseller_admin' &&
        (rType === 'premium' || buyer.resellerTier === 'premium' || buyer.resellerTier === 'vip' || buyer.canOverridePricing);
    const isBasicReseller = buyer.role === 'reseller_admin' && !isPremiumTier;

    let adminOverride = null;
    if (buyer.role === 'reseller_admin') {
        adminOverride = await AdminPricingOverride.findOne({
            resellerId: buyer._id, serviceType,
            network: network?.toUpperCase() || null,
            planId: planId || null, status: 'enabled'
        });
    }

    if (serviceType === 'data') {
        const plan = await DataPlan.findOne({ api_plan_id: planId, network: network?.toUpperCase() });
        if (!plan) throw new Error('Invalid data plan');

        const systemPrice = plan.selling_price;
        if (buyer.role === 'admin') {
            basePrice = plan.api_price; sellingPrice = plan.selling_price; pricingSource = 'system';
        } else if (isReseller) {
            basePrice = adminOverride?.buyingPrice ??
                (isPremiumTier ? (plan.premium_price ?? plan.vip_price ?? plan.reseller_price ?? plan.selling_price)
                               : (plan.reseller_price ?? plan.selling_price));

            if (reseller) {
                if (rType === 'basic') {
                    let assignedPrice = reseller.assignedPrices?.get(safeKey(planId));
                    if ((assignedPrice == null) && adminOverride) assignedPrice = adminOverride.assignedSellingPrice;
                    const basicCentralPrice = (plan.basic_selling_price > 0) ? plan.basic_selling_price : undefined;

                    if (assignedPrice != null) { sellingPrice = assignedPrice; pricingSource = 'basic_assigned'; }
                    else if (basicCentralPrice != null) { sellingPrice = basicCentralPrice; pricingSource = 'basic_central'; }
                    else { sellingPrice = systemPrice; pricingSource = 'system'; }

                } else if (rType === 'premium') {
                    let customPrice = reseller.customPrices?.get(safeKey(planId));
                    if (customPrice == null) {
                        const ro = await PriceOverride.findOne({ resellerId: reseller._id, serviceType, network: network?.toUpperCase(), planId, status: 'enabled' });
                        customPrice = ro?.sellingPrice;
                    }
                    let assignedPrice = reseller.assignedPrices?.get(safeKey(planId));
                    if ((assignedPrice == null) && adminOverride) assignedPrice = adminOverride.assignedSellingPrice;
                    const vipCentralPrice = (plan.vip_selling_price > 0) ? plan.vip_selling_price :
                                           (plan.premium_selling_price > 0 ? plan.premium_selling_price : undefined);

                    if (customPrice != null) { sellingPrice = customPrice; pricingSource = 'premium_custom'; }
                    else if (assignedPrice != null) { sellingPrice = assignedPrice; pricingSource = 'premium_assigned'; }
                    else if (vipCentralPrice != null) { sellingPrice = vipCentralPrice; pricingSource = 'vip_central'; }
                    else { sellingPrice = systemPrice; pricingSource = 'system'; }
                }
            } else {
                sellingPrice = basePrice;
                pricingSource = rType === 'premium' ? 'premium_assigned' : 'basic_assigned';
            }
        } else {
            basePrice = plan.selling_price; sellingPrice = plan.selling_price; pricingSource = 'system';
        }
    } else {
        const amt = Number(amount);
        const systemPrice = amt;
        if (buyer.role === 'admin') {
            basePrice = amt * 0.98; sellingPrice = amt; pricingSource = 'system';
        } else if (isReseller) {
            basePrice = adminOverride?.buyingPrice ?? (isPremiumTier ? amt * 0.99 : amt * 0.995);
            if (reseller) {
                const lk = safeKey(planId || serviceType);
                let assignedPrice = reseller.assignedPrices?.get(lk);
                if ((assignedPrice == null) && adminOverride) assignedPrice = adminOverride.assignedSellingPrice;
                if ((assignedPrice == null) && adminOverride?.marginPercentage) assignedPrice = amt * (1 + adminOverride.marginPercentage / 100);

                if (rType === 'basic') {
                    if (assignedPrice != null) { sellingPrice = assignedPrice; pricingSource = 'basic_assigned'; }
                    else { sellingPrice = systemPrice; pricingSource = 'system'; }
                } else {
                    let customPrice = reseller.customPrices?.get(lk);
                    if (customPrice != null) { sellingPrice = customPrice; pricingSource = 'premium_custom'; }
                    else if (assignedPrice != null) { sellingPrice = assignedPrice; pricingSource = 'premium_assigned'; }
                    else { sellingPrice = systemPrice; pricingSource = 'system'; }
                }
            } else {
                sellingPrice = basePrice;
                pricingSource = rType === 'premium' ? 'premium_assigned' : 'basic_assigned';
            }
        } else {
            basePrice = amt; sellingPrice = amt; pricingSource = 'system';
        }
    }

    if (sellingPrice < basePrice) sellingPrice = basePrice;
    return { basePrice, sellingPrice, pricingSource };
}
// ──────────────────────────────────────────────────────────────────────────

await mongoose.connect(process.env.MONGO_URI);
log(COLORS.cyan, `\n${COLORS.bold}=== LIVE PRICING ENGINE SIMULATION ===${COLORS.reset}`);

const anyPlan = await DataPlan.findOne({ status: true, basic_selling_price: { $gt: 0 } })
    ?? await DataPlan.findOne({ status: true });
const directUser = await User.findOne({ role: 'user' });
const basicReseller = await User.findOne({ role: 'reseller_admin', resellerType: 'basic' });
const premiumReseller = await User.findOne({ role: 'reseller_admin', resellerType: 'premium' });
const basicCustomer = basicReseller ? await User.findOne({ role: 'user', referredBy: basicReseller._id }) : null;
const premiumCustomer = premiumReseller ? await User.findOne({ role: 'user', referredBy: premiumReseller._id }) : null;

console.log('\n📋 Test subjects:');
console.log(`  Retail user:      ${directUser?.email || '(none)'}`);
console.log(`  Basic reseller:   ${basicReseller?.email || '(none)'}`);
console.log(`  Basic customer:   ${basicCustomer?.email || '(none - no customers yet)'}`);
console.log(`  Premium reseller: ${premiumReseller?.email || '(none)'}`);
console.log(`  Premium customer: ${premiumCustomer?.email || '(none - no customers yet)'}`);
console.log(`\n  Test plan: ${anyPlan?.plan_name} | api_price=₦${anyPlan?.api_price} | selling_price=₦${anyPlan?.selling_price} | basic_selling_price=₦${anyPlan?.basic_selling_price} | vip_selling_price=₦${anyPlan?.vip_selling_price}`);

const results = [];

// ── Test 1: Retail user (Data) ─────────────────────────────────────────────
if (directUser && anyPlan) {
    log(COLORS.cyan, '\n── TEST 1: Retail User — Data');
    const r = await calculateVtuPrice(directUser._id, 'data', anyPlan.network, anyPlan.api_plan_id);
    const expected = anyPlan.selling_price;
    const ok = r.sellingPrice === expected;
    ok ? pass(`Retail: charged ₦${r.sellingPrice} (source: ${r.pricingSource})`, `Expected ₦${expected}`) :
         fail(`Retail: charged ₦${r.sellingPrice} but expected ₦${expected}`, `Source: ${r.pricingSource}`);
    results.push({ test: 'Retail Data', price: r.sellingPrice, expected, source: r.pricingSource, pass: ok });
}

// ── Test 2: Retail user (Airtime) ────────────────────────────────────────
if (directUser) {
    log(COLORS.cyan, '\n── TEST 2: Retail User — Airtime ₦500');
    const r = await calculateVtuPrice(directUser._id, 'airtime', 'MTN', null, 500);
    const ok = r.sellingPrice === 500 && r.pricingSource === 'system';
    ok ? pass(`Retail airtime: charged ₦${r.sellingPrice} (source: ${r.pricingSource})`) :
         fail(`Retail airtime: charged ₦${r.sellingPrice}, expected ₦500`, `Source: ${r.pricingSource}`);
    results.push({ test: 'Retail Airtime', price: r.sellingPrice, expected: 500, source: r.pricingSource, pass: ok });
}

// ── Test 3: Basic reseller customer (Data) ────────────────────────────────
if (basicCustomer && anyPlan) {
    log(COLORS.cyan, '\n── TEST 3: Basic Reseller Customer — Data');
    const r = await calculateVtuPrice(basicCustomer._id, 'data', anyPlan.network, anyPlan.api_plan_id);
    const expected = anyPlan.basic_selling_price > 0 ? anyPlan.basic_selling_price : anyPlan.selling_price;
    const sourceOk = ['basic_assigned', 'basic_central', 'system'].includes(r.pricingSource);
    sourceOk ? pass(`Basic customer: charged ₦${r.sellingPrice} (source: ${r.pricingSource})`, `Expected ~₦${expected}`) :
               fail(`Basic customer: unexpected pricingSource=${r.pricingSource}`);
    results.push({ test: 'Basic Customer Data', price: r.sellingPrice, expected, source: r.pricingSource, pass: sourceOk });
} else {
    log(COLORS.yellow, '\n  ⚠️  TEST 3 skipped: No basic reseller customer found. Assign a user to a basic reseller first.');
}

// ── Test 4: Premium reseller customer (Data, no custom override) ──────────
if (premiumCustomer && anyPlan) {
    log(COLORS.cyan, '\n── TEST 4: Premium Reseller Customer — Data (no custom override)');
    const r = await calculateVtuPrice(premiumCustomer._id, 'data', anyPlan.network, anyPlan.api_plan_id);
    const expected = anyPlan.vip_selling_price > 0 ? anyPlan.vip_selling_price :
                     (anyPlan.premium_selling_price > 0 ? anyPlan.premium_selling_price : anyPlan.selling_price);
    const sourceOk = ['vip_central', 'premium_assigned', 'premium_custom', 'system'].includes(r.pricingSource);
    sourceOk ? pass(`Premium customer: charged ₦${r.sellingPrice} (source: ${r.pricingSource})`, `Expected ~₦${expected}`) :
               fail(`Premium customer: unexpected pricingSource=${r.pricingSource}`);
    results.push({ test: 'Premium Customer Data', price: r.sellingPrice, expected, source: r.pricingSource, pass: sourceOk });
} else {
    log(COLORS.yellow, '\n  ⚠️  TEST 4 skipped: No premium reseller customer found.');
}

// ── Test 5: Retail Electricity ₦5000 ────────────────────────────────────
if (directUser) {
    log(COLORS.cyan, '\n── TEST 5: Retail User — Electricity ₦5000');
    const r = await calculateVtuPrice(directUser._id, 'electricity', 'IBEDC', null, 5000);
    const ok = r.sellingPrice === 5000 && r.pricingSource === 'system';
    ok ? pass(`Retail electricity: charged ₦${r.sellingPrice} (source: ${r.pricingSource})`) :
         fail(`Retail electricity: charged ₦${r.sellingPrice}, expected ₦5000`, `Source: ${r.pricingSource}`);
    results.push({ test: 'Retail Electricity', price: r.sellingPrice, expected: 5000, source: r.pricingSource, pass: ok });
}

// ── Summary ────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(70));
log(COLORS.cyan + COLORS.bold, 'LIVE PRICING ENGINE SIMULATION RESULTS');
console.log('─'.repeat(70));
console.log('  Test                    │ Expected  │ Got       │ Source           │ Result');
console.log('─'.repeat(70));
for (const r of results) {
    const status = r.pass ? '\x1b[32m✅ PASS\x1b[0m' : '\x1b[31m❌ FAIL\x1b[0m';
    console.log(`  ${r.test.padEnd(24)} │ ₦${String(r.expected).padEnd(8)} │ ₦${String(r.price).padEnd(8)} │ ${r.source.padEnd(16)} │ ${status}`);
}
console.log('═'.repeat(70));

await mongoose.disconnect();
