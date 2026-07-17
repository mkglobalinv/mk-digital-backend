import { getSupabaseClient } from './supabaseClient.js';
import User from '../models/User.js';

export const insertLedgerEntry = async (userId, amount, type, walletType, reference, description) => {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: 'Supabase client not initialized' };

    const { data, error } = await supabase
        .from('wallet_ledger')
        .insert([{
            user_id: userId.toString(),
            amount: parseFloat(amount),
            type,
            wallet_type: walletType,
            reference,
            description,
            status: 'success'
        }]);

    if (error) {
        console.error('[Supabase Ledger] Failed to insert ledger entry:', error);
        return { error };
    }

    return { data };
};

// Calculates the exact balance from the ledger dynamically
export const calculateLedgerBalances = async (userId) => {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: 'Supabase client not initialized' };

    // Fetch all successful transactions for this user
    const { data, error } = await supabase
        .from('wallet_ledger')
        .select('amount, type, wallet_type')
        .eq('user_id', userId.toString())
        .eq('status', 'success');

    if (error) {
        console.error('[Supabase Ledger] Failed to calculate balance:', error);
        return { error };
    }

    const balances = {
        normal: 0,
        vip: 0,
        earnings: 0
    };

    data.forEach(entry => {
        const amt = parseFloat(entry.amount);
        if (entry.type === 'credit' || entry.type === 'commission') {
            balances[entry.wallet_type] += amt;
        } else if (entry.type === 'debit' || entry.type === 'adjustment') { // adjustment can be debit
            balances[entry.wallet_type] -= amt;
        }
    });

    return balances;
};

// Sync Supabase ledger balance back to MongoDB (hybrid approach)
export const syncLedgerToMongo = async (userId) => {
    try {
        const balances = await calculateLedgerBalances(userId);
        if (balances.error) return false;

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
