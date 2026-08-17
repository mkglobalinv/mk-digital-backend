import { idgate360Post } from './client.js';

// All handlers pass the upstream JSON straight through by default so this
// module is easy to smoke-test with curl/Postman. Slip-generating endpoints
// additionally support ?download=true to stream the decoded PDF instead of
// returning base64 JSON.

const forwardUpstreamError = (res, err) => {
    if (err?.isIdgate360Error) {
        return res.status(err.status).json(err.body);
    }
    console.error('[IDGate360] Unexpected error:', err);
    return res.status(500).json({ status: false, message: 'Internal error contacting IDGate360' });
};

const handleSlipEndpoint = (upstreamPath, filenamePrefix) => async (req, res) => {
    try {
        const data = await idgate360Post(upstreamPath, req.body);

        if (req.query.download === 'true' && data?.status === 'success' && data?.pdf_base64) {
            const pdf = Buffer.from(data.pdf_base64, 'base64');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filenamePrefix}_${Date.now()}.pdf"`);
            return res.send(pdf);
        }

        return res.status(200).json(data);
    } catch (err) {
        return forwardUpstreamError(res, err);
    }
};

export const ninPremium = handleSlipEndpoint('/nin/premium', 'nin_slip');
export const ninPhonePremium = handleSlipEndpoint('/nin/phone-premium', 'nin_slip');
export const ninDemo = handleSlipEndpoint('/nin/demo', 'nin_slip');
export const bvnPremium = handleSlipEndpoint('/bvn/premium', 'bvn_slip');

export const bankVerify = async (req, res) => {
    try {
        const data = await idgate360Post('/bank/verify', req.body);
        return res.status(200).json(data);
    } catch (err) {
        return forwardUpstreamError(res, err);
    }
};

export const ipeSubmit = async (req, res) => {
    try {
        const data = await idgate360Post('/ipe/submit', req.body);
        return res.status(200).json(data);
    } catch (err) {
        return forwardUpstreamError(res, err);
    }
};

export const ipeStatus = async (req, res) => {
    try {
        const data = await idgate360Post('/ipe/status', req.body);
        return res.status(200).json(data);
    } catch (err) {
        return forwardUpstreamError(res, err);
    }
};

export const ninValidate = async (req, res) => {
    try {
        const data = await idgate360Post('/nin/validate', req.body);
        return res.status(200).json(data);
    } catch (err) {
        return forwardUpstreamError(res, err);
    }
};

export const ninValidateStatus = async (req, res) => {
    try {
        const data = await idgate360Post('/nin/validate-status', req.body);
        return res.status(200).json(data);
    } catch (err) {
        return forwardUpstreamError(res, err);
    }
};
