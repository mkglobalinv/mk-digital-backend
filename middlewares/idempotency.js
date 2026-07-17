import idempotencyService from '../services/idempotencyService.js';

/**
     * Middleware to enforce transaction idempotency and prevent duplicate executions/double debits.
     * Supports both client-supplied transaction references and fallback payload hashing for double-click protection.
     */
export const transactionIdempotency = async (req, res, next) => {
    try {
        const reference = req.body.reference || req.body.clientRef || req.body.client_reference || req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User session missing" });
        }

        let lockKey;
        if (reference) {
            // Section 1 Rule: Verify reference uniqueness in the database first
            const isUnique = await idempotencyService.isReferenceUnique(reference);
            if (!isUnique) {
                return res.status(400).json({ 
                    status: 'error',
                    message: `Duplicate transaction. The reference '${reference}' has already been processed.` 
                });
            }
            lockKey = `ref:${userId}:${reference}`;
        } else {
            // Fallback lock: Generate key based on payload hash to lock repeated requests temporarily
            const hash = idempotencyService.generatePayloadKey(userId, req.originalUrl, req.body);
            lockKey = `payload:${userId}:${hash}`;
        }

        // Acquire lock (with a 10s TTL, enough time to call the external provider APIs)
        const acquired = idempotencyService.acquireLock(lockKey, 10000);
        if (!acquired) {
            return res.status(409).json({ 
                status: 'error',
                message: "Duplicate request detected. Transaction is currently processing. Please wait." 
            });
        }

        // Attach automatic release hooks on response finish/close
        let released = false;
        const release = () => {
            if (!released) {
                idempotencyService.releaseLock(lockKey);
                released = true;
            }
        };

        res.on('finish', release);
        res.on('close', release);

        next();
    } catch (err) {
        console.error("[Idempotency Middleware Error]", err);
        next(); // Fallback: allow transaction to proceed if middleware fails to prevent total lockout
    }
};
