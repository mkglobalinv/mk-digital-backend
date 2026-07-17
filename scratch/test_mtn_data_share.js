import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

const BASE_URL = (process.env.PEYFLEX_API_URL || 'https://client.peyflex.com.ng').replace(/\/$/, '');
const TOKEN = process.env.PEYFLEX_API_TOKEN;

const headers = {
    'Authorization': `Token ${TOKEN}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

async function run() {
    console.log("=== 1. Checking Database Values for Failed Transaction ===");
    await mongoose.connect(process.env.MONGO_URI);
    
    // We recently appended suffix to prevent duplicate keys: e.g. M1GBA-Awoof-275
    const DataPlan = mongoose.models.DataPlan || mongoose.model('DataPlan', new mongoose.Schema({}, { strict: false, collection: 'dataplans' }));
    
    const awoofPlan = await DataPlan.findOne({ api_plan_id: /M1GBA/ });
    console.log(`\nStored Awoof Plan in DB:`);
    console.log(JSON.stringify(awoofPlan, null, 2));

    const dataSharePlan = await DataPlan.findOne({ api_plan_id: /M1GBS-Corporate/ });
    console.log(`\nStored Data Share Plan in DB:`);
    console.log(JSON.stringify(dataSharePlan, null, 2));
    
    console.log("\n=== 2. Re-fetching Live API Networks ===");
    try {
        const netRes = await axios.get(`${BASE_URL}/api/data/networks/`, { headers });
        console.log("Live Networks:");
        console.log(JSON.stringify(netRes.data, null, 2));
    } catch (e) {
        console.error("Failed to fetch live networks:", e.message);
    }
    
    console.log("\n=== 3. Re-testing Live Purchase (mtn_data_share + M1GBS) ===");
    const payload = {
        network: "mtn_data_share",
        plan_code: "M1GBS",
        mobile_number: "08133131020",
        ported_number: true
    };
    
    console.log("Sending Payload:", JSON.stringify(payload));
    try {
        const purRes = await axios.post(`${BASE_URL}/api/data/purchase/`, payload, { headers, timeout: 15000 });
        console.log("\n[SUCCESS] Purchase succeeded!");
        console.log(JSON.stringify(purRes.data, null, 2));
    } catch (e) {
        console.error("\n[FAILED] Purchase failed!");
        if (e.response) {
            console.error(`Status: ${e.response.status}`);
            console.error(JSON.stringify(e.response.data, null, 2));
        } else {
            console.error(e.message);
        }
    }
    
    process.exit(0);
}

run();
