import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
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

mongoose.connect(process.env.MONGO_URI);

const DataPlanSchema = new mongoose.Schema({
    network: String,
    plan_name: String,
    api_plan_id: String,
    provider: String,
    category: String,
    selling_price: Number
}, { collection: 'dataplans' });

const DataPlan = mongoose.models.DataPlan || mongoose.model('DataPlan', DataPlanSchema);

async function run() {
    console.log("Fetching live PeyFlex networks...");
    let liveNetworks = [];
    try {
        const netRes = await peyflexClient.get('/api/data/networks/');
        liveNetworks = netRes.data.networks || [];
    } catch(e) {
        console.error("Failed to fetch networks", e.message);
        return;
    }

    let livePlans = {};
    for (const net of liveNetworks) {
        console.log(`Fetching plans for ${net.identifier}...`);
        try {
            const planRes = await peyflexClient.get(`/api/data/plans/?network=${net.identifier}`);
            if (planRes.data && planRes.data.plans) {
                livePlans[net.identifier] = planRes.data.plans;
            }
        } catch(e) {
            console.error(`  -> Failed for ${net.identifier}`, e.message);
        }
    }

    console.log("Dumping ALL MTN plans from DB...");
    const allMtnPlans = await DataPlan.find({ network: /MTN/i });
    console.log(JSON.stringify(allMtnPlans, null, 2));
    process.exit(0);
}
run();
