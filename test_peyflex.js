import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const PEYFLEX_API_URL = "https://client.peyflex.com.ng";
const PEYFLEX_API_TOKEN = process.env.PEYFLEX_API_TOKEN || process.env.PEYFLEX_API_KEY;

const peyflexClient = axios.create({
    baseURL: PEYFLEX_API_URL,
    headers: {
        'Authorization': `Token ${PEYFLEX_API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

async function getPlans() {
    try {
        console.log("Fetching Data Networks...");
        const netResp = await peyflexClient.get('/api/data/networks/');
        console.log("Networks:", netResp.data);
    } catch (e) {
        console.error("Networks Error:", e.response?.status, e.response?.data?.substring?.(0, 100) || e.message);
    }

    try {
        console.log("\nFetching Data Plans for MTN (mtn_gifting_data)...");
        const planResp = await peyflexClient.get('/api/data/plans/?network=mtn_gifting_data');
        console.log("MTN Gifting Plans:", JSON.stringify(planResp.data, null, 2));
    } catch (e) {
        console.error("Plans Error:", e.response?.status, e.response?.data?.substring?.(0, 100) || e.message);
    }

    try {
        console.log("\nFetching Data Plans for MTN (1)...");
        const planResp2 = await peyflexClient.get('/api/data/plans/?network=1');
        console.log("MTN (1) Plans:", JSON.stringify(planResp2.data, null, 2));
    } catch (e) {
        console.error("Plans Error:", e.response?.status, e.response?.data?.substring?.(0, 100) || e.message);
    }
}

getPlans();
