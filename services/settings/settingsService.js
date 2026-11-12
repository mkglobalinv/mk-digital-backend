import net from "net";
import IntegrationCredential from "../../models/IntegrationCredential.js";
import IntegrationAuditLog from "../../models/IntegrationAuditLog.js";
import IntegrationProviderState from "../../models/IntegrationProviderState.js";
import ProviderStatus from "../../models/ProviderStatus.js";
import { SETTINGS, SETTINGS_BY_KEY, PROVIDERS, PROVIDERS_BY_ID, GROUPS, isMaskedType } from "./catalog.js";
import { encryptValue, decryptValue, getMasterKey, SettingsKeyError } from "./secretCrypto.js";
import { notifyConfigChange } from "./runtimeConfig.js";

// Server-side configuration service for System Settings -> Integrations &
// API Configuration.
//
// Precedence: a value saved in the dashboard (encrypted in MongoDB) overrides
// the server's .env; clearing it in the dashboard restores the .env value.
// Saved values are written to process.env and every integration reloads via
// runtimeConfig, so changes take effect without a restart.
//
// Values never leave this module except as masks, and are never logged.

export class SettingsValidationError extends Error {
    constructor(message, field = null) {
        super(message);
        this.field = field;
    }
}

// .env values as they were at startup, before any dashboard override.
const ENV_SNAPSHOT = new Map(SETTINGS.map((d) => [d.key, process.env[d.key]]));
const dbKeys = new Set();
let loadErrors = [];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const HOST_RE = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*$/i;
const VALIDATORS = {
    secret: (v) => /^[\x21-\x7E]{4,4096}$/.test(v) || "Must be 4-4096 characters with no spaces.",
    identifier: (v) => /^[A-Za-z0-9_.:@+-]{1,200}$/.test(v) || "Only letters, numbers and . _ - : @ + are allowed.",
    url: (v) => {
        if (v.length > 300 || /\s/.test(v)) return "Enter a valid URL.";
        let u;
        try { u = new URL(v); } catch { return "Enter a valid URL, starting with https://"; }
        if (u.protocol !== "https:") return "URL must start with https://";
        if (u.username || u.password) return "URL must not contain a username or password.";
        return true;
    },
    host: (v) => HOST_RE.test(v) || "Enter a hostname such as smtp-relay.brevo.com.",
    port: (v) => (/^\d{1,5}$/.test(v) && +v >= 1 && +v <= 65535) || "Enter a port between 1 and 65535.",
    email: (v) => (/^[^\s@<>"]{1,64}@[^\s@<>"]{1,253}$/.test(v) && HOST_RE.test(v.split("@")[1])) || "Enter a valid email address.",
    name: (v) => /^[^\r\n<>"\\]{1,60}$/.test(v) || "Up to 60 characters; no quotes or angle brackets.",
    ipv4: (v) => net.isIPv4(v) || "Enter an IPv4 address such as 203.0.113.10.",
    ipv6: (v) => net.isIPv6(v) || "Enter a valid IPv6 address.",
    bool: (v) => v === "true" || v === "false" || "Must be true or false.",
    hostlist: (v) => v.split(",").map((h) => h.trim()).filter(Boolean).every((h) => HOST_RE.test(h)) || "Comma-separated domain names only.",
    bucket: (v) => /^[A-Za-z0-9._-]{1,63}$/.test(v) || "Letters, numbers, dots, dashes and underscores only.",
    ga: (v) => /^G-[A-Z0-9]{4,20}$/.test(v) || "Google Analytics IDs look like G-XXXXXXXXXX.",
    pixel: (v) => /^\d{6,20}$/.test(v) || "Meta Pixel IDs are digits only."
};

export function normalizeAndValidate(key, raw) {
    const def = SETTINGS_BY_KEY.get(key);
    if (!def) throw new SettingsValidationError(`Unknown setting.`, key);
    if (typeof raw === "boolean" && def.type === "bool") raw = String(raw);
    if (typeof raw !== "string") throw new SettingsValidationError(`${def.label}: must be text.`, key);
    let value = raw.trim();
    if (def.type === "url") value = value.replace(/\/+$/, "");
    if (def.type === "host" || def.type === "hostlist") value = value.toLowerCase();
    if (def.type === "hostlist") value = value.split(",").map((h) => h.trim()).filter(Boolean).join(",");
    if (value.includes("•")) throw new SettingsValidationError(`${def.label}: enter the full new value, not the masked one.`, key);
    const ok = VALIDATORS[def.type](value);
    if (ok !== true) throw new SettingsValidationError(`${def.label}: ${ok}`, key);
    return value;
}

// ---------------------------------------------------------------------------
// Masking and status
// ---------------------------------------------------------------------------
export function maskValue(def, value) {
    if (value === undefined || value === null || value === "") return null;
    if (!isMaskedType(def.type)) return value;
    return value.length >= 12 ? `••••••••${value.slice(-4)}` : "••••••••";
}

const effective = (key) => {
    const v = process.env[key];
    return v === undefined || v === "" ? null : v;
};

function settingView(def) {
    const value = effective(def.key);
    return {
        key: def.key,
        label: def.label,
        type: def.type,
        optional: !!def.optional,
        applies: def.applies || "live",
        help: def.help || null,
        placeholder: def.placeholder || null,
        defaultValue: def.default ?? null,
        isSet: value !== null,
        source: dbKeys.has(def.key) ? "dashboard" : value !== null ? "environment" : "unset",
        display: maskValue(def, value)
    };
}

async function providerEnabled(p) {
    if (!p.toggle) return null;
    if (p.toggle.setting) {
        const value = effective(p.toggle.setting) ?? SETTINGS_BY_KEY.get(p.toggle.setting).default ?? "false";
        return value === "true";
    }
    const status = await ProviderStatus.findOne({ providerName: p.toggle.providerStatus }).select("manualDisabled").lean();
    return !status?.manualDisabled;
}

/** Full dashboard view. Contains masks only, never values. */
export async function getSettingsView() {
    const states = new Map((await IntegrationProviderState.find({}).lean()).map((s) => [s.provider, s.lastTest]));
    const providers = [];
    for (const p of PROVIDERS) {
        const settings = p.settings.map((k) => settingView(SETTINGS_BY_KEY.get(k)));
        const configured = settings.filter((x) => !x.optional).every((x) => x.isSet);
        const lastTest = states.get(p.id) || null;
        const status = !configured ? "not_configured" : lastTest?.status || (p.test ? "untested" : "configured");
        providers.push({
            id: p.id, group: p.group, name: p.name, description: p.description,
            canTest: p.test, toggle: p.toggle ? (p.toggle.setting ? "setting" : "providerStatus") : null,
            enabled: await providerEnabled(p),
            status, lastTest, settings
        });
    }
    return {
        groups: GROUPS,
        providers,
        encryption: { configured: hasMasterKey(), loadErrors: loadErrors.map((e) => e.key) }
    };
}

function hasMasterKey() {
    try { return !!getMasterKey(); } catch { return false; }
}

// ---------------------------------------------------------------------------
// Runtime load (startup) and writes
// ---------------------------------------------------------------------------
function applyToProcess(key, value) {
    if (value === null) {
        const original = ENV_SNAPSHOT.get(key);
        if (original === undefined) delete process.env[key];
        else process.env[key] = original;
        dbKeys.delete(key);
    } else {
        process.env[key] = value;
        dbKeys.add(key);
    }
}

/**
 * Called once after MongoDB connects (server.js), before the server starts
 * listening. Without SETTINGS_ENCRYPTION_KEY, or for any value that cannot be
 * decrypted, the .env value stays in effect.
 */
export async function loadSettingsIntoRuntime() {
    loadErrors = [];
    let key;
    try {
        key = getMasterKey();
    } catch (err) {
        console.error(`[Settings] ${err.message} Using .env values only.`);
        return { loaded: 0, errors: ["SETTINGS_ENCRYPTION_KEY"] };
    }
    const docs = await IntegrationCredential.find({}).lean();
    if (!key) {
        if (docs.length) console.error(`[Settings] ${docs.length} saved setting(s) ignored: SETTINGS_ENCRYPTION_KEY is not set. Using .env values.`);
        return { loaded: 0, errors: docs.map((d) => d.key) };
    }
    const changed = [];
    for (const doc of docs) {
        if (!SETTINGS_BY_KEY.has(doc.key)) continue;
        try {
            applyToProcess(doc.key, decryptValue(doc.key, doc.value, key));
            changed.push(doc.key);
        } catch (err) {
            loadErrors.push({ key: doc.key });
            console.error(`[Settings] Could not decrypt ${doc.key}; using the .env value. (${err.message})`);
        }
    }
    if (changed.length) notifyConfigChange(changed);
    console.log(`[Settings] Loaded ${changed.length} dashboard setting(s); ${loadErrors.length} unreadable.`);
    return { loaded: changed.length, errors: loadErrors.map((e) => e.key) };
}

/**
 * changes: { KEY: "new value" | null }  (null or "" clears the dashboard value)
 * All values are validated before anything is written (all-or-nothing).
 */
export async function saveSettings(changes, actor = {}) {
    if (!changes || typeof changes !== "object" || Array.isArray(changes)) throw new SettingsValidationError("No changes provided.");
    const entries = Object.entries(changes);
    if (entries.length === 0) throw new SettingsValidationError("No changes provided.");
    if (entries.length > SETTINGS.length) throw new SettingsValidationError("Too many changes.");

    const masterKey = getMasterKey();
    const plan = entries.map(([key, raw]) => {
        if (!SETTINGS_BY_KEY.has(key)) throw new SettingsValidationError("Unknown setting.", key);
        const clear = raw === null || (typeof raw === "string" && raw.trim() === "");
        return { key, clear, value: clear ? null : normalizeAndValidate(key, raw) };
    });
    if (!masterKey && plan.some((p) => !p.clear)) {
        throw new SettingsValidationError("SETTINGS_ENCRYPTION_KEY is not set on the server, so credentials cannot be saved. See the deployment guide.");
    }

    for (const p of plan) {
        if (p.clear) {
            await IntegrationCredential.deleteOne({ key: p.key });
        } else {
            await IntegrationCredential.updateOne(
                { key: p.key },
                { $set: { value: encryptValue(p.key, p.value, masterKey), updatedBy: actor.id || null, updatedByEmail: actor.email || null } },
                { upsert: true }
            );
        }
        applyToProcess(p.key, p.value);
    }
    await IntegrationAuditLog.insertMany(plan.map((p) => ({
        actorId: actor.id || null, actorEmail: actor.email || null, ip: actor.ip || null,
        action: p.clear ? "setting.cleared" : "setting.updated",
        target: p.key,
        detail: p.clear ? "Dashboard value removed; .env value (if any) in effect" : "Value updated"
    })));
    notifyConfigChange(plan.map((p) => p.key));
    return plan.map((p) => p.key);
}

export async function setProviderEnabled(providerId, enabled, actor = {}) {
    const p = PROVIDERS_BY_ID.get(providerId);
    if (!p) throw new SettingsValidationError("Unknown provider.");
    if (!p.toggle) throw new SettingsValidationError(`${p.name} cannot be switched on or off here; the application has no switch for it.`);
    if (typeof enabled !== "boolean") throw new SettingsValidationError("enabled must be true or false.");
    if (p.toggle.setting) {
        await saveSettings({ [p.toggle.setting]: String(enabled) }, actor);
    } else {
        // Same semantics as the existing management "toggleProvider" switch.
        await ProviderStatus.findOneAndUpdate(
            { providerName: p.toggle.providerStatus },
            { $set: { manualDisabled: !enabled, isAvailable: enabled } },
            { upsert: true }
        );
    }
    await IntegrationAuditLog.create({ actorId: actor.id || null, actorEmail: actor.email || null, ip: actor.ip || null, action: enabled ? "provider.enabled" : "provider.disabled", target: providerId });
}

export async function recordTestResult(providerId, result, actor = {}) {
    const lastTest = { status: result.ok ? "connected" : "failed", message: result.message, at: new Date(), byEmail: actor.email || null };
    await IntegrationProviderState.updateOne({ provider: providerId }, { $set: { lastTest } }, { upsert: true });
    await IntegrationAuditLog.create({ actorId: actor.id || null, actorEmail: actor.email || null, ip: actor.ip || null, action: "provider.tested", target: providerId, detail: result.ok ? "Connected" : "Failed" });
    return lastTest;
}

export async function getAuditLog(limit = 50) {
    return IntegrationAuditLog.find({}).sort({ createdAt: -1 }).limit(Math.min(200, Math.max(1, limit))).lean();
}

/** Removes any configured secret value from a message before it is shown or stored. */
export function redactSecrets(message) {
    let out = String(message || "");
    for (const def of SETTINGS) {
        if (!isMaskedType(def.type)) continue;
        const v = effective(def.key);
        if (v && v.length >= 4) out = out.split(v).join("[redacted]");
    }
    return out.slice(0, 300);
}

export { SettingsKeyError };
