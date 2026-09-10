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

// Phase 2.1 hardening constants -------------------------------------------------
// How long a credit "claim" (see creditWalletExactlyOnce) is honored before a later
// attempt is allowed to reclaim it -- recovers from a process crash mid-credit
// without letting two live attempts overlap.
const CREDIT_CLAIM_STALE_MS = 60 * 1000;
// A transaction stuck in PENDING this long almost certainly means the process
// crashed between creating the record and the (now try/caught) OTP-request call
// ever completing -- there is nothing left to retry, the customer must start over.
const PENDING_STALE_MS = 2 * 60 * 1000;
// A transaction stuck in QUOTA_CHECKING this long means we genuinely don't know
// whether the provider received the request -- never guessed at, always routed to
// MANUAL_REVIEW rather than retried automatically.
const QUOTA_STALE_MS = 2 * 60 * 1000;
// Minimum time between reconciliation status-check attempts for the same stuck
// transaction, so an overlapping or slow reconciliation pass can't re-query (or
// re-claim a credit for) the same transaction back-to-back.
const RECONCILE_MIN_INTERVAL_MS = 20 * 1000;

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
 * Runs a provider call and normalizes a thrown exception (network error, timeout,
 * malformed response, whatever a real HTTP client raises) into the same
 * {success, status, message} shape a provider is expected to return on a clean
 * failure -- so every call site has exactly one code path to handle, instead of a
 * try/catch duplicated five times. The real exception is logged server-side only
 * (never included in the returned message, and only err.message -- never the raw
 * error object, which could in principle echo request fields -- ever reaches the
 * audit trail via the caller's writeAudit metadata).
 */
async function safeProviderCall(fn, label) {
    try {
        return await fn();
    } catch (err) {
        console.error(`[AirtimeToCash] Provider call threw during ${label}:`, err.message);
        // Diagnostic only, server-side console -- never included in the returned
        // message/errorMessage below, so this never reaches the audit trail or the
        // customer-facing error. Logged specifically so a real provider-side
        // rejection (e.g. a 401/403 body explaining why) is visible in ops logs
        // instead of just axios's generic "Request failed with status code N".
        if (err.response) {
            console.error(`[AirtimeToCash] Provider HTTP ${err.response.status} response body during ${label}:`, JSON.stringify(err.response.data));
        }
        return {
            success: false,
            status: AIRTIME_CASH_STATUS.AMBIGUOUS,
            message: 'A technical error occurred communicating with the provider.',
            threw: true,
            errorMessage: err.message
        };
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

    // Safe pre-transfer operation: nothing has been sent to the network yet, so a
    // thrown exception here is handled identically to a clean {success:false}
    // response -- FAILED, retryable only by starting a new transaction, never
    // auto-repeated.
    const result = await safeProviderCall(
        () => provider.requestOtp({ network: tx.network, phone: tx.senderPhone, amount: tx.airtimeAmount, sandbox: config.isTestMode }),
        'requestOtp'
    );

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
        await writeAudit({
            transactionId: tx._id,
            actorType: 'system',
            action: result.threw ? 'OTP_REQUEST_ERROR' : 'OTP_REQUEST_FAILED',
            fromStatus: 'PENDING',
            toStatus: 'FAILED',
            metadata: { reason: tx.failureReason, providerError: result.threw ? result.errorMessage : undefined },
            ip
        });
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
    // otp is passed through only -- it is never included in the result the provider
    // returns to us, so no scrubbing is needed on the way back; it's simply never
    // written anywhere below.
    const result = await safeProviderCall(
        () => provider.verifyOtp({ sessionId: tx.providerSessionId, otp, phone: tx.senderPhone, network: tx.network }),
        'verifyOtp'
    );

    if (result.success) {
        // AirtimeBridge's documented /verify/otp response is where sessionId is
        // actually returned (generate/otp's response never includes one) -- capture
        // it here rather than assuming it arrived earlier.
        if (result.data?.sessionId) {
            tx.providerSessionId = result.data.sessionId;
        }
        if (result.data?.airtimeBalance) {
            tx.providerAirtimeSnapshot = {
                balance: result.data.airtimeBalance,
                tariff: result.data.tariff,
                type: result.data.type
            };
        } else {
            // Diagnostic only, server-side console -- the documented response shape
            // (data.airtimeBalance/tariff/type) didn't match what actually came back,
            // so log the raw body to see the real shape rather than assuming.
            console.warn('[AirtimeToCash] verifyOtp succeeded but no airtimeBalance found in provider response:', JSON.stringify(result.raw));
        }
        tx.status = 'OTP_VERIFIED';
        tx.otpVerifiedAt = new Date();
        await tx.save();
        await writeAudit({ transactionId: tx._id, actorType: 'customer', actorId: customerId, action: 'OTP_VERIFIED', fromStatus: 'OTP_REQUIRED', toStatus: 'OTP_VERIFIED', ip });
    } else {
        tx.retryCount = (tx.retryCount || 0) + 1;
        tx.failureReason = result.threw ? 'Could not verify OTP due to a technical error. Please try again.' : (result.message || 'Invalid OTP.');
        await tx.save();
        await writeAudit({
            transactionId: tx._id,
            actorType: 'customer',
            actorId: customerId,
            action: result.threw ? 'OTP_VERIFY_ERROR' : 'OTP_VERIFY_FAILED',
            fromStatus: 'OTP_REQUIRED',
            toStatus: 'OTP_REQUIRED',
            metadata: { reason: tx.failureReason, providerError: result.threw ? result.errorMessage : undefined },
            ip
        });
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
    // Also a safe pre-transfer operation -- no airtime has moved yet, so an
    // exception here is handled the same way a clean "unavailable" response is.
    const result = await safeProviderCall(
        () => provider.checkAvailability({ sessionId: tx.providerSessionId, network: tx.network, phone: tx.senderPhone, amount: tx.airtimeAmount }),
        'checkAvailability'
    );

    if (result.success) {
        tx.status = 'READY_FOR_TRANSFER';
        tx.quotaCheckedAt = new Date();
        await tx.save();
        await writeAudit({ transactionId: tx._id, actorType: 'system', action: 'QUOTA_CHECKED', fromStatus, toStatus: 'READY_FOR_TRANSFER', ip });
    } else {
        tx.status = 'FAILED';
        tx.failureReason = result.threw ? 'Could not check availability due to a technical error. Please try again.' : (result.message || 'Recipient/quota unavailable right now.');
        await tx.save();
        await writeAudit({
            transactionId: tx._id,
            actorType: 'system',
            action: result.threw ? 'QUOTA_CHECK_ERROR' : 'QUOTA_CHECK_FAILED',
            fromStatus,
            toStatus: 'FAILED',
            metadata: { reason: tx.failureReason, providerError: result.threw ? result.errorMessage : undefined },
            ip
        });
    }

    return tx;
}

/**
 * Atomically claims the right to attempt this transaction's wallet credit. Backed
 * by a single MongoDB findOneAndUpdate, which is atomic per-document regardless of
 * replica-set/session availability -- this is what actually prevents two
 * concurrent callers (the transfer() request path and the reconciliation job can
 * both reach the same transaction) from both proceeding to call
 * walletService.creditBalance() at once, which is what made the original
 * "if (tx.walletCredited) return" in-memory check racy (Phase 2.1 audit finding).
 * Only one concurrent caller's filter can match at a time: once it sets
 * creditClaimedAt, every other concurrent call's filter (creditClaimedAt: null or
 * older than CREDIT_CLAIM_STALE_MS) no longer matches, so it gets null back.
 * Returns the freshly-claimed document, or null if someone else holds/held the
 * claim (already succeeded, or is actively attempting it right now).
 */
async function claimCreditAttempt(transactionId) {
    const staleThreshold = new Date(Date.now() - CREDIT_CLAIM_STALE_MS);
    return AirtimeCashTransaction.findOneAndUpdate(
        {
            _id: transactionId,
            walletCredited: false,
            $or: [{ creditClaimedAt: null }, { creditClaimedAt: { $lt: staleThreshold } }]
        },
        { $set: { creditClaimedAt: new Date() } },
        { new: true }
    );
}

/**
 * Attempts the wallet credit exactly once, safe under concurrency: re-fetches and
 * atomically claims the transaction from the database (never trusts the in-memory
 * `tx` passed in for the exactly-once decision) before ever calling
 * walletService.creditBalance(). walletCreditReference is still derived once,
 * deterministically, from the transaction's own reference, so every claimed
 * attempt (first try or a later reconciliation retry) uses the identical reference
 * -- creditBalance()'s own reference-based dedup is a second, redundant layer of
 * protection, not the only one. Only ever called after providerConfirmedAt has
 * been set.
 */
async function creditWalletExactlyOnce(tx) {
    const claimed = await claimCreditAttempt(tx._id);
    if (!claimed) {
        // Either already credited, or another process is mid-attempt right now.
        // Return the current DB state rather than the possibly-stale `tx` we were
        // handed, so callers see the real outcome.
        return (await AirtimeCashTransaction.findById(tx._id)) || tx;
    }
    tx = claimed;

    if (!tx.walletCreditReference) {
        tx.walletCreditReference = `AC2C-CREDIT-${tx.reference}`;
        await tx.save();
    }

    const description = `Airtime-to-Cash: ${tx.network} ₦${tx.airtimeAmount} converted`;
    let updatedUser;
    try {
        updatedUser = await creditBalance(tx.customerId, tx.customerPayoutAmount, tx.walletCreditReference, description);
    } catch (err) {
        console.error('[AirtimeToCash] creditBalance threw:', err.message);
        updatedUser = null;
    }

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
        // apply this attempt (e.g. transient DB issue). Release the claim so a later
        // attempt (reconciliation, or another manual resolution) can retry it --
        // status stays PROCESSING with providerConfirmedAt set and walletCredited
        // false; the provider transfer itself is never repeated for this.
        tx.creditClaimedAt = null;
        await tx.save();
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
    // The critical case: we do NOT know whether an exception here means the
    // provider never received the request, or received it and the response was
    // simply lost. safeProviderCall normalizes a thrown exception to the same
    // {success:false, status:'ambiguous'} shape the mock/real provider returns for
    // a genuinely ambiguous response, which the branching below already routes to
    // MANUAL_REVIEW -- never FAILED (that would be a guess) and never retried
    // automatically (that could double-deduct the customer's airtime).
    const result = await safeProviderCall(
        () => provider.transfer({ sessionId: tx.providerSessionId, network: tx.network, phone: tx.senderPhone, amount: tx.airtimeAmount, transferPin, reference: tx.reference }),
        'transfer'
    );

    tx.providerReference = result.data?.providerReference || tx.providerReference;
    tx.providerResponseStatus = result.status;

    if (result.status === AIRTIME_CASH_STATUS.SUCCESS) {
        // Provider's own conversion accounting, stored for audit only -- never
        // used to compute or override customerPayoutAmount, which stays whatever
        // 9jaSub's own tenant/global pricing (pricingSnapshot, frozen at creation)
        // already calculated.
        tx.providerTransferData = {
            amountConverted: result.data?.amountConverted,
            recipient: result.data?.recipient,
            balanceBefore: result.data?.balanceBefore,
            balanceAfter: result.data?.balanceAfter,
            automationCharges: result.data?.automationCharges
        };
        tx.providerConfirmedAt = new Date();
        await tx.save();
        await writeAudit({ transactionId: tx._id, actorType: 'provider', action: 'PROVIDER_CONFIRMED', toStatus: 'PROCESSING', metadata: { providerReference: tx.providerReference, amountConverted: tx.providerTransferData.amountConverted } });
        return creditWalletExactlyOnce(tx);
    }

    if (result.status === AIRTIME_CASH_STATUS.FAILED) {
        tx.status = 'FAILED';
        tx.failureReason = result.message || 'Transfer failed.';
        await tx.save();
        await writeAudit({ transactionId: tx._id, actorType: 'provider', action: 'PROVIDER_FAILED', fromStatus: 'PROCESSING', toStatus: 'FAILED', metadata: { reason: tx.failureReason } });
        return tx;
    }

    // Ambiguous/pending/threw: do NOT retry the transfer, do NOT credit the wallet.
    tx.status = 'MANUAL_REVIEW';
    tx.failureReason = result.threw
        ? 'A technical error occurred submitting the transfer; the outcome is unknown and requires manual review.'
        : (result.message || 'Provider response requires manual review.');
    await tx.save();
    await writeAudit({
        transactionId: tx._id,
        actorType: 'provider',
        action: result.threw ? 'PROVIDER_TRANSFER_ERROR' : 'PROVIDER_AMBIGUOUS',
        fromStatus: 'PROCESSING',
        toStatus: 'MANUAL_REVIEW',
        metadata: { reason: tx.failureReason, providerError: result.threw ? result.errorMessage : undefined }
    });
    return tx;
}

/**
 * Background reconciliation pass. Mirrors the shape of services/requeryService.js's
 * job, adapted for a credit-only (never-refund) flow. Four independent sweeps, each
 * using timestamps to decide what's actually stale rather than relying solely on an
 * open-ended retry loop:
 *
 *   1. Credit-pending: provider already confirmed, wallet credit never applied
 *      (retries the credit only -- see creditWalletExactlyOnce's atomic claim).
 *   2. Stale PENDING: the OTP-request call itself is now wrapped in
 *      safeProviderCall (Phase 2.1), so a normal failure/exception already moves a
 *      transaction out of PENDING immediately -- a transaction still PENDING after
 *      PENDING_STALE_MS means the process most likely crashed mid-request. There is
 *      nothing to recover; it's marked FAILED so the customer must start over.
 *   3. Stale QUOTA_CHECKING: same reasoning, but the outcome (did the provider see
 *      the request or not) is genuinely unknown, so it goes to MANUAL_REVIEW rather
 *      than being guessed at as FAILED.
 *   4. Stuck PROCESSING (pre-confirmation) / MANUAL_REVIEW *that already reached the
 *      transfer stage* (transferInitiatedAt set): a provider status check only,
 *      never a repeated transfer. Gated by lastReconcileAttemptAt so an overlapping
 *      or slow pass can't re-query the same transaction back-to-back; retryCount is
 *      still the final give-up cap (MAX_RECONCILE_RETRIES), after which it's left
 *      for admin manual review.
 */
export async function runReconciliationPass() {
    const now = Date.now();

    // 1. Credit-pending.
    const pendingCredit = await AirtimeCashTransaction.find({
        walletCredited: false,
        providerConfirmedAt: { $ne: null },
        status: 'PROCESSING'
    });
    for (const tx of pendingCredit) {
        await creditWalletExactlyOnce(tx);
    }

    // 2. Stale PENDING -- never retried, never guessed as anything but FAILED.
    const stalePending = await AirtimeCashTransaction.find({
        status: 'PENDING',
        createdAt: { $lt: new Date(now - PENDING_STALE_MS) }
    });
    for (const tx of stalePending) {
        tx.status = 'FAILED';
        tx.failureReason = 'OTP request did not complete in time.';
        await tx.save();
        await writeAudit({ transactionId: tx._id, actorType: 'system', action: 'RECONCILE_STALE_PENDING_FAILED', fromStatus: 'PENDING', toStatus: 'FAILED' });
    }

    // 3. Stale QUOTA_CHECKING -- outcome unknown, never guessed at.
    const staleQuota = await AirtimeCashTransaction.find({
        status: 'QUOTA_CHECKING',
        updatedAt: { $lt: new Date(now - QUOTA_STALE_MS) }
    });
    for (const tx of staleQuota) {
        tx.status = 'MANUAL_REVIEW';
        tx.failureReason = 'Quota/availability check did not complete in time; outcome unknown.';
        await tx.save();
        await writeAudit({ transactionId: tx._id, actorType: 'system', action: 'RECONCILE_STALE_QUOTA_MANUAL_REVIEW', toStatus: 'MANUAL_REVIEW' });
    }

    // 4. Stuck post-transfer-attempt PROCESSING/MANUAL_REVIEW -- status check only.
    // transferInitiatedAt guards out the staleQuota transactions just moved to
    // MANUAL_REVIEW above (and any other pre-transfer MANUAL_REVIEW) -- there is no
    // provider transfer reference to check status for if a transfer was never
    // attempted.
    const stuck = await AirtimeCashTransaction.find({
        status: { $in: ['PROCESSING', 'MANUAL_REVIEW'] },
        providerConfirmedAt: null,
        transferInitiatedAt: { $ne: null },
        retryCount: { $lt: MAX_RECONCILE_RETRIES },
        $or: [
            { lastReconcileAttemptAt: null },
            { lastReconcileAttemptAt: { $lt: new Date(now - RECONCILE_MIN_INTERVAL_MS) } }
        ]
    });

    if (stuck.length === 0) return;

    const { provider } = await getProvider();
    for (const tx of stuck) {
        tx.lastReconcileAttemptAt = new Date();
        tx.retryCount = (tx.retryCount || 0) + 1;

        const result = await safeProviderCall(
            () => provider.checkStatus({ providerReference: tx.providerReference, sessionId: tx.providerSessionId }),
            'checkStatus'
        );

        if (result.threw) {
            // The status check itself failed -- record the attempt (so the retry
            // cap still applies) but leave status untouched. Never escalate to
            // FAILED off a status-check exception alone, and never call
            // provider.transfer() again for this.
            await tx.save();
            await writeAudit({ transactionId: tx._id, actorType: 'system', action: 'RECONCILE_STATUS_CHECK_ERROR', metadata: { reason: 'Status check failed.', providerError: result.errorMessage } });
            continue;
        }

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
 * Distinct recent sender phone numbers from this customer's OWN past transactions,
 * for a "recently used" quick-select. Deliberately returns the real (unmasked)
 * number -- toSafeTransactionView's maskPhone exists for viewing someone else's
 * data (e.g. an admin/reseller list), not for a customer seeing back a number they
 * themselves typed in; there's no security value in masking a customer's own data
 * to themselves, and doing so here would make the quick-select useless.
 */
export async function listOwnRecentNumbers(customerId, { limit = 3 } = {}) {
    const recentTx = await AirtimeCashTransaction.find({ customerId }).sort({ createdAt: -1 }).limit(20).select('senderPhone').lean();
    const seen = new Set();
    const numbers = [];
    for (const tx of recentTx) {
        if (tx.senderPhone && !seen.has(tx.senderPhone)) {
            seen.add(tx.senderPhone);
            numbers.push(tx.senderPhone);
            if (numbers.length >= limit) break;
        }
    }
    return numbers;
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
