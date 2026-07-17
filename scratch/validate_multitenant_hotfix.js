/**
 * scratch/validate_multitenant_hotfix.js
 * ============================================================
 * Validates the multi-tenant business logic hotfix scenarios:
 * 1. Register on storefront -> role='user', referredBy=reseller._id
 * 2. Register-with-payment on storefront -> blocked with 403
 * 3. Login on storefront -> role='user', sessionType='retail'
 * 4. Access reseller APIs with storefront token -> blocked with 403
 *
 * Usage: node scratch/validate_multitenant_hotfix.js
 * ============================================================
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import axios from 'axios';
import User from '../models/User.js';

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

const BASE_URL = 'http://localhost:8800';

async function runValidation() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mksubdata');
    log(COLORS.cyan, `\n${COLORS.bold}=== Multi-Tenant Hotfix Validation ===${COLORS.reset}`);

    // 1. Setup Test Reseller in DB
    let reseller = await User.findOne({ role: 'reseller_admin', subdomain: 'testreseller' });
    if (!reseller) {
        reseller = new User({
            name: 'Test Reseller',
            email: 'testreseller@example.com',
            password: '$2b$10$xyz', // mock password
            role: 'reseller_admin',
            resellerActivationStatus: 'active',
            whiteLabelStatus: 'active',
            isResellerActivated: true,
            isEmailVerified: true,
            isSignupComplete: true,
            subdomain: 'testreseller',
            branding: { siteName: 'Test Store' }
        });
        await reseller.save();
        log(COLORS.yellow, `Created test reseller in database.`);
    } else {
        log(COLORS.yellow, `Found existing test reseller: ${reseller.email}`);
    }

    const resellerHost = 'testreseller.9jasub.com';
    const mainHost = '9jasub.com';

    // Cleanup previous test users
    await User.deleteMany({ email: { $in: ['storefront_cust@example.com', 'escalated_reseller@example.com'] } });

    // ── Scenario 1: Register on storefront ────────────────────
    section('Scenario 1: Register on Storefront');
    try {
        const regRes = await axios.post(`${BASE_URL}/register`, {
            name: 'Storefront Customer',
            email: 'storefront_cust@example.com',
            password: 'Password123!',
            transactionPin: '1234',
            role: 'reseller_admin' // Attempted role escalation
        }, {
            headers: { Host: resellerHost }
        });

        assert(regRes.data.email === 'storefront_cust@example.com', 'Successfully registered user on storefront');

        // Check user in database
        const createdUser = await User.findOne({ email: 'storefront_cust@example.com' });
        assert(createdUser !== null, 'User saved in database');
        assert(createdUser.role === 'user', `Role is strictly 'user' (escalation ignored). Got: ${createdUser.role}`);
        assert(createdUser.referredBy.toString() === reseller._id.toString(), 'User is correctly referred by the storefront reseller');
    } catch (err) {
        fail('Scenario 1 registration failed', err.response?.data?.message || err.message);
    }

    // ── Scenario 2: Register-with-payment on storefront ───────
    section('Scenario 2: Register-With-Payment on Storefront');
    try {
        await axios.post(`${BASE_URL}/api/reseller/register-with-payment`, {
            name: 'Escalated Reseller',
            email: 'escalated_reseller@example.com',
            businessName: 'Escalated Business',
            password: 'Password123!'
        }, {
            headers: { Host: resellerHost }
        });
        fail('Register-with-payment succeeded on reseller domain (should have been blocked)');
    } catch (err) {
        assert(err.response?.status === 403, 'Register-with-payment blocked on reseller domain with 403', `Status: ${err.response?.status}`);
    }

    // ── Scenario 3: Login on storefront ───────────────────────
    section('Scenario 3: Login on Storefront');
    // First let's verify storefront customer
    const userToVerify = await User.findOne({ email: 'storefront_cust@example.com' });
    userToVerify.isEmailVerified = true;
    userToVerify.isSignupComplete = true;
    await userToVerify.save();

    // Now test storefront login
    try {
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'storefront_cust@example.com',
            password: 'Password123!'
        }, {
            headers: { Host: resellerHost }
        });

        assert(loginRes.data.token !== undefined, 'Login succeeded');
        assert(loginRes.data.user.role === 'user', `Login response user role is 'user'. Got: ${loginRes.data.user.role}`);

        const token = loginRes.data.token;

        // ── Scenario 4: Access reseller APIs with storefront token ──
        section('Scenario 4: Access Reseller APIs with Storefront Token');
        try {
            await axios.get(`${BASE_URL}/api/reseller/stats`, {
                headers: { 
                    Host: resellerHost,
                    Authorization: `Bearer ${token}`
                }
            });
            fail('Access to reseller stats API succeeded with storefront customer token (should be blocked)');
        } catch (err) {
            assert(err.response?.status === 403, 'Access to reseller stats API blocked with 403', `Status: ${err.response?.status}`);
        }
    } catch (err) {
        fail('Scenario 3/4 login or api check failed', err.response?.data?.message || err.message);
    }

    // ── Scenario 5: Login as reseller owner on storefront ─────
    section('Scenario 5: Login as Reseller Owner on Storefront');
    // Let's set reseller password to test login
    const bcrypt = await import('bcrypt');
    reseller.password = await bcrypt.default.hash('OwnerPassword123!', 10);
    await reseller.save();

    let ownerLoginRes;
    try {
        ownerLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'testreseller@example.com',
            password: 'OwnerPassword123!'
        }, {
            headers: { Host: resellerHost }
        });

        assert(ownerLoginRes.data.token !== undefined, 'Owner login on storefront succeeded');
        assert(ownerLoginRes.data.user.role === 'user', `Owner role is forced to 'user' on storefront. Got: ${ownerLoginRes.data.user.role}`);

        // Try to access reseller API using owner token on storefront host
        try {
            await axios.get(`${BASE_URL}/api/reseller/stats`, {
                headers: { 
                    Host: resellerHost,
                    Authorization: `Bearer ${ownerLoginRes.data.token}`
                }
            });
            fail('Reseller owner accessed reseller stats API on storefront domain (should be blocked)');
        } catch (err) {
            assert(err.response?.status === 403, 'Reseller owner access to reseller stats API on storefront blocked with 403');
        }
    } catch (err) {
        fail('Scenario 5 failed', err.response?.data?.message || err.message);
    }

    // ── Scenario 6: Validate /user/me sanitization on storefront ──
    section('Scenario 6: Validate /user/me Sanitization on Storefront');
    try {
        const ownerMeRes = await axios.get(`${BASE_URL}/user/me`, {
            headers: {
                Host: resellerHost,
                Authorization: `Bearer ${ownerLoginRes.data.token}`
            }
        });

        assert(ownerMeRes.data.role === 'user', `Profile role is strictly 'user' on storefront. Got: ${ownerMeRes.data.role}`);
        assert(ownerMeRes.data.resellerActivationStatus === 'none', `resellerActivationStatus is downgraded to 'none'. Got: ${ownerMeRes.data.resellerActivationStatus}`);
        assert(ownerMeRes.data.whiteLabelStatus === 'none', `whiteLabelStatus is downgraded to 'none'. Got: ${ownerMeRes.data.whiteLabelStatus}`);
        assert(ownerMeRes.data.apiLevel === 'normal', `apiLevel is downgraded to 'normal'. Got: ${ownerMeRes.data.apiLevel}`);
    } catch (err) {
        fail('Scenario 6 validation failed', err.response?.data?.message || err.message);
    }

    // ── SUMMARY ────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(50));
    log(passed > 0 ? COLORS.green : COLORS.yellow, `  PASSED : ${passed}`);
    log(failed > 0 ? COLORS.red : COLORS.green, `  FAILED : ${failed}`);
    console.log('═'.repeat(50) + '\n');

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
}

runValidation().catch(err => {
    console.error('Fatal validation error:', err);
    process.exit(1);
});
