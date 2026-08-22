import express from "express";
import Transaction from "../models/Transaction.js";
import { resolveTransactionByReference } from "../services/requeryService.js";

const router = express.Router();

router.post("/clubkonnect", async (req, res) => {
    try {
        const { status, reference } = req.body;
        console.log(`[Webhook] Clubkonnect triggered for reference: ${reference} | Status: ${status}`);
        if (reference) {
            await resolveTransactionByReference(reference);
        }
        res.status(200).send("OK");
    } catch (e) {
        console.error("[Webhook Error] Clubkonnect:", e.message);
        res.status(500).send("Error");
    }
});

// PeyFlex has no working transaction-status/verify endpoint (see requeryPeyflex()),
// so this webhook's delivered status is the only way a PeyFlex data/airtime
// transaction can ever resolve out of "unknown". Map it to a definitive
// success/failed result and pass it straight through instead of re-polling.
export const normalizePeyflexWebhookStatus = (body) => {
    const raw = body?.status ?? body?.Status ?? body?.status_text;
    if (raw === true) return 'success';
    if (raw === false) return 'failed';
    const str = String(raw || '').toLowerCase();
    if (['success', 'successful', 'completed', 'delivered'].includes(str)) return 'success';
    if (['failed', 'failure', 'declined', 'error', 'cancelled', 'canceled'].includes(str)) return 'failed';
    return null; // ambiguous / unrecognized — don't guess
};

router.post("/peyflex", async (req, res) => {
    try {
        const { reference } = req.body;
        const normalizedStatus = normalizePeyflexWebhookStatus(req.body);
        console.log(`[Webhook] Peyflex triggered for reference: ${reference} | Status: ${req.body?.status} -> ${normalizedStatus || 'unrecognized'}`);
        if (reference && normalizedStatus) {
            await resolveTransactionByReference(reference, { status: normalizedStatus, data: req.body });
        }
        res.status(200).send("OK");
    } catch (e) {
        console.error("[Webhook Error] Peyflex:", e.message);
        res.status(500).send("Error");
    }
});

export default router;
