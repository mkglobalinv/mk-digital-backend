import { getSupabaseClient } from '../supabaseClient.js';
import { getGlobalPrice } from './globalPricing.js';
import { getResellerPrice, getResellerMarkup } from './resellerPricing.js';
import User from '../../models/User.js';
import PricingSettings from '../../models/PricingSettings.js';

/**
 * Calculates the exact price a retail customer pays.
 * If they signed up under a reseller, it factors in the reseller's wholesale cost + markup.
 * Otherwise, it uses the global default retail price + active retail discounts.
 */
export const getRetailPrice = async (userId, planId, serviceType = 'data') => {
    try {
        const user = await User.findById(userId).lean();
        if (!user) throw new Error("User not found");

        const globalPrice = await getGlobalPrice(planId, serviceType);
        if (!globalPrice) throw new Error("Plan not found in Global Pricing");

        let baseRetailPrice = globalPrice.default_retail_price;

        // 1. Check if user belongs to a reseller (White-Label)
        if (user.referredBy) {
            const resellerId = user.referredBy.toString();
            
            // Get the reseller object to check their tier and stored prices
            const reseller = await User.findById(resellerId).lean();
            if (!reseller) throw new Error("Reseller not found");
            
            // What the reseller pays the platform
            const resellerWholesaleCost = await getResellerPrice(resellerId, planId, serviceType);
            
            const isPremium = reseller.canOverridePricing || 
                reseller.resellerTier === 'vip' || 
                reseller.resellerTier === 'premium' || 
                reseller.resellerType === 'premium';

            const key = String(planId || serviceType).replace(/\./g, '_dot_');

            if (isPremium) {
                // Premium Reseller: They can set their own profit margin
                if (reseller.customPrices && reseller.customPrices[key]) {
                    baseRetailPrice = Number(reseller.customPrices[key]);
                } else {
                    // Fallback to their general markup
                    const markup = await getResellerMarkup(resellerId, serviceType);
                    if (markup.markup_type === 'percentage') {
                        baseRetailPrice = Number(resellerWholesaleCost) + (Number(resellerWholesaleCost) * (Number(markup.markup_value) / 100));
                    } else {
                        baseRetailPrice = Number(resellerWholesaleCost) + Number(markup.markup_value);
                    }
                }

                // Check if reseller has a specific price for this specific customer
                const supabase = getSupabaseClient();
                if (supabase) {
                    const { data: customerOverride, error } = await supabase
                        .from('reseller_customer_pricing')
                        .select('custom_price')
                        .eq('reseller_id', resellerId)
                        .eq('customer_id', userId)
                        .eq('plan_id', planId)
                        .single();
                    
                    if (customerOverride && !error) {
                        baseRetailPrice = Number(customerOverride.custom_price);
                    }
                }
            } else {
                // Basic Reseller Automatic Pricing Engine (SINGLE SOURCE OF TRUTH)
                // Basic Resellers CANNOT set prices manually. Fully automatic logic applies.
                const providerCost = Number(resellerWholesaleCost);
                let adminPrice;

                const adminRule = await PricingSettings.findOne({ resellerId: null, serviceType, status: 'active' }).lean();
                if (adminRule && adminRule.markupPercentage > 0) {
                    const adminMarkupValue = providerCost * (Number(adminRule.markupPercentage) / 100);
                    adminPrice = providerCost + adminMarkupValue;
                } else {
                    adminPrice = Number(globalPrice.default_retail_price);
                }

                const adminProfit = adminPrice - providerCost;
                // 50% Basic Commission derived directly from Admin Profit
                const basicCommission = adminProfit > 0 ? adminProfit * 0.50 : 0;
                
                // Customer Pays exactly the Admin Selling Price (Retail Price)
                const customerPrice = adminPrice;
                baseRetailPrice = customerPrice;
                
                return {
                    finalPrice: customerPrice,
                    resellerProfit: basicCommission,
                    resellerId: resellerId
                };
            }
            
            const resellerProfit = Number(baseRetailPrice) - Number(resellerWholesaleCost);
            return {
                finalPrice: Number(baseRetailPrice),
                resellerProfit: resellerProfit > 0 ? resellerProfit : 0,
                resellerId: resellerId
            };
        }

        // 2. Apply any global retail discounts
        if (!user.referredBy) {
            const supabase = getSupabaseClient();
            if (supabase) {
                const { data: discount } = await supabase
                    .from('retail_discounts')
                    .select('*')
                    .eq('plan_id', planId)
                    .eq('is_active', true)
                    .single();
                    
                if (discount) {
                    if (discount.discount_type === 'percentage') {
                        baseRetailPrice = baseRetailPrice - (baseRetailPrice * (discount.discount_value / 100));
                    } else {
                        baseRetailPrice = baseRetailPrice - discount.discount_value;
                    }
                }
            }
        }

        return {
            finalPrice: baseRetailPrice,
            resellerProfit: 0,
            resellerId: null
        };

    } catch (err) {
        console.error('[RetailPricing Engine] Error calculating price:', err);
        throw err;
    }
};
