import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Withdrawal from '../models/Withdrawal.js';
import mongoose from 'mongoose';

// Phase 1: User Audit
export const getUserAudit = async (req, res) => {
    try {
        const { userId } = req.params;
        if (userId && !userId.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid resource identifier format." });
        const user = await User.findById(userId).select('-password -transactionPin -withdrawalPin');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const totalFundedResult = await Transaction.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'credit', status: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalFunded = totalFundedResult.length > 0 ? totalFundedResult[0].total : 0;

        const totalSpentResult = await Transaction.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'debit', status: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalSpent = totalSpentResult.length > 0 ? totalSpentResult[0].total : 0;

        const { page = 1, limit = 50, search, startDate, endDate } = req.query;
        let query = { userId: userId };
        
        if (search) {
            query.$or = [
                { reference: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { status: { $regex: search, $options: 'i' } }
            ];
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
            // Include end of day for endDate if it's just a date
            if (endDate && query.createdAt.$lte) {
                query.createdAt.$lte = new Date(new Date(endDate).setHours(23,59,59,999));
            }
        }

        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
            
        const totalTransactions = await Transaction.countDocuments(query);

        res.json({
            user: {
                ...user.toObject(),
                totalFunded,
                totalSpent
            },
            transactions,
            pagination: {
                total: totalTransactions,
                page: parseInt(page),
                pages: Math.ceil(totalTransactions / limit)
            }
        });

    } catch (err) {
        console.error('[getUserAudit] Error:', err);
        res.status(500).json({ message: err.message });
    }
};

// Phase 2: Reseller Customers Audit
export const getResellerCustomersAudit = async (req, res) => {
    try {
        const { resellerId } = req.params;
        if (resellerId && !resellerId.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid resource identifier format." });
        const { page = 1, limit = 50, search, startDate, endDate } = req.query;

        // Find customer IDs
        const customers = await User.find({ tenantOwnerId: resellerId }).select('_id');
        const customerIds = customers.map(c => c._id);

        let query = { userId: { $in: customerIds } }; 

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                query.createdAt.$lte = new Date(new Date(endDate).setHours(23,59,59,999));
            }
        }

        const transactions = await Transaction.find(query)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const totalTransactions = await Transaction.countDocuments(query);

        res.json({
            transactions,
            pagination: {
                total: totalTransactions,
                page: parseInt(page),
                pages: Math.ceil(totalTransactions / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Phase 2: Profit Ledger Audit
export const getProfitLedgerAudit = async (req, res) => {
    try {
        const { resellerId } = req.params;
        if (resellerId && !resellerId.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid resource identifier format." });
        const { page = 1, limit = 50, search, startDate, endDate } = req.query;

        // Only reseller customer transactions
        let query = { resellerId: resellerId, userId: { $ne: resellerId } };
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                query.createdAt.$lte = new Date(new Date(endDate).setHours(23,59,59,999));
            }
        }

        // Fetch transactions
        const transactions = await Transaction.find(query)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const totalTransactions = await Transaction.countDocuments(query);

        // Map the results to explicitly include "Estimated Admin Share"
        const ledger = transactions.map(tx => {
            const costPrice = tx.cost_price || 0;
            const sellingPrice = tx.selling_price || 0;
            const resellerProfit = tx.profit || 0;
            const adminShare = sellingPrice - costPrice - resellerProfit;

            return {
                _id: tx._id,
                transactionId: tx.reference || tx._id,
                customerEmail: tx.userId ? tx.userId.email : 'Unknown',
                customerName: tx.userId ? tx.userId.name : 'Unknown',
                servicePurchased: tx.description || tx.type,
                providerCost: costPrice,
                customerSellingPrice: sellingPrice,
                resellerProfit: resellerProfit,
                estimatedAdminShare: adminShare,
                status: tx.status,
                date: tx.createdAt
            };
        });

        res.json({
            ledger,
            pagination: {
                total: totalTransactions,
                page: parseInt(page),
                pages: Math.ceil(totalTransactions / limit)
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Phase 1 (Reseller Website Analytics): Super-Admin-only, read-only overview.
// Deliberately built entirely from data that already exists (tenantOwnerId,
// resellerId, whiteLabelStatus, createdAt) -- no heartbeat/polling/websocket
// system, no new schema fields, no new tenant-resolution logic. Access is
// enforced at the route level via requireOwner, matching every other
// owner-only endpoint in this file's routes (backups, reconciliation, etc).
export const getResellerAnalyticsOverview = async (req, res) => {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Bound the transaction scan to a fixed recent window rather than the whole
        // collection, so this endpoint's cost stays constant as the platform grows.
        // This window doubles as the "recent activity" cutoff -- anything older is
        // honestly reported as "no recent activity" rather than a fabricated status.
        const activityWindowDays = 30;
        const activityWindowStart = new Date(now.getTime() - activityWindowDays * 24 * 60 * 60 * 1000);

        // Same reseller filter already used by getResellers() in adminController.js,
        // for consistency with the existing "Reseller Partners" list.
        const resellers = await User.find({
            $or: [
                { role: { $in: ['reseller_admin', 'reseller'] } },
                { whiteLabelStatus: 'active' }
            ]
        }).select('name branding subdomain customDomain whiteLabelStatus isResellerActivated isGracePeriod resellerTier onboardingData createdAt').lean();

        if (resellers.length === 0) {
            return res.json({ resellers: [], generatedAt: now, activityWindowDays });
        }

        const resellerIds = resellers.map(r => r._id);

        // Customer counts for ALL resellers in a single aggregation (no per-reseller
        // loop / no N+1). tenantOwnerId is the sole tenant-ownership field (see
        // models/User.js) and is already indexed.
        const customerStats = await User.aggregate([
            { $match: { tenantOwnerId: { $in: resellerIds } } },
            {
                $group: {
                    _id: '$tenantOwnerId',
                    totalCustomers: { $sum: 1 },
                    customersToday: { $sum: { $cond: [{ $gte: ['$createdAt', startOfToday] }, 1, 0] } },
                    customersWeek: { $sum: { $cond: [{ $gte: ['$createdAt', startOfWeek] }, 1, 0] } },
                    customersMonth: { $sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0] } }
                }
            }
        ]);
        const customerStatsMap = new Map(customerStats.map(c => [String(c._id), c]));

        // Transaction counts/volume/last-activity for ALL resellers in a single
        // aggregation, bounded to activityWindowStart, using the existing
        // { resellerId: 1, createdAt: -1 } index. Volume only sums 'success'
        // transactions -- pending/failed attempts are counted but never valued.
        const txStats = await Transaction.aggregate([
            { $match: { resellerId: { $in: resellerIds }, createdAt: { $gte: activityWindowStart } } },
            {
                $group: {
                    _id: '$resellerId',
                    txToday: { $sum: { $cond: [{ $gte: ['$createdAt', startOfToday] }, 1, 0] } },
                    txWeek: { $sum: { $cond: [{ $gte: ['$createdAt', startOfWeek] }, 1, 0] } },
                    txMonth: { $sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0] } },
                    volumeToday: { $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', startOfToday] }, { $eq: ['$status', 'success'] }] }, '$amount', 0] } },
                    volumeWeek: { $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', startOfWeek] }, { $eq: ['$status', 'success'] }] }, '$amount', 0] } },
                    volumeMonth: { $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', startOfMonth] }, { $eq: ['$status', 'success'] }] }, '$amount', 0] } },
                    lastActivity: { $max: '$createdAt' }
                }
            }
        ]);
        const txStatsMap = new Map(txStats.map(t => [String(t._id), t]));

        // Merge in memory (no further DB calls). Status wording is deliberately
        // "Active"/"Inactive" derived from existing account-status fields -- never
        // "online"/"offline", since no real website-health signal exists.
        const BLOCKED_STATUSES = ['suspended', 'disabled', 'under_review'];
        const results = resellers.map(reseller => {
            const id = String(reseller._id);
            const c = customerStatsMap.get(id);
            const t = txStatsMap.get(id);

            const businessName = reseller.branding?.siteName || reseller.onboardingData?.brandName || reseller.onboardingData?.businessName || reseller.name;
            const domain = reseller.customDomain || (reseller.subdomain ? `${reseller.subdomain}.9jasub.com` : null);

            let status = 'Inactive';
            let statusReason = 'Not yet activated';
            if (BLOCKED_STATUSES.includes(reseller.whiteLabelStatus)) {
                statusReason = reseller.whiteLabelStatus === 'under_review' ? 'Under review' : 'Suspended';
            } else if (reseller.isGracePeriod) {
                statusReason = 'Grace period (activation fee pending)';
            } else if (reseller.isResellerActivated && reseller.whiteLabelStatus === 'active') {
                status = 'Active';
                statusReason = 'Active';
            }

            return {
                resellerId: reseller._id,
                businessName,
                domain,
                resellerTier: reseller.resellerTier,
                status,
                statusReason,
                customers: {
                    total: c?.totalCustomers || 0,
                    today: c?.customersToday || 0,
                    week: c?.customersWeek || 0,
                    month: c?.customersMonth || 0
                },
                transactions: {
                    today: t?.txToday || 0,
                    week: t?.txWeek || 0,
                    month: t?.txMonth || 0
                },
                volume: {
                    today: t?.volumeToday || 0,
                    week: t?.volumeWeek || 0,
                    month: t?.volumeMonth || 0
                },
                lastActivity: t?.lastActivity || null,
                resellerSince: reseller.createdAt
            };
        });

        res.json({ resellers: results, generatedAt: now, activityWindowDays });
    } catch (err) {
        console.error('[getResellerAnalyticsOverview] Error:', err);
        res.status(500).json({ message: err.message });
    }
};

// Phase 3: Withdrawal Verification Dashboard
export const getWithdrawalVerification = async (req, res) => {
    try {
        const { withdrawalId } = req.params;
        const withdrawal = await Withdrawal.findById(withdrawalId).populate('userId', 'name email balance1 earningsBalance');
        if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

        const user = withdrawal.userId;
        const requestedAmount = withdrawal.amount;
        const currentEarningsBalance = user.earningsBalance || 0;

        const profitEarnedResult = await Transaction.aggregate([
            { $match: { resellerId: new mongoose.Types.ObjectId(user._id) } },
            { $group: { _id: null, total: { $sum: '$profit' } } }
        ]);
        const totalProfitEarned = profitEarnedResult.length > 0 ? profitEarnedResult[0].total : 0;

        const profitWithdrawnResult = await Withdrawal.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(user._id), status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalProfitWithdrawn = profitWithdrawnResult.length > 0 ? profitWithdrawnResult[0].total : 0;

        const pendingWithdrawalResult = await Withdrawal.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(user._id), status: 'pending', _id: { $ne: new mongoose.Types.ObjectId(withdrawalId) } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const otherPending = pendingWithdrawalResult.length > 0 ? pendingWithdrawalResult[0].total : 0;
        const pendingWithdrawalAmount = otherPending + requestedAmount;

        const availableBeforeThisRequest = totalProfitEarned - totalProfitWithdrawn - otherPending;

        res.json({
            withdrawal: {
                _id: withdrawal._id,
                userId: user._id,
                status: withdrawal.status,
                reference: withdrawal.reference,
                date: withdrawal.createdAt,
                amount: withdrawal.amount,
                bankName: withdrawal.bankName,
                accountNumber: withdrawal.accountNumber,
                accountName: withdrawal.accountName
            },
            userBalances: {
                balance1: user.balance1 || 0,
                earningsBalance: currentEarningsBalance
            },
            profitIntegrity: {
                totalCalculatedProfit: totalProfitEarned,
                totalPreviousWithdrawals: totalProfitWithdrawn,
                maxWithdrawableAmount: Math.max(0, availableBeforeThisRequest),
                isAmountValid: availableBeforeThisRequest >= requestedAmount
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
