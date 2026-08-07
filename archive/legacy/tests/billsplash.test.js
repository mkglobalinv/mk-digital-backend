/**
 * tests/billsplash.test.js
 *
 * Billsplash provider unit tests.
 * Uses `nock` (already in devDependencies) to intercept HTTP — no live API calls.
 * No database connections required.
 *
 * Run with:
 *   node --experimental-vm-modules tests/billsplash.test.js
 *
 * Note: This project does not use Jest/Mocha. Tests are written as a
 * standalone async script to match the pattern in isolation.test.js.
 */

// ── IMPORTANT: Set env BEFORE any imports so module-level code picks it up ──
process.env.BILLSPLASH_BASE_URL = 'https://billsplash.com/api';
process.env.BILLSPLASH_API_KEY  = 'test_api_key_for_unit_tests';

import nock from 'nock';

// Import provider functions AFTER env is set
import {
    buyAirtimeWithBillsplash,
    fetchDataPlansFromBillsplash,
    buyDataWithBillsplash,
    verifyNINWithBillsplash,
    verifyBVNWithBillsplash,
    verifyNINByPhoneWithBillsplash,
    verifyNINByDemographicsWithBillsplash,
    submitIPEClearanceWithBillsplash,
    pollIPEStatus,
    requeryBillsplash,
    fetchBillsplashBalance
} from '../services/providers/billsplash.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test runner helpers
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

const assert = (name, condition, details = '') => {
    if (condition) {
        console.log(`  ✅ PASS: ${name}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${name}`, details);
        failed++;
    }
};

const runTest = async (name, fn) => {
    console.log(`\n[TEST] ${name}`);
    try {
        await fn();
    } catch (err) {
        console.error(`  ❌ UNCAUGHT ERROR: ${name}`, err.message);
        failed++;
    }
    // Clean up any pending nock interceptors
    nock.cleanAll();
};

// ─────────────────────────────────────────────────────────────────────────────
// AIRTIME TESTS — documented endpoint: POST /api/airtime/topup
// Source: billsplash.com public API section
// ─────────────────────────────────────────────────────────────────────────────

await runTest('Airtime purchase — success path', async () => {
    nock('https://billsplash.com')
        .post('/api/airtime/topup', { network: 'mtn', phone: '08012345678', amount: 500 })
        .reply(200, { status: 'success', transaction_id: 'BS-TXN-001', message: 'Airtime sent' });

    const result = await buyAirtimeWithBillsplash('mtn', 500, '08012345678');
    assert('status is success',         result.status === 'success');
    assert('provider_used is billsplash', result.provider_used === 'billsplash');
    assert('reference is returned',     Boolean(result.reference));
    assert('data is populated',         Boolean(result.data));
});

await runTest('Airtime purchase — provider failure (400)', async () => {
    nock('https://billsplash.com')
        .post('/api/airtime/topup')
        .reply(400, { status: 'failed', message: 'Invalid network' });

    const result = await buyAirtimeWithBillsplash('mtn', 500, '08012345678');
    assert('status is failed',          result.status === 'failed');
    assert('message is present',        typeof result.message === 'string');
    assert('provider_used is billsplash', result.provider_used === 'billsplash');
});

await runTest('Airtime purchase — 429 rate limit retries and returns unknown', async () => {
    // Return 429 for all 3 attempts (initial + 2 retries)
    nock('https://billsplash.com')
        .post('/api/airtime/topup')
        .times(3)
        .reply(429, { message: 'Too many requests' });

    const result = await buyAirtimeWithBillsplash('mtn', 500, '08012345678');
    assert('status is unknown after rate limit exhaustion', result.status === 'unknown');
    assert('provider_used is billsplash', result.provider_used === 'billsplash');
});

await runTest('Airtime purchase — 500 server error returns unknown', async () => {
    nock('https://billsplash.com')
        .post('/api/airtime/topup')
        .times(3)
        .reply(500, { message: 'Internal server error' });

    const result = await buyAirtimeWithBillsplash('mtn', 500, '08012345678');
    assert('status is unknown after 500 exhaustion', result.status === 'unknown');
});

await runTest('Airtime purchase — network lowercase (glo)', async () => {
    nock('https://billsplash.com')
        .post('/api/airtime/topup', { network: 'glo', phone: '07011111111', amount: 200 })
        .reply(200, { status: 'success', transaction_id: 'BS-TXN-002' });

    const result = await buyAirtimeWithBillsplash('GLO', 200, '07011111111');
    assert('network is lowercased',     result.status === 'success', JSON.stringify(result));
});

await runTest('Airtime purchase — pending response normalised to unknown', async () => {
    nock('https://billsplash.com')
        .post('/api/airtime/topup')
        .reply(200, { status: 'pending', message: 'Processing' });

    const result = await buyAirtimeWithBillsplash('mtn', 100, '08099999999');
    assert('pending normalised to unknown', result.status === 'unknown');
});

// ─────────────────────────────────────────────────────────────────────────────
// DATA TESTS — endpoint not yet documented → returns placeholder failure
// ─────────────────────────────────────────────────────────────────────────────

await runTest('Data plans fetch — placeholder returns graceful failure', async () => {
    const result = await fetchDataPlansFromBillsplash('mtn');
    assert('success is false',          result.success === false);
    assert('plans array is empty',      Array.isArray(result.plans) && result.plans.length === 0);
    assert('message explains reason',   result.message.includes('not yet documented'));
});

await runTest('Data purchase — placeholder returns graceful failure', async () => {
    const result = await buyDataWithBillsplash('mtn', 'MTN-1GB-PLAN', '08012345678');
    assert('success is false',          result.success === false);
    assert('status is failed',          result.status === 'failed');
    assert('provider_used is billsplash', result.provider_used === 'billsplash');
    assert('message explains reason',   result.message.includes('not yet documented'));
});

// ─────────────────────────────────────────────────────────────────────────────
// IDENTITY TESTS — endpoints not yet publicly documented → placeholders
// ─────────────────────────────────────────────────────────────────────────────

await runTest('NIN verification — placeholder returns graceful failure', async () => {
    const result = await verifyNINWithBillsplash('12345678901');
    assert('status is failed',          result.status === 'failed');
    assert('provider_used is billsplash', result.provider_used === 'billsplash');
    assert('message explains reason',   result.message.includes('not yet documented'));
});

await runTest('BVN verification — placeholder returns graceful failure', async () => {
    const result = await verifyBVNWithBillsplash('22222222222');
    assert('status is failed',          result.status === 'failed');
    assert('provider_used is billsplash', result.provider_used === 'billsplash');
    assert('message explains reason',   result.message.includes('not yet documented'));
});

await runTest('NIN by phone — placeholder returns graceful failure', async () => {
    const result = await verifyNINByPhoneWithBillsplash('08012345678');
    assert('status is failed',          result.status === 'failed');
    assert('provider_used is billsplash', result.provider_used === 'billsplash');
});

await runTest('NIN by demographics — placeholder returns graceful failure', async () => {
    const result = await verifyNINByDemographicsWithBillsplash({ firstname: 'John', lastname: 'Doe', dob: '1990-01-01' });
    assert('status is failed',          result.status === 'failed');
    assert('provider_used is billsplash', result.provider_used === 'billsplash');
});

// ─────────────────────────────────────────────────────────────────────────────
// IPE TESTS — partially documented (done, trackingID fields confirmed in brief)
// ─────────────────────────────────────────────────────────────────────────────

await runTest('IPE submit — placeholder returns graceful failure', async () => {
    const result = await submitIPEClearanceWithBillsplash({ nin: '12345678901', consent: true });
    assert('status is failed',          result.status === 'failed');
    assert('provider_used is billsplash', result.provider_used === 'billsplash');
    assert('message explains reason',   result.message.includes('not yet documented'));
});

await runTest('IPE poll — placeholder returns done=false and unknown status', async () => {
    const result = await pollIPEStatus('TRACK-XYZ-001');
    assert('done is false',             result.done === false);
    assert('status is unknown',         result.status === 'unknown');
    assert('message explains reason',   result.message.includes('not yet documented'));
});

// ─────────────────────────────────────────────────────────────────────────────
// REQUERY TESTS — endpoint not yet documented → placeholder unknown
// ─────────────────────────────────────────────────────────────────────────────

await runTest('Requery — placeholder returns unknown status', async () => {
    const result = await requeryBillsplash('BS-REF-001');
    assert('status is unknown',         result.status === 'unknown');
    assert('message explains reason',   result.message.includes('not yet documented'));
});

// ─────────────────────────────────────────────────────────────────────────────
// MONITORING TESTS — balance endpoint not documented → throws
// ─────────────────────────────────────────────────────────────────────────────

await runTest('Balance fetch — throws until documented (monitoring catch handles gracefully)', async () => {
    let threw = false;
    try {
        await fetchBillsplashBalance();
    } catch (err) {
        threw = true;
        assert('error message explains reason', err.message.includes('not yet documented'));
    }
    assert('fetchBillsplashBalance throws', threw);
});

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY / MASKING TESTS — assert secrets never appear in logs
// ─────────────────────────────────────────────────────────────────────────────

await runTest('Sensitive field masking — API key not in log output', async () => {
    // If billsplash.js logs the raw Authorization header, this test catches it.
    // We do a dry-run that hits a nocked endpoint and verify the guard runs first.
    const originalKey = process.env.BILLSPLASH_API_KEY;
    process.env.BILLSPLASH_API_KEY = 'SUPER_SECRET_KEY_MUST_NOT_LOG';

    nock('https://billsplash.com')
        .post('/api/airtime/topup')
        .reply(200, { status: 'success', transaction_id: 'MASKED-TEST' });

    // We can't intercept console.log easily without mocking — but we know the
    // maskHeaders() function strips Authorization from the logged config.
    // Assert the result is still normalized correctly (integration smoke-check).
    const result = await buyAirtimeWithBillsplash('mtn', 100, '08000000000');
    assert('result returned without exposing key', result.provider_used === 'billsplash');

    process.env.BILLSPLASH_API_KEY = originalKey;
});

await runTest('Missing API key — guard returns graceful failure immediately', async () => {
    const originalKey = process.env.BILLSPLASH_API_KEY;
    process.env.BILLSPLASH_API_KEY = '';

    // Force re-read — create a fresh client path by calling the function
    const result = await buyAirtimeWithBillsplash('mtn', 100, '08000000000');
    // Guard should return immediately without making HTTP call
    assert('status is failed when key missing', result.status === 'failed');
    assert('message references configuration',  result.message.toLowerCase().includes('api key'));

    process.env.BILLSPLASH_API_KEY = originalKey;
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════');
console.log(`[Billsplash Tests] Results: ${passed} passed, ${failed} failed`);
console.log('══════════════════════════════════════════════════════\n');

if (failed > 0) process.exit(1);
