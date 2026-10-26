// Regression test: the smeplug ProviderStatus document was only ever written
// on insert ($setOnInsert). One created while SMEPLUG_ENABLED was unset, or
// one hit by an automatic hard block, stayed isAvailable=false forever, and
// every SmePlug purchase failed with "Provider (smeplug) ... is currently
// offline" before SmePlug was ever called. Startup must sync it to env config.

import { jest } from '@jest/globals';

process.env.SMEPLUG_ENABLED = 'true';
process.env.SMEPLUG_API_KEY = 'sk_test_smeplug123';

describe('ensureSmeplugProviderStatus startup sync', () => {
    let ProviderStatus;
    let ensureSmeplugProviderStatus;
    let originals;
    let updateCall;

    beforeAll(async () => {
        ProviderStatus = (await import('../models/ProviderStatus.js')).default;
        ({ ensureSmeplugProviderStatus } = await import('../services/providers/smeplug.js'));
        originals = { findOneAndUpdate: ProviderStatus.findOneAndUpdate, updateOne: ProviderStatus.updateOne };
        ProviderStatus.findOneAndUpdate = async () => ({});
        ProviderStatus.updateOne = async (filter, update) => {
            updateCall = { filter, update };
            return { matchedCount: 1, modifiedCount: 1 };
        };
    });

    afterAll(() => {
        Object.assign(ProviderStatus, originals);
    });

    test('re-enables a blocked smeplug when it is enabled and configured', async () => {
        await ensureSmeplugProviderStatus();

        expect(updateCall.update.$set).toMatchObject({ isAvailable: true, apiStatus: 'online', isUnderMaintenance: false, failureCount: 0 });
    });

    test('never overrides an admin manual disable', async () => {
        await ensureSmeplugProviderStatus();

        expect(updateCall.filter).toEqual({ providerName: 'smeplug', manualDisabled: { $ne: true } });
    });
});
