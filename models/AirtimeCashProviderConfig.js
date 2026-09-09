import mongoose from 'mongoose';
import crypto from 'crypto';

// Same AES-256-GCM field-level encryption pattern as models/GatewayConfig.js
// (kept as a separate copy rather than importing from GatewayConfig, since that
// model's `provider` enum is scoped to payment gateways and is not to be touched
// for this feature). Key derivation matches GatewayConfig exactly so ops only
// needs to manage one secret (GATEWAY_SECRET / JWT_SECRET) across both.
const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = crypto.scryptSync(process.env.GATEWAY_SECRET || process.env.JWT_SECRET || 'fallback_secret', 'salt', 32);

function encrypt(text) {
    if (!text) return text;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decrypt(text) {
    if (!text) return text;
    try {
        const parts = text.split(':');
        if (parts.length !== 3) return text; // Probably not encrypted
        const [ivHex, authTagHex, encryptedHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Failed to decrypt Airtime-to-Cash provider credential');
        return null;
    }
}

const NETWORKS = ['MTN', 'AIRTEL', 'GLO', '9MOBILE'];

const networkTogglesSchema = new mongoose.Schema({
    MTN: { type: Boolean, default: false },
    AIRTEL: { type: Boolean, default: false },
    GLO: { type: Boolean, default: false },
    '9MOBILE': { type: Boolean, default: false }
}, { _id: false });

const airtimeCashProviderConfigSchema = new mongoose.Schema({
    provider: {
        type: String,
        required: true,
        unique: true,
        enum: ['airtimebridge']
    },
    // Master switch. MUST default to false -- production activation is an explicit
    // admin action taken only after credentials + the real API contract are verified
    // (see docs/airtime-to-cash-integration.md).
    isActive: {
        type: Boolean,
        default: false
    },
    isTestMode: {
        type: Boolean,
        default: true
    },
    credentials: {
        apiToken: { type: String, set: encrypt, get: decrypt },
        apiBaseUrl: { type: String, default: 'https://automation.airtimetocash.com/api' }
    },
    // Independently disable/enable a network without touching the master switch.
    // All default to false so enabling the service does not silently accept every
    // network before each has been verified against the provider.
    networks: {
        type: networkTogglesSchema,
        default: () => ({})
    },
    limits: {
        minAmount: { type: Number, default: 500 },
        maxAmount: { type: Number, default: 50000 }
    },
    lastTestedAt: { type: Date },
    testStatus: {
        type: String,
        enum: ['pending', 'success', 'failed', 'untested'],
        default: 'untested'
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

airtimeCashProviderConfigSchema.statics.NETWORKS = NETWORKS;

export default mongoose.model('AirtimeCashProviderConfig', airtimeCashProviderConfigSchema);
