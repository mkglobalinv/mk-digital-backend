// SmePlug provider adapter test suite. Everything here runs against
// nock-mocked HTTP -- no real network call to SmePlug is ever made, and no
// real money moves. Mirrors tests/ogdamsProvider.test.js's structure and
// scope note: this suite unit-tests the NEW, isolated code this integration
// added (services/providers/smeplug.js and the SmePlug-specific exports in
// routes/webhookRoutes.js) -- it does not re-test the existing, unmodified
// idempotency/wallet-refund/failover machinery smeplug simply plugs into.

import { jest } from '@jest/globals';

process.env.SMEPLUG_ENABLED = 'true';
process.env.SMEPLUG_API_KEY = 'sk_test_smeplug123';
process.env.SMEPLUG_API_BASE_URL = 'https://smeplug.ng/api/v1';

const BASE_URL = 'https://smeplug.ng/api/v1';

describe('SmePlug provider adapter (real HTTP client, mocked at the network layer with nock)', () => {
    let nock;
    let smeplug;

    beforeAll(async () => {
        nock = (await import('nock')).default;
        smeplug = await import('../services/providers/smeplug.js');
    });

    afterEach(() => {
        nock.cleanAll();
    });

    test('validateSmeplugConfig reports enabled+configured when both env vars are set', () => {
        expect(smeplug.validateSmeplugConfig()).toEqual({ enabled: true, configured: true });
    });

    test('getSmeplugBalance: sends the Bearer token and parses balance as a number', async () => {
        const scope = nock(BASE_URL, { reqheaders: { authorization: 'Bearer sk_test_smeplug123' } })
            .get('/account/balance')
            .reply(200, { balance: 3229.12 });

        const result = await smeplug.getSmeplugBalance();
        expect(result.success).toBe(true);
        expect(result.balance).toBe(3229.12);
        expect(scope.isDone()).toBe(true);
    });

    test('getSmeplugDataPlans: flattens the network-ID-keyed response into the flat {network, planId, name, price} shape', async () => {
        nock(BASE_URL).get('/data/plans').reply(200, {
            status: true,
            data: {
                "1": [{ id: "1", name: "500MB [SME]", price: "220", telco_price: "0" }],
                "2": [{ id: "AIR1000", name: "1.5GB", price: "920", telco_price: "920" }]
            }
        });

        const result = await smeplug.getSmeplugDataPlans();
        expect(result.success).toBe(true);
        expect(result.plans).toEqual([
            { network: 'MTN', planId: '1', name: '500MB [SME]', price: 220, telcoPrice: 0 },
            { network: 'AIRTEL', planId: 'AIR1000', name: '1.5GB', price: 920, telcoPrice: 920 }
        ]);
    });

    test('getSmeplugMtnGiftingPlans: only returns the eight user-selected MTN Gifting plan IDs, even when SME and other-network plans are mixed in', async () => {
        nock(BASE_URL).get('/data/plans').reply(200, {
            status: true,
            data: {
                "1": [
                    { id: "1", name: "500MB [SME]", price: "220", telco_price: "0" }, // not in the whitelist (SME, not Gifting)
                    { id: "11", name: "1GB daily Plan [Gifting]", price: "350", telco_price: "350" },
                    { id: "13", name: "2.5GB 2-Day Plan [Gifting]", price: "500", telco_price: "500" },
                    { id: "15", name: "750MB 2-Week Plan [Gifting]", price: "500", telco_price: "500" },
                    { id: "16", name: "1GB Weekly Plan [Gifting]", price: "500", telco_price: "500" },
                    { id: "17", name: "2GB Weekly Plan [Gifting]", price: "1000", telco_price: "1000" },
                    { id: "18", name: "6GB Weekly Plan [Gifting]", price: "1500", telco_price: "1500" },
                    { id: "19", name: "1.5GB Monthly Data Plan [Gifting]", price: "1000", telco_price: "1000" },
                    { id: "20", name: "2GB Monthly Plan [Gifting]", price: "1200", telco_price: "1200" },
                    { id: "25", name: "10GB Monthly Plan [Gifting]", price: "3500", telco_price: "3500" } // not in the whitelist
                ],
                "2": [{ id: "17", name: "wrong network, same id as an MTN plan", price: "999", telco_price: "999" }]
            }
        });

        const result = await smeplug.getSmeplugMtnGiftingPlans();
        expect(result.success).toBe(true);
        expect(result.plans.map((p) => p.planId).sort()).toEqual(
            ['11', '13', '15', '16', '17', '18', '19', '20']
        );
        expect(result.plans.every((p) => p.network === 'MTN')).toBe(true);
        expect(result.plans.every((p) => p.validity)).toBe(true);
    });

    test('MTN_DATA_GIFTING_PLAN_IDS matches exactly the eight plan IDs selected by the user from SmePlug\'s real catalog', () => {
        expect(Object.keys(smeplug.MTN_DATA_GIFTING_PLAN_IDS).sort()).toEqual(
            ['11', '13', '15', '16', '17', '18', '19', '20']
        );
    });

    test('buyDataWithSmeplug: success (status:true, no current_status) sends network_id/plan_id/phone/customer_reference and returns status success', async () => {
        const scope = nock(BASE_URL, { reqheaders: { authorization: 'Bearer sk_test_smeplug123' } })
            .post('/data/purchase', { network_id: 1, plan_id: '11', phone: '09061668519', customer_reference: 'internal-ref-1' })
            .reply(200, { status: true, data: { reference: '49e2e6ea701054ff164c', msg: 'You have successfully transferred 1GB Data to 2349061668519.' } });

        const result = await smeplug.buyDataWithSmeplug('MTN', '11', '09061668519', 'internal-ref-1');
        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
        expect(result.provider).toBe('smeplug');
        expect(result.reference).toBe('49e2e6ea701054ff164c');
        expect(scope.isDone()).toBe(true);
    });

    test('buyDataWithSmeplug: a documented pending current_status (Sim & Device medium) is "unknown", never guessed as success', async () => {
        nock(BASE_URL).post('/data/purchase').reply(200, {
            status: true,
            data: { reference: 'REF-PENDING', current_status: 'processing', msg: 'Queued' }
        });

        const result = await smeplug.buyDataWithSmeplug('MTN', '11', '09061668519', 'internal-ref-2');
        expect(result.success).toBe(false);
        expect(result.status).toBe('unknown');
        expect(result.errorCode).toBe('TRANSACTION_PENDING');
        expect(result.reference).toBe('REF-PENDING');
    });

    test('buyDataWithSmeplug: status:false in a 200 body is a definite, clean failure (customer never charged)', async () => {
        nock(BASE_URL).post('/data/purchase').reply(200, { status: false, message: 'Insufficient wallet balance' });

        const result = await smeplug.buyDataWithSmeplug('MTN', '11', '09061668519', 'internal-ref-3');
        expect(result.success).toBe(false);
        expect(result.status).toBe('failed');
        expect(result.errorCode).toBe('TRANSACTION_FAILED');
        // Customer-safe message only -- never the raw provider message.
        expect(result.message).not.toMatch(/balance/i);
    });

    test('buyDataWithSmeplug: HTTP 401 maps to PROVIDER_AUTH_ERROR, a clean failure (not "unknown")', async () => {
        nock(BASE_URL).post('/data/purchase').reply(401, { message: 'Invalid token' });

        const result = await smeplug.buyDataWithSmeplug('MTN', '11', '09061668519', 'internal-ref-4');
        expect(result.status).toBe('failed');
        expect(result.errorCode).toBe('PROVIDER_AUTH_ERROR');
    });

    test('buyDataWithSmeplug: a network-level connection reset is "unknown" and is NEVER retried (no second request is made)', async () => {
        const scope = nock(BASE_URL).post('/data/purchase').replyWithError('socket hang up');

        const result = await smeplug.buyDataWithSmeplug('MTN', '11', '09061668519', 'internal-ref-5');
        expect(result.status).toBe('unknown');
        expect(scope.isDone()).toBe(true);
        expect(nock.pendingMocks().length).toBe(0);
    });

    test('buyAirtimeWithSmeplug: sends amount and reports success on status:true', async () => {
        const scope = nock(BASE_URL)
            .post('/airtime/purchase', { network_id: 1, phone: '08099999999', amount: 20, customer_reference: 'internal-ref-6' })
            .reply(200, { status: true, data: { reference: 'AIR-REF-1', msg: '20 airtime purchase for 08099999999' } });

        const result = await smeplug.buyAirtimeWithSmeplug('MTN', 20, '08099999999', 'internal-ref-6');
        expect(result.status).toBe('success');
        expect(scope.isDone()).toBe(true);
    });

    test('requerySmeplug: reports success when SmePlug\'s transaction-status endpoint returns status:"success"', async () => {
        nock(BASE_URL).get('/transactions/some-ref').reply(200, {
            status: 'success', reference: 'f52c00afe7e5eb27b7a7', customer_reference: 'some-ref',
            type: 'Data purchase', beneficiary: '09061668519', memo: '1GB data purchase', response: '1GB data purchase', price: '350'
        });

        const result = await smeplug.requerySmeplug('some-ref');
        expect(result.status).toBe('success');
    });

    test('requerySmeplug: reports pending for an unrecognized/still-processing status text -- never guesses a final outcome', async () => {
        nock(BASE_URL).get('/transactions/some-ref').reply(200, { status: 'processing', reference: 'REF', customer_reference: 'some-ref' });

        const result = await smeplug.requerySmeplug('some-ref');
        expect(result.status).toBe('pending');
    });

    test('maskSmeplugPhone masks the middle digits, keeping the first 5 and last 2', () => {
        expect(smeplug.maskSmeplugPhone('08012345678')).toBe('08012****78');
    });

    test('networkNameToId throws for an unsupported network rather than silently defaulting', () => {
        expect(() => smeplug.networkNameToId('UNKNOWN_NETWORK')).toThrow(/Unsupported network/);
    });

    test('network ID mapping is independent from Ogdams\' (3=9Mobile/4=Glo here, not 3=Glo/4=9mobile)', () => {
        expect(smeplug.networkNameToId('9MOBILE')).toBe(3);
        expect(smeplug.networkNameToId('GLO')).toBe(4);
    });
});

describe('SmePlug provider adapter -- disabled/misconfigured (config validation)', () => {
    let smeplugDisabled;

    beforeAll(async () => {
        // Isolate module state: SMEPLUG_ENABLED must be false BEFORE this module
        // is first imported, since the adapter reads process.env once at load
        // time. jest.resetModules() plus a fresh dynamic import gives this
        // describe block its own module instance independent of the suite above.
        jest.resetModules();
        process.env.SMEPLUG_ENABLED = 'false';
        smeplugDisabled = await import('../services/providers/smeplug.js?disabled-instance');
    });

    afterAll(() => {
        process.env.SMEPLUG_ENABLED = 'true';
    });

    test('validateSmeplugConfig reports disabled, not an error, when SMEPLUG_ENABLED is not "true"', () => {
        expect(smeplugDisabled.validateSmeplugConfig()).toEqual({ enabled: false });
    });

    test('buyDataWithSmeplug returns a clean failure (not a thrown exception, not an internal message leak) when disabled', async () => {
        const result = await smeplugDisabled.buyDataWithSmeplug('MTN', '11', '08012345678', 'ref-disabled-1');
        expect(result.success).toBe(false);
        expect(result.status).toBe('failed');
        expect(result.errorCode).toBe('PROVIDER_UNAVAILABLE');
        expect(result.message).not.toMatch(/SMEPLUG_ENABLED/);
    });
});

describe('SmePlug webhook status normalization', () => {
    let webhookRoutes;

    beforeAll(async () => {
        webhookRoutes = await import('../routes/webhookRoutes.js');
    });

    test('normalizeSmeplugWebhookStatus recognizes a nested {transaction:{status}} payload', () => {
        expect(webhookRoutes.normalizeSmeplugWebhookStatus({ transaction: { status: 'success' } })).toBe('success');
        expect(webhookRoutes.normalizeSmeplugWebhookStatus({ transaction: { status: 'failed' } })).toBe('failed');
    });

    test('normalizeSmeplugWebhookStatus never guesses on an unrecognized status', () => {
        expect(webhookRoutes.normalizeSmeplugWebhookStatus({ transaction: { status: 'processing' } })).toBe(null);
        expect(webhookRoutes.normalizeSmeplugWebhookStatus({})).toBe(null);
    });
});
