// Shared safety helpers for the Airtime-to-Cash domain. Every place that writes an
// audit log entry, a console log, or an API response for this feature is expected to
// go through these so the "never store/log OTP or transfer PIN" rule can't be
// accidentally violated in one call site while being respected everywhere else.

// Keys that must never reach a log line, an audit log document, or an API response.
const FORBIDDEN_KEYS = ['otp', 'transferpin', 'transfer_pin', 'pin', 'transactionpin', 'transaction_pin'];

/**
 * Deep-strips any key matching FORBIDDEN_KEYS (case-insensitive) from a plain object
 * before it is written to AirtimeCashAuditLog.metadata or passed to console/logger.
 */
export function sanitizeAuditMetadata(input) {
    if (input === null || input === undefined) return input;
    if (Array.isArray(input)) return input.map(sanitizeAuditMetadata);
    if (typeof input !== 'object') return input;

    const out = {};
    for (const [key, value] of Object.entries(input)) {
        if (FORBIDDEN_KEYS.includes(key.toLowerCase())) {
            out[key] = '[REDACTED]';
            continue;
        }
        out[key] = (value && typeof value === 'object') ? sanitizeAuditMetadata(value) : value;
    }
    return out;
}

/**
 * Masks a Nigerian phone number for display, e.g. 08012345678 -> 0801***5678.
 */
export function maskPhone(phone) {
    const str = String(phone || '');
    if (str.length < 7) return str.replace(/./g, '*');
    return `${str.slice(0, 4)}***${str.slice(-4)}`;
}

/**
 * Masks a bank account number for display, e.g. 0123456789 -> 01******89.
 */
export function maskAccountNumber(accountNumber) {
    const str = String(accountNumber || '');
    if (str.length < 5) return str.replace(/./g, '*');
    return `${str.slice(0, 2)}${'*'.repeat(str.length - 4)}${str.slice(-2)}`;
}

/**
 * Shapes a transaction document for any API response (customer, reseller, or admin
 * list views) -- masks PII and never includes OTP/PIN fields (which are never
 * persisted on the document in the first place, but this is the single choke point
 * responses are supposed to flow through).
 */
export function toSafeTransactionView(tx, { includeAdminFields = false } = {}) {
    if (!tx) return tx;
    const plain = typeof tx.toObject === 'function' ? tx.toObject() : tx;

    const base = {
        id: plain._id,
        reference: plain.reference,
        network: plain.network,
        senderPhone: maskPhone(plain.senderPhone),
        airtimeAmount: plain.airtimeAmount,
        customerPayoutAmount: plain.customerPayoutAmount,
        platformValue: includeAdminFields ? plain.platformValue : undefined,
        bankName: plain.bankName,
        accountNumber: maskAccountNumber(plain.accountNumber),
        status: plain.status,
        failureReason: plain.failureReason,
        provider: plain.provider,
        providerReference: includeAdminFields ? plain.providerReference : undefined,
        pricingSnapshot: plain.pricingSnapshot,
        createdAt: plain.createdAt,
        completedAt: plain.completedAt
    };

    if (includeAdminFields) {
        base.tenantId = plain.tenantId;
        base.customerId = plain.customerId;
        base.providerSessionId = undefined; // still never exposed, even to admins
        base.walletCredited = plain.walletCredited;
        base.walletCreditReference = plain.walletCreditReference;
        base.retryCount = plain.retryCount;
        base.isSandbox = plain.isSandbox;
        // Provider's own conversion accounting -- admin/audit only, and purely
        // informational: it never fed into customerPayoutAmount above.
        base.providerTransferData = plain.providerTransferData;
    }

    return base;
}
