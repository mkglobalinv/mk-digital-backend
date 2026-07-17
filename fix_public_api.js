const fs = require('fs');
let content = fs.readFileSync('routes/publicApiRoutes.js', 'utf8');

content = content.replace(
    "import SystemSetting from '../models/SystemSetting.js';",
    "import SystemSetting from '../models/SystemSetting.js';\nimport { calculateVtuPrice, calculateBulkDataPrices } from '../services/pricing/vtuPricing.js';"
);

const dStartStr = 'let price = plan.selling_price;';
const dStart = content.indexOf(dStartStr);
const dEndStr = "const balanceField = req.isSandbox ? 'sandboxBalance' : 'balance1';";
const dEnd = content.indexOf(dEndStr, dStart);

if (dStart !== -1 && dEnd !== -1) {
    content = content.substring(0, dStart) + `const { sellingPrice, basePrice, reseller } = await calculateVtuPrice(req.user._id, 'data', network, plan_id);
        const price = sellingPrice;
        const profit = Math.max(0, sellingPrice - basePrice);
        const resellerUser = reseller;

        ` + content.substring(dEnd);
}

const pStartStr = "router.get('/data/plans', async (req, res) => {";
const pStart = content.indexOf(pStartStr);
const pEndStr = "} catch (err) { res.status(500).json({ status: 'error', message: err.message }); }";
const pEnd = content.indexOf(pEndStr, pStart);

if (pStart !== -1 && pEnd !== -1) {
    content = content.substring(0, pStart) + `router.get('/data/plans', async (req, res) => {
    try {
        const plans = await DataPlan.find({ status: true }).sort({ network: 1, selling_price: 1 });
        const bulkPrices = await calculateBulkDataPrices(req.user._id, plans);

        res.json({
            status: 'success',
            count: bulkPrices.filter(p => p.sellingPrice !== null).length,
            data: bulkPrices.filter(p => p.sellingPrice !== null).map(({ plan: p, sellingPrice }) => {
                let displayNetwork = p.network;
                if (displayNetwork === 'AIRTEL') displayNetwork = 'Airtel';
                if (displayNetwork === 'GLO') displayNetwork = 'Glo';

                return {
                    plan_id: p.api_plan_id,
                    network: displayNetwork,
                    category: p.category,
                    name: p.plan_name,
                    price: sellingPrice,
                    validity: p.validity
                };
            })
        });
    ` + content.substring(pEnd);
}

const aStartStr = 'let price = Number(amount);';
const aStart = content.indexOf(aStartStr);
const aEndStr = "const balanceField = req.isSandbox ? 'sandboxBalance' : 'balance1';";
const aEnd = content.indexOf(aEndStr, aStart);

if (aStart !== -1 && aEnd !== -1) {
    content = content.substring(0, aStart) + `const { sellingPrice, basePrice, reseller } = await calculateVtuPrice(req.user._id, 'airtime', network, null, amount);
        const price = sellingPrice;
        const profit = Math.max(0, sellingPrice - basePrice);
        const resellerUser = reseller;

        ` + content.substring(aEnd);
}

fs.writeFileSync('routes/publicApiRoutes.js', content);
console.log('publicApiRoutes updated successfully');
