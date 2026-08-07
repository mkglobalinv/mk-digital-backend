import { getSupabaseClient } from '../supabaseClient.js';
import DataPlan from '../../models/DataPlan.js';

/**
 * Fetches the base global pricing for a service from the Global Platform Engine.
 */
export const getGlobalPrice = async (planId, serviceType = 'data') => {
    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            const { data, error } = await supabase
                .from('global_pricing')
                .select('*')
                .eq('plan_id', planId)
                .single();
                
            if (!error && data) {
                return data;
            }
        }
        
        // Fallback to MongoDB if Supabase table is empty/unmigrated
        if (serviceType === 'data' || serviceType === 'identity') {
            const plan = await DataPlan.findOne({ api_plan_id: planId }).lean();
            if (plan) {
                return {
                    plan_id: plan.api_plan_id,
                    base_cost: plan.api_price,
                    default_retail_price: plan.selling_price,
                    provider: plan.provider
                };
            }
        }
        return null;
    } catch (err) {
        console.error('[GlobalPricing Engine] Error fetching price:', err);
        return null;
    }
};
