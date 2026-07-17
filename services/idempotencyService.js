import Transaction from '../models/Transaction.js';
import crypto from 'crypto';

class IdempotencyService {
    constructor() {
        this.locks = new Map(); // key -> expiry timestamp
        // Automatically cleanup expired locks every 10 seconds
        setInterval(() => this.cleanupExpiredLocks(), 10000);
    }

    /**
     * Acquire a temporary in-memory lock
     */
    acquireLock(key, ttlMs = 5000) {
        const now = Date.now();
        const expiry = now + ttlMs;

        if (this.locks.has(key)) {
            const currentExpiry = this.locks.get(key);
            if (currentExpiry > now) {
                // Lock is active
                return false;
            }
        }

        this.locks.set(key, expiry);
        return true;
    }

    /**
     * Release an in-memory lock
     */
    releaseLock(key) {
        this.locks.delete(key);
    }

    /**
     * Check if a transaction reference already exists in the database
     */
    async isReferenceUnique(reference) {
        if (!reference) return true;
        const exists = await Transaction.findOne({ reference });
        return !exists;
    }

    /**
     * Helper to generate a unique key based on user and request body payload
     */
    generatePayloadKey(userId, path, body) {
        // Strip transient/varying fields from body to create a stable hash
        const cleanBody = { ...body };
        delete cleanBody.reference;
        delete cleanBody.client_reference;
        
        const payloadString = `${userId}:${path}:${JSON.stringify(cleanBody)}`;
        return crypto.createHash('md5').update(payloadString).digest('hex');
    }

    cleanupExpiredLocks() {
        const now = Date.now();
        for (const [key, expiry] of this.locks.entries()) {
            if (expiry <= now) {
                this.locks.delete(key);
            }
        }
    }
}

export default new IdempotencyService();
