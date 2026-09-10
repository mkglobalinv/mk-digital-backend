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
            // 20002 = "1GB - 1 Day", one of the nine plan IDs Ogdams support
            // confirmed are MTN Data Gifting.
            data: { msg: [{ networkId: 1, planId: 20002, name: 'MTN 1GB Daily', price: '450.00', validity: '1 Day' }], ref: null }
        });

        const plans = await freshSwitcher.smartFetchDataPlans('MTN', 'ogdams');
        expect(plans).toHaveLength(1);
        expect(plans[0]).toMatchObject({ provider: 'ogdams', plan_id: '20002', plan_code: '20002', name: 'MTN 1GB Daily', price: 450 });
    });

    test('a non-Gifting MTN plan mixed into the same response is filtered out -- only the confirmed Gifting plan IDs ever sync', async () => {
        jest.resetModules();
        const freshSwitcher = await import('../services/switcher.js?gifting-filter-test');
        nock(BASE_URL).get('/get/data/plans').reply(200, {
            status: true, code: 200,
            data: {
                msg: [
                    { networkId: 1, planId: 20002, name: 'MTN 1GB Daily', price: '450.00', validity: '1 Day' }, // confirmed Gifting
                    { networkId: 1, planId: 202, name: 'MTN SME 2GB', price: '900.00', validity: '30 Days' }  // NOT in the whitelist -- e.g. an SME plan
                ],
                ref: null
            }
        });

        const plans = await freshSwitcher.smartFetchDataPlans('MTN', 'ogdams');
        expect(plans).toHaveLength(1);
        expect(plans[0].plan_id).toBe('20002');
        expect(plans.some((p) => p.plan_id === '202')).toBe(false);
    });

    test('all nine confirmed MTN Data Gifting plan IDs sync, and non-whitelisted IDs (including the old placeholder examples) never sync', async () => {
        jest.resetModules();
        const freshSwitcher = await import('../services/switcher.js?gifting-full-whitelist-test');
        const confirmed = [
            { networkId: 1, planId: 20000, name: 'MTN 75MB - 1 Day', price: '90.00', validity: '1 Day' },
            { networkId: 1, planId: 20002, name: 'MTN 1GB - 1 Day', price: '450.00', validity: '1 Day' },
            { networkId: 1, planId: 20006, name: 'MTN 2GB - 2 Days', price: '850.00', validity: '2 Days' },
            { networkId: 1, planId: 20007, name: 'MTN 2.5GB - 2 Days', price: '1000.00', validity: '2 Days' },
            { networkId: 1, planId: 20008, name: 'MTN 3.2GB - 2 Days', price: '1200.00', validity: '2 Days' },
            { networkId: 1, planId: 20013, name: 'MTN 1GB - 7 Days', price: '1300.00', validity: '7 Days' },
            { networkId: 1, planId: 20014, name: 'MTN 1.2GB - 7 Days', price: '1400.00', validity: '7 Days' },
            { networkId: 1, planId: 20015, name: 'MTN 1.5GB - 7 Days', price: '1500.00', validity: '7 Days' },
            { networkId: 1, planId: 20017, name: 'MTN 11GB - 7 Days', price: '4500.00', validity: '7 Days' }
        ];
        // 541/497/498 were the earlier placeholder example IDs -- they must no
        // longer sync now that the whitelist has been replaced by the 9
        // confirmed IDs.
        const nonWhitelisted = [
            { networkId: 1, planId: 541, name: 'MTN 500MB Daily (old example)', price: '400.00', validity: '1 Day' },
            { networkId: 1, planId: 497, name: 'MTN 1GB Daily (old example)', price: '450.00', validity: '1 Day' },
            { networkId: 1, planId: 498, name: 'MTN 2.5GB Daily (old example)', price: '900.00', validity: '1 Day' }
        ];
        nock(BASE_URL).get('/get/data/plans').reply(200, {
            status: true, code: 200,
            data: { msg: [...confirmed, ...nonWhitelisted], ref: null }
        });

        const plans = await freshSwitcher.smartFetchDataPlans('MTN', 'ogdams');
        expect(plans).toHaveLength(9);
        const syncedIds = plans.map((p) => p.plan_id).sort();
        expect(syncedIds).toEqual(['20000', '20002', '20006', '20007', '20008', '20013', '20014', '20015', '20017']);
        expect(plans.some((p) => ['541', '497', '498'].includes(p.plan_id))).toBe(false);
    });
});
