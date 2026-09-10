import express from "express";
import crypto from "crypto";
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

// ============================================================================
// Ogdams SimHosting webhook -- documented as: "Events are sent as POST
// requests with an ogdams-simhosting-signature header — an HMAC-SHA512 hash
// of the raw request body signed with your secret key." "Your secret key" is
// the same sk_live_... key already established as the Bearer auth token
// earlier in the docs, so that's the HMAC key here (OGDAMS_WEBHOOK_SECRET, if
// set, overrides it -- in case the Ogdams dashboard exposes a distinct
// webhook secret not shown in the supplied docs).
//
// IMPORTANT DOCUMENTED GAP: no example webhook payload was supplied. The
// native vend-response envelope IS documented as
// {status:true|false, code:<int>, data:{msg, ref}} (see /vend/data, /vend/airtime),
// so normalizeOgdamsWebhookStatus() infers the webhook uses the same
// envelope as the most reasonable, evidence-based guess -- NOT a confirmed
// fact. If real webhook deliveries turn out to use different field names,
// this normalizer is the only place that needs to change.
// ============================================================================
export const verifyOgdamsSignature = (rawBody, signatureHeader) => {
    const secret = process.env.OGDAMS_WEBHOOK_SECRET || process.env.OGDAMS_API_KEY;
    if (!secret || !signatureHeader || !rawBody) return false;
    const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
    const expectedBuf = Buffer.from(expected, "utf8");
    const providedBuf = Buffer.from(String(signatureHeader), "utf8");
    if (expectedBuf.length !== providedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
};

export const normalizeOgdamsWebhookStatus = (body) => {
    if (typeof body?.status === "boolean" && typeof body?.code === "number") {
        if (body.status === true && body.code === 200) return "success";
        if (body.status === false || body.code === 424) return "failed";
        if (body.code === 201 || body.code === 202) return null; // still processing -- not a final outcome
    }
    return null; // unrecognized shape -- never guessed
};

router.post("/ogdams", async (req, res) => {
    try {
        const signature = req.headers["ogdams-simhosting-signature"];
        if (!verifyOgdamsSignature(req.rawBody, signature)) {
            console.error("[Webhook] Ogdams signature verification failed.");
            return res.status(401).send("Invalid signature");
        }

        const reference = req.body?.data?.ref || req.body?.ref || req.body?.reference;
        const normalizedStatus = normalizeOgdamsWebhookStatus(req.body);
        console.log(`[Webhook] Ogdams triggered for reference: ${reference} | code: ${req.body?.code} -> ${normalizedStatus || 'unrecognized/pending'}`);

        if (reference && normalizedStatus) {
            // resolveTransactionByReference is itself idempotent -- it only acts on
            // a transaction still in pending/unknown, so a duplicate/replayed
            // webhook delivery for an already-resolved transaction is a safe no-op.
            await resolveTransactionByReference(reference, { status: normalizedStatus, data: req.body });
        }
        res.status(200).send("OK");
    } catch (e) {
        console.error("[Webhook Error] Ogdams:", e.message);
        res.status(500).send("Error");
    }
});

export default router;
