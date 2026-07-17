import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const BASE_URL = (process.env.PEYFLEX_API_URL || 'https://client.peyflex.com.ng').replace(/\/$/, '');
const TOKEN = process.env.PEYFLEX_API_TOKEN;

const peyflexClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Authorization': `Token ${TOKEN}`,
        'Accept': 'application/json'
    }
});

const DataPlanSchema = new mongoose.Schema({
    network: String,
    plan_name: String,
    plan_size: String,
    api_plan_id: String,
    provider: String,
    category: String,
    
    api_price: Number,
    selling_price: Number,
    basic_selling_price: Number,
    reseller_price: Number,
    premium_price: Number,
    
    profit: Number,
    status: Boolean,
    validity: String,
}, { collection: 'dataplans', strict: false });

const DataPlan = mongoose.models.DataPlan || mongoose.model('DataPlan', DataPlanSchema);

async function syncPlans() {
    try {
        console.log("=== STARTING PEYFLEX SYNC ===");
        await mongoose.connect(process.env.MONGO_URI);
        
        // 1. Delete all existing Peyflex data plans for MTN, GLO, AIRTEL, 9MOBILE
        console.log("Deleting old peyflex data plans from DB...");
        const delRes = await DataPlan.deleteMany({ provider: 'peyflex' });
        console.log(`Deleted ${delRes.deletedCount} old plans.`);

        // 2. Fetch live networks
        console.log("Fetching live PeyFlex networks...");
        const netRes = await peyflexClient.get('/api/data/networks/');
        const liveNetworks = netRes.data.networks || [];
        
        const PROFIT_MARGIN = 20;

        let totalInserted = 0;

        for (const net of liveNetworks) {
            console.log(`\nFetching plans for ${net.identifier}...`);
            try {
                const planRes = await peyflexClient.get(`/api/data/plans/?network=${net.identifier}`);
                const plans = planRes.data.plans || [];
                console.log(`  -> Found ${plans.length} plans.`);

                // Determine Network and Category mapping
                let networkName = 'MTN';
                let categoryName = 'Gifting'; // Default

                if (net.identifier === 'glo_data') {
                    networkName = 'GLO';
                    categoryName = 'Corporate'; // CG usually corporate
                } else if (net.identifier === '9mobile_data') {
                    networkName = '9MOBILE';
                    categoryName = 'Corporate';
                } else if (net.identifier === 'airtel_data') {
                    networkName = 'AIRTEL';
                    categoryName = 'Gifting';
                } else if (net.identifier === 'mtn_gifting_data') {
                    networkName = 'MTN';
                    categoryName = 'Gifting';
                } else if (net.identifier === 'mtn_data_share') {
                    networkName = 'MTN';
                    categoryName = 'Corporate';
                } else if (net.identifier === 'mtn_awoof_gifting') {
                    networkName = 'MTN';
                    categoryName = 'Awoof';
                } else if (net.identifier === 'mtn_sme_data') {
                    networkName = 'MTN';
                    categoryName = 'SME';
                }

                const docsToInsert = [];
                for (const p of plans) {
                    // p.label e.g. "1GB = N275 (1 Day)" or "1.5GB = N995 (7 Days)"
                    const label = p.label || "";
                    let planSize = "Unknown";
                    let validity = "Unknown";
                    
                    if (label.includes('=')) {
                        planSize = label.split('=')[0].trim();
                    }
                    if (label.includes('(') && label.includes(')')) {
                        const vMatch = label.match(/\(([^)]+)\)/);
                        if (vMatch) validity = vMatch[1];
                    }

                    const apiPrice = Number(p.amount);
                    const sellingPrice = apiPrice + PROFIT_MARGIN;

                    docsToInsert.push({
                        network: networkName,
                        category: categoryName,
                        plan_name: label,
                        plan_size: planSize,
                        api_plan_id: p.plan_code + '-' + categoryName + '-' + apiPrice,
                        provider: 'peyflex',
                        
                        api_price: apiPrice,
                        selling_price: sellingPrice,
                        basic_selling_price: sellingPrice,
                        reseller_price: sellingPrice - 10 > apiPrice ? sellingPrice - 10 : sellingPrice,
                        premium_price: sellingPrice,
                        
                        profit: PROFIT_MARGIN,
                        status: true,
                        validity: validity
                    });
                }

                if (docsToInsert.length > 0) {
                    await DataPlan.insertMany(docsToInsert);
                    totalInserted += docsToInsert.length;
                    console.log(`  -> Inserted ${docsToInsert.length} ${networkName} ${categoryName} plans.`);
                }

            } catch (err) {
                console.error(`  -> ERROR fetching plans for ${net.identifier}:`, err.response ? err.response.data : err.message);
            }
        }

        console.log(`\n=== SYNC COMPLETE ===`);
        console.log(`Successfully synced ${totalInserted} live PeyFlex plans into the database.`);
        process.exit(0);

    } catch (err) {
        console.error("Critical Error during sync:", err);
        process.exit(1);
    }
}

syncPlans();
