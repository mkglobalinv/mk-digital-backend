// Covers the pure merge logic behind GET /admin/data-plans/ogdams-sme
// (routes/adminRoutes.js's mergeOgdamsSmePlans), which backs the new,
// independent "Ogdams MTN SME Pricing" admin page. Pure-function unit tests
// only; no DB/HTTP involved.
import { mergeOgdamsSmePlans } from '../routes/adminRoutes.js';

const WHITELIST = Object.freeze({
    '20000': '75MB - 1 Day',
    '20002': '1GB - 1 Day',
    '20006': '2GB - 2 Days'
});

describe('mergeOgdamsSmePlans', () => {
    test('returns exactly one row per whitelist entry, in whitelist order, even when nothing has synced yet', () => {
        const rows = mergeOgdamsSmePlans([], WHITELIST);
        expect(rows).toHaveLength(3);
        expect(rows.map((r) => r.plan_id)).toEqual(['20000', '20002', '20006']);
        expect(rows.every((r) => r.synced === false)).toBe(true);
        expect(rows.every((r) => r._id === null)).toBe(true);
        expect(rows.every((r) => r.status === false)).toBe(true);
    });

    test('a plan ID with a matching synced DataPlan document reports synced: true with its real cost/price/profit/status, plus all reseller pricing tiers', () => {
        const existingPlans = [
            { _id: 'abc123', api_plan_id: '20002', plan_name: 'MTN 1GB Daily', plan_size: '1GB', validity: '1 Day', api_price: 450, selling_price: 500, reseller_price: 480, vip_price: 470, premium_price: 460, profit: 50, status: true }
        ];
        const rows = mergeOgdamsSmePlans(existingPlans, WHITELIST);
        const row = rows.find((r) => r.plan_id === '20002');
        expect(row).toMatchObject({
            _id: 'abc123', synced: true, plan_name: 'MTN 1GB Daily', api_price: 450, selling_price: 500,
            reseller_price: 480, vip_price: 470, premium_price: 460, profit: 50, status: true
        });

        // Unmatched IDs stay unsynced -- a document existing for one plan ID
        // must never bleed into another plan ID's row.
        const unsynced = rows.filter((r) => r.plan_id !== '20002');
        expect(unsynced.every((r) => r.synced === false)).toBe(true);
        expect(unsynced.every((r) => r.reseller_price === null && r.vip_price === null && r.premium_price === null)).toBe(true);
    });

    test('a DataPlan document whose api_plan_id is not in the whitelist is silently ignored (never injected as an extra row)', () => {
        const existingPlans = [
            { _id: 'xyz', api_plan_id: '541', plan_name: 'Old placeholder plan', api_price: 250, selling_price: 300, profit: 50, status: true }
        ];
        const rows = mergeOgdamsSmePlans(existingPlans, WHITELIST);
        expect(rows).toHaveLength(3);
        expect(rows.every((r) => r.plan_id !== '541')).toBe(true);
    });

    test('an inactive (status: false) synced plan is still reported with synced: true, preserving the admin-set status rather than masking it', () => {
        const existingPlans = [
            { _id: 'def456', api_plan_id: '20000', plan_name: 'MTN 75MB Daily', api_price: 90, selling_price: 110, profit: 20, status: false }
        ];
        const rows = mergeOgdamsSmePlans(existingPlans, WHITELIST);
        const row = rows.find((r) => r.plan_id === '20000');
        expect(row.synced).toBe(true);
        expect(row.status).toBe(false);
    });
});
