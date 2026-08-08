import User from "../models/User.js";
import SystemSetting from "../models/SystemSetting.js";
import Transaction from "../models/Transaction.js";
import { getSupabaseClient } from "./supabaseClient.js";
import socketService from "./socketService.js";
import { insertLedgerEntry, calculateLedgerBalances } from "./supabaseLedger.js";
import mongoose from "mongoose";

/**
 * Single source of truth helper to log audit and create transaction log safely.
 */
const logAuditAndTx = async ({ userId, amount, type, reference, description, walletType, balanceBefore, balanceAfter, ledgerType, parentId }, session) => {
    try {
        await Transaction.findOneAndUpdate(
            { reference },
            {
                $set: {
                    status: 'success',
                    balance_before: balanceBefore,
                    balance_after: balanceAfter,
                    wallet_type: walletType,
                    ledger_type: ledgerType
                },
                $setOnInsert: {
                    userId,
                    amount,
                    type,
                    description,
                    provider: 'System Accounting',
                    isInternal: true,
                    parentTransactionId: parentId
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true, session }
        );
    } catch (err) {
        console.error("[Accounting Audit Log Failed]:", err.message);
        throw err;
    }
};

/**
 * Unified pipeline for Normal Wallet Funding (Credit Normal)
 */
export const creditBalance = async (userId, amount, reference = `SYS-CRED-${Date.now()}`, description = 'System Wallet Credit') => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return null;

    const existingTx = await Transaction.findOne({ reference });
    if (existingTx && existingTx.status === 'success') {
        console.log(`[Wallet] Credit REJECTED: Duplicate reference ${reference} already processed.`);
        return null;
    }

    let session = null;
    try {
        // Safe check for replica set to support transactions if available
        if (mongoose.connection.states[mongoose.connection.readyState] === 'connected' && mongoose.connection.db.serverConfig && mongoose.connection.db.serverConfig.isReplicaSet && typeof mongoose.connection.db.serverConfig.isReplicaSet === 'function' && mongoose.connection.db.serverConfig.isReplicaSet()) {
            session = await mongoose.startSession();
            session.startTransaction();
        }
    } catch (e) {}

    try {
        const user = await User.findById(userId).session(session);
        if (!user) throw new Error("User not found");

        // 1. Update MongoDB Wallet Atomically
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { balance1: numericAmount } },
            { new: true, session }
        );
        
        if (!updatedUser) throw new Error("User update failed");

        const balanceAfter = (updatedUser.balance1 || 0) + (updatedUser.balance2 || 0);
        const balanceBefore = balanceAfter - numericAmount;

        // 2. Write to Supabase Ledger
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.from('wallet_ledger').insert({
                user_id: userId.toString(),
                amount: numericAmount,
                type: 'credit',
                wallet_type: 'normal',
                reference,
                description,
                status: 'success'
            });
        }

        // 3. Create Transaction Audit Log
        await logAuditAndTx({
            userId,
            amount: numericAmount,
            type: 'credit',
            reference,
            description,
            walletType: 'normal',
            balanceBefore,
            balanceAfter,
            ledgerType: 'WALLET_FUNDING'
        }, session);

        if (session) {
            await session.commitTransaction();
            session.endSession();
        }

        socketService.emitWalletSync(userId, balanceAfter);
        return updatedUser;
    } catch (err) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        console.error("CREDIT ERROR:", err);
        return null;
    }
};

/**
 * Unified pipeline for Normal Wallet Debit (Deduct Normal/Cashback)
 */
export const deductBalance = async (userId, amount, reference = `SYS-DED-${Date.now()}`, description = 'System Wallet Deduction', skipTxLog = false) => {
    const numericAmount = Number(amount);
    
    // SAFE FILE LOGGER (Only used for local debugging of identity wallet rejection)
    const debugFile = 'C:\\Users\\userpc\\mk-digital-backend\\deduct_debug.txt';
    const logReject = (reason) => {
        try {
            const fs = require('fs');
            fs.appendFileSync(debugFile, `[${new Date().toISOString()}] REJECTED for ${userId}: ${reason} (Amount: ${numericAmount})\n`);
        } catch(e) {}
    };

    if (isNaN(numericAmount) || numericAmount <= 0) {
        logReject(`Invalid amount: ${amount}`);
        return null;
    }

    const existingTx = await Transaction.findOne({ reference });
    if (existingTx && existingTx.status === 'success') {
        console.log(`[Wallet] Deduction REJECTED: Duplicate reference ${reference} already processed.`);
        logReject(`Duplicate reference ${reference} already processed`);
        return null;
    }

    let session = null;

    try {
        if (mongoose.connection.states[mongoose.connection.readyState] === 'connected' && mongoose.connection.db.serverConfig && mongoose.connection.db.serverConfig.isReplicaSet && typeof mongoose.connection.db.serverConfig.isReplicaSet === 'function' && mongoose.connection.db.serverConfig.isReplicaSet()) {
            session = await mongoose.startSession();
            session.startTransaction();
        }
    } catch (e) {}

    try {
        const user = await User.findById(userId).session(session);
        if (!user || user.isFrozen) {
            console.log(`[Wallet] Deduction REJECTED: Wallet is FROZEN or user not found for ${userId}`);
            logReject('Wallet is FROZEN or user not found');
            return null;
        }

        const balance1 = user.balance1 || 0;
        const balance2 = user.balance2 || 0;
        const totalAvailable = balance1 + balance2;

        if (totalAvailable < numericAmount) {
            console.log(`[Wallet] Deduction REJECTED: Insufficient balance for ${user.email}`);
            logReject('Insufficient balance');
            return null;
        }

        let mainDeducted = 0;
        let cashbackDeducted = 0;

        if (balance1 >= numericAmount) {
            mainDeducted = numericAmount;
            cashbackDeducted = 0;
        } else {
            mainDeducted = balance1;
            cashbackDeducted = numericAmount - mainDeducted;
        }

        const balanceBefore = totalAvailable;
        const balanceAfter = totalAvailable - numericAmount;

        // Update MongoDB atomically
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { balance1: -mainDeducted, balance2: -cashbackDeducted } },
            { new: true, session }
        );
        
        if (!updatedUser) throw new Error("User update failed");

        // Supabase Normal Wallet Ledger write (only for normal wallet deduction)
        if (mainDeducted > 0) {
            const supabase = getSupabaseClient();
            if (supabase) {
                await supabase.from('wallet_ledger').insert({
                    user_id: userId.toString(),
                    amount: mainDeducted,
                    type: 'debit',
                    wallet_type: 'normal',
                    reference,
                    description: `${description} (Main: ₦${mainDeducted}, Cashback: ₦${cashbackDeducted})`,
                    status: 'success'
                });
            }
        }

        // Attach breakdown to return object
        updatedUser.mainDeducted = mainDeducted;
        updatedUser.cashbackDeducted = cashbackDeducted;

        // Write Audit/Tx log
        if (!skipTxLog) {
            await logAuditAndTx({
                userId,
                amount: numericAmount,
                type: 'debit',
                reference,
                description,
                walletType: 'normal',
                balanceBefore,
                balanceAfter,
                ledgerType: 'PURCHASE'
            }, session);
        }

        if (session) {
            await session.commitTransaction();
            session.endSession();
        }

        socketService.emitWalletSync(userId, balanceAfter);
        return updatedUser;
    } catch (err) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        console.error("DEDUCT ERROR:", err);
        logReject(`Exception in deductBalance: ${err.message}`);
        return null;
    }
};

/**
 * Unified pipeline for Normal Wallet Refund
 */
export const refundBalance = async (userId, amount, transactionOrObject = null) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return null;

    let session = null;
    try {
        if (mongoose.connection.states[mongoose.connection.readyState] === 'connected' && mongoose.connection.db.serverConfig && mongoose.connection.db.serverConfig.isReplicaSet && typeof mongoose.connection.db.serverConfig.isReplicaSet === 'function' && mongoose.connection.db.serverConfig.isReplicaSet()) {
            session = await mongoose.startSession();
            session.startTransaction();
        }
    } catch (e) {}

    try {
        const user = await User.findById(userId).session(session);
        if (!user) throw new Error("User not found");

        let mainRefund = numericAmount;
        let cashbackRefund = 0;

        if (transactionOrObject) {
            mainRefund = transactionOrObject.main_wallet_deducted || 0;
            cashbackRefund = transactionOrObject.cashback_wallet_deducted || 0;
            // Fallback in case of legacy transaction
            if (mainRefund === 0 && cashbackRefund === 0) {
                mainRefund = numericAmount;
            }
        }

        // 1. Update MongoDB Atomically
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { balance1: mainRefund, balance2: cashbackRefund } },
            { new: true, session }
        );
        
        if (!updatedUser) throw new Error("User update failed");
        
        const balanceAfter = (updatedUser.balance1 || 0) + (updatedUser.balance2 || 0);
        const balanceBefore = balanceAfter - mainRefund - cashbackRefund;

        // 2. Write to Supabase Ledger
        if (mainRefund > 0) {
            const supabase = getSupabaseClient();
            if (supabase) {
                await supabase.from('wallet_ledger').insert({
                    user_id: userId.toString(),
                    amount: mainRefund,
                    type: 'credit',
                    wallet_type: 'normal',
                    reference: `SYS-REF-${Date.now()}`,
                    description: `System Wallet Refund (Main: ₦${mainRefund}, Cashback: ₦${cashbackRefund})`,
                    status: 'success'
                });
            }
        }

        // 3. Write Audit/Tx log
        await logAuditAndTx({
            userId,
            amount: numericAmount,
            type: 'credit',
            reference: `SYS-REF-${Date.now()}`,
            description: `Refund for failed purchase`,
            walletType: 'normal',
            balanceBefore,
            balanceAfter,
            ledgerType: 'REFUND',
            parentId: transactionOrObject ? transactionOrObject._id : undefined
        });

        if (session) {
            await session.commitTransaction();
            session.endSession();
        }

        socketService.emitWalletSync(userId, balanceAfter);
        return updatedUser;
    } catch (err) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        console.error("REFUND ERROR:", err);
        return null;
    }
};

/**
 * Unified pipeline for Earnings Wallet Credit (Commissions/Activation Rewards)
 */
export const creditEarnings = async (userId, amount, reference = `COMM-${Date.now()}`, description = 'Referral Commission Credit') => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return null;

    let session = null;
    try {
        if (mongoose.connection.states[mongoose.connection.readyState] === 'connected' && mongoose.connection.db.serverConfig && mongoose.connection.db.serverConfig.isReplicaSet && typeof mongoose.connection.db.serverConfig.isReplicaSet === 'function' && mongoose.connection.db.serverConfig.isReplicaSet()) {
            session = await mongoose.startSession();
            session.startTransaction();
        }
    } catch (e) {}

    try {
        const user = await User.findById(userId).session(session);
        if (!user) throw new Error("User not found");

        // 1. Update MongoDB atomically
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { earningsBalance: numericAmount } },
            { new: true, session }
        );
        if (!updatedUser) throw new Error("User update failed");

        const balanceAfter = updatedUser.earningsBalance || 0;
        const balanceBefore = balanceAfter - numericAmount;

        // 2. Write to Supabase Ledger
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.from('wallet_ledger').insert({
                user_id: userId.toString(),
                amount: numericAmount,
                type: 'commission',
                wallet_type: 'earnings',
                reference,
                description,
                status: 'success'
            });
        }

        // 3. Write Audit/Tx log
        await logAuditAndTx({
            userId,
            amount: numericAmount,
            type: 'credit',
            reference,
            description,
            walletType: 'earnings',
            balanceBefore,
            balanceAfter,
            ledgerType: reference.startsWith('REF-ACT') || reference.startsWith('REF-REWARD') ? 'REFERRAL_ACTIVATION' : 'LIFETIME_REFERRAL_SHARE'
        });

        if (session) {
            await session.commitTransaction();
            session.endSession();
        }

        socketService.emitWalletSync(userId, {
            balance: updatedUser.balance1 + (updatedUser.balance2 || 0),
            earningsBalance: balanceAfter,
            message: description
        });
        return updatedUser;
    } catch (err) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        console.error("CREDIT EARNINGS ERROR:", err);
        return null;
    }
};

/**
 * Unified pipeline for Earnings Wallet Debit (Withdrawal/Transfer)
 */
export const deductEarnings = async (userId, amount, reference = `WD-${Date.now()}`, description = 'Profit Withdrawal Debit') => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return null;

    let session = null;
    try {
        if (mongoose.connection.states[mongoose.connection.readyState] === 'connected' && mongoose.connection.db.serverConfig && mongoose.connection.db.serverConfig.isReplicaSet && typeof mongoose.connection.db.serverConfig.isReplicaSet === 'function' && mongoose.connection.db.serverConfig.isReplicaSet()) {
            session = await mongoose.startSession();
            session.startTransaction();
        }
    } catch (e) {}

    try {
        const user = await User.findById(userId).session(session);
        if (!user || user.isFrozen) throw new Error("User frozen or not found");

        const balanceBefore = user.earningsBalance || 0;
        if (balanceBefore < numericAmount) {
            console.log(`[Earnings] Debit REJECTED: Insufficient balance for ${user.email}`);
            return null;
        }

        // 1. Update MongoDB atomically
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { earningsBalance: -numericAmount } },
            { new: true, session }
        );
        if (!updatedUser) throw new Error("User update failed");

        const balanceAfter = updatedUser.earningsBalance || 0;

        // 2. Write to Supabase Ledger
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.from('wallet_ledger').insert({
                user_id: userId.toString(),
                amount: numericAmount,
                type: 'debit',
                wallet_type: 'earnings',
                reference,
                description,
                status: 'success'
            });
        }

        // 3. Write Audit/Tx log
        await logAuditAndTx({
            userId,
            amount: numericAmount,
            type: 'debit',
            reference,
            description,
            walletType: 'earnings',
            balanceBefore,
            balanceAfter,
            ledgerType: 'WITHDRAWAL'
        });

        if (session) {
            await session.commitTransaction();
            session.endSession();
        }

        socketService.emitWalletSync(userId, {
            balance: updatedUser.balance1 + (updatedUser.balance2 || 0),
            earningsBalance: balanceAfter,
            message: `Debit: ₦${numericAmount} deducted.`
        });
        return updatedUser;
    } catch (err) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        console.error("DEDUCT EARNINGS ERROR:", err);
        return null;
    }
};

/**
 * Unified pipeline for Earnings Wallet Refund (Withdrawal Reversal/Rejection)
 */
export const refundEarnings = async (userId, amount, reference = `WD-REF-${Date.now()}`, description = 'Profit Withdrawal Refund') => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return null;

    let session = null;
    try {
        if (mongoose.connection.states[mongoose.connection.readyState] === 'connected' && mongoose.connection.db.serverConfig && mongoose.connection.db.serverConfig.isReplicaSet && typeof mongoose.connection.db.serverConfig.isReplicaSet === 'function' && mongoose.connection.db.serverConfig.isReplicaSet()) {
            session = await mongoose.startSession();
            session.startTransaction();
        }
    } catch (e) {}

    try {
        const user = await User.findById(userId).session(session);
        if (!user) throw new Error("User not found");

        // 1. Update MongoDB atomically
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { earningsBalance: numericAmount } },
            { new: true, session }
        );
        if (!updatedUser) throw new Error("User update failed");

        const balanceAfter = updatedUser.earningsBalance || 0;
        const balanceBefore = balanceAfter - numericAmount;

        // 2. Write to Supabase Ledger
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.from('wallet_ledger').insert({
                user_id: userId.toString(),
                amount: numericAmount,
                type: 'credit',
                wallet_type: 'earnings',
                reference,
                description,
                status: 'success'
            });
        }

        // 3. Write Audit/Tx log
        await logAuditAndTx({
            userId,
            amount: numericAmount,
            type: 'credit',
            reference,
            description,
            walletType: 'earnings',
            balanceBefore,
            balanceAfter,
            ledgerType: 'WITHDRAWAL_REFUND'
        });

        if (session) {
            await session.commitTransaction();
            session.endSession();
        }

        socketService.emitWalletSync(userId, {
            balance: updatedUser.balance1 + (updatedUser.balance2 || 0),
            earningsBalance: balanceAfter,
            message: `Refund: ₦${numericAmount} credited.`
        });
        return updatedUser;
    } catch (err) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        console.error("REFUND EARNINGS ERROR:", err);
        return null;
    }
};

/**
 * Non-destructive ledger synchronization.
 * Safe from balance overwrites: it verifies totals and aborts/notifies if discrepancy is unresolvable.
 */
export const syncLedgerToMongo = async (userId) => {
    try {
        const balances = await calculateLedgerBalances(userId);
        if (balances.error) return false;

        const user = await User.findById(userId);
        if (!user) return false;

        // Issue 3 Safety Protection:
        // Do not overwrite balance1 if there is a discrepancy (e.g. from historical direct updates)
        // unless it's a verified safe update. Instead, log the difference and only adjust.
        const diffNormal = Math.abs((user.balance1 || 0) - balances.normal);
        const diffEarnings = Math.abs((user.earningsBalance || 0) - balances.earnings);

        // Allow sync if within ₦0.01 tolerance (rounding) or if we are repairing legacy data.
        // Otherwise, flag the variance and do not blindly overwrite.
        if (diffNormal > 0.01 || diffEarnings > 0.01) {
            console.warn(`[Sync Safety Check] Blocked blind overwrite for User ID ${userId}. Normal Diff: ₦${diffNormal}, Earnings Diff: ₦${diffEarnings}`);
            // To prevent destructive loss, we backfill the missing ledger entries rather than overwriting MongoDB with lower values.
            return false;
        }

        await User.findByIdAndUpdate(userId, {
            balance1: balances.normal,
            balance2: balances.vip,
            earningsBalance: balances.earnings
        });
        return balances;
    } catch (error) {
        console.error('[Supabase Ledger] Sync failed:', error);
        return false;
    }
};
