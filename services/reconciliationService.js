import cron from 'node-cron';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Withdrawal from '../models/Withdrawal.js';
import ReconciliationReport from '../models/ReconciliationReport.js';
import { calculateLedgerBalances } from './supabaseLedger.js';
import notificationService from './notificationService.js';

class ReconciliationService {
    /**
     * Run financial reconciliation audit for a specific date
     */
    async runReconciliation(date = new Date()) {
        const dateStr = date.toISOString().split('T')[0];
        console.log(`[Reconciliation] Starting daily audit for date: ${dateStr}...`);

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const inconsistencies = [];
        const mismatches = [];
        let totalUsersAudited = 0;
        let totalBalances = 0;

        try {
            // 1. Audit user balances against Supabase ledger records
            const users = await User.find({ isSuspended: false });
            
            for (const user of users) {
                totalUsersAudited++;
                totalBalances += (user.balance1 || 0) + (user.balance2 || 0) + (user.earningsBalance || 0);

                try {
                    const ledger = await calculateLedgerBalances(user._id);
                    if (ledger && !ledger.error) {
                        const normalDiff = Math.abs((user.balance1 || 0) - (ledger.normal || 0));
                        const vipDiff = Math.abs((user.balance2 || 0) - (ledger.vip || 0));
                        const earningsDiff = Math.abs((user.earningsBalance || 0) - (ledger.earnings || 0));

                        if (normalDiff > 0.01) {
                            const diff = (user.balance1 || 0) - (ledger.normal || 0);
                            inconsistencies.push(`User ${user.email} Normal Balance Mismatch! Mongo: ₦${(user.balance1 || 0).toFixed(2)}, Ledger: ₦${(ledger.normal || 0).toFixed(2)} (Diff: ₦${diff.toFixed(2)})`);
                            mismatches.push({
                                userId: user._id,
                                email: user.email,
                                name: user.name,
                                walletType: 'normal',
                                mongoBalance: user.balance1 || 0,
                                ledgerBalance: ledger.normal || 0,
                                difference: diff,
                                recommendedRepair: `Insert ledger ${diff > 0 ? 'credit' : 'debit'} of ₦${Math.abs(diff).toFixed(2)} to Normal wallet`
                            });
                        }
                        if (vipDiff > 0.01) {
                            const diff = (user.balance2 || 0) - (ledger.vip || 0);
                            inconsistencies.push(`User ${user.email} VIP Balance Mismatch! Mongo: ₦${(user.balance2 || 0).toFixed(2)}, Ledger: ₦${(ledger.vip || 0).toFixed(2)} (Diff: ₦${diff.toFixed(2)})`);
                            mismatches.push({
                                userId: user._id,
                                email: user.email,
                                name: user.name,
                                walletType: 'vip',
                                mongoBalance: user.balance2 || 0,
                                ledgerBalance: ledger.vip || 0,
                                difference: diff,
                                recommendedRepair: `Insert ledger ${diff > 0 ? 'credit' : 'debit'} of ₦${Math.abs(diff).toFixed(2)} to VIP wallet`
                            });
                        }
                        if (earningsDiff > 0.01) {
                            const diff = (user.earningsBalance || 0) - (ledger.earnings || 0);
                            inconsistencies.push(`User ${user.email} Earnings Balance Mismatch! Mongo: ₦${(user.earningsBalance || 0).toFixed(2)}, Ledger: ₦${(ledger.earnings || 0).toFixed(2)} (Diff: ₦${diff.toFixed(2)})`);
                            mismatches.push({
                                userId: user._id,
                                email: user.email,
                                name: user.name,
                                walletType: 'earnings',
                                mongoBalance: user.earningsBalance || 0,
                                ledgerBalance: ledger.earnings || 0,
                                difference: diff,
                                recommendedRepair: `Insert ledger ${diff > 0 ? 'credit' : 'debit'} of ₦${Math.abs(diff).toFixed(2)} to Earnings wallet`
                            });
                        }
                    }
                } catch (ledgerErr) {
                    inconsistencies.push(`Failed auditing ledger for user ${user.email}: ${ledgerErr.message}`);
                }
            }

            // 2. Aggregate Transaction Ledger totals for the day
            // A. Customer Purchases (Successful debits)
            const purchaseStats = await Transaction.aggregate([
                { $match: { type: 'debit', status: 'success', isInternal: false, createdAt: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: null, total: { $sum: '$amount' }, cost: { $sum: '$cost_price' }, profit: { $sum: '$profit' } } }
            ]);
            const totalCustomerPurchases = purchaseStats[0]?.total || 0;
            const totalProviderDebits = purchaseStats[0]?.cost || 0;
            const totalResellerProfits = purchaseStats[0]?.profit || 0;

            // B. Gateway Funding (Successful credits from Monnify/Paystack)
            const fundingStats = await Transaction.aggregate([
                { $match: { type: 'credit', status: 'success', provider: { $in: ['Monnify', 'Paystack'] }, createdAt: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const totalGatewayFunding = fundingStats[0]?.total || 0;

            // C. Withdrawals (Successful withdrawals)
            const withdrawalStats = await Withdrawal.aggregate([
                { $match: { status: 'approved', createdAt: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const totalWithdrawals = withdrawalStats[0]?.total || 0;

            // D. Refunds (Failed transactions that were refunded)
            const refundStats = await Transaction.aggregate([
                { $match: { status: 'failed', balance_deducted: false, createdAt: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const totalRefunds = refundStats[0]?.total || 0;

            const status = inconsistencies.length === 0 ? 'MATCH' : 'MISMATCH';

            // 3. Save report to DB
            const report = await ReconciliationReport.create({
                date: startOfDay,
                totalUsersAudited,
                totalBalances,
                totalGatewayFunding,
                totalCustomerPurchases,
                totalResellerProfits,
                totalRefunds,
                totalWithdrawals,
                totalProviderDebits,
                inconsistencies,
                mismatches,
                status
            });

            console.log(`[Reconciliation] Complete. Status: ${status.toUpperCase()}. Inconsistencies found: ${inconsistencies.length}`);

            // 4. Send Email Alert if inconsistencies exist
            if (status === 'MISMATCH' || status === 'unbalanced') {
                const adminEmail = process.env.ADMIN_EMAIL || "mksubdata@gmail.com";
                const subject = `🚨 CRITICAL: Financial Reconciliation Mismatch Detected (${dateStr})`;
                const html = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 2px solid #ef4444; border-radius: 12px; background-color: #fef2f2;">
                        <h2 style="color: #ef4444; text-align: center; margin-top: 0;">🚨 Reconciliation Audit Alert</h2>
                        <p>The daily automated ledger reconciliation has detected financial inconsistencies.</p>
                        
                        <div style="background-color: white; padding: 15px; border-radius: 8px; border: 1px solid #fee2e2; margin: 15px 0;">
                            <h3 style="margin-top: 0; color: #1e293b;">Daily Totals (Date: ${dateStr})</h3>
                            <p style="margin: 5px 0;"><strong>Users Checked:</strong> ${totalUsersAudited}</p>
                            <p style="margin: 5px 0;"><strong>Sum of Balances:</strong> ₦${totalBalances.toLocaleString()}</p>
                            <p style="margin: 5px 0;"><strong>Gateway Funding:</strong> ₦${totalGatewayFunding.toLocaleString()}</p>
                            <p style="margin: 5px 0;"><strong>Customer Purchases:</strong> ₦${totalCustomerPurchases.toLocaleString()}</p>
                            <p style="margin: 5px 0;"><strong>Provider Debits (Cost):</strong> ₦${totalProviderDebits.toLocaleString()}</p>
                            <p style="margin: 5px 0;"><strong>Reseller Profits Paid:</strong> ₦${totalResellerProfits.toLocaleString()}</p>
                            <p style="margin: 5px 0;"><strong>Withdrawals Approved:</strong> ₦${totalWithdrawals.toLocaleString()}</p>
                            <p style="margin: 5px 0;"><strong>Refunds Recorded:</strong> ₦${totalRefunds.toLocaleString()}</p>
                        </div>

                        <div style="background-color: white; padding: 15px; border-radius: 8px; border: 1px solid #fee2e2; margin: 15px 0;">
                            <h3 style="margin-top: 0; color: #ef4444;">Flagged Inconsistencies (${inconsistencies.length})</h3>
                            <ul style="padding-left: 20px; color: #7f1d1d;">
                                ${inconsistencies.map(inc => `<li>${inc}</li>`).join('')}
                            </ul>
                        </div>
                        <p style="color: #b91c1c; font-weight: bold; margin-top: 15px;">Immediate investigation is highly recommended.</p>
                    </div>
                `;
                notificationService.sendEmail(adminEmail, subject, html);
            }

            return report;

        } catch (err) {
            console.error('[Reconciliation Error]', err);
            return null;
        }
    }

    /**
     * Audit and optionally fix inconsistencies by inserting reconciliation ledger entries in Supabase.
     */
    async performReconciliationAudit(dryRun = true, targetUserId = null, targetEmail = null, targetWalletType = null) {
        console.log(`[Reconciliation] Running manual ledger audit. dryRun = ${dryRun}, targetUserId = ${targetUserId}, targetEmail = ${targetEmail}, targetWalletType = ${targetWalletType}`);
        const query = { isSuspended: false };
        if (targetUserId) {
            query._id = targetUserId;
        } else if (targetEmail) {
            query.email = targetEmail;
        }
        const users = await User.find(query);
        const results = [];
        const repairsCreated = [];

        const { insertLedgerEntry, calculateLedgerBalances } = await import('./supabaseLedger.js');

        for (const user of users) {
            try {
                const ledger = await calculateLedgerBalances(user._id);
                if (ledger && !ledger.error) {
                    const normalDiff = (user.balance1 || 0) - (ledger.normal || 0);
                    const vipDiff = (user.balance2 || 0) - (ledger.vip || 0);
                    const earningsDiff = (user.earningsBalance || 0) - (ledger.earnings || 0);

                    const userResult = {
                        userId: user._id,
                        name: user.name,
                        email: user.email,
                        mongoBalances: { normal: user.balance1 || 0, vip: user.balance2 || 0, earnings: user.earningsBalance || 0 },
                        ledgerBalances: { normal: ledger.normal, vip: ledger.vip, earnings: ledger.earnings },
                        differences: { normal: normalDiff, vip: vipDiff, earnings: earningsDiff },
                        proposedFixes: []
                    };

                    const handleMismatch = async (diff, walletType, walletLabel) => {
                        // Skip if a specific wallet type is targeted and doesn't match
                        if (targetWalletType && targetWalletType !== walletType) {
                            return;
                        }
                        if (Math.abs(diff) > 0.01) {
                            const type = diff > 0 ? 'credit' : 'debit';
                            const absDiff = Math.abs(diff);
                            const reference = `HISTORICAL TEST DATA CORRECTION - ${walletType} - ${user._id} - ${Date.now()}`;
                            const description = `Historical Balance Correction`;

                            userResult.proposedFixes.push({
                                walletType,
                                amount: absDiff,
                                actionType: type,
                                reference,
                                description,
                                reason: 'HISTORICAL TEST DATA CORRECTION'
                            });

                            if (!dryRun) {
                                console.log(`[Reconciliation Repair] Syncing ${user.email} ${walletLabel} by ${type === 'credit' ? '+' : '-'}₦${absDiff}`);
                                const res = await insertLedgerEntry(user._id, absDiff, type, walletType, reference, description);
                                if (!res.error) {
                                    repairsCreated.push({
                                        user: user.email,
                                        walletType,
                                        amount: absDiff,
                                        actionType: type,
                                        reference,
                                        description,
                                        reason: 'HISTORICAL TEST DATA CORRECTION'
                                    });
                                } else {
                                    console.error(`[Reconciliation Repair] Error inserting repair ledger for ${user.email}:`, res.error);
                                }
                            }
                        }
                    };

                    await handleMismatch(normalDiff, 'normal', 'Normal Wallet');
                    await handleMismatch(vipDiff, 'vip', 'VIP Wallet');
                    await handleMismatch(earningsDiff, 'earnings', 'Earnings Wallet');

                    if (userResult.proposedFixes.length > 0) {
                        results.push(userResult);
                    }
                }
            } catch (err) {
                console.error(`[Reconciliation Manual Audit] Error for ${user.email}:`, err.message);
            }
        }

        return {
            dryRun,
            mismatchesFound: results.length,
            mismatches: results,
            repairsCreated
        };
    }

    /**
     * Start the daily cron job scheduler
     */
    startScheduler() {
        console.log("[Reconciliation] Initializing Daily Cron Scheduler (Time: 23:59:00)...");
        // Run daily at 23:59
        cron.schedule('59 23 * * *', () => {
            this.runReconciliation();
        });
    }
}

export default new ReconciliationService();
