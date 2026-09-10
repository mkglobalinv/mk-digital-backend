// Covers the pure logic behind the V3 Pricing Engine (routes/adminRoutes.js's
// applyPricingRuleToPlans, used by POST /admin/pricing-rules and friends),
// after extending PricingRule with an optional `provider` field so a
// provider-scoped rule (e.g. Ogdams) can manage its own MTN Gifting pricing
// independently of the shared/default rule that still governs every other
// provider's plans for that network+category. Pure-function unit tests only;
// no DB/HTTP involved.
import { pricingRuleProviderFilter, computeV3Prices } from '../routes/adminRoutes.js';

describe('pricingRuleProviderFilter', () => {
    test('a provider-scoped rule only ever targets its own provider, regardless of what else is scoped', () => {
        expect(pricingRuleProviderFilter({ provider: 'ogdams' }, [])).toBe('ogdams');
        expect(pricingRuleProviderFilter({ provider: 'ogdams' }, ['peyflex'])).toBe('ogdams');
    });

    test('a default (no-provider) rule with no provider-scoped rules present applies to everything (no filter)', () => {
        expect(pricingRuleProviderFilter({ provider: undefined }, [])).toBeUndefined();
    });

    test('a default rule excludes any provider that has its own active scoped rule, so it never overwrites that provider\'s independent pricing', () => {
        expect(pricingRuleProviderFilter({ provider: undefined }, ['ogdams'])).toEqual({ $nin: ['ogdams'] });
        expect(pricingRuleProviderFilter({ provider: undefined }, ['ogdams', 'clubkonnect'])).toEqual({ $nin: ['ogdams', 'clubkonnect'] });
    });
});

describe('computeV3Prices', () => {
    test('computes retail/basic/vip/premium prices from a cost and the rule\'s percentages, matching the original V3 engine math', () => {
        const rule = { retailPercentage: 10, basicPercentage: 50, vipPercentage: 5 };
        const result = computeV3Prices(1000, rule);
        // retailMarkup = 1000 * 0.10 = 100 -> retailPrice = 1100
        expect(result.selling_price).toBe(1100);
        expect(result.reseller_price).toBe(1100);
        // basicExtraProfit = 100 * 0.50 = 50 -> 1100 + 50 = 1150
        expect(result.basic_selling_price).toBe(1150);
        // vipMarkup = 1000 * 0.05 = 50 -> vipPrice = 1050
        expect(result.vip_price).toBe(1050);
        expect(result.vip_selling_price).toBe(1050);
        expect(result.premium_price).toBe(1050);
        expect(result.premium_selling_price).toBe(1050);
    });

    test('treats a missing/zero cost as 0 rather than throwing or producing NaN', () => {
        const rule = { retailPercentage: 10, basicPercentage: 10, vipPercentage: 10 };
        const result = computeV3Prices(undefined, rule);
        expect(result.selling_price).toBe(0);
        expect(result.vip_price).toBe(0);
        expect(Number.isNaN(result.selling_price)).toBe(false);
    });

    test('two different Ogdams plans with different costs, priced under the same rule, produce independently correct prices', () => {
        const rule = { retailPercentage: 20, basicPercentage: 0, vipPercentage: 10 };
        const plan75mb = computeV3Prices(90, rule); // 75MB - 1 Day
        const plan11gb = computeV3Prices(4500, rule); // 11GB - 7 Days
        expect(plan75mb.selling_price).toBe(108); // 90 * 1.2
        expect(plan11gb.selling_price).toBe(5400); // 4500 * 1.2
    });
});
