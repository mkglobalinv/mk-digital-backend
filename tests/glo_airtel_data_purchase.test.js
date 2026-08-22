// Regression test for the Glo/Airtel data purchase failure.
//
// Root cause: server.js's /api/vtu/data/purchase handler persisted the raw,
// client-supplied `category` from the Android app's request body into the
// queued Transaction's `api_response.category`, instead of the authoritative
// `dbPlanInfo.category` already looked up from MongoDB in the same handler.
// When a purchase is routed to PeyFlex (either as the plan's primary provider,
// or via ClubKonnect failover), `buyDataWithPeyflex()` throws
// "Could not determine PeyFlex network identifier for data purchase." if
// `category` is falsy — which happens whenever the client omits it. Glo and
// Airtel purchases hit this because the app does not always send `category`
// for those networks, while MTN's UI always sends one (multiple plan
// categories to choose from), so MTN appeared to work while Glo/Airtel did not.
//
// This test exercises the actual buggy unit (`buyDataWithPeyflex`) directly,
// with no live server/DB required, using `nock` to mock the PeyFlex HTTP API.

import nock from 'nock';

process.env.PEYFLEX_API_TOKEN = process.env.PEYFLEX_API_TOKEN || 'test-token';

const { buyDataWithPeyflex } = await import('../services/providers/peyflexV2.js');

const PEYFLEX_BASE = (process.env.PEYFLEX_API_URL || 'https://client.peyflex.com.ng').replace(/\/$/, '');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
        console.log(`  PASS: ${message}`);
    } else {
        failed++;
        console.error(`  FAIL: ${message}`);
    }
}

async function testMissingCategoryThrowsForGlo() {
    console.log('\n1. Glo data purchase with NO category (the reported bug, pre-fix client payload)');
    nock.cleanAll();
    let threw = false;
    let errorMessage = '';
    try {
        await buyDataWithPeyflex('GLO', 'GLO_100.01', '08010000001', undefined);
    } catch (err) {
        threw = true;
        errorMessage = err.message;
    }
    assert(threw, 'buyDataWithPeyflex throws when category is missing');
    assert(
        errorMessage === 'Could not determine PeyFlex network identifier for data purchase.',
        `error message matches the exact production failure (got: "${errorMessage}")`
    );
}

async function testMissingCategoryThrowsForAirtel() {
    console.log('\n2. Airtel data purchase with NO category (the reported bug, pre-fix client payload)');
    nock.cleanAll();
    let threw = false;
    try {
        await buyDataWithPeyflex('AIRTEL', 'AIRTEL_500.01', '08010000002', undefined);
    } catch (err) {
        threw = true;
    }
    assert(threw, 'buyDataWithPeyflex throws when category is missing (Airtel)');
}

async function testGloSucceedsWithDbCategory() {
    console.log('\n3. Glo data purchase WITH dbPlanInfo.category (post-fix behavior) - provider SUCCESS');
    nock.cleanAll();
    const scope = nock(PEYFLEX_BASE)
        .post('/api/data/purchase/', (body) => body.network === 'glo_data' && body.plan_code === '100.01')
        .reply(200, { status: true, status_text: 'success', reference: 'PFX-GLO-1', message: 'Data delivered' });

    // real api_plan_id format per scripts/sync_peyflex_plans.js: "<plan_code>-<Category>-<price>"
    const result = await buyDataWithPeyflex('GLO', '100.01-Gifting-500', '08010000001', 'Gifting');

    assert(result.status === 'success', `result status is success (got: ${result.status})`);
    assert(result.reference === 'PFX-GLO-1', 'reference passed through from provider response');
    assert(scope.isDone(), 'the correctly-mapped glo_data identifier was sent to PeyFlex');
}

async function testAirtelSucceedsWithDbCategory() {
    console.log('\n4. Airtel data purchase WITH dbPlanInfo.category (post-fix behavior) - provider SUCCESS');
    nock.cleanAll();
    const scope = nock(PEYFLEX_BASE)
        .post('/api/data/purchase/', (body) => body.network === 'airtel_sme_data' && body.plan_code === '500.01')
        .reply(200, { status: true, reference: 'PFX-AIR-1' });

    const result = await buyDataWithPeyflex('AIRTEL', '500.01-SME-750', '08010000002', 'SME');

    assert(result.status === 'success', `result status is success (got: ${result.status})`);
    assert(scope.isDone(), 'the correctly-mapped airtel_sme_data identifier was sent to PeyFlex');
}

async function testGloFailedProviderResponse() {
    console.log('\n5. Glo data purchase WITH category, but PROVIDER returns a failure');
    nock.cleanAll();
    nock(PEYFLEX_BASE)
        .post('/api/data/purchase/')
        .reply(200, { status: false, msg: 'Insufficient provider balance' });

    const result = await buyDataWithPeyflex('GLO', '100.01-Gifting-500', '08010000001', 'Gifting');

    assert(result.status === 'failed', `result status is failed (got: ${result.status})`);
    assert(result.message === 'Insufficient provider balance', 'failure message passed through from provider');
}

async function testAirtelUnknownOnServerError() {
    console.log('\n6. Airtel data purchase WITH category, PROVIDER 5xx -> status unknown (no false refund)');
    nock.cleanAll();
    nock(PEYFLEX_BASE)
        .post('/api/data/purchase/')
        .times(3) // 1 initial attempt + 2 retries
        .reply(500, { error: 'Internal Server Error' });

    const result = await buyDataWithPeyflex('AIRTEL', '500.01-Corporate-750', '08010000002', 'Corporate');

    assert(result.status === 'unknown', `5xx maps to status "unknown", not "failed" (got: ${result.status})`);
}

async function testAirtelFailedOnExplicitProviderFailure() {
    console.log('\n6b. Airtel data purchase, PROVIDER 5xx but body explicitly says FAILED -> status failed (real production case)');
    nock.cleanAll();
    // Reproduces the actual PeyFlex response seen in production for this bug report:
    // HTTP 500 with a body that unambiguously says the transaction failed.
    nock(PEYFLEX_BASE)
        .post('/api/data/purchase/')
        .times(3)
        .reply(500, { status: 'FAILED', message: 'An error occurred.', error_code: 'ERR_999' });

    const result = await buyDataWithPeyflex('AIRTEL', 'A200MB-Gifting-199', '08010000002', 'Gifting');

    assert(result.status === 'failed', `explicit body status "FAILED" on a 5xx maps to "failed", not "unknown" (got: ${result.status})`);
    assert(result.message === 'An error occurred.', 'failure message passed through from the explicit provider body');
}

async function testPeyflexTokenNotLoggedToConsole() {
    console.log('\n6c. PeyFlex API token is not written to console output on outbound requests');
    nock.cleanAll();
    nock(PEYFLEX_BASE)
        .post('/api/data/purchase/')
        .reply(200, { status: true, reference: 'PFX-LOG-1' });

    const originalLog = console.log;
    const captured = [];
    console.log = (...args) => { captured.push(args.map(String).join(' ')); originalLog(...args); };
    try {
        await buyDataWithPeyflex('MTN', '1000.01-SME-1200', '08010000003', 'SME');
    } finally {
        console.log = originalLog;
    }

    const combined = captured.join('\n');
    assert(!combined.includes(process.env.PEYFLEX_API_TOKEN), 'logged output never contains the raw API token');
    assert(!combined.includes('"Authorization"'), 'logged headers omit the Authorization key entirely');
}

async function testMtnControlStillWorks() {
    console.log('\n7. Control: MTN (the network reported as working) behaves the same way with category present');
    nock.cleanAll();
    const scope = nock(PEYFLEX_BASE)
        .post('/api/data/purchase/', (body) => body.network === 'mtn_sme_data')
        .reply(200, { status: true, reference: 'PFX-MTN-1' });

    const result = await buyDataWithPeyflex('MTN', '1000.01-SME-1200', '08010000003', 'SME');

    assert(result.status === 'success', `MTN purchase still succeeds (got: ${result.status})`);
    assert(scope.isDone(), 'MTN identifier resolved and request sent as before (unaffected by the fix)');
}

async function run() {
    await testMissingCategoryThrowsForGlo();
    await testMissingCategoryThrowsForAirtel();
    await testGloSucceedsWithDbCategory();
    await testAirtelSucceedsWithDbCategory();
    await testGloFailedProviderResponse();
    await testAirtelUnknownOnServerError();
    await testAirtelFailedOnExplicitProviderFailure();
    await testPeyflexTokenNotLoggedToConsole();
    await testMtnControlStillWorks();

    nock.cleanAll();
    nock.restore();

    console.log(`\n${passed} passed, ${failed} failed`);
    if (failed > 0) {
        process.exitCode = 1;
    }
}

run();
