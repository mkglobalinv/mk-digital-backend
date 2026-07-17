import { getSupabaseClient } from '../supabaseClient.js';
import { getGlobalPrice } from './globalPricing.js';
import User from '../../models/User.js';

/**
 * Calculates the exact price a reseller should pay based on their tier, overrides, and global base cost.
 */
export const getResellerPrice = async (resellerId, planId, serviceType = 'data') => {
    try {
        const globalPrice = await getGlobalPrice(planId, serviceType);
        if (!globalPrice) throw new Error("Plan not found in Global Pricing");

        const supabase = getSupabaseClient();
        
        if (supabase) {
            // 1. Check for specific custom override first
            const { data: override } = await supabase
                .from('reseller_custom_price_overrides')
                .select('custom_price')
                .eq('reseller_id', resellerId)
                .eq('plan_id', planId)
                .single();
                
            if (override) return override.custom_price;

            // 2. Determine Reseller Tier
            const reseller = await User.findById(resellerId).lean();
            if (!reseller) throw new Error("Reseller not found");

            const isVIP = reseller.apiSubscriptionTier === 'pro' || reseller.apiSubscriptionTier === 'enterprise';

            // 3. Fallback to basic/vip pricing tables
            const table = isVIP ? 'reseller_vip_pricing' : 'reseller_basic_pricing';
            const priceCol = isVIP ? 'vip_price' : 'reseller_price';

            const { data: tierPrice } = await supabase
                .from(table)
                .select(priceCol)
                .eq('plan_id', planId)
                .single();

            if (tierPrice) return tierPrice[priceCol];
        }

        // Fallback: If no Supabase records, use the MongoDB default logic
        const reseller = await User.findById(resellerId).lean();
        const isVIP = reseller?.apiSubscriptionTier === 'pro' || reseller?.apiSubscriptionTier === 'enterprise';
        // Note: For full fallback, we would need the DataPlan document. 
        // We simplified it here for architecture separation.
        return globalPrice.default_retail_price;

    } catch (err) {
        console.error('[ResellerPricing Engine] Error calculating price:', err);
        throw err;
    }
};

/**
 * Gets the markup amount a reseller charges THEIR customers.
 */
export const getResellerMarkup = async (resellerId, serviceType = 'data') => {
    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            const { data } = await supabase
                .from('reseller_service_markup')
                .select('markup_type, markup_value')
                .eq('reseller_id', resellerId)
                .eq('service_type', serviceType)
                .single();
                
            if (data) return data;
        }
        return { markup_type: 'flat', markup_value: 0 };
    } catch (err) {
        return { markup_type: 'flat', markup_value: 0 };
    }
};
