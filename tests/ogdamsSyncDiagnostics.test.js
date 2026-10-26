// Ogdams as a data provider: (1) the admin plan sync used to report only
// "Added: 0, Updated: 0" when Ogdams gave nothing back, hiding why; (2) the
// ogdams ProviderStatus document was only written on insert, so one created
// while OGDAMS_ENABLED was unset stayed "offline" forever, failing purchases.

import { jest } from '@jest/globals';

process.env.OGDAMS_ENABLED = 'true';
process.env.OGDAMS_API_KEY = 'sk_test_ogdams123';
process.env.OGDAMS_API_BASE_URL = 'https://simhosting.ogdams.ng/api/v1';

const BASE_URL = 'https://simhosting.ogdams.ng/api/v1';

describe('Ogdams plan sync diagnostics and startup status', () => {
    let nock;
    let ogdams;
    let ProviderStatus;

    beforeAll(async () => {
        nock = (await import('nock')).default;
        ogdams = await import('../services/providers/ogdams.js');
        ProviderStatus = (await import('../models/ProviderStatus.js')).default;
    });

    afterEach(() => {
        nock.cleanAll();
    });

    test('explains an account that returns no plans at all', async () => {
        nock(BASE_URL).get('/get/data/plans').reply(200, { status: true, code: 200, data: { msg: [] } });

        expect(await ogdams.explainEmptyOgdamsSync()).toMatch(/no plans at all/);
    });

    test('explains a rejected key / non-whitelisted IP', async () => {
        nock(BASE_URL).get('/get/data/plans').reply(401, { status: false, code: 401, data: { msg: 'Unauthorized' } });

        expect(await ogdams.explainEmptyOgdamsSync()).toMatch(/401/);
    });

    test('names the MTN plan IDs when none match the Gifting whitelist', async () => {
        nock(BASE_URL).get('/get/data/plans').reply(200, {
            status: true, code: 200,
            data: { msg: [{ networkId: 1, planId: 99999, name: '500MB', price: 150, validity: '1 Day' }] }
        });

        const reason = await ogdams.explainEmptyOgdamsSync();
        expect(reason).toContain('99999');
        expect(reason).toContain('20000');
    });

    test('startup re-enables a stuck ogdams status without overriding a manual disable', async () => {
        const originals = { findOneAndUpdate: ProviderStatus.findOneAndUpdate, updateOne: ProviderStatus.updateOne };
        let updateCall;
        ProviderStatus.findOneAndUpdate = async () => ({});
        ProviderStatus.updateOne = async (filter, update) => {
            updateCall = { filter, update };
            return { matchedCount: 1, modifiedCount: 1 };
        };
        try {
            await ogdams.ensureOgdamsProviderStatus();
        } finally {
            Object.assign(ProviderStatus, originals);
        }

        expect(updateCall.filter).toEqual({ providerName: 'ogdams', manualDisabled: { $ne: true } });
        expect(updateCall.update.$set).toMatchObject({ isAvailable: true, apiStatus: 'online' });
    });
});
