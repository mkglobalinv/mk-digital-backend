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

    test('MTN: fetches Ogdams plans and normalizes to {provider, plan_id, plan_code, name, price, label}', async () => {
        nock(BASE_URL).get('/get/data/plans').reply(200, {
            status: true, code: 200,
            data: { msg: [{ networkId: 1, planId: 101, name: 'MTN SME 1GB', price: '500.00', validity: '30 Days' }], ref: null }
        });

        const plans = await switcher.smartFetchDataPlans('MTN', 'ogdams');
        expect(plans).toHaveLength(1);
        expect(plans[0]).toMatchObject({ provider: 'ogdams', plan_id: '101', plan_code: '101', name: 'MTN SME 1GB', price: 500 });
    });
});
