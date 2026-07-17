import { getSupabaseClient } from './supabaseClient.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

/**
 * Syncs daily analytics from MongoDB to Supabase.
 * This can be run via a cron job every hour or end of day to offload
 * heavy aggregations from the frontend dashboard requests.
 */
export const syncDailyAnalytics = async (dateStr, resellerId = 'system') => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return { error: 'Supabase client not initialized' };

        const startOfDay = new Date(dateStr);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(dateStr);
        endOfDay.setHours(23, 59, 59, 999);

        // Build Match Query
        const matchQuery = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
        if (resellerId !== 'system') {
            matchQuery.resellerId = resellerId;
        }

        // Aggregate in Mongo to push summary to Supabase
        const stats = await Transaction.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalTransactions: { $sum: 1 },
                    successfulTransactions: { 
                        $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } 
                    },
                    failedTransactions: { 
                        $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } 
                    },
                    totalRevenue: { 
                        $sum: { $cond: [{ $eq: ["$status", "success"] }, "$amount", 0] } 
                    },
                    totalProfit: { 
                        $sum: { $cond: [{ $eq: ["$status", "success"] }, "$profit", 0] } 
                    }
                }
            }
        ]);

        const result = stats[0] || {
            totalTransactions: 0,
            successfulTransactions: 0,
            failedTransactions: 0,
            totalRevenue: 0,
            totalProfit: 0
        };

        // Active users count
        const activeUsersQuery = { lastApiCall: { $gte: startOfDay, $lte: endOfDay } };
        if (resellerId !== 'system') {
            activeUsersQuery.referredBy = resellerId;
        }
        const activeUsers = await User.countDocuments(activeUsersQuery);

        // Upsert to Supabase
        const { data, error } = await supabase.from('daily_analytics').upsert({
            date: startOfDay.toISOString().split('T')[0],
            reseller_id: resellerId.toString(),
            total_transactions: result.totalTransactions,
            successful_transactions: result.successfulTransactions,
            failed_transactions: result.failedTransactions,
            total_revenue: result.totalRevenue,
            total_profit: result.totalProfit,
            active_users: activeUsers,
            updated_at: new Date().toISOString()
        }, { onConflict: 'date,reseller_id' });

        if (error) throw error;
        
        return { success: true, data };
    } catch (err) {
        console.error('[Supabase Analytics] Sync failed:', err);
        return { error: err.message };
    }
};

/**
 * Fetch optimized analytics directly from Supabase instead of running
 * expensive MongoDB aggregates on every dashboard load.
 */
export const getAnalyticsFromSupabase = async (resellerId = 'system', limitDays = 7) => {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: 'Supabase client not initialized' };

    const { data, error } = await supabase
        .from('daily_analytics')
        .select('*')
        .eq('reseller_id', resellerId.toString())
        .order('date', { ascending: false })
        .limit(limitDays);

    if (error) {
        console.error('[Supabase Analytics] Fetch failed:', error);
        return { error };
    }

    return { data };
};
