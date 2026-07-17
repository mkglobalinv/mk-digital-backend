const fs = require('fs');

let content = fs.readFileSync('c:/Users/userpc/mk-digital-backend/server.js', 'utf8');

// 1. IMPORT PRICINGRULE (already done mostly but let's ensure)
if (!content.includes('import PricingRule from "./models/PricingRule.js";')) {
    content = content.replace('import PricingSettings from "./models/PricingSettings.js";', 'import PricingSettings from "./models/PricingSettings.js";\nimport PricingRule from "./models/PricingRule.js";');
}

// 2. REFACTOR calculateVtuPrice (Lines 671-721)
const calcStart = content.indexOf("    if (serviceType === 'data') {");
const calcEnd = content.indexOf("    } else if (serviceType === 'airtime') {");

if (calcStart > -1 && calcEnd > -1) {
    const replacement = `    if (serviceType === 'data') {
        const plan = await DataPlan.findOne({ api_plan_id: planId, network: network?.toUpperCase(), status: true });
        if (!plan) throw new Error("Invalid data plan");

        const rule = await PricingRule.findOne({ network: plan.network.toUpperCase(), category: plan.category });
        if (!rule || !rule.isActive) {
            throw new Error("Pricing rule not configured for this network/category.");
        }

        const providerCost = plan.api_price;

        if (buyer.role === 'admin') {
            basePrice = providerCost;
            sellingPrice = Math.round(providerCost * (1 + rule.retailPercentage / 100));
            pricingSource = "system";
        } else if (isReseller && !reseller) {
            // Reseller buying directly for themselves
            const effectivePercentage = isPremiumTier ? rule.vipPercentage : rule.basicPercentage;
            const finalPrice = Math.round(providerCost * (1 + effectivePercentage / 100));
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
                const customPercentage = resellerOverride?.customPercentage || 0;
                const effectivePercentage = rule.vipPercentage + customPercentage;
                sellingPrice = Math.round(providerCost * (1 + effectivePercentage / 100));
                basePrice = Math.round(providerCost * (1 + rule.vipPercentage / 100));
                pricingSource = "v3_vip_customer";
            } else {
                const effectivePercentage = rule.basicPercentage;
                const finalPrice = Math.round(providerCost * (1 + effectivePercentage / 100));
                sellingPrice = finalPrice;
                basePrice = finalPrice;
                pricingSource = "v3_basic_customer";
            }
        } else {
            // Regular direct retail user
            const effectivePercentage = rule.retailPercentage;
            const finalPrice = Math.round(providerCost * (1 + effectivePercentage / 100));
            basePrice = finalPrice;
            sellingPrice = finalPrice;
            pricingSource = "v3_retail";
        }
`;
    content = content.substring(0, calcStart) + replacement + content.substring(calcEnd);
}

// 3. REFACTOR /api/vtu/data-plans/all
const allPlansStart = content.indexOf("        const plans = await DataPlan.find({ status: true }).sort({ network: 1, selling_price: 1 });");
const allPlansEnd = content.indexOf("            return {", allPlansStart);

if (allPlansStart > -1 && allPlansEnd > -1) {
    const replacement = `        const plans = await DataPlan.find({ status: true });
        const rules = await PricingRule.find({ isActive: true });
        
        // Fetch user and possible overrides
        const user = await User.findById(req.user.id).populate('referredBy');
        let overrides = [];
        
        const resellerUser = user.referredBy || (user.role === 'reseller_admin' ? user : null);
        const isResellerSelf = user.role === 'reseller_admin';
        const isPremiumTier = resellerUser && (resellerUser.resellerTier === 'premium' || resellerUser.resellerTier === 'vip');

        if (isPremiumTier) {
            overrides = await PriceOverride.find({ resellerId: resellerUser._id, status: 'enabled' });
        }

        const formattedPlans = plans.map(p => {
            const rule = rules.find(r => r.network === p.network.toUpperCase() && r.category === p.category);
            if (!rule) return null;

            let finalPrice;
            let percentage = rule.retailPercentage;

            if (isResellerSelf) {
                percentage = isPremiumTier ? rule.vipPercentage : rule.basicPercentage;
                finalPrice = Math.round(p.api_price * (1 + percentage / 100));
            } else if (resellerUser) {
                if (isPremiumTier) {
                    const override = overrides.find(o => o.planId === p.api_plan_id && o.network === p.network);
                    const customPercentage = override?.customPercentage || 0;
                    percentage = rule.vipPercentage + customPercentage;
                    finalPrice = Math.round(p.api_price * (1 + percentage / 100));
                } else {
                    percentage = rule.basicPercentage;
                    finalPrice = Math.round(p.api_price * (1 + percentage / 100));
                }
            } else {
                percentage = rule.retailPercentage;
                finalPrice = Math.round(p.api_price * (1 + percentage / 100));
            }

`;
    content = content.substring(0, allPlansStart) + replacement + content.substring(allPlansEnd);
    
    // Also fix the filter(Boolean) at the end of the map
    const mapEnd = content.indexOf("        });\n\n        res.json(formattedPlans);", allPlansStart);
    if (mapEnd > -1) {
        content = content.substring(0, mapEnd) + "        }).filter(Boolean);\n\n        // Sort properly by price\n        formattedPlans.sort((a,b) => a.price - b.price);\n\n        res.json(formattedPlans);" + content.substring(mapEnd + 45);
    }
}


// 4. REFACTOR /api/vtu/data-plans/:network
const netPlansStart = content.indexOf("        const plans = await DataPlan.find(query).sort({ category: 1, selling_price: 1 });");
const netPlansEnd = content.indexOf("            return {", netPlansStart);

if (netPlansStart > -1 && netPlansEnd > -1) {
    const replacement = `        const plans = await DataPlan.find(query);
        const rules = await PricingRule.find({ isActive: true });

        if (!plans || plans.length === 0) {
            console.log(\`[VTU Plans Warning] No DB plans for \${network}\`);
            return res.json([]);
        }

        // Fetch user and possible overrides
        const user = await User.findById(req.user.id).populate('referredBy');
        let overrides = [];
        
        const resellerUser = user.referredBy || (user.role === 'reseller_admin' ? user : null);
        const isResellerSelf = user.role === 'reseller_admin';
        const isPremiumTier = resellerUser && (resellerUser.resellerTier === 'premium' || resellerUser.resellerTier === 'vip');

        if (isPremiumTier) {
            overrides = await PriceOverride.find({ resellerId: resellerUser._id, network, status: 'enabled' });
        }

        const providerCategories = await ProviderCategory.find({}).lean();

        const formattedPlans = plans.filter(p => {
            const compositeName = \`\${network} \${p.category || 'Direct'}\`;
            const config = providerCategories.find(c => 
                c.category_name.toLowerCase() === compositeName.toLowerCase() &&
                c.provider_name.toLowerCase() === (p.provider || '').toLowerCase()
            );
            if (config && config.visibility === 'HIDDEN') return false;
            if (config && config.status === 'DISABLED') return false;
            return true;
        }).map(p => {
            const rule = rules.find(r => r.network === p.network.toUpperCase() && r.category === p.category);
            if (!rule) return null;

            let finalPrice;
            let percentage = rule.retailPercentage;

            if (isResellerSelf) {
                percentage = isPremiumTier ? rule.vipPercentage : rule.basicPercentage;
                finalPrice = Math.round(p.api_price * (1 + percentage / 100));
            } else if (resellerUser) {
                if (isPremiumTier) {
                    const override = overrides.find(o => o.planId === p.api_plan_id);
                    const customPercentage = override?.customPercentage || 0;
                    percentage = rule.vipPercentage + customPercentage;
                    finalPrice = Math.round(p.api_price * (1 + percentage / 100));
                } else {
                    percentage = rule.basicPercentage;
                    finalPrice = Math.round(p.api_price * (1 + percentage / 100));
                }
            } else {
                percentage = rule.retailPercentage;
                finalPrice = Math.round(p.api_price * (1 + percentage / 100));
            }

`;
    content = content.substring(0, netPlansStart) + replacement + content.substring(netPlansEnd);
    
    const mapEnd2 = content.indexOf("        });\n\n        res.json(formattedPlans);", netPlansStart);
    if (mapEnd2 > -1) {
        content = content.substring(0, mapEnd2) + "        }).filter(Boolean);\n\n        formattedPlans.sort((a,b) => a.price - b.price);\n\n        res.json(formattedPlans);" + content.substring(mapEnd2 + 45);
    }
}

fs.writeFileSync('c:/Users/userpc/mk-digital-backend/server.js', content, 'utf8');
console.log("Refactored server.js perfectly!");
