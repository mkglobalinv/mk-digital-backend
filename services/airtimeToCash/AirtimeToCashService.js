import crypto from 'crypto';
import AirtimeCashTransaction from '../../models/AirtimeCashTransaction.js';
import AirtimeCashAuditLog from '../../models/AirtimeCashAuditLog.js';
import Notification from '../../models/Notification.js';
import { creditBalance } from '../walletService.js';
import { getProvider } from './providers/index.js';
import { calculateAirtimeCashQuote, resolveEffectivePricing } from './pricing.js';
import { sanitizeAuditMetadata } from './security.js';
import { AIRTIME_CASH_STATUS } from './providerInterface.js';

const NETWORKS = ['MTN', 'AIRTEL', 'GLO', '9MOBILE'];
const MAX_RECONCILE_RETRIES = 20;

export class ServiceDisabledError extends Error {
    constructor(message = 'Airtime-to-Cash is currently unavailable. Please try again later.') {
        super(message);
        this.name = 'ServiceDisabledError';
    }
}

export class NotFoundError extends Error {
    constructor(message = 'Transaction not found.') {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class InvalidStateError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidStateError';
    }
}

function generateReference() {
    return `AC2C-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

async function writeAudit({ transactionId, actorType, actorId, action, fromStatus, toStatus, metadata, ip }) {
    try {
        await AirtimeCashAuditLog.create({
            transactionId,
            actorType,
            actorId,
            action,
            fromStatus,
            toStatus,
            metadata: sanitizeAuditMetadata(metadata || {}),
            ip
        });
    } catch (err) {
        console.error('[AirtimeToCash] Failed to write audit log:', err.message);
    }
}

/**
 * Throws unless the service is globally enabled AND the specific network is enabled.
 * This is the single gate every customer-facing entry point must pass through --
 * satisfies "global switch OFF by default" + independent per-network switches.
 */
function assertServiceEnabledForNetwork(config, network) {
    if (!config.isActive) {
        throw new ServiceDisabledError();
    }
    const net = String(network || '').toUpperCase();
    if (!NETWORKS.includes(net)) {
        throw new ServiceDisabledError('Unsupported network.');
    }
    if (!config.networks?.[net]) {
        throw new ServiceDisabledError(`Airtime-to-Cash is currently unavailable for ${net}.`);
    }
}

/**
 * GET /api/airtime-to-cash/config -- what a given tenant's storefront should show:
 * whether the service is on at all, and which networks are actually usable (provider
 * network toggle AND a configured, enabled pricing row for that tenant/network).
 */
export async function getPublicConfig(tenantId) {
    const { config } = await getProvider();
    const networks = {};
    for (const net of NETWORKS) {
        const providerEnabled = Boolean(config.isActive && config.networks?.[net]);
        let pricingEnabled = false;
        if (providerEnabled) {
            const resolved = await resolveEffectivePricing(tenantId, net);
            pricingEnabled = Boolean(resolved);
        }
        networks[net] = providerEnabled && pricingEnabled;
    }
    return {
        enabled: Boolean(config.isActive),
        networks,
        limits: { minAmount: config.limits?.minAmount, maxAmount: config.limits?.maxAmount }
    };
}

/**
 * POST /api/airtime-to-cash/quote -- the only place a payout figure is computed.
 * The frontend must display exactly this number, never compute its own.
 */
export async function getQuote({ tenantId, network, amount }) {
    const { config } = await getProvider();
    assertServiceEnabledForNetwork(config, network);
    return calculateAirtimeCashQuote({ tenantId, network, amount });
}

/**
 * Starts a new Airtime-to-Cash transaction and requests an OTP from the provider.
 * Idempotent on `idempotencyKey`: a retried request with the same key reattaches to
 * the existing transaction instead of creating a second one / calling the provider
 * twice.
 */
export async function requestOtp({ customerId, tenantId, network, phone, amount, bankName, accountNumber, idempotencyKey, ip }) {
    const { provider, config } = await getProvider();
    assertServiceEnabledForNetwork(config, String(network).toUpperCase());

    if (idempotencyKey) {
        const existing = await AirtimeCashTransaction.findOne({ idempotencyKey });
        if (existing) return existing;
    }

    const quote = await calculateAirtimeCashQuote({ tenantId, network, amount });

    const tx = await AirtimeCashTransaction.create({
        reference: generateReference(),
        tenantId: tenantId || null,
        customerId,
        network: String(network).toUpperCase(),
        senderPhone: phone,
        airtimeAmount: Number(amount),
        pricingSnapshot: {
            pricingId: quote.pricingId,
            source: quote.source,
            conversionPercentage: quote.conversionPercentage,
            fixedFee: quote.fixedFee
        },
        customerPayoutAmount: quote.payoutAmount,
        platformValue: Number(amount) - quote.payoutAmount,
        bankName,
        accountNumber,
        status: 'PENDING',
        idempotencyKey: idempotencyKey || undefined,
        isSandbox: config.isTestMode
    });

    await writeAudit({ transactionId: tx._id, actorType: 'customer', actorId: customerId, action: 'CREATED', toStatus: 'PENDING', ip });

    const result = await provider.requestOtp({ network: tx.network, phone: tx.senderPhone, amount: tx.airtimeAmount, sandbox: config.isTestMode });

    if (result.success) {
        tx.providerSessionId = result.data?.sessionId;
        tx.status = 'OTP_REQUIRED';
        tx.otpRequestedAt = new Date();
        await tx.save();
        await writeAudit({ transactionId: tx._id, actorType: 'system', action: 'OTP_REQUESTED', fromStatus: 'PENDING', toStatus: 'OTP_REQUIRED', ip });
    } else {
        tx.status = 'FAILED';
        tx.failureReason = result.message || 'Unable to send OTP.';
        tx.providerResponseStatus = result.status;
        await tx.save();
        await writeAudit({ transactionId: tx._id, actorType: 'system', action: 'OTP_REQUEST_FAILED', fromStatus: 'PENDING', toStatus: 'FAILED', metadata: { reason: tx.failureReason }, ip });
    }

    return tx;
}

async function loadOwnedTransaction(reference, customerId) {
    const tx = await AirtimeCashTransaction.findOne({ reference });
    if (!tx || String(tx.customerId) !== String(customerId)) {
        throw new NotFoundError();
    }
    return tx;
}

export async function verifyOtp({ reference, customerId, otp, ip }) {
    const tx = await loadOwnedTransaction(reference, customerId);
    if (tx.status !== 'OTP_REQUIRED') {
        throw new InvalidStateError(`Cannot verify OTP from status ${tx.status}.`);
    }

    const { provider } = await getProvider();
    const result = await provider.verifyOtp({ sessionId: tx.providerSessionId, otp, phone: tx.senderPhone, network: tx.network });

    if (result.success) {
        tx.status = 'OTP_VERIFIED';
        tx.otpVerifiedAt = new Date();
        await tx.save();
        await writeAudit({ transactionId: tx._id, actorType: 'customer', actorId: customerId, action: 'OTP_VERIFIED', fromStatus: 'OTP_REQUIRED', toStatus: 'OTP_VERIFIED', ip });
    } else {
        tx.retryCount = (tx.retryCount || 0) + 1;
        tx.failureReason = result.message || 'Invalid OTP.';
        await tx.save();
        await writeAudit({ transactionId: tx._id, actorType: 'customer', actorId: customerId, action: 'OTP_VERIFY_FAILED', fromStatus: 'OTP_REQUIRED', toStatus: 'OTP_REQUIRED', metadata: { reason: tx.failureReason }, ip });
    }

    return tx;
}

export async function checkAvailability({ reference, customerId, ip }) {
    const tx = await loadOwnedTransaction(reference, customerId);
    if (!['OTP_VERIFIED', 'FAILED'].includes(tx.status)) {
        throw new InvalidStateError(`Cannot check availability from status ${tx.status}.`);
    }
    if (tx.status === 'FAILED' && tx.otpVerifiedAt === null) {
        throw new InvalidStateError('Cannot retry: OTP was never verified for this transaction.');
    }

    const fromStatus = tx.status;
    tx.status = 'QUOTA_CHECKING';
    await tx.save();

    const { provider } = await getProvider();
    const result = await provider.checkAvailability({ sessionId: tx.providerSessionId, network: tx.network, phone: tx.senderPhone, amount: tx.airtimeAmount });

    if (result.success) {
        tx.status = 'READY_FOR_TRANSFER';
        tx.quotaCheckedAt = new Date();
        await tx.save();
        await writeAudit({ transactionId: tx._id, actorType: 'system', action: 'QUOTA_CHECKED', fromStatus, toStatus: 'READY_FOR_TRANSFER', ip });
    } else {
        tx.status = 'FAILED';
        tx.failureReason = result.message || 'Recipient/quota unavailable right now.';
        await tx.save();
        await writeAudit({ transactionId: tx._id, actorType: 'system', action: 'QUOTA_CHECK_FAILED', fromStatus, toStatus: 'FAILED', metadata: { reason: tx.failureReason }, ip });
    }

    return tx;
}

/**
 * Attempts the wallet credit exactly once. Safe to call multiple times: relies on
 * walletService.creditBalance()'s own reference-based dedup PLUS the walletCredited
 * flag here, so a reconciliation retry after a transient failure can never double
 * -credit. Only ever called after providerConfirmedAt has been set.
 */
async function creditWalletExactlyOnce(tx) {
    if (tx.walletCredited) return tx;

    if (!tx.walletCreditReference) {
        tx.walletCreditReference = `AC2C-CREDIT-${tx.reference}`;
        await tx.save();
    }

    const description = `Airtime-to-Cash: ${tx.network} ₦${tx.airtimeAmount} converted`;
    const updatedUser = await creditBalance(tx.customerId, tx.customerPayoutAmount, tx.walletCreditReference, description);

    if (updatedUser) {
        tx.walletCredited = true;
        tx.status = 'SUCCESS';
        tx.completedAt = new Date();
        await tx.save();
        await writeAudit({ transactionId: tx._id, actorType: 'system', action: 'WALLET_CREDITED', toStatus: 'SUCCESS', metadata: { amount: tx.customerPayoutAmount, reference: tx.walletCreditReference } });
        try {
            await Notification.create({
                userId: tx.customerId,
                title: 'Airtime-to-Cash Successful',
                message: `₦${tx.customerPayoutAmount} has been credited to your wallet for your ${tx.network} airtime conversion.`,
                type: 'success'
            });
        } catch (err) {
            console.error('[AirtimeToCash] Notification failed:', err.message);
        }
    } else {
        // Recoverable state: provider confirmed the transfer, but the credit did not
        // apply this attempt (e.g. transient DB issue). Status stays PROCESSING with
        // providerConfirmedAt set and walletCredited false -- the reconciliation job
        // retries the credit only, never the provider transfer, until it succeeds.
        await writeAudit({ transactionId: tx._id, actorType: 'system', action: 'WALLET_CREDIT_RETRY_PENDING', metadata: { amount: tx.customerPayoutAmount, reference: tx.walletCreditReference } });
    }

    return tx;
}

export async function transfer({ reference, customerId, transferPin, ip }) {
    const tx = await loadOwnedTransaction(reference, customerId);
    if (tx.status !== 'READY_FOR_TRANSFER') {
        throw new InvalidStateError(`Cannot transfer from status ${tx.status}.`);
    }

    tx.status = 'PROCESSING';
    tx.transferInitiatedAt = new Date();
    await tx.save();
    // transferPin is intentionally excluded from every audit/log call in this function.
    await writeAudit({ transactionId: tx._id, actorType: 'customer', actorId: customerId, action: 'TRANSFER_INITIATED', fromStatus: 'READY_FOR_TRANSFER', toStatus: 'PROCESSING', ip });

    const { provider } = await getProvider();
    const result = await provider.transfer({ sessionId: tx.providerSessionId, network: tx.network, phone: tx.senderPhone, amount: tx.airtimeAmount, transferPin });

    tx.providerReference = result.data?.providerReference || tx.providerReference;
    tx.providerResponseStatus = result.status;

    if (result.status === AIRTIME_CASH_STATUS.SUCCESS) {
        tx.providerConfirmedAt = new Date();
        await tx.save();
        await writeAudit({ transactionId: tx._id, actorType: 'provider', action: 'PROVIDER_CONFIRMED', toStatus: 'PROCESSING', metadata: { providerReference: tx.providerReference } });
        return creditWalletExactlyOnce(tx);
    }

    if (result.status === AIRTIME_CASH_STATUS.FAILED) {
        tx.status = 'FAILED';
        tx.failureReason = result.message || 'Transfer failed.';
        await tx.save();
        await writeAudit({ transactionId: tx._id, actorType: 'provider', action: 'PROVIDER_FAILED', fromStatus: 'PROCESSING', toStatus: 'FAILED', metadata: { reason: tx.failureReason } });
        return tx;
    }

    // Ambiguous/pending: do NOT retry the transfer, do NOT credit the wallet.
    tx.status = 'MANUAL_REVIEW';
    tx.failureReason = result.message || 'Provider response requires manual review.';
    await tx.save();
    await writeAudit({ transactionId: tx._id, actorType: 'provider', action: 'PROVIDER_AMBIGUOUS', fromStatus: 'PROCESSING', toStatus: 'MANUAL_REVIEW', metadata: { reason: tx.failureReason } });
    return tx;
}

/**
 * Background reconciliation pass. Mirrors the shape of services/requeryService.js's
 * job, adapted for a credit-only (never-refund) flow:
 *   1. Any transaction the provider already confirmed but that never got credited
 *      (a transient failure mid-credit) gets exactly one more credit attempt.
 *   2. Any transaction still PROCESSING (provider not yet confirmed) or
 *      MANUAL_REVIEW gets re-queried, up to MAX_RECONCILE_RETRIES times, after which
 *      it is left for admin manual review rather than guessed at.
 */
export async function runReconciliationPass() {
    const pendingCredit = await AirtimeCashTransaction.find({
        walletCredited: false,
        providerConfirmedAt: { $ne: null },
        status: { $in: ['PROCESSING'] }
    });
    for (const tx of pendingCredit) {
        await creditWalletExactlyOnce(tx);
    }

    const stuck = await AirtimeCashTransaction.find({
        status: { $in: ['PROCESSING', 'MANUAL_REVIEW'] },
        providerConfirmedAt: null,
        retryCount: { $lt: MAX_RECONCILE_RETRIES }
    });

    if (stuck.length === 0) return;

    const { provider } = await getProvider();
    for (const tx of stuck) {
        try {
            const result = await provider.checkStatus({ providerReference: tx.providerReference, sessionId: tx.providerSessionId });
            tx.retryCount = (tx.retryCount || 0) + 1;
            tx.providerResponseStatus = result.status;

            if (result.status === AIRTIME_CASH_STATUS.SUCCESS) {
                tx.providerConfirmedAt = new Date();
                await tx.save();
                await writeAudit({ transactionId: tx._id, actorType: 'system', action: 'RECONCILE_CONFIRMED', toStatus: 'PROCESSING' });
                await creditWalletExactlyOnce(tx);
            } else if (result.status === AIRTIME_CASH_STATUS.FAILED) {
                tx.status = 'FAILED';
                tx.failureReason = result.message || 'Transfer failed (confirmed on reconciliation).';
                await tx.save();
                await writeAudit({ transactionId: tx._id, actorType: 'system', action: 'RECONCILE_FAILED', toStatus: 'FAILED', metadata: { reason: tx.failureReason } });
            } else {
                tx.status = 'MANUAL_REVIEW';
                await tx.save();
            }
        } catch (err) {
            console.error(`[AirtimeToCash Reconcile] Error checking ${tx.reference}:`, err.message);
        }
    }
}

export function startReconciliationJob(intervalMs = 30000) {
    console.log('[AirtimeToCash] Starting reconciliation job...');
    return setInterval(() => {
        runReconciliationPass().catch((err) => console.error('[AirtimeToCash Reconcile Job Error]', err.message));
    }, intervalMs);
}

/**
 * Admin resolution of a MANUAL_REVIEW transaction. `decision: 'credit'` must only be
 * used once the admin has independently confirmed (outside 9jaSub, e.g. by checking
 * the AirtimeBridge dashboard) that the transfer actually completed -- this function
 * does not itself re-contact the provider, it records the admin's confirmation.
 */
export async function adminResolveManualReview({ reference, adminId, decision, note, ip }) {
    const tx = await AirtimeCashTransaction.findOne({ reference });
    if (!tx) throw new NotFoundError();
    if (tx.status !== 'MANUAL_REVIEW') {
        throw new InvalidStateError(`Transaction is not in MANUAL_REVIEW (currently ${tx.status}).`);
    }

    if (decision === 'credit') {
        tx.providerConfirmedAt = new Date();
        tx.providerResponseStatus = 'admin_confirmed';
        await tx.save();
        await writeAudit({ transactionId: tx._id, actorType: 'admin', actorId: adminId, action: 'MANUAL_REVIEW_CREDIT_APPROVED', fromStatus: 'MANUAL_REVIEW', toStatus: 'PROCESSING', metadata: { note }, ip });
        return creditWalletExactlyOnce(tx);
    }

    if (decision === 'fail') {
        tx.status = 'FAILED';
        tx.failureReason = note || 'Resolved by admin: transfer did not complete.';
        await tx.save();
        await writeAudit({ transactionId: tx._id, actorType: 'admin', actorId: adminId, action: 'MANUAL_REVIEW_MARKED_FAILED', fromStatus: 'MANUAL_REVIEW', toStatus: 'FAILED', metadata: { note }, ip });
        return tx;
    }

    throw new InvalidStateError('decision must be "credit" or "fail".');
}

export async function getOwnTransaction(reference, customerId) {
    return loadOwnedTransaction(reference, customerId);
}

export async function listOwnTransactions(customerId, { page = 1, limit = 20 } = {}) {
    const skip = (Math.max(1, page) - 1) * limit;
    return AirtimeCashTransaction.find({ customerId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
}

/**
 * Tenant-isolated lookup for the reseller-facing routes: a reseller may only ever
 * see transactions that happened on their own storefront (tx.tenantId === their own
 * User._id). Never trust a tenantId supplied by the browser -- this always uses the
 * authenticated requester's own id.
 */
export async function listTenantTransactions(tenantId, { page = 1, limit = 20, status } = {}) {
    const skip = (Math.max(1, page) - 1) * limit;
    const query = { tenantId };
    if (status) query.status = status;
    return AirtimeCashTransaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
}

export async function listAllTransactions({ page = 1, limit = 20, status, tenantId, network } = {}) {
    const skip = (Math.max(1, page) - 1) * limit;
    const query = {};
    if (status) query.status = status;
    if (tenantId) query.tenantId = tenantId;
    if (network) query.network = String(network).toUpperCase();
    return AirtimeCashTransaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
}

export async function getAuditTrail(transactionId) {
    return AirtimeCashAuditLog.find({ transactionId }).sort({ createdAt: 1 });
}

export { NETWORKS };
