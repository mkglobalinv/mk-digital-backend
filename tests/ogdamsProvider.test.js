// Ogdams SimHosting provider adapter test suite. Everything here runs against
// nock-mocked HTTP -- no real network call to Ogdams is ever made, and no real
// money moves (matches "Do not perform a real paid transaction automatically
// during development").
//
// Scope note: this suite unit-tests the NEW, isolated code this integration
// added (services/providers/ogdams.js and the Ogdams-specific exports in
// routes/webhookRoutes.js). It deliberately does NOT re-test the existing,
// unmodified idempotency/wallet-refund/failover machinery (middlewares/
// idempotency.js, walletService.js's balance_deducted atomic guard,
// switcher.js's no-cross-provider-failover-for-data design) that Ogdams
// simply plugs into unchanged -- those aren't dependency-injected in the
// existing codebase, and retrofitting them to be unit-testable here would
// itself be an architecture change outside this task's scope. See the final
// report for the evidence-based reasoning on why those properties still hold.

import { jest } from '@jest/globals';

process.env.OGDAMS_ENABLED = 'true';
process.env.OGDAMS_API_KEY = 'sk_test_ogdams123';
process.env.OGDAMS_API_BASE_URL = 'https://simhosting.ogdams.ng/api/v1';
process.env.OGDAMS_WEBHOOK_SECRET = '';

const BASE_URL = 'https://simhosting.ogdams.ng/api/v1';

describe('Ogdams provider adapter (real HTTP client, mocked at the network layer with nock)', () => {
    let nock;
    let ogdams;

    beforeAll(async () => {
        nock = (await import('nock')).default;
        ogdams = await import('../services/providers/ogdams.js');
    });

    afterEach(() => {
        nock.cleanAll();
    });

    test('validateOgdamsConfig reports enabled+configured when both env vars are set', () => {
        const result = ogdams.validateOgdamsConfig();
        expect(result).toEqual({ enabled: true, configured: true });
    });

    test('getOgdamsBalances: sends the Bearer token and parses mainBalance/vtuMtn/smeMtn/dgMtn', async () => {
        const scope = nock(BASE_URL, { reqheaders: { authorization: 'Bearer sk_test_ogdams123' } })
            .get('/get/balances')
            .reply(200, { status: true, code: 200, data: { msg: { mainBalance: '25000.00', vtuMtn: '10.00', smeMtn: '5.00', dgMtn: '0.00' }, ref: null } });

        const result = await ogdams.getOgdamsBalances();
        expect(result.success).toBe(true);
        expect(result.balances.mainBalance).toBe('25000.00');
        expect(scope.isDone()).toBe(true);
    });

    test('getOgdamsDataPlans: maps networkId back to the internal network name and normalizes price to a number', async () => {
        nock(BASE_URL).get('/get/data/plans').reply(200, {
            status: true, code: 200,
            data: { msg: [{ networkId: 1, planId: 101, name: 'MTN SME 1GB', price: '500.00', validity: '30 Days' }], ref: null }
        });

        const result = await ogdams.getOgdamsDataPlans();
        expect(result.success).toBe(true);
        expect(result.plans[0]).toEqual({ network: 'MTN', planId: '101', name: 'MTN SME 1GB', price: 500, validity: '30 Days' });
    });

    test('getOgdamsMtnGiftingPlans: only returns the nine confirmed MTN Data Gifting plan IDs, even when other MTN plans are mixed in the response', async () => {
        nock(BASE_URL).get('/get/data/plans').reply(200, {
            status: true, code: 200,
            data: {
                msg: [
                    { networkId: 1, planId: 20000, name: 'MTN 75MB - 1 Day', price: '90.00', validity: '1 Day' },
                    { networkId: 1, planId: 20002, name: 'MTN 1GB - 1 Day', price: '450.00', validity: '1 Day' },
                    { networkId: 1, planId: 20006, name: 'MTN 2GB - 2 Days', price: '850.00', validity: '2 Days' },
                    { networkId: 1, planId: 20007, name: 'MTN 2.5GB - 2 Days', price: '1000.00', validity: '2 Days' },
                    { networkId: 1, planId: 20008, name: 'MTN 3.2GB - 2 Days', price: '1200.00', validity: '2 Days' },
                    { networkId: 1, planId: 20013, name: 'MTN 1GB - 7 Days', price: '1300.00', validity: '7 Days' },
                    { networkId: 1, planId: 20014, name: 'MTN 1.2GB - 7 Days', price: '1400.00', validity: '7 Days' },
                    { networkId: 1, planId: 20015, name: 'MTN 1.5GB - 7 Days', price: '1500.00', validity: '7 Days' },
                    { networkId: 1, planId: 20017, name: 'MTN 11GB - 7 Days', price: '4500.00', validity: '7 Days' },
                    { networkId: 1, planId: 9999, name: 'MTN SME 5GB', price: '2000.00', validity: '30 Days' }, // not in the whitelist
                    { networkId: 1, planId: 541, name: 'MTN 500MB Daily (old placeholder example)', price: '250.00', validity: '1 Day' }, // superseded, no longer whitelisted
                    { networkId: 2, planId: 20000, name: 'Airtel 75MB', price: '90.00', validity: '1 Day' } // same planId, wrong network
                ],
                ref: null
            }
        });

        const result = await ogdams.getOgdamsMtnGiftingPlans();
        expect(result.success).toBe(true);
        expect(result.plans.map((p) => p.planId).sort()).toEqual(
            ['20000', '20002', '20006', '20007', '20008', '20013', '20014', '20015', '20017']
        );
        expect(result.plans.every((p) => p.network === 'MTN')).toBe(true);
    });

    test('MTN_DATA_GIFTING_PLAN_IDS matches exactly the nine plan IDs confirmed by Ogdams support', () => {
        expect(Object.keys(ogdams.MTN_DATA_GIFTING_PLAN_IDS).sort()).toEqual(
            ['20000', '20002', '20006', '20007', '20008', '20013', '20014', '20015', '20017']
        );
    });

    test('buyDataWithOgdams: success (code 200) sends networkId/planId/phoneNumber/reference and returns status success', async () => {
        const scope = nock(BASE_URL, { reqheaders: { authorization: 'Bearer sk_test_ogdams123' } })
            .post('/vend/data', { networkId: 1, planId: 101, phoneNumber: '08012345678', reference: 'internal-ref-1' })
            .reply(200, { status: true, code: 200, data: { msg: 'Delivered', ref: 'SX8K2J4NQ9' } });

        const result = await ogdams.buyDataWithOgdams('MTN', 101, '08012345678', 'internal-ref-1');
        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
        expect(result.provider).toBe('ogdams');
        expect(result.reference).toBe('SX8K2J4NQ9');
        expect(scope.isDone()).toBe(true);
    });

    test('buyDataWithOgdams: code 202 (processing) is "unknown", never guessed as success -- matches "Expect response in 5 secs"', async () => {
        nock(BASE_URL).post('/vend/data').reply(202, { status: true, code: 202, data: { msg: 'Transaction recorded. Expect response in 5 secs', ref: 'SX8K2J4NQ9' } });

        const result = await ogdams.buyDataWithOgdams('MTN', 101, '08012345678', 'internal-ref-2');
        expect(result.success).toBe(false);
        expect(result.status).toBe('unknown');
        expect(result.errorCode).toBe('TRANSACTION_PENDING');
        expect(result.reference).toBe('SX8K2J4NQ9');
    });

    test('buyDataWithOgdams: HTTP 424 is a definite, clean failure (customer never charged)', async () => {
        nock(BASE_URL).post('/vend/data').reply(424, { status: false, code: 424, data: { msg: 'Insufficient plan stock', ref: null } });

        const result = await ogdams.buyDataWithOgdams('MTN', 101, '08012345678', 'internal-ref-3');
        expect(result.success).toBe(false);
        expect(result.status).toBe('failed');
        expect(result.errorCode).toBe('TRANSACTION_FAILED');
        // Customer-safe message only -- never the raw provider message.
        expect(result.message).not.toMatch(/stock/i);
    });

    test('buyDataWithOgdams: HTTP 401 maps to PROVIDER_AUTH_ERROR, a clean failure (not "unknown")', async () => {
        nock(BASE_URL).post('/vend/data').reply(401, { status: false, code: 401, data: { msg: 'Invalid API key', ref: null } });

        const result = await ogdams.buyDataWithOgdams('MTN', 101, '08012345678', 'internal-ref-4');
        expect(result.status).toBe('failed');
        expect(result.errorCode).toBe('PROVIDER_AUTH_ERROR');
    });

    test('buyDataWithOgdams: a network-level connection reset is "unknown" and is NEVER retried (no second request is made)', async () => {
        // A plain string error, not an object -- nock's replyWithError with an
        // object shape doesn't reliably short-circuit the request in this axios
        // version (the real request falls through to axios's own internal
        // timeout instead), the same issue already diagnosed for the
        // AirtimeBridge provider tests earlier in this codebase's test suite.
        const scope = nock(BASE_URL).post('/vend/data').replyWithError('socket hang up');

        const result = await ogdams.buyDataWithOgdams('MTN', 101, '08012345678', 'internal-ref-5');
        expect(result.status).toBe('unknown');
        // Only one interceptor was registered and it was consumed exactly once --
        // proves the adapter never retried this vend call.
        expect(scope.isDone()).toBe(true);
        expect(nock.pendingMocks().length).toBe(0);
    });

    test('buyDataWithOgdams: a network-level failure (provider unreachable) is "unknown", not "failed"', async () => {
        nock(BASE_URL).post('/vend/data').replyWithError('getaddrinfo ENOTFOUND simhosting.ogdams.ng');

        const result = await ogdams.buyDataWithOgdams('MTN', 101, '08012345678', 'internal-ref-6');
        expect(result.status).toBe('unknown');
        expect(result.errorCode).toBe('PROVIDER_UNAVAILABLE');
    });

    test('buyAirtimeWithOgdams: sends amount/type and reports success on code 200', async () => {
        const scope = nock(BASE_URL)
            .post('/vend/airtime', { networkId: 2, amount: 500, phoneNumber: '08099999999', type: 'vtu', reference: 'internal-ref-7' })
            .reply(200, { status: true, code: 200, data: { msg: 'Delivered', ref: 'AIR-REF-1' } });

        const result = await ogdams.buyAirtimeWithOgdams('AIRTEL', 500, '08099999999', 'internal-ref-7');
        expect(result.status).toBe('success');
        expect(scope.isDone()).toBe(true);
    });

    test('requeryOgdams: always reports pending (no status-check endpoint is documented) -- never guesses an outcome', async () => {
        const result = await ogdams.requeryOgdams('any-reference');
        expect(result.status).toBe('pending');
    });

    test('the reference sent to Ogdams is truncated to 40 chars (documented max length)', async () => {
        const longRef = 'x'.repeat(60);
        const scope = nock(BASE_URL)
            .post('/vend/data', (body) => body.reference.length === 40 && body.reference === 'x'.repeat(40))
            .reply(200, { status: true, code: 200, data: { msg: 'ok', ref: 'R1' } });

        await ogdams.buyDataWithOgdams('MTN', 101, '08012345678', longRef);
        expect(scope.isDone()).toBe(true);
    });

    test('maskOgdamsPhone masks the middle digits, keeping the first 5 and last 2', () => {
        expect(ogdams.maskOgdamsPhone('08012345678')).toBe('08012****78');
    });

    test('networkNameToId throws for an unsupported network rather than silently defaulting', () => {
        expect(() => ogdams.networkNameToId('UNKNOWN_NETWORK')).toThrow(/Unsupported network/);
    });
});

describe('Ogdams provider adapter -- disabled/misconfigured (config validation)', () => {
    let ogdamsDisabled;

    beforeAll(async () => {
        // Isolate module state: OGDAMS_ENABLED must be false BEFORE this module
        // is first imported, since the adapter reads process.env once at load
        // time. jest.resetModules() plus a fresh dynamic import gives this
        // describe block its own module instance independent of the suite above.
        jest.resetModules();
        process.env.OGDAMS_ENABLED = 'false';
        ogdamsDisabled = await import('../services/providers/ogdams.js?disabled-instance');
    });

    afterAll(() => {
        process.env.OGDAMS_ENABLED = 'true';
    });

    test('validateOgdamsConfig reports disabled, not an error, when OGDAMS_ENABLED is not "true"', () => {
        expect(ogdamsDisabled.validateOgdamsConfig()).toEqual({ enabled: false });
    });

    test('buyDataWithOgdams returns a clean failure (not a thrown exception, not an internal message leak) when disabled', async () => {
        const result = await ogdamsDisabled.buyDataWithOgdams('MTN', 101, '08012345678', 'ref-disabled-1');
        expect(result.success).toBe(false);
        expect(result.status).toBe('failed');
        expect(result.errorCode).toBe('PROVIDER_UNAVAILABLE');
        // The clean customer-facing message, not the raw "OGDAMS_ENABLED..." string.
        expect(result.message).not.toMatch(/OGDAMS_ENABLED/);
    });
});

describe('Ogdams webhook signature verification and status normalization', () => {
    let webhookRoutes;
    let crypto;

    beforeAll(async () => {
        crypto = (await import('crypto')).default;
        webhookRoutes = await import('../routes/webhookRoutes.js');
    });

    function sign(body, secret = 'sk_test_ogdams123') {
        return crypto.createHmac('sha512', secret).update(JSON.stringify(body)).digest('hex');
    }

    test('verifyOgdamsSignature accepts a correctly-signed body', () => {
        const body = { status: true, code: 200, data: { msg: 'ok', ref: 'REF-1' } };
        const rawBody = Buffer.from(JSON.stringify(body));
        const signature = sign(body);
        expect(webhookRoutes.verifyOgdamsSignature(rawBody, signature)).toBe(true);
    });

    test('verifyOgdamsSignature rejects a tampered body (signature no longer matches)', () => {
        const originalBody = { status: true, code: 200, data: { msg: 'ok', ref: 'REF-1' } };
        const signature = sign(originalBody);
        const tamperedRawBody = Buffer.from(JSON.stringify({ status: true, code: 200, data: { msg: 'ok', ref: 'REF-2' } }));
        expect(webhookRoutes.verifyOgdamsSignature(tamperedRawBody, signature)).toBe(false);
    });

    test('verifyOgdamsSignature rejects a missing signature header', () => {
        const rawBody = Buffer.from(JSON.stringify({ status: true, code: 200 }));
        expect(webhookRoutes.verifyOgdamsSignature(rawBody, undefined)).toBe(false);
    });

    test('verifyOgdamsSignature rejects a signature signed with the wrong key', () => {
        const body = { status: true, code: 200, data: { msg: 'ok', ref: 'REF-1' } };
        const rawBody = Buffer.from(JSON.stringify(body));
        const wrongSignature = sign(body, 'wrong-key');
        expect(webhookRoutes.verifyOgdamsSignature(rawBody, wrongSignature)).toBe(false);
    });

    test('normalizeOgdamsWebhookStatus: code 200 + status true is success', () => {
        expect(webhookRoutes.normalizeOgdamsWebhookStatus({ status: true, code: 200 })).toBe('success');
    });

    test('normalizeOgdamsWebhookStatus: code 424 is failed', () => {
        expect(webhookRoutes.normalizeOgdamsWebhookStatus({ status: false, code: 424 })).toBe('failed');
    });

    test('normalizeOgdamsWebhookStatus: code 202 (still processing) is null -- not a final outcome, never guessed', () => {
        expect(webhookRoutes.normalizeOgdamsWebhookStatus({ status: true, code: 202 })).toBe(null);
    });

    test('normalizeOgdamsWebhookStatus: an unrecognized shape is null, never guessed', () => {
        expect(webhookRoutes.normalizeOgdamsWebhookStatus({ foo: 'bar' })).toBe(null);
        expect(webhookRoutes.normalizeOgdamsWebhookStatus(null)).toBe(null);
    });
});
