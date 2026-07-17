import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

class AnalyticsService {
    async getUserStats(userId) {
        const stats = await Transaction.aggregate([
            { $match: { userId, isApiRequest: true } },
            { $group: {
                _id: null,
                totalRequests: { $sum: 1 },
                successCount: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
                failedCount: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
                totalRevenue: { $sum: "$amount" }
            }}
        ]);

        const dailyStats = await Transaction.aggregate([
            { $match: { userId, isApiRequest: true, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 },
                revenue: { $sum: "$amount" }
            }},
            { $sort: { "_id": 1 } }
        ]);

        return {
            summary: stats[0] || { totalRequests: 0, successCount: 0, failedCount: 0, totalRevenue: 0 },
            daily: dailyStats
        };
    }

    async getAdminStats() {
        const totalVolume = await Transaction.aggregate([
            { $match: { status: "success" } },
            { $group: { _id: null, total: { $sum: "$amount" }, profit: { $sum: "$profit" } } }
        ]);

        const topUsers = await User.find({ role: 'user' })
            .sort({ balance1: -1 })
            .limit(10)
            .select('name email balance1');

        return {
            volume: totalVolume[0] || { total: 0, profit: 0 },
            topUsers
        };
    }
}

export default new AnalyticsService();
