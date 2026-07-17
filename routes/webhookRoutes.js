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

router.post("/peyflex", async (req, res) => {
    try {
        const { status, reference } = req.body;
        console.log(`[Webhook] Peyflex triggered for reference: ${reference} | Status: ${status}`);
        if (reference) {
            await resolveTransactionByReference(reference);
        }
        res.status(200).send("OK");
    } catch (e) {
        console.error("[Webhook Error] Peyflex:", e.message);
        res.status(500).send("Error");
    }
});

export default router;
