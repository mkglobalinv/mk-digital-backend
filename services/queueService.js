import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { buyData, buyAirtime, buyCableTV, buyElectricity } from './vtuService.js';
import { refundBalance } from './walletService.js';
import socketService from './socketService.js';
import { applyResellerProfit } from './resellerProfitService.js';
import { requeryClubkonnect } from './providers/clubkonnect.js';
import { sendTransactionNotification } from './emailService.js';
import { processLifetimeReferralCashback } from './referralCashbackEngine.js';

class QueueService {
    constructor() {
        this.isProcessing = false;
        this.checkInterval = 5000; // Check every 5s
    }

    async enqueue(transactionData) {
        const transaction = await Transaction.create({
            ...transactionData,
            status: 'pending'
        });
        return transaction;
    }

    async startWorker() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        
        console.log('[Queue] Worker started...');
        setInterval(async () => {
            await this.processQueue();
        }, this.checkInterval);
    }

    async processQueue() {
        try {
            const pendingTx = await Transaction.find({ 
                status: 'pending',
                isApiRequest: true 
            }).limit(5);

            for (const tx of pendingTx) {
                await this.executeTransaction(tx);
            }
        } catch (err) {
            console.error('[Queue Error]', err.message);
        }
    }

    async executeTransaction(tx) {
        tx.status = 'processing';
        await tx.save();

        const user = await User.findById(tx.userId);
        if (!user) {
            tx.status = 'failed';
            await tx.save();
            return;
        }
        
        try {
            let result;
            const apiReq = tx.api_response || {}; // Assuming api_response temporarily holds request params
            
            if (tx.description.includes('Data')) {
                if (!apiReq.planCode) {
                    tx.status = 'needs_verification';
                    tx.description = `${tx.description} (Missing planCode, requires manual check)`;
                    await tx.save();
                    return;
                }
                result = await buyData(tx.network, apiReq.planCode, tx.phone, tx.cost_price || tx.amount, tx.countryCode || 'NG', apiReq.operatorId, apiReq.network_id, tx.provider_used || 'smart', apiReq.category);
            } else if (tx.description.includes('Airtime')) {
                if (!apiReq.inputAmount && !tx.amount) {
                    tx.status = 'needs_verification';
                    tx.description = `${tx.description} (Missing inputAmount, requires manual check)`;
                    await tx.save();
                    return;
                }
                result = await buyAirtime(tx.network, apiReq.inputAmount || tx.amount, tx.phone, tx.countryCode || 'NG', apiReq.operatorId, tx.provider_used || 'smart');
            } else if (tx.description.includes('Cable')) {
                result = await buyCableTV(apiReq.cableId, apiReq.packageId, apiReq.smartcard, tx.phone);
            } else if (tx.description.includes('Electricity')) {
                result = await buyElectricity(apiReq.discoId, apiReq.meterType, apiReq.meterNumber, apiReq.inputAmount || tx.amount, tx.phone);
            } else {
                throw new Error("Unknown transaction type");
            }

            if (result && result.status === 'success') {
                tx.status = 'success';
                tx.reference = result.reference || tx.reference;
                tx.provider_used = result.provider_used || tx.provider_used;
                tx.api_response = result.data;
                
                // Success: Record profit for reseller
                await applyResellerProfit(tx, user);
                
                // Phase 13: Process Lifetime Referral Cashback
                await processLifetimeReferralCashback(tx, user);
                
                await tx.save();
                
                sendTransactionNotification(tx);
                socketService.emitActivity({
                    type: 'vtu_success',
                    message: `${tx.description} was successful!`,
                    userId: tx.userId
                });

            } else if (result && result.status === 'unknown') {
                tx.status = 'unknown'; // Leave for requeryService to handle properly
                tx.reference = result.reference || tx.reference;
                tx.provider_used = result.provider_used || tx.provider_used;
                tx.api_response = { ...(tx.api_response || {}), provider_response: result.data };
                tx.retry_count = (tx.retry_count || 0) + 1;
                await tx.save();
            } else {
                // Definitive failure
                await this.handleFailure(tx, user, result ? result.message : null);
            }
        } catch (err) {
            console.error(`[Queue Exec Error] ${tx.reference}:`, err.message);
            await this.handleFailure(tx, user, err.message);
        }
    }
    
    async handleFailure(tx, user, errorMessage = null) {
        if (tx.provider_used === 'clubkonnect') {
            try {
                const check = await requeryClubkonnect(tx.reference);
                if (check && check.status === 'success') {
                    console.log(`[Queue] Overriding failure for ${tx.reference}. Provider reports SUCCESS.`);
                    tx.status = 'success';
                    tx.description = tx.description.replace(/\(Failed.*?\)|\(Processing\)|\(Pending\)|\(Manual Verification Required\)/g, '').trim();
                    tx.description = tx.description.replace('[REFUND ON HOLD]', '').trim();
                    tx.api_response = check.data || tx.api_response;
                    
                    // Apply reseller profit logic correctly
                    await applyResellerProfit(tx, user);
                    
                    // Phase 13: Process Lifetime Referral Cashback
                    await processLifetimeReferralCashback(tx, user);
                    
                    await tx.save();
                    
                    sendTransactionNotification(tx);
                    socketService.emitActivity({
                        type: 'vtu_success',
                        message: `${tx.description} was successful!`,
                        userId: tx.userId
                    });
                    return; // Abort failure
                }
            } catch (err) {
                console.error(`[Queue] Failed to verify provider status before failing:`, err.message);
            }
        }

        tx.status = 'failed';
        if (errorMessage) {
            tx.description = `${tx.description} (Failed: ${errorMessage})`;
        }
        
        // Refund Customer atomically
        const lockedTx = await Transaction.findOneAndUpdate(
            { _id: tx._id, balance_deducted: true },
            { $set: { balance_deducted: false } },
            { new: true }
        );
        if (lockedTx) {
            await refundBalance(user._id, lockedTx.amount, lockedTx);
        }

        // Refund Reseller (if applicable)
            if (tx.resellerId) {
                const resellerTx = await Transaction.findOne({ 
                    parentTransactionId: tx._id, 
                    userId: tx.resellerId, 
                    isInternal: true,
                    ledger_type: { $ne: 'REFUND' }
                });
                if (resellerTx) {
                    await refundBalance(tx.resellerId, resellerTx.amount, resellerTx);
                    resellerTx.status = 'failed';
                    resellerTx.description += " (Refunded)";
                    await resellerTx.save();
                }
            }
        await tx.save();
        
        sendTransactionNotification(tx);
        socketService.emitActivity({
            type: 'vtu_failed',
            message: `${tx.description} failed and has been refunded.`,
            userId: tx.userId
        });
    }
}

export default new QueueService();
