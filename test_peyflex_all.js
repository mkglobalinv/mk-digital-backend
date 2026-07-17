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

async function getAllPlans() {
    try {
        const netResp = await peyflexClient.get('/api/data/networks/');
        const networks = netResp.data.networks;
        
        for (const net of networks) {
            console.log(`\nFetching plans for ${net.identifier}...`);
            const planResp = await peyflexClient.get(`/api/data/plans/?network=${net.identifier}`);
            console.log(`Found ${planResp.data.plans?.length || 0} plans.`);
            
            // Check for M2a5GB or M12m5GBA
            const awoofPlans = planResp.data.plans.filter(p => p.plan_code.includes('M2a5GB') || p.plan_code.includes('M12m5GBA') || p.plan_code.includes('Awoof'));
            if (awoofPlans.length > 0) {
                console.log("AWOOF PLANS FOUND IN THIS NETWORK:", awoofPlans);
            }
        }
    } catch (e) {
        console.error("Error:", e.response?.status, e.response?.data || e.message);
    }
}

getAllPlans();
