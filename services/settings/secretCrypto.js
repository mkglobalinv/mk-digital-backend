import crypto from "crypto";

// AES-256-GCM (authenticated) encryption for stored integration credentials.
// The master key lives only in the server environment (SETTINGS_ENCRYPTION_KEY,
// 32 bytes as 64 hex chars or base64) -- never in MongoDB or the frontend.
// Each ciphertext is bound to its setting name through the GCM additional
// authenticated data, so a value cannot be moved to a different setting.

const ALGORITHM = "aes-256-gcm";
const VERSION = 1;

export class SettingsKeyError extends Error {}

export function getMasterKey() {
    const raw = (process.env.SETTINGS_ENCRYPTION_KEY || "").trim();
    if (!raw) return null;
    const key = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
    if (key.length !== 32) throw new SettingsKeyError("SETTINGS_ENCRYPTION_KEY must be 32 bytes (64 hex characters or base64).");
    return key;
}

/** Short, non-reversible identifier of the master key (to detect key changes). */
export const keyId = (key) => crypto.createHash("sha256").update(key).digest("hex").slice(0, 12);

const aadFor = (name) => Buffer.from(`9jasub-setting:${name}`, "utf8");

export function encryptValue(name, plaintext, key = getMasterKey()) {
    if (!key) throw new SettingsKeyError("SETTINGS_ENCRYPTION_KEY is not set on the server.");
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(aadFor(name));
    const ct = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
    return { v: VERSION, kid: keyId(key), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ct: ct.toString("base64") };
}

export function decryptValue(name, payload, key = getMasterKey()) {
    if (!key) throw new SettingsKeyError("SETTINGS_ENCRYPTION_KEY is not set on the server.");
    if (!payload || payload.v !== VERSION) throw new SettingsKeyError("Unsupported encrypted value format.");
    if (payload.kid && payload.kid !== keyId(key)) throw new SettingsKeyError("Value was encrypted with a different SETTINGS_ENCRYPTION_KEY.");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(payload.iv, "base64"));
    decipher.setAAD(aadFor(name));
    decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(payload.ct, "base64")), decipher.final()]).toString("utf8");
}
