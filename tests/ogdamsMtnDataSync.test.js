// Covers the new smartFetchDataPlans('...', 'ogdams') branch added to wire
// Ogdams into the existing admin "Sync Data Plans" flow (routes/adminRoutes.js
// POST /data-plans/sync), scoped to MTN only for the current phase. No real
// network call (nock-mocked); no database involved (smartFetchDataPlans is a
// pure fetch+normalize function, it never touches DataPlan/ProviderStatus).
import { jest } from '@jest/globals';

process.env.OGDAMS_ENABLED = 'true';
process.env.OGDAMS_API_KEY = 'sk_test_ogdams123';
process.env.OGDAMS_API_BASE_URL = 'https://simhosting.ogdams.ng/api/v1';

const BASE_URL = 'https://simhosting.ogdams.ng/api/v1';

describe('smartFetchDataPlans(..., "ogdams") -- MTN-only scope for the admin plan sync', () => {
    let nock;
    let switcher;

    beforeAll(async () => {
        nock = (await import('nock')).default;
        switcher = await import('../services/switcher.js');
    });

    afterEach(() => {
        nock.cleanAll();
    });

    // Order matters: smartFetchDataPlans caches successful results per
    // (option, network) at module scope for CACHE_TTL -- the failure case
    // must run before any successful MTN+ogdams fetch populates that cache,
    // or it would just see the cached result instead of exercising the
    // failure path.
    test('a real Ogdams fetch failure for MTN returns [] rather than throwing (never aborts the admin sync loop)', async () => {
        nock(BASE_URL).get('/get/data/plans').reply(424, { status: false, code: 424, data: { msg: 'error', ref: null } });

        const plans = await switcher.smartFetchDataPlans('MTN', 'ogdams');
        expect(plans).toEqual([]);
    });

    test('GLO/AIRTEL/9MOBILE: returns [] without calling Ogdams at all (no HTTP request made)', async () => {
        // No nock interceptor registered for any Ogdams path -- if the code
        // attempted a request for a non-MTN network, this would throw
        // "Nock: No match for request" and fail the test.
        for (const network of ['GLO', 'AIRTEL', '9MOBILE']) {
            const plans = await switcher.smartFetchDataPlans(network, 'ogdams');
            expect(plans).toEqual([]);
        }
    });

    // The next two tests both need a fresh, uncached smartFetchDataPlans('MTN',
    // 'ogdams') call -- the module-scope cache (keyed by option+network, TTL
    // 5 min) would otherwise make the second test see the first test's cached
    // result instead of actually exercising its own mocked response. Each
    // test below does its own jest.resetModules() + fresh dynamic import to
    // get an independent cache instance, same pattern used in
    // tests/ogdamsProvider.test.js's disabled/enabled describe block.
    test('MTN: fetches Ogdams plans and normalizes to {provider, plan_id, plan_code, name, price, label} -- using a confirmed Data Gifting plan ID', async () => {
        jest.resetModules();
        const freshSwitcher = await import('../services/switcher.js?gifting-fetch-test');
        nock(BASE_URL).get('/get/data/plans').reply(200, {
            status: true, code: 200,
            // 497 = "1GB Daily", one of the three plan IDs Ogdams support
            // confirmed are MTN Data Gifting.
            data: { msg: [{ networkId: 1, planId: 497, name: 'MTN 1GB Daily', price: '450.00', validity: '1 Day' }], ref: null }
        });

        const plans = await freshSwitcher.smartFetchDataPlans('MTN', 'ogdams');
        expect(plans).toHaveLength(1);
        expect(plans[0]).toMatchObject({ provider: 'ogdams', plan_id: '497', plan_code: '497', name: 'MTN 1GB Daily', price: 450 });
    });

    test('a non-Gifting MTN plan mixed into the same response is filtered out -- only the confirmed Gifting plan IDs ever sync', async () => {
        jest.resetModules();
        const freshSwitcher = await import('../services/switcher.js?gifting-filter-test');
        nock(BASE_URL).get('/get/data/plans').reply(200, {
            status: true, code: 200,
            data: {
                msg: [
                    { networkId: 1, planId: 497, name: 'MTN 1GB Daily', price: '450.00', validity: '1 Day' }, // confirmed Gifting
                    { networkId: 1, planId: 202, name: 'MTN SME 2GB', price: '900.00', validity: '30 Days' }  // NOT in the whitelist -- e.g. an SME plan
                ],
                ref: null
            }
        });

        const plans = await freshSwitcher.smartFetchDataPlans('MTN', 'ogdams');
        expect(plans).toHaveLength(1);
        expect(plans[0].plan_id).toBe('497');
        expect(plans.some((p) => p.plan_id === '202')).toBe(false);
    });
});
