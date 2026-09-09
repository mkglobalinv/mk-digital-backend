import * as AirtimeToCashService from '../services/airtimeToCash/AirtimeToCashService.js';
import { resolveEffectivePricing } from '../services/airtimeToCash/pricing.js';
import { toSafeTransactionView } from '../services/airtimeToCash/security.js';

const NETWORKS = ['MTN', 'AIRTEL', 'GLO', '9MOBILE'];

/**
 * Read-only view of the tenant's OWN effective Airtime-to-Cash rates (their own
 * override if one exists, otherwise the global default they're currently getting).
 * Rate-setting itself is a main-platform-admin-only action (see
 * routes/admin/airtimeCashAdminRoutes.js) -- this route never accepts a write.
 */
export const getOwnPricing = async (req, res) => {
    try {
        const tenantId = req.user._id;
        const rows = {};
        for (const net of NETWORKS) {
            const resolved = await resolveEffectivePricing(tenantId, net);
            rows[net] = resolved ? { ...resolved.row.toObject(), source: resolved.source } : null;
        }
        res.json({ status: 'success', data: rows });
    } catch (err) {
        console.error('[Reseller AirtimeToCash]', err);
        res.status(500).json({ status: 'error', message: 'Something went wrong.' });
    }
};

// Tenant isolation: tenantId always comes from the authenticated reseller's own
// _id, never from a query/body param -- a reseller can never pass another
// reseller's id to read their transactions.
export const listOwnTenantTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const txs = await AirtimeToCashService.listTenantTransactions(req.user._id, { page, limit, status: req.query.status });
        res.json({ status: 'success', data: txs.map((t) => toSafeTransactionView(t)) });
    } catch (err) {
        console.error('[Reseller AirtimeToCash]', err);
        res.status(500).json({ status: 'error', message: 'Something went wrong.' });
    }
};
