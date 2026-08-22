import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { deductBalance, refundBalance } from "./walletService.js";
import { sendTransactionNotification } from "./emailService.js";
import { requeryClubkonnect } from "./providers/clubkonnect.js";
// import { requeryVTPass } from "./providers/vtpass.js";
import { requeryPeyflex } from "./providers/peyflex.js";
// billsplash provider decommissioned — stubs preserve requery logic without crashing
const requeryBillsplash = async () => ({ status: 'pending', message: 'Billsplash decommissioned' });
const pollIPEStatus    = async () => ({ done: false,       message: 'Billsplash decommissioned' });
import { applyResellerProfit } from "./resellerProfitService.js";
import { processLifetimeReferralCashback } from "./referralCashbackEngine.js";

/**
 * Resolve a pending transaction by checking provider status
 */
/**
 * Resolve a transaction by its reference (useful for immediate follow-up or webhooks)
 */
export const resolveTransactionByReference = async (reference, overrideResult = null) => {
    try {
        const transaction = await Transaction.findOne({ reference, status: { $in: ['pending', 'unknown'] } });
        if (!transaction) return null;
        return await resolvePendingTransaction(transaction, overrideResult);
    } catch (e) {
        console.error(`[Requery] Reference resolve error:`, e.message);
        return null;
    }
};

/**
 * Trigger immediate verification after a short delay
 */
export const triggerImmediateVerification = (reference, delayMs = 5000) => {
    console.log(`[Requery] Scheduling immediate check for ${reference} in ${delayMs}ms...`);
    setTimeout(async () => {
        await resolveTransactionByReference(reference);
    }, delayMs);
};

export const resolvePendingTransaction = async (transaction, overrideResult = null) => {
    if (transaction.status !== 'pending' && transaction.status !== 'unknown') return;

    console.log(`[Requery] Resolving transaction ${transaction._id} (${transaction.reference}) | Provider: ${transaction.provider_used}`);

    let result = { status: 'pending' };
    const provider = transaction.provider_used;

    try {
        if (overrideResult) {
            // A provider webhook already delivered a definitive status for this
            // transaction — use it directly instead of re-polling the provider
            // (PeyFlex in particular has no working poll/verify endpoint).
            result = overrideResult;
        } else if (provider.includes('value') || provider === 'billsplash') {
            result = await requeryBillsplash(transaction.reference);
        } else if (provider === 'clubkonnect') {
            result = await requeryClubkonnect(transaction.reference);
        } else if (provider === 'vtpass') {
            result = { status: 'failed', message: 'VTPass module missing' };
        } else if (provider.includes('smart') || provider === 'peyflex') {
            result = await requeryPeyflex(transaction.reference);
        } else if (provider === 'billsplash') {
            // For IPE clearance transactions, use trackingID polling (done=true → success)
            if (transaction.api_response && transaction.api_response.trackingID) {
                const poll = await pollIPEStatus(transaction.api_response.trackingID);
                result = poll.done === true
                    ? { status: 'success', data: poll }
                    : { status: 'pending',  data: poll };
            } else {
                result = await requeryBillsplash(transaction.reference);
            }
        }

        if (result.status === 'success') {
            console.log(`[Requery] SUCCESS for ${transaction._id}. Deducting balance if necessary...`);
            
            // 1. Deduct balance (if not already deducted)
            if (!transaction.balance_deducted) {
                await deductBalance(transaction.userId, transaction.amount);
                transaction.balance_deducted = true;
            }
            
            // 2. Update transaction
            transaction.status = 'success';
            transaction.description = transaction.description.replace(/\(Processing\)|\(Pending\)|\(Failed\)|\(Manual Verification Required\)/g, '').trim();
            transaction.api_response = result.data || transaction.api_response;
            
            // Apply reseller profit logic correctly
            const user = await User.findById(transaction.userId);
            await applyResellerProfit(transaction, user);
            
            // Process Lifetime Referral Cashback if this is a successful requery
            await processLifetimeReferralCashback(transaction, user);
            
            await transaction.save();

            // 3. Notify user
            sendTransactionNotification(transaction);
            return transaction;
        } else if (result.status === 'failed') {
            console.log(`[Requery] FAILED for ${transaction._id}. Refunding if necessary...`);
            
            const lockedTx = await Transaction.findOneAndUpdate(
                { _id: transaction._id, balance_deducted: true },
                { $set: { balance_deducted: false } },
                { new: true }
            );
            if (lockedTx) {
                await refundBalance(lockedTx.userId, lockedTx.amount, lockedTx);
            }

            // Refund Reseller atomically (if applicable)
            if (transaction.resellerId) {
                const lockedResellerTx = await Transaction.findOneAndUpdate({
                    parentTransactionId: transaction._id, 
                    userId: transaction.resellerId, 
                    isInternal: true,
                    ledger_type: { $ne: 'REFUND' },
                    balance_deducted: true
                }, { $set: { balance_deducted: false } }, { new: true });
                if (lockedResellerTx) {
                    await refundBalance(transaction.resellerId, lockedResellerTx.amount, lockedResellerTx);
                    lockedResellerTx.status = 'failed';
                    lockedResellerTx.description += " (Refunded)";
                    await lockedResellerTx.save();
                }
            }
            transaction.description = transaction.description.replace(/\(Processing\)|\(Pending\)|\(Failed\)|\(Manual Verification Required\)/g, '').trim();

            transaction.status = 'failed';
            transaction.api_response = result.data || transaction.api_response;
            await transaction.save();
            sendTransactionNotification(transaction);
            return transaction;
        } else {
            console.log(`[Requery] Still PENDING/UNKNOWN for ${transaction._id}.`);
            // Increment retry count or just wait for next cycle
            transaction.retry_count = (transaction.retry_count || 0) + 1;
            
            // To prevent false refunds on slow provider networks, we do not auto-fail and refund.
            // Instead, we just mark it for manual review after a certain number of retries.
            if (transaction.retry_count >= 20) {
                console.log(`[Requery] Max retries reached for ${transaction._id}. Keeping as pending for manual verification...`);
                transaction.description = transaction.description.replace(/\(Processing\)|\(Pending\)|\(Failed\)|\(Manual Verification Required\)/g, '').trim();
                await transaction.save();
            } else {
                await transaction.save();
            }
            return transaction;
        }
    } catch (error) {
        console.error(`[Requery] Error resolving ${transaction._id}:`, error.message);
        return null;
    }
};

/**
 * Background task to process all pending transactions
 */
export const startRequeryJob = () => {
    console.log("[Requery] Starting background job...");
    setInterval(async () => {
        try {
            const pendingTxs = await Transaction.find({ 
                status: { $in: ['pending', 'unknown'] },
                type: 'debit',
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
            });

            if (pendingTxs.length > 0) {
                console.log(`[Requery] Found ${pendingTxs.length} pending transactions.`);
                for (const tx of pendingTxs) {
                    await resolvePendingTransaction(tx);
                }
            }
        } catch (err) {
            console.error("[Requery Job Error]", err.message);
        }
    }, 30000); // Every 30 seconds
};
