// Regression test: an automatic hard block (activateHardBlock sets
// isAvailable=false) on a provider with no balance poller, like smeplug, could
// never be lifted. "Reset failures" and the Active toggle in the admin
// Monitoring Dashboard left isAvailable=false, so every purchase kept failing
// with "Provider (smeplug) for this data plan is currently offline".

import { jest } from '@jest/globals';

describe('lifting an automatic provider hard block', () => {
    let ProviderStatus;
    let resetProviderFailures;
    let originalFindOne;

    beforeAll(async () => {
        ProviderStatus = (await import('../models/ProviderStatus.js')).default;
        ({ resetProviderFailures } = await import('../services/providerMonitoringService.js'));
        originalFindOne = ProviderStatus.findOne;
    });

    afterAll(() => {
        ProviderStatus.findOne = originalFindOne;
    });

    const hardBlocked = (overrides = {}) => ({
        providerName: 'smeplug',
        isAvailable: false,
        apiStatus: 'disconnected',
        failureCount: 3,
        manualDisabled: false,
        save: async () => {},
        ...overrides
    });

    test('reset failures re-enables a hard-blocked provider', async () => {
        const doc = hardBlocked();
        ProviderStatus.findOne = async () => doc;

        await resetProviderFailures('smeplug');

        expect(doc.isAvailable).toBe(true);
        expect(doc.failureCount).toBe(0);
        expect(doc.apiStatus).not.toBe('disconnected');
    });

    test('reset failures leaves a manually disabled provider disabled', async () => {
        const doc = hardBlocked({ manualDisabled: true });
        ProviderStatus.findOne = async () => doc;

        await resetProviderFailures('smeplug');

        expect(doc.isAvailable).toBe(false);
    });
});
