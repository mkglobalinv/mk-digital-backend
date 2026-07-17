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

async function runTrace() {
    console.log("==================================================");
    console.log("FINAL PEYFLEX TRACE INVESTIGATION");
    console.log("==================================================\n");

    try {
        await mongoose.connect(process.env.MONGO_URI);
        const DataPlan = mongoose.models.DataPlan || mongoose.model('DataPlan', new mongoose.Schema({}, { strict: false, collection: 'dataplans' }));

        console.log("--- 1. FETCHING DATABASE VALUES ---");
        const dbAwoofPlan = await DataPlan.findOne({ api_plan_id: /^M1GBA/ });
        
        if (!dbAwoofPlan) {
            console.error("Could not find Awoof plan in DB!");
            process.exit(1);
        }
        
        const dbNetwork = dbAwoofPlan.network; // e.g., 'MTN'
        const dbCategory = dbAwoofPlan.category; // e.g., 'Awoof'
        const dbApiPlanId = dbAwoofPlan.api_plan_id; // e.g., 'M1GBA-Awoof-275'
        // Extract base plan code from DB mapping logic (as done in peyflexV2.js)
        const extractedPlanCode = dbApiPlanId.includes('-') ? dbApiPlanId.split('-')[0] : dbApiPlanId;
        const dbAmount = dbAwoofPlan.api_price;

        console.log(`Database Record: 
  - Network: ${dbNetwork}
  - Category: ${dbCategory}
  - Full API Plan ID: ${dbApiPlanId}
  - Extracted Plan Code: ${extractedPlanCode}
  - API Price: ${dbAmount}
`);

        console.log("--- 2. FETCHING LIVE PEYFLEX NETWORKS ---");
        console.log(`GET ${BASE_URL}/api/data/networks/`);
        const netRes = await axios.get(`${BASE_URL}/api/data/networks/`, { headers });
        const liveNetworks = netRes.data.networks || [];
        
        const targetIdentifier = 'mtn_awoof_gifting';
        const networkMatch = liveNetworks.find(n => n.identifier === targetIdentifier);
        
        if (networkMatch) {
            console.log(`[VERIFIED] Network identifier '${targetIdentifier}' EXACTLY matches live API.`);
        } else {
            console.log(`[FAILED] Network identifier '${targetIdentifier}' DOES NOT EXIST in live API!`);
        }


        console.log("\n--- 3. FETCHING LIVE PEYFLEX PLANS FOR TARGET NETWORK ---");
        console.log(`GET ${BASE_URL}/api/data/plans/?network=${targetIdentifier}`);
        const planRes = await axios.get(`${BASE_URL}/api/data/plans/?network=${targetIdentifier}`, { headers });
        const livePlans = planRes.data.plans || [];
        
        const planMatch = livePlans.find(p => p.plan_code === extractedPlanCode);
        
        if (planMatch) {
            console.log(`[VERIFIED] Plan code '${extractedPlanCode}' EXACTLY matches live API.`);
            console.log(`Live Plan Details: ${JSON.stringify(planMatch)}`);
        } else {
            console.log(`[FAILED] Plan code '${extractedPlanCode}' DOES NOT EXIST in live API for this network!`);
        }


        console.log("\n--- 4. COMPARISON TABLE ---");
        console.table([
            { Field: "network", DatabaseValue: "MTN (Awoof)", LiveApiValue: targetIdentifier, PurchasePayloadValue: targetIdentifier },
            { Field: "plan_code", DatabaseValue: extractedPlanCode, LiveApiValue: planMatch ? planMatch.plan_code : 'N/A', PurchasePayloadValue: extractedPlanCode },
            { Field: "category", DatabaseValue: dbCategory, LiveApiValue: "mtn_awoof_gifting", PurchasePayloadValue: "Implicit" },
            { Field: "amount", DatabaseValue: dbAmount, LiveApiValue: planMatch ? planMatch.amount : 'N/A', PurchasePayloadValue: "N/A (Not sent)" }
        ]);


        console.log("\n--- 5. EXECUTING PURCHASE REQUEST TRACE ---");
        
        const payload = {
            network: targetIdentifier,
            plan_code: extractedPlanCode,
            mobile_number: "08133131020",
            ported_number: true
        };

        console.log("OUTBOUND REQUEST DETAILS:");
        console.log(`- URL: POST ${BASE_URL}/api/data/purchase/`);
        console.log(`- Method: POST`);
        console.log(`- Headers:`);
        console.log(`  Accept: application/json`);
        console.log(`  Content-Type: application/json`);
        console.log(`  Authorization: Token ***${TOKEN.slice(-4)}`);
        console.log(`- Request Body:`);
        console.log(JSON.stringify(payload, null, 2));

        try {
            const purRes = await axios.post(`${BASE_URL}/api/data/purchase/`, payload, { headers });
            console.log("\nINBOUND RESPONSE DETAILS (SUCCESS):");
            console.log(`- HTTP Status: ${purRes.status}`);
            console.log(`- Response Headers: ${JSON.stringify(purRes.headers)}`);
            console.log(`- Response Body:`);
            console.log(JSON.stringify(purRes.data, null, 2));

        } catch (e) {
            console.log("\nINBOUND RESPONSE DETAILS (ERROR):");
            if (e.response) {
                console.log(`- HTTP Status: ${e.response.status}`);
                console.log(`- Response Headers: ${JSON.stringify(e.response.headers, null, 2)}`);
                console.log(`- Response Body:`);
                console.log(JSON.stringify(e.response.data, null, 2));
            } else {
                console.log(`- Network/Connection Error: ${e.message}`);
            }
        }
        
    } catch (err) {
        console.error("Fatal Error:", err);
    } finally {
        process.exit(0);
    }
}

runTrace();
