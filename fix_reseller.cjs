const fs = require('fs');
let content = fs.readFileSync('controllers/resellerController.js', 'utf8');

if (!content.includes('calculateBulkDataPrices')) {
    content = content.replace(
        "import User from '../models/User.js';",
        "import User from '../models/User.js';\nimport { calculateBulkDataPrices } from '../services/pricing/vtuPricing.js';"
    );
}

const startStr = 'const AdminPricingOverride = (await import(\'../models/AdminPricingOverride.js\')).default;';
const endStr = 'return res.json({ status: \'success\', isPremium, isBasic, data: combined });';

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    const newLogic = `
        const bulkPrices = await calculateBulkDataPrices(resellerId, allPlans);

        const combined = bulkPrices.map(({ plan, sellingPrice, basePrice, pricingSource }) => {
            return {
                planId: plan.api_plan_id,
                network: plan.network,
                plan_name: plan.plan_name.replace(/\\|\\|/g, '').replace(/Direct/ig, '').trim(),
                serviceType: 'data',
                buyingPrice: basePrice,
                sellingPrice: sellingPrice,
                status: 'enabled', // We simplify status tracking to enabled for now
                isOverridden: pricingSource === 'reseller_custom',
                hasAdminAssigned: pricingSource === 'admin_assigned',
                priceSource: pricingSource
            };
        });

        `;
    
    content = content.substring(0, startIdx) + newLogic + content.substring(endIdx);
    fs.writeFileSync('controllers/resellerController.js', content);
    console.log('resellerController.js updated successfully');
} else {
    console.log('Failed to find start or end index');
}
