// Regression test for data purchases failing in the background queue.
//
// smartBuyData() looked the plan up by api_plan_id alone, but DataPlan's
// unique index is {api_plan_id, provider, network} and providers reuse small
// numeric ids (SmePlug "6", ClubKonnect "6", ...). The lookup could resolve to
// another network's/provider's plan, so the order was sent to the wrong
// provider API and failed (then got refunded) even though the customer picked
// a valid plan. The lookup must be scoped to network and, when known, provider.

import { jest } from '@jest/globals';

describe('smartBuyData plan lookup', () => {
    let DataPlan;
    let ProviderStatus;
    let smartBuyData;
    let originalFindOne;
    let originalStatusFindOne;

    beforeAll(async () => {
        DataPlan = (await import('../models/DataPlan.js')).default;
        ProviderStatus = (await import('../models/ProviderStatus.js')).default;
        ({ smartBuyData } = await import('../services/switcher.js'));
        originalFindOne = DataPlan.findOne;
        originalStatusFindOne = ProviderStatus.findOne;
        // Report the resolved provider as offline so no provider HTTP call is made;
        // the failure message names which provider the plan resolved to.
        ProviderStatus.findOne = async () => ({ isAvailable: false });
    });

    afterAll(() => {
        DataPlan.findOne = originalFindOne;
        ProviderStatus.findOne = originalStatusFindOne;
    });

    test('scopes the lookup to network and plan provider', async () => {
        let captured;
        DataPlan.findOne = async (query) => {
            captured = query;
            return { provider: 'smeplug' };
        };

        const result = await smartBuyData('mtn', '6', '08030000000', 500, 'NG', null, null, 'smart', 'GiftingXtra', 'SmePlug');

        expect(captured).toEqual({ api_plan_id: '6', network: 'MTN', provider: 'smeplug' });
        expect(result.message).toContain('smeplug');
    });

    test('still scopes to network when provider is unknown (transactions queued before this fix)', async () => {
        let captured;
        DataPlan.findOne = async (query) => {
            captured = query;
            return { provider: 'clubkonnect' };
        };

        await smartBuyData('GLO', '6', '08050000000', 500);

        expect(captured).toEqual({ api_plan_id: '6', network: 'GLO' });
    });
});
