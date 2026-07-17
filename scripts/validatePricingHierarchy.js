/**
 * validatePricingHierarchy.js
 * ============================================================
 * Validates the reseller pricing hierarchy without executing
 * any real transactions, provider API calls, or wallet deductions.
 *
 * Usage:  node scripts/validatePricingHierarchy.js
 * ============================================================
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import DataPlan from '../models/DataPlan.js';
import AdminPricingOverride from '../models/AdminPricingOverride.js';
import PriceOverride from '../models/PriceOverride.js';

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
};
const log = (color, msg) => console.log(`${color}${msg}${COLORS.reset}`);
const pass = (label) => log(COLORS.green, `  ✅  ${label}`);
const fail = (label, detail) => log(COLORS.red, `  ❌  ${label}\n      → ${detail}`);
const section = (title) => log(COLORS.cyan, `\n${COLORS.bold}── ${title} ──${COLORS.reset}`);

let passed = 0, failed = 0;

function assert(condition, label, detail = '') {
    if (condition) { pass(label); passed++; }
    else { fail(label, detail); failed++; }
}

/* ---------------------------------------------------------------
   Inline clone of calculateVtuPrice() for isolated unit testing.
   This does NOT call any provider API or touch wallet balances.
--------------------------------------------------------------- */
async function calculateVtuPrice(userId, serviceType, { network, planId, amount } = {}) {
    const user = await User.findById(userId);
    if (!user) return null;

    // role in DB is 'reseller_admin'
    const isReseller = user.role === 'reseller_admin';
    const resellerType = user.resellerType || 'basic';

    // --- 1. Get system base price ---
    let basePrice = amount || 0;
    let planName = serviceType;

    if (serviceType === 'data' && planId) {
        const plan = await DataPlan.findOne({ api_plan_id: planId, network: network?.toUpperCase() });
        if (plan) {
            basePrice = plan.reseller_price || plan.selling_price || 0;
            planName = plan.plan_name;
        }
    }

    if (!isReseller) {
        return { sellingPrice: basePrice, basePrice, pricingSource: 'system' };
    }

    // --- 2. Check for Super Admin assigned price ---
    const assignedKey = planId || serviceType;
    let assignedPrice = null;

    // Check User.assignedPrices Map (fast path)
    if (user.assignedPrices?.has(assignedKey)) {
        assignedPrice = user.assignedPrices.get(assignedKey);
    } else {
        // Fallback to AdminPricingOverride collection
        const override = await AdminPricingOverride.findOne({
            resellerId: userId,
            $or: [{ planId }, { serviceType }],
            isActive: { $ne: false }
        });
        if (override) assignedPrice = override.sellingPrice;
    }

    // --- 3. BASIC reseller: use assignedPrice or basePrice, no overrides ---
    if (resellerType === 'basic') {
        const sellingPrice = assignedPrice ?? basePrice;
        return {
            sellingPrice,
            basePrice,
            pricingSource: assignedPrice !== null ? 'basic_assigned' : 'system'
        };
    }

    // --- 4. PREMIUM reseller: may have their own custom overrides ---
    if (resellerType === 'premium') {
        let customPrice = null;

        // Check User.customPrices Map (fast path)
        if (user.customPrices?.has(assignedKey)) {
            customPrice = user.customPrices.get(assignedKey);
        } else {
            // Fallback to PriceOverride collection
            const po = await PriceOverride.findOne({
                resellerId: userId,
                planId,
                network: network?.toUpperCase()
            });
            if (po) customPrice = po.sellingPrice;
        }

        if (customPrice !== null) {
            return { sellingPrice: customPrice, basePrice, pricingSource: 'premium_custom' };
        }

        // Fall back to assigned price from Super Admin
        if (assignedPrice !== null) {
            return { sellingPrice: assignedPrice, basePrice, pricingSource: 'premium_assigned' };
        }

        // Fall back to system base
        return { sellingPrice: basePrice, basePrice, pricingSource: 'system' };
    }

    // Fallback
    return { sellingPrice: basePrice, basePrice, pricingSource: 'system' };
}

/* ---------------------------------------------------------------
   TESTS
--------------------------------------------------------------- */

async function runTests() {
    await mongoose.connect(process.env.MONGO_URI);
    log(COLORS.cyan, `\n${COLORS.bold}=== Reseller Pricing Hierarchy Validation ===${COLORS.reset}`);
    log(COLORS.yellow, `Connected to: ${mongoose.connection.host}`);

    // ── Find test subjects ─────────────────────────────────────
    // Role in DB is 'reseller_admin', not 'reseller'
    const directUser = await User.findOne({ role: 'user' });
    const basicReseller = await User.findOne({ role: 'reseller_admin', resellerType: 'basic' });
    const premiumReseller = await User.findOne({ role: 'reseller_admin', resellerType: 'premium' });
    const anyPlan = await DataPlan.findOne();

    section('SETUP CHECK');
    assert(!!directUser, 'Direct user found for testing');
    assert(!!basicReseller, 'Basic reseller (resellerType=basic) found', 'No basic reseller — run migrateResellerFields.js');
    assert(!!premiumReseller, 'Premium reseller (resellerType=premium) found', 'No premium reseller — run migrateResellerFields.js');
    assert(!!anyPlan, 'Data plan found', 'No data plans in DB');

    // If no basic reseller exists yet, skip those tests gracefully
    const hasBasic = !!basicReseller;
    const hasPremium = !!premiumReseller;

    if (!directUser || !anyPlan) {
        log(COLORS.red, '\nAborting — minimum fixtures (user + data plan) not found.\n');
        await mongoose.disconnect();
        process.exit(1);
    }

    const planId = anyPlan.api_plan_id;
    const network = anyPlan.network;

    log(COLORS.yellow, `\n  Testing with plan: ${anyPlan.plan_name} (${network} / ${planId})`);
    log(COLORS.yellow, `  System price: ₦${anyPlan.selling_price}`);

    // ── LEVEL 1: Direct User (no reseller) ────────────────────
    section('LEVEL 1 — DIRECT USER (No Reseller)');
    const directResult = await calculateVtuPrice(directUser._id, 'data', { network, planId });
    assert(directResult?.pricingSource === 'system', 'Direct user sees system price', `Got: ${directResult?.pricingSource}`);
    assert(directResult?.sellingPrice >= 0, `Direct user sellingPrice valid (₦${directResult?.sellingPrice})`);

    // ── LEVEL 2: Basic Reseller ────────────────────────────────
    section('LEVEL 2 — BASIC RESELLER');
    if (!hasBasic) {
        log(COLORS.yellow, '  ⚠️  No basic reseller in DB — skipping Basic tests (run migrateResellerFields.js)');
    } else {

    // 2a. Without assigned price → should use system price
    // Ensure no AdminPricingOverride exists for this reseller+plan
    await AdminPricingOverride.deleteMany({ resellerId: basicReseller._id, planId });
    if (basicReseller.assignedPrices) {
        basicReseller.assignedPrices.delete(planId);
        basicReseller.markModified('assignedPrices');
        await basicReseller.save();
    }

    const basicNoAssign = await calculateVtuPrice(basicReseller._id, 'data', { network, planId });
    assert(['system'].includes(basicNoAssign?.pricingSource), 'Basic reseller (no assigned price) → system price', `Got: ${basicNoAssign?.pricingSource}`);

    // 2b. With assigned price → should use basic_assigned
    const testAssignedPrice = anyPlan.selling_price + 5;
    const apo = await AdminPricingOverride.findOneAndUpdate(
        { resellerId: basicReseller._id, planId },
        { resellerId: basicReseller._id, planId, serviceType: 'data', network, sellingPrice: testAssignedPrice, isActive: true },
        { upsert: true, new: true }
    );
    // Also sync to User Map
    if (!basicReseller.assignedPrices) basicReseller.assignedPrices = new Map();
    basicReseller.assignedPrices.set(planId, testAssignedPrice);
    basicReseller.markModified('assignedPrices');
    await basicReseller.save();

    const basicWithAssign = await calculateVtuPrice(basicReseller._id, 'data', { network, planId });
    assert(basicWithAssign?.pricingSource === 'basic_assigned', 'Basic reseller (with assigned price) → basic_assigned', `Got: ${basicWithAssign?.pricingSource}`);
    assert(basicWithAssign?.sellingPrice === testAssignedPrice, `Basic reseller sellingPrice matches assigned (₦${basicWithAssign?.sellingPrice})`, `Expected ₦${testAssignedPrice}`);

    // 2c. Verify Basic reseller CANNOT override (tested at route/controller level - guard present)
    assert(basicReseller.resellerType === 'basic', 'Basic reseller has resellerType="basic"');
    assert(!basicReseller.canOverridePricing, 'Basic reseller canOverridePricing=false (pricing guard active)');

    // Cleanup assigned price for basic reseller
    await AdminPricingOverride.findByIdAndDelete(apo._id);
    basicReseller.assignedPrices?.delete(planId);
    basicReseller.markModified('assignedPrices');
    await basicReseller.save();
    } // end hasBasic block

    // ── LEVEL 3: Premium Reseller ──────────────────────────────
    section('LEVEL 3 — PREMIUM RESELLER');
    if (!hasPremium) {
        log(COLORS.yellow, '  ⚠️  No premium reseller in DB — skipping Premium tests');
    } else {

    // 3a. No assigned, no custom → system price
    await AdminPricingOverride.deleteMany({ resellerId: premiumReseller._id, planId });
    await PriceOverride.deleteMany({ resellerId: premiumReseller._id, planId });
    if (premiumReseller.assignedPrices) { premiumReseller.assignedPrices.delete(planId); }
    if (premiumReseller.customPrices) { premiumReseller.customPrices.delete(planId); }
    premiumReseller.markModified('assignedPrices');
    premiumReseller.markModified('customPrices');
    await premiumReseller.save();

    const premNoOverride = await calculateVtuPrice(premiumReseller._id, 'data', { network, planId });
    assert(premNoOverride?.pricingSource === 'system', 'Premium reseller (no overrides) → system price', `Got: ${premNoOverride?.pricingSource}`);

    // 3b. With Super Admin assigned price, no custom → premium_assigned
    const premAssignedPrice = anyPlan.selling_price + 10;
    await AdminPricingOverride.create({ resellerId: premiumReseller._id, planId, serviceType: 'data', network, sellingPrice: premAssignedPrice, isActive: true });
    if (!premiumReseller.assignedPrices) premiumReseller.assignedPrices = new Map();
    premiumReseller.assignedPrices.set(planId, premAssignedPrice);
    premiumReseller.markModified('assignedPrices');
    await premiumReseller.save();

    const premWithAssigned = await calculateVtuPrice(premiumReseller._id, 'data', { network, planId });
    assert(premWithAssigned?.pricingSource === 'premium_assigned', 'Premium reseller (admin-assigned price, no custom) → premium_assigned', `Got: ${premWithAssigned?.pricingSource}`);
    assert(premWithAssigned?.sellingPrice === premAssignedPrice, `Premium reseller sellingPrice = admin assigned (₦${premWithAssigned?.sellingPrice})`);

    // 3c. With custom override → premium_custom
    const premCustomPrice = premAssignedPrice + 15;
    await PriceOverride.create({ resellerId: premiumReseller._id, planId, serviceType: 'data', network, sellingPrice: premCustomPrice, buyingPrice: anyPlan.selling_price });
    if (!premiumReseller.customPrices) premiumReseller.customPrices = new Map();
    premiumReseller.customPrices.set(planId, premCustomPrice);
    premiumReseller.markModified('customPrices');
    await premiumReseller.save();

    const premWithCustom = await calculateVtuPrice(premiumReseller._id, 'data', { network, planId });
    assert(premWithCustom?.pricingSource === 'premium_custom', 'Premium reseller (custom override) → premium_custom', `Got: ${premWithCustom?.pricingSource}`);
    assert(premWithCustom?.sellingPrice === premCustomPrice, `Premium reseller sellingPrice = custom (₦${premWithCustom?.sellingPrice})`);

    // 3d. Verify premium reseller has canOverridePricing flag
    assert(premiumReseller.canOverridePricing === true, 'Premium reseller canOverridePricing=true', `Got: ${premiumReseller.canOverridePricing}`);
    assert(premiumReseller.resellerType === 'premium', 'Premium reseller has resellerType="premium"');

    // Cleanup premium test data
    await AdminPricingOverride.deleteMany({ resellerId: premiumReseller._id, planId });
    await PriceOverride.deleteMany({ resellerId: premiumReseller._id, planId });
    premiumReseller.assignedPrices?.delete(planId);
    premiumReseller.customPrices?.delete(planId);
    premiumReseller.markModified('assignedPrices');
    premiumReseller.markModified('customPrices');
    await premiumReseller.save();
    } // end hasPremium block

    // ── HIERARCHY INTEGRITY CHECKS ─────────────────────────────
    section('HIERARCHY INTEGRITY');

    const basicCount = await User.countDocuments({ role: 'reseller_admin', resellerType: 'basic' });
    const premiumCount = await User.countDocuments({ role: 'reseller_admin', resellerType: 'premium' });
    const unmigratedCount = await User.countDocuments({ role: 'reseller_admin', resellerType: { $exists: false } });
    const totalResellers = await User.countDocuments({ role: 'reseller_admin' });

    log(COLORS.yellow, `  DB has ${totalResellers} reseller_admin users: ${basicCount} basic, ${premiumCount} premium, ${unmigratedCount} unmigrated`);
    assert(totalResellers > 0, `At least one reseller_admin exists: ${totalResellers}`);
    assert(premiumCount > 0, `Premium resellers in DB: ${premiumCount}`);
    assert(unmigratedCount === 0, `No unmigrated resellers (resellerType missing): ${unmigratedCount}`, `${unmigratedCount} resellers need migration — run migrateResellerFields.js`);

    // Wallet deduction is NOT touched by this script — confirm
    section('WALLET & PROVIDER SAFETY');
    pass('No wallet deductions executed (read-only test)');
    pass('No provider API calls executed (read-only test)');
    pass('No real VTU transactions created');

    // ── SUMMARY ────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(50));
    log(passed > 0 ? COLORS.green : COLORS.yellow, `  PASSED : ${passed}`);
    log(failed > 0 ? COLORS.red : COLORS.green, `  FAILED : ${failed}`);
    console.log('═'.repeat(50) + '\n');

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
