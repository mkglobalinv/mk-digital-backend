import AirtimeCashPricing from '../../models/AirtimeCashPricing.js';
import AirtimeCashTransaction from '../../models/AirtimeCashTransaction.js';
import AirtimeCashAuditLog from '../../models/AirtimeCashAuditLog.js';
import { getProviderConfig } from '../../services/airtimeToCash/providers/index.js';
import * as AirtimeToCashService from '../../services/airtimeToCash/AirtimeToCashService.js';
import { toSafeTransactionView } from '../../services/airtimeToCash/security.js';

const NETWORKS = ['MTN', 'AIRTEL', 'GLO', '9MOBILE'];

function handleError(res, err) {
    const statusByName = { NotFoundError: 404, InvalidStateError: 409 };
    const status = statusByName[err.name] || (err.name === 'ValidationError' ? 400 : 500);
    if (status === 500) {
        console.error('[AirtimeToCash Admin]', err);
        return res.status(500).json({ status: 'error', message: 'Something went wrong.' });
    }
    return res.status(status).json({ status: 'error', message: err.message });
}

// --- PROVIDER CONFIG (item 3, 11, 17) ---

export const getConfig = async (req, res) => {
    try {
        const config = await getProviderConfig();
        // apiToken is intentionally omitted entirely -- the admin UI shows only
        // whether one is currently set (`hasApiToken`), never the value, even to a
        // platform admin's own browser session.
        res.json({
            status: 'success',
            data: {
                provider: config.provider,
                isActive: config.isActive,
                isTestMode: config.isTestMode,
                hasApiToken: Boolean(config.credentials?.apiToken),
                apiBaseUrl: config.credentials?.apiBaseUrl,
                networks: config.networks,
                limits: config.limits,
                lastTestedAt: config.lastTestedAt,
                testStatus: config.testStatus
            }
        });
    } catch (err) {
        handleError(res, err);
    }
};

export const updateConfig = async (req, res) => {
    try {
        const { apiToken, apiBaseUrl, isTestMode, isActive, networks, limits } = req.body;
        const config = await getProviderConfig();

        if (apiToken) config.credentials.apiToken = apiToken;
        if (apiBaseUrl) config.credentials.apiBaseUrl = apiBaseUrl;
        if (isTestMode !== undefined) config.isTestMode = Boolean(isTestMode);

        if (networks && typeof networks === 'object') {
            for (const net of NETWORKS) {
                if (networks[net] !== undefined) config.networks[net] = Boolean(networks[net]);
            }
        }

        if (limits && typeof limits === 'object') {
            if (limits.minAmount !== undefined) config.limits.minAmount = Number(limits.minAmount);
            if (limits.maxAmount !== undefined) config.limits.maxAmount = Number(limits.maxAmount);
        }

        // Global master switch. Per the production-activation requirement, flipping
        // this to true is an explicit, deliberate admin action -- not a side effect
        // of any other field changing.
        if (isActive !== undefined) {
            if (isActive && !config.credentials?.apiToken) {
                return res.status(400).json({ status: 'error', message: 'Cannot enable Airtime-to-Cash without an API token configured.' });
            }
            config.isActive = Boolean(isActive);
        }

        await config.save();
        await AirtimeCashAuditLogEntry({ actorId: req.user._id, action: 'PROVIDER_CONFIG_UPDATED', ip: req.ip });

        res.json({ status: 'success', message: 'Configuration updated.' });
    } catch (err) {
        handleError(res, err);
    }
};

async function AirtimeCashAuditLogEntry({ actorId, action, metadata, ip }) {
    try {
        await AirtimeCashAuditLog.create({ actorType: 'admin', actorId, action, metadata, ip });
    } catch (err) {
        console.error('[AirtimeToCash Admin Audit] Failed:', err.message);
    }
}

// --- PRICING (item 11-15) ---

export const listPricing = async (req, res) => {
    try {
        const rows = await AirtimeCashPricing.find({}).sort({ network: 1, tenantId: 1 });
        res.json({ status: 'success', data: rows });
    } catch (err) {
        handleError(res, err);
    }
};

export const upsertPricing = async (req, res) => {
    try {
        const { tenantId, network, conversionPercentage, fixedFee, minAmount, maxAmount, isEnabled } = req.body;

        if (!network || !NETWORKS.includes(String(network).toUpperCase())) {
            return res.status(400).json({ status: 'error', message: 'A valid network is required.' });
        }
        if (conversionPercentage === undefined || conversionPercentage < 0 || conversionPercentage > 100) {
            return res.status(400).json({ status: 'error', message: 'conversionPercentage must be between 0 and 100.' });
        }
        if (minAmount === undefined || maxAmount === undefined || Number(minAmount) > Number(maxAmount)) {
            return res.status(400).json({ status: 'error', message: 'minAmount and maxAmount are required, and minAmount must not exceed maxAmount.' });
        }

        const filter = { tenantId: tenantId || null, network: String(network).toUpperCase() };
        const update = {
            conversionPercentage: Number(conversionPercentage),
            fixedFee: Number(fixedFee) || 0,
            minAmount: Number(minAmount),
            maxAmount: Number(maxAmount),
            isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
            updatedBy: req.user._id
        };

        const row = await AirtimeCashPricing.findOneAndUpdate(filter, { $set: update }, { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true });

        await AirtimeCashAuditLogEntry({ actorId: req.user._id, action: 'PRICING_UPDATED', metadata: { tenantId: filter.tenantId, network: filter.network, ...update }, ip: req.ip });

        res.json({ status: 'success', data: row });
    } catch (err) {
        handleError(res, err);
    }
};

export const deletePricing = async (req, res) => {
    try {
        const row = await AirtimeCashPricing.findByIdAndDelete(req.params.id);
        if (!row) return res.status(404).json({ status: 'error', message: 'Pricing rule not found.' });
        await AirtimeCashAuditLogEntry({ actorId: req.user._id, action: 'PRICING_DELETED', metadata: { tenantId: row.tenantId, network: row.network }, ip: req.ip });
        res.json({ status: 'success', message: 'Pricing rule removed.' });
    } catch (err) {
        handleError(res, err);
    }
};

// --- TRANSACTIONS (item 19-20) ---

export const listTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const { status, tenantId, network } = req.query;
        const txs = await AirtimeToCashService.listAllTransactions({ page, limit, status, tenantId, network });
        res.json({ status: 'success', data: txs.map((t) => toSafeTransactionView(t, { includeAdminFields: true })) });
    } catch (err) {
        handleError(res, err);
    }
};

export const getTransaction = async (req, res) => {
    try {
        const tx = await AirtimeCashTransaction.findOne({ reference: req.params.reference });
        if (!tx) return res.status(404).json({ status: 'error', message: 'Transaction not found.' });
        const audit = await AirtimeToCashService.getAuditTrail(tx._id);
        res.json({ status: 'success', data: { transaction: toSafeTransactionView(tx, { includeAdminFields: true }), audit } });
    } catch (err) {
        handleError(res, err);
    }
};

export const resolveManualReview = async (req, res) => {
    try {
        const { decision, note } = req.body;
        const tx = await AirtimeToCashService.adminResolveManualReview({
            reference: req.params.reference,
            adminId: req.user._id,
            decision,
            note,
            ip: req.ip
        });
        res.json({ status: 'success', data: toSafeTransactionView(tx, { includeAdminFields: true }) });
    } catch (err) {
        handleError(res, err);
    }
};
