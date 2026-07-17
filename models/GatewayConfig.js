import mongoose from 'mongoose';
import crypto from 'crypto';

// ENCRYPTION PATTERN DOCUMENTATION:
// Since no global credential encryption pattern exists for provider secrets,
// we are using standard AES-256-GCM encryption natively within this model using Node.js 'crypto'.
// This ensures that credentials are never stored in plaintext.
// The encryption key is derived from the standard process.env.JWT_SECRET or a dedicated GATEWAY_SECRET.

const ALGORITHM = 'aes-256-gcm';
// Use GATEWAY_SECRET if available, otherwise fallback to JWT_SECRET and pad/truncate to 32 bytes
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
        console.error('Failed to decrypt gateway credential');
        return null;
    }
}

const gatewayConfigSchema = new mongoose.Schema({
    provider: {
        type: String,
        required: true,
        unique: true, // e.g., 'flutterwave', 'xixapay'
        enum: ['flutterwave', 'xixapay']
    },
    isActive: {
        type: Boolean,
        default: false
    },
    isTestMode: {
        type: Boolean,
        default: true
    },
    credentials: {
        publicKey: { type: String, set: encrypt, get: decrypt },
        secretKey: { type: String, set: encrypt, get: decrypt },
        encryptionKey: { type: String, set: encrypt, get: decrypt }, // Used by FW
        merchantId: { type: String, set: encrypt, get: decrypt } // Used by some providers
    },
    lastTestedAt: {
        type: Date
    },
    testStatus: {
        type: String,
        enum: ['pending', 'success', 'failed', 'untested'],
        default: 'untested'
    }
}, { 
    timestamps: true,
    toJSON: { getters: true }, // Ensure decryption on JSON conversion
    toObject: { getters: true } 
});

const GatewayConfig = mongoose.model('GatewayConfig', gatewayConfigSchema);

export default GatewayConfig;
