import express from "express";
import { PROVIDERS_BY_ID } from "../services/settings/catalog.js";
import {
    getSettingsView, saveSettings, setProviderEnabled, recordTestResult, getAuditLog,
    redactSecrets, SettingsValidationError, SettingsKeyError
} from "../services/settings/settingsService.js";
import { runConnectionTest } from "../services/settings/connectionTests.js";

// System Settings -> Integrations & API Configuration.
// Mounted at /api/admin/integrations behind adminAuth + requireSuperAdmin
// (routes/adminRoutes.js). Responses contain masked values only.
const router = express.Router();

router.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

const actorOf = (req) => ({ id: req.user?._id, email: req.user?.email, ip: req.ip });

const handle = (fn) => async (req, res) => {
    try {
        res.json(await fn(req));
    } catch (err) {
        if (err instanceof SettingsValidationError || err instanceof SettingsKeyError) {
            return res.status(400).json({ message: err.message, field: err.field || null });
        }
        // Never echo internals; they could contain configuration details.
        console.error("[System Settings] request failed:", redactSecrets(err.message));
        res.status(500).json({ message: "The settings operation failed. Check the server logs." });
    }
};

router.get("/", handle(() => getSettingsView()));

router.put("/", handle(async (req) => {
    const saved = await saveSettings(req.body?.changes, actorOf(req));
    return { message: `Saved ${saved.length} setting(s). Changes are active now.`, saved, view: await getSettingsView() };
}));

router.post("/providers/:id/enabled", handle(async (req) => {
    if (!PROVIDERS_BY_ID.has(req.params.id)) throw new SettingsValidationError("Unknown provider.");
    await setProviderEnabled(req.params.id, req.body?.enabled, actorOf(req));
    return { message: `${PROVIDERS_BY_ID.get(req.params.id).name} ${req.body.enabled ? "enabled" : "disabled"}.`, view: await getSettingsView() };
}));

// Connection tests call external APIs: at most 10 per admin per minute.
const testHits = new Map();
router.post("/providers/:id/test", handle(async (req) => {
    const p = PROVIDERS_BY_ID.get(req.params.id);
    if (!p) throw new SettingsValidationError("Unknown provider.");
    if (!p.test) throw new SettingsValidationError(`${p.name} has no connection test.`);
    const who = String(req.user?._id || req.ip);
    const now = Date.now();
    const recent = (testHits.get(who) || []).filter((t) => now - t < 60000);
    if (recent.length >= 10) throw new SettingsValidationError("Too many connection tests. Wait a minute and try again.");
    testHits.set(who, [...recent, now]);

    const result = await runConnectionTest(p.id);
    const safe = { ok: result.ok, message: redactSecrets(result.message) };
    const lastTest = await recordTestResult(p.id, safe, actorOf(req));
    return { provider: p.id, ...safe, lastTest };
}));

router.get("/audit", handle(async (req) => ({ entries: await getAuditLog(parseInt(req.query.limit, 10) || 50) })));

export default router;
