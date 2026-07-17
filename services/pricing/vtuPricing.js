import User from "../../models/User.js";
import DataPlan from "../../models/DataPlan.js";
import PricingRule from "../../models/PricingRule.js";
import PriceOverride from "../../models/PriceOverride.js";
import AdminPricingOverride from "../../models/AdminPricingOverride.js";
import PricingSettings from "../../models/PricingSettings.js";

// Helper to escape dots in Mongoose Map keys
const safeKey = (k) => k ? String(k).replace(/\./g, '_dot_') : k;

export const calculateVtuPrice = async (userId, serviceType, network, planId, amount = 0) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    let basePrice = 0;
    let sellingPrice = 0;
    let reseller = null;
    let pricingSource = "system";

    // 1. Identify Reseller (the entity whose prices govern this customer)
    if (user.referredBy) {
        const potentialReseller = await User.findById(user.referredBy);
        if (potentialReseller && (
            potentialReseller.role === 'reseller_admin' ||
            potentialReseller.resellerActivationStatus === 'active' ||
            potentialReseller.whiteLabelStatus === 'active' ||
            potentialReseller.apiLevel === 'reseller'
        )) {
            reseller = potentialReseller;
        }
    }

    const buyer = reseller || user;
    const isReseller = buyer.role === 'reseller_admin';
    const rType = buyer.resellerType || "basic";
    const isPremiumTier = buyer.role === 'reseller_admin' && (rType === 'premium' || buyer.resellerTier === 'premium' || buyer.resellerTier === 'vip' || buyer.canOverridePricing);
    const isBasicReseller = buyer.role === 'reseller_admin' && !isPremiumTier;

    // 2. Fetch Admin Override for this reseller (if any)
    let adminOverride = null;
    if (buyer.role === 'reseller_admin') {
        adminOverride = await AdminPricingOverride.findOne({
            resellerId: buyer._id,
            serviceType,
            network: network?.toUpperCase() || null,
            planId: planId || null,
            status: 'enabled'
        });
    }

    // NEW: Fetch PricingSettings (Percentage Engine)
    let pricingSetting = null;
    if (buyer.role === 'reseller_admin') {
        pricingSetting = await PricingSettings.findOne({
            resellerId: buyer._id,
            serviceType,
            network: network?.toUpperCase() || null,
            status: 'active'
        });
        if (!pricingSetting) {
            // Fallback to global admin setting for this service
            pricingSetting = await PricingSettings.findOne({
                resellerId: null,
                serviceType,
                network: network?.toUpperCase() || null,
                status: 'active'
            });
        }
    }

    // 3. Calculate base (cost) and selling price by tier
    if (serviceType === 'data') {
        const plan = await DataPlan.findOne({ api_plan_id: planId, network: network?.toUpperCase(), status: true });
        if (!plan) throw new Error("Invalid data plan");

        const rule = await PricingRule.findOne({ network: plan.network.toUpperCase(), category: plan.category });
        if (!rule || !rule.isActive) {
            throw new Error("Pricing rule not configured for this network/category.");
        }

        const providerCost = plan.api_price;

        if (buyer.role === 'admin') {
            basePrice = providerCost;
            sellingPrice = plan.selling_price;
            pricingSource = "system";
        } else if (isReseller && !reseller) {
            // Reseller buying directly for themselves
            const finalPrice = isPremiumTier ? (plan.vip_price || plan.selling_price) : (plan.reseller_price || plan.selling_price);
            basePrice = finalPrice;
            sellingPrice = finalPrice;
            pricingSource = isPremiumTier ? "v3_vip_owner" : "v3_basic_owner";
        } else if (reseller) {
            // Customer buying through a reseller
            if (isPremiumTier) {
                const resellerOverride = await PriceOverride.findOne({
                    resellerId: reseller._id,
                    serviceType,
                    network: network?.toUpperCase(),
                    planId,
                    status: 'enabled'
                });
                basePrice = plan.vip_price || plan.selling_price;
                
                if (resellerOverride && resellerOverride.sellingPrice) {
                    sellingPrice = resellerOverride.sellingPrice;
                } else {
                    sellingPrice = plan.vip_selling_price || plan.selling_price;
                }
                pricingSource = "v3_vip_customer";
            } else {
                  const adminMarkup = plan.selling_price - plan.api_price;
                  const basicCommission = adminMarkup > 0 ? adminMarkup * 0.5 : 0;
                  // Reseller cost becomes Admin Selling Price MINUS their commission
                  basePrice = plan.selling_price - basicCommission;
                  // Customer Pays exactly the Admin Selling Price
                  sellingPrice = plan.selling_price;
                pricingSource = "v3_basic_customer";
            }
        } else {
            // Regular direct retail user
            basePrice = plan.api_price;
            sellingPrice = plan.selling_price;
            pricingSource = "v3_retail";
        }
    } else if (serviceType === 'airtime') {
        const amt = Number(amount);
        const systemPrice = amt;

        if (buyer.role === 'admin') {
            basePrice = amt * 0.97;
            sellingPrice = amt;
            pricingSource = "system";
        } else if (isReseller) {
            // Reseller cost (what they pay the platform)
            basePrice = adminOverride?.buyingPrice ?? (isPremiumTier ? (amt * 0.98) : (amt * 0.99));

            if (reseller) {
                // Customer is purchasing through a reseller
                const lookupKey = safeKey(planId || serviceType);
                if (rType === "basic") {
                    // Priority 1: Per-reseller assigned price
                    let assignedPrice = reseller.assignedPrices ? reseller.assignedPrices.get(lookupKey) : undefined;
                    // Priority 2: AdminPricingOverride.assignedSellingPrice
                    if ((assignedPrice === undefined || assignedPrice === null) && adminOverride) {
                        assignedPrice = adminOverride.assignedSellingPrice;
                    }
                    // Priority 3: AdminPricingOverride.marginPercentage-based price
                    if ((assignedPrice === undefined || assignedPrice === null) && adminOverride?.marginPercentage) {
                        assignedPrice = amt * (1 + adminOverride.marginPercentage / 100);
                    }

                    // Priority 3.5: Percentage Engine
                    let percentagePrice = undefined;
                    if (pricingSetting && pricingSetting.markupPercentage !== undefined && pricingSetting.markupPercentage !== null) {
                        percentagePrice = basePrice * (1 + (pricingSetting.markupPercentage / 100));
                    }

                    if (assignedPrice !== undefined && assignedPrice !== null) {
                        sellingPrice = assignedPrice;
                        pricingSource = "basic_assigned";
                    } else if (percentagePrice !== undefined) {
                        sellingPrice = percentagePrice;
                        pricingSource = "percentage_engine";
                    } else {
                        sellingPrice = systemPrice; // Retail price as fallback
                        pricingSource = "system";
                    }
                } else if (rType === "premium") {
                    // Priority 1: Premium reseller's own custom price
                    let customPrice = reseller.customPrices ? reseller.customPrices.get(lookupKey) : undefined;
                    if (customPrice === undefined) {
                        const resellerOverride = await PriceOverride.findOne({
                            resellerId: reseller._id,
                            serviceType,
                            network: network?.toUpperCase() || null,
                            planId: planId || null,
                            status: 'enabled'
                        });
                        customPrice = resellerOverride?.sellingPrice;
                    }

                    // Priority 2: Admin-assigned selling price
                    let assignedPrice = reseller.assignedPrices ? reseller.assignedPrices.get(lookupKey) : undefined;
                    if ((assignedPrice === undefined || assignedPrice === null) && adminOverride) {
                        assignedPrice = adminOverride.assignedSellingPrice;
                    }
                    if ((assignedPrice === undefined || assignedPrice === null) && adminOverride?.marginPercentage) {
                        assignedPrice = amt * (1 + adminOverride.marginPercentage / 100);
                    }

                    // Priority 2.5: Percentage Engine
                    let percentagePrice = undefined;
                    if (pricingSetting && pricingSetting.markupPercentage !== undefined && pricingSetting.markupPercentage !== null) {
                        percentagePrice = basePrice * (1 + (pricingSetting.markupPercentage / 100));
                    }

                    if (customPrice !== undefined && customPrice !== null) {
                        sellingPrice = customPrice;
                        pricingSource = "premium_custom";
                    } else if (assignedPrice !== undefined && assignedPrice !== null) {
                        sellingPrice = assignedPrice;
                        pricingSource = "premium_assigned";
                    } else if (percentagePrice !== undefined) {
                        sellingPrice = percentagePrice;
                        pricingSource = "percentage_engine";
                    } else {
                        sellingPrice = systemPrice;
                        pricingSource = "system";
                    }
                }
            } else {
                // Reseller purchasing directly for themselves
                sellingPrice = basePrice;
                pricingSource = rType === 'premium' ? "premium_assigned" : "basic_assigned";
            }
        } else {
            // Retail user — always pays face value for airtime
            basePrice = amt;
            sellingPrice = amt;
            pricingSource = "system";
        }

    } else {
        // Electricity, Cable, Epin, etc.
        const amt = Number(amount);
        const systemPrice = amt;

        if (buyer.role === 'admin') {
            basePrice = amt * 0.98;
            sellingPrice = amt;
            pricingSource = "system";
        } else if (isReseller) {
            // Reseller cost (what they pay the platform)
            basePrice = adminOverride?.buyingPrice ?? (isPremiumTier ? (amt * 0.99) : (amt * 0.995));

            if (reseller) {
                // Customer is purchasing through a reseller
                const lookupKey = safeKey(planId || serviceType);
                if (rType === "basic") {
                    // Priority 1: Per-reseller assigned price
                    let assignedPrice = reseller.assignedPrices ? reseller.assignedPrices.get(lookupKey) : undefined;
                    // Priority 2: AdminPricingOverride.assignedSellingPrice
                    if ((assignedPrice === undefined || assignedPrice === null) && adminOverride) {
                        assignedPrice = adminOverride.assignedSellingPrice;
                    }
                    // Priority 3: MarginPercentage-based price
                    if ((assignedPrice === undefined || assignedPrice === null) && adminOverride?.marginPercentage) {
                        assignedPrice = amt * (1 + adminOverride.marginPercentage / 100);
                    }

                    // Priority 3.5: Percentage Engine
                    let percentagePrice = undefined;
                    if (pricingSetting && pricingSetting.markupPercentage !== undefined && pricingSetting.markupPercentage !== null) {
                        percentagePrice = basePrice * (1 + (pricingSetting.markupPercentage / 100));
                    }

                    if (assignedPrice !== undefined && assignedPrice !== null) {
                        sellingPrice = assignedPrice;
                        pricingSource = "basic_assigned";
                    } else if (percentagePrice !== undefined) {
                        sellingPrice = percentagePrice;
                        pricingSource = "percentage_engine";
                    } else {
                        sellingPrice = systemPrice; // Retail price as fallback
                        pricingSource = "system";
                    }
                } else if (rType === "premium") {
                    // Priority 1: Premium reseller's own custom price
                    let customPrice = reseller.customPrices ? reseller.customPrices.get(lookupKey) : undefined;
                    if (customPrice === undefined) {
                        const resellerOverride = await PriceOverride.findOne({
                            resellerId: reseller._id,
                            serviceType,
                            network: network?.toUpperCase() || null,
                            planId: planId || null,
                            status: 'enabled'
                        });
                        customPrice = resellerOverride?.sellingPrice;
                    }

                    // Priority 2: Admin-assigned selling price
                    let assignedPrice = reseller.assignedPrices ? reseller.assignedPrices.get(lookupKey) : undefined;
                    if ((assignedPrice === undefined || assignedPrice === null) && adminOverride) {
                        assignedPrice = adminOverride.assignedSellingPrice;
                    }
                    if ((assignedPrice === undefined || assignedPrice === null) && adminOverride?.marginPercentage) {
                        assignedPrice = amt * (1 + adminOverride.marginPercentage / 100);
                    }

                    // Priority 2.5: Percentage Engine
                    let percentagePrice = undefined;
                    if (pricingSetting && pricingSetting.markupPercentage !== undefined && pricingSetting.markupPercentage !== null) {
                        percentagePrice = basePrice * (1 + (pricingSetting.markupPercentage / 100));
                    }

                    if (customPrice !== undefined && customPrice !== null) {
                        sellingPrice = customPrice;
                        pricingSource = "premium_custom";
                    } else if (assignedPrice !== undefined && assignedPrice !== null) {
                        sellingPrice = assignedPrice;
                        pricingSource = "premium_assigned";
                    } else if (percentagePrice !== undefined) {
                        sellingPrice = percentagePrice;
                        pricingSource = "percentage_engine";
                    } else {
                        sellingPrice = systemPrice;
                        pricingSource = "system";
                    }
                }
            } else {
                // Reseller purchasing directly for themselves
                sellingPrice = basePrice;
                pricingSource = rType === 'premium' ? "premium_assigned" : "basic_assigned";
            }
        } else {
            // Retail user — always pays face value for cable/electricity
            basePrice = amt;
            sellingPrice = amt;
            pricingSource = "system";
        }
    }

    // 4. Price Protection: Selling price cannot go below reseller's buying cost
    if (sellingPrice < basePrice) {
        console.warn(`[PriceProtection] Selling price (${sellingPrice}) < base price (${basePrice}) for reseller ${reseller?.email || 'direct'}. Clamped to base.`);
        sellingPrice = basePrice;
    }

    return { basePrice, sellingPrice, pricingSource, reseller };
};

export const calculateBulkDataPrices = async (userId, plans, networkFilter = null) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    let reseller = null;
    if (user.referredBy) {
        const potentialReseller = await User.findById(user.referredBy);
        if (potentialReseller && (
            potentialReseller.role === 'reseller_admin' ||
            potentialReseller.resellerActivationStatus === 'active' ||
            potentialReseller.whiteLabelStatus === 'active' ||
            potentialReseller.apiLevel === 'reseller'
        )) {
            reseller = potentialReseller;
        }
    }

    const buyer = reseller || user;
    const isReseller = buyer.role === 'reseller_admin';
    const rType = buyer.resellerType || "basic";
    const isPremiumTier = buyer.role === 'reseller_admin' && (rType === 'premium' || buyer.resellerTier === 'premium' || buyer.resellerTier === 'vip' || buyer.canOverridePricing);

    let priceOverrides = [];
    if (reseller && isPremiumTier) {
        const query = { resellerId: reseller._id, serviceType: 'data', status: 'enabled' };
        if (networkFilter) query.network = networkFilter.toUpperCase();
        priceOverrides = await PriceOverride.find(query);
    }

    const rules = await PricingRule.find({ isActive: true });

    return plans.map(plan => {
        const pCategory = plan.category || 'Direct';
        const rule = rules.find(r => r.network === plan.network.toUpperCase() && (r.category || '').toUpperCase() === pCategory.toUpperCase());
        if (!rule) {
            return { plan, sellingPrice: null, error: "Pricing rule not configured" };
        }

        let basePrice = 0;
        let sellingPrice = 0;
        let pricingSource = "system";
        const providerCost = plan.api_price;

        if (buyer.role === 'admin') {
            basePrice = providerCost;
            sellingPrice = plan.selling_price;
            pricingSource = "system";
        } else if (isReseller && !reseller) {
            const finalPrice = isPremiumTier ? (plan.vip_price || plan.selling_price) : (plan.reseller_price || plan.selling_price);
            basePrice = finalPrice;
            sellingPrice = finalPrice;
            pricingSource = isPremiumTier ? "v3_vip_owner" : "v3_basic_owner";
        } else if (reseller) {
            if (isPremiumTier) {
                const resellerOverride = priceOverrides.find(o => o.planId === plan.api_plan_id && o.network === plan.network);
                basePrice = plan.vip_price || plan.selling_price;
                
                if (resellerOverride && resellerOverride.sellingPrice) {
                    sellingPrice = resellerOverride.sellingPrice;
                } else {
                    sellingPrice = plan.vip_selling_price || plan.selling_price;
                }
                pricingSource = "v3_vip_customer";
            } else {
                const adminMarkup = plan.selling_price - plan.api_price;
                const basicCommission = adminMarkup > 0 ? adminMarkup * 0.5 : 0;
                basePrice = plan.selling_price - basicCommission;
                sellingPrice = plan.selling_price;
                pricingSource = "v3_basic_customer";
            }
        } else {
            basePrice = plan.api_price;
            sellingPrice = plan.selling_price;
            pricingSource = "v3_retail";
        }

        if (sellingPrice < basePrice) {
            console.warn(`[PriceProtection] Selling price (${sellingPrice}) < base price (${basePrice}) for reseller ${reseller?.email || 'direct'}. Clamped to base.`);
            sellingPrice = basePrice;
        }

        return { plan, basePrice, sellingPrice, pricingSource, reseller };
    });
};
