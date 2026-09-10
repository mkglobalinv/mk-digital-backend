import * as AirtimeToCashService from '../services/airtimeToCash/AirtimeToCashService.js';
import { toSafeTransactionView } from '../services/airtimeToCash/security.js';

// tenantId is ALWAYS derived from req.reseller (set by middlewares/whiteLabel.js from
// the request's Host header), never from anything the client sends in the body --
// this is what makes tenant isolation for pricing/transactions non-negotiable rather
// than something a route handler could get wrong per-call.
function currentTenantId(req) {
    return req.reseller?._id || null;
}

function handleServiceError(res, err) {
    const statusByName = {
        ServiceDisabledError: 400,
        NotFoundError: 404,
        InvalidStateError: 409,
        PricingNotConfiguredError: 400,
        AmountOutOfRangeError: 400
    };
    const status = statusByName[err.name] || 500;
    if (status === 500) {
        console.error('[AirtimeToCash]', err);
        return res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
    }
    return res.status(status).json({ status: 'error', message: err.message });
}

export const getConfig = async (req, res) => {
    try {
        const config = await AirtimeToCashService.getPublicConfig(currentTenantId(req));
        res.json({ status: 'success', data: config });
    } catch (err) {
        handleServiceError(res, err);
    }
};

export const getRecentNumbers = async (req, res) => {
    try {
        const numbers = await AirtimeToCashService.listOwnRecentNumbers(req.user._id);
        res.json({ status: 'success', data: { myNumber: req.user.phone || null, recent: numbers } });
    } catch (err) {
        handleServiceError(res, err);
    }
};

export const getQuote = async (req, res) => {
    try {
        const { network, amount } = req.body;
        if (!network || !amount) {
            return res.status(400).json({ status: 'error', message: 'network and amount are required.' });
        }
        const quote = await AirtimeToCashService.getQuote({ tenantId: currentTenantId(req), network, amount });
        res.json({ status: 'success', data: quote });
    } catch (err) {
        handleServiceError(res, err);
    }
};

export const requestOtp = async (req, res) => {
    try {
        const { network, phone, amount } = req.body;
        if (!network || !phone || !amount) {
            return res.status(400).json({ status: 'error', message: 'network, phone and amount are required.' });
        }
        const idempotencyKey = req.body.reference || req.body.idempotencyKey || req.headers['idempotency-key'];

        const tx = await AirtimeToCashService.requestOtp({
            customerId: req.user._id,
            tenantId: currentTenantId(req),
            network,
            phone,
            amount,
            idempotencyKey,
            ip: req.ip
        });

        res.json({ status: 'success', data: toSafeTransactionView(tx) });
    } catch (err) {
        handleServiceError(res, err);
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { reference, otp } = req.body;
        if (!reference || !otp) {
            return res.status(400).json({ status: 'error', message: 'reference and otp are required.' });
        }
        const tx = await AirtimeToCashService.verifyOtp({ reference, customerId: req.user._id, otp, ip: req.ip });
        res.json({ status: 'success', data: toSafeTransactionView(tx) });
    } catch (err) {
        handleServiceError(res, err);
    }
};

export const checkAvailability = async (req, res) => {
    try {
        const { reference } = req.body;
        if (!reference) {
            return res.status(400).json({ status: 'error', message: 'reference is required.' });
        }
        const tx = await AirtimeToCashService.checkAvailability({ reference, customerId: req.user._id, ip: req.ip });
        res.json({ status: 'success', data: toSafeTransactionView(tx) });
    } catch (err) {
        handleServiceError(res, err);
    }
};

export const transfer = async (req, res) => {
    try {
        const { reference, transferPin } = req.body;
        if (!reference || !transferPin) {
            return res.status(400).json({ status: 'error', message: 'reference and transferPin are required.' });
        }
        const tx = await AirtimeToCashService.transfer({ reference, customerId: req.user._id, transferPin, ip: req.ip });
        res.json({ status: 'success', data: toSafeTransactionView(tx) });
    } catch (err) {
        handleServiceError(res, err);
    }
};

export const getTransaction = async (req, res) => {
    try {
        const tx = await AirtimeToCashService.getOwnTransaction(req.params.reference, req.user._id);
        res.json({ status: 'success', data: toSafeTransactionView(tx) });
    } catch (err) {
        handleServiceError(res, err);
    }
};

export const listTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const txs = await AirtimeToCashService.listOwnTransactions(req.user._id, { page, limit });
        res.json({ status: 'success', data: txs.map((t) => toSafeTransactionView(t)) });
    } catch (err) {
        handleServiceError(res, err);
    }
};
