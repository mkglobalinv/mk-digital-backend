// Tests services/providerRouting.js -- the admin-controllable "which provider
// handles this service+network" logic, built entirely on the existing
// ProviderCategory visibility mechanism. In-memory fakes for DataPlan/
// ProviderCategory (no live MongoDB in this environment); no real HTTP calls
// (this layer never talks to a provider API at all, it only flips
// visibility flags that the existing, unmodified purchase-plan-listing
// endpoint already respects).
import { jest } from '@jest/globals';

function makeFakeDataPlan(seedDocs) {
    return {
        _store: [...seedDocs],
        distinct: async function (field, query = {}) {
            const matches = this._store.filter((d) => Object.entries(query).every(([k, v]) => d[k] === v));
            return [...new Set(matches.map((d) => d[field]))];
        }
    };
}

function makeFakeProviderCategory() {
    const store = [];
    return {
        _store: store,
        find: (query) => ({
            lean: async () => {
                if (query?.category_name?.$in) {
                    const regexes = query.category_name.$in;
                    return store.filter((doc) => regexes.some((r) => r.test(doc.category_name)));
                }
                return [...store];
            }
        }),
        findOneAndUpdate: async (filter, update, options) => {
            let doc = store.find((d) => d.provider_name === filter.provider_name && d.category_name === filter.category_name);
            if (!doc) {
                if (!options?.upsert) return null;
                doc = { provider_name: filter.provider_name, category_name: filter.category_name, visibility: 'VISIBLE', status: 'ACTIVE' };
                store.push(doc);
            }
            if (update.$set) Object.assign(doc, update.$set);
            return doc;
        }
    };
}

describe('services/providerRouting.js', () => {
    let fakeDataPlan;
    let fakeProviderCategory;
    let routing;

    beforeEach(async () => {
        jest.resetModules();
        // MTN has plans on 'ogdams' (one category: Direct) and 'peyflex' (two
        // categories: SME, Gifting) -- deliberately asymmetric, to prove the
        // "owns every category" check is real and not just checking one row.
        // AIRTEL/GLO/9MOBILE have peyflex-only plans (matches "everything else
        // continues using the existing configured provider").
        fakeDataPlan = makeFakeDataPlan([
            { network: 'MTN', category: 'Direct', provider: 'ogdams' },
            { network: 'MTN', category: 'SME', provider: 'peyflex' },
            { network: 'MTN', category: 'Gifting', provider: 'peyflex' },
            { network: 'AIRTEL', category: 'SME', provider: 'peyflex' },
            { network: 'GLO', category: 'SME', provider: 'peyflex' },
            { network: '9MOBILE', category: 'SME', provider: 'peyflex' }
        ]);
        fakeProviderCategory = makeFakeProviderCategory();

        jest.unstable_mockModule('../models/DataPlan.js', () => ({ default: fakeDataPlan }));
        jest.unstable_mockModule('../models/ProviderCategory.js', () => ({ default: fakeProviderCategory }));

        routing = await import('../services/providerRouting.js');
    });

    test('default state (no explicit selection yet): resolves to null, not a guessed provider -- every category defaults VISIBLE so no single provider "owns" MTN yet', async () => {
        const result = await routing.resolveDataProviderForNetwork('MTN');
        expect(result.provider).toBeNull();
        expect(result.providers.sort()).toEqual(['ogdams', 'peyflex'].sort());
    });

    test('1. MTN DATA -> Ogdams: setDataProviderForNetwork makes ogdams the sole resolved provider for MTN', async () => {
        await routing.setDataProviderForNetwork('MTN', 'ogdams', 'admin1');
        const result = await routing.resolveDataProviderForNetwork('MTN');
        expect(result.provider).toBe('ogdams');
    });

    test('2. MTN AIRTIME -> Peyflex: the summary reports airtime fixed to peyflex for every network, unaffected by data routing', async () => {
        await routing.setDataProviderForNetwork('MTN', 'ogdams', 'admin1');
        const summary = await routing.getProviderRoutingSummary();
        const mtnAirtime = summary.airtime.find((r) => r.network === 'MTN');
        expect(mtnAirtime).toMatchObject({ service: 'airtime', network: 'MTN', provider: 'peyflex', fixed: true });
        expect(summary.airtime.every((r) => r.provider === 'peyflex' && r.fixed === true)).toBe(true);

        const mtnData = summary.data.find((r) => r.network === 'MTN');
        expect(mtnData.provider).toBe('ogdams');
    });

    test('3-5. Airtel/Glo/9mobile DATA remain on the existing provider after an MTN-only routing change', async () => {
        const before = await Promise.all(['AIRTEL', 'GLO', '9MOBILE'].map((n) => routing.resolveDataProviderForNetwork(n)));
        await routing.setDataProviderForNetwork('MTN', 'ogdams', 'admin1');
        const after = await Promise.all(['AIRTEL', 'GLO', '9MOBILE'].map((n) => routing.resolveDataProviderForNetwork(n)));
        expect(after).toEqual(before);
        // And no ProviderCategory row was ever created for those networks --
        // proves the MTN-scoped write never touched other networks' data.
        const otherNetworkRows = fakeProviderCategory._store.filter((r) => !r.category_name.startsWith('MTN'));
        expect(otherNetworkRows).toHaveLength(0);
    });

    test('6. Change MTN DATA from Ogdams -> Peyflex', async () => {
        await routing.setDataProviderForNetwork('MTN', 'ogdams', 'admin1');
        expect((await routing.resolveDataProviderForNetwork('MTN')).provider).toBe('ogdams');

        await routing.setDataProviderForNetwork('MTN', 'peyflex', 'admin1');
        expect((await routing.resolveDataProviderForNetwork('MTN')).provider).toBe('peyflex');
    });

    test('7. Change MTN DATA from Peyflex -> Ogdams', async () => {
        await routing.setDataProviderForNetwork('MTN', 'peyflex', 'admin1');
        expect((await routing.resolveDataProviderForNetwork('MTN')).provider).toBe('peyflex');

        await routing.setDataProviderForNetwork('MTN', 'ogdams', 'admin1');
        expect((await routing.resolveDataProviderForNetwork('MTN')).provider).toBe('ogdams');
    });

    test('8. Selecting Ogdams for an unsupported service/network is rejected -- no ProviderCategory row is touched', async () => {
        await expect(routing.setDataProviderForNetwork('GLO', 'ogdams', 'admin1')).rejects.toThrow(/not currently supported/i);
        expect(fakeProviderCategory._store).toHaveLength(0);
    });

    test('8b. Selecting a provider with no plans on that network is rejected (e.g. ogdams for AIRTEL, which has none in this fixture)', async () => {
        // Distinct from the hard Ogdams restriction above: this is the general
        // "can't route to a provider with nothing to sell" guard, which would
        // also reject e.g. an unconfigured third provider name for any network.
        await expect(routing.setDataProviderForNetwork('AIRTEL', 'ogdams', 'admin1')).rejects.toThrow();
    });

    test('9. Existing provider behavior is unchanged for a network never touched by a routing change', async () => {
        // AIRTEL was never explicitly routed -- still resolves exactly as it
        // did before any routing action ever ran (null/default, peyflex-only
        // available), proving "if no override exists, preserve existing
        // behavior" holds structurally, not just by coincidence.
        const result = await routing.resolveDataProviderForNetwork('AIRTEL');
        expect(result.providers).toEqual(['peyflex']);
    });
});
