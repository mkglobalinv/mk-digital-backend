import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const PEYFLEX_API_URL = (process.env.PEYFLEX_API_URL || "https://client.peyflex.com.ng").replace(/\/$/, "");
const PEYFLEX_API_TOKEN = process.env.PEYFLEX_API_TOKEN || process.env.PEYFLEX_API_KEY;

const getPeyflexHeaders = () => {
    return {
        'Authorization': `Token ${PEYFLEX_API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
};

const identifiers = [
    'mtn_sme_data', 'mtn_gifting_data', 'mtn_data_share',
    'glo_data', 'glo_sme_data', 'glo_gifting_data',
    'airtel_data', 'airtel_sme_data', 'airtel_gifting_data',
    '9mobile_data', '9mobile_sme_data', '9mobile_gifting_data'
];

async function testPlans() {
    console.log("Using API Token:", PEYFLEX_API_TOKEN ? "Present (Starts with " + PEYFLEX_API_TOKEN.substring(0, 5) + "...)" : "Missing");
    for (const id of identifiers) {
        const endpoint = `${PEYFLEX_API_URL}/api/data/plans/`;
        try {
            console.log(`\n--- Fetching plans for identifier: ${id} ---`);
            const res = await axios.get(endpoint, {
                params: { network: id },
                headers: getPeyflexHeaders(),
                timeout: 10000
            });
            console.log(`Status: ${res.status}`);
            console.log(`Body keys:`, Object.keys(res.data));
            if (res.data.plans) {
                console.log(`Plans found: ${res.data.plans.length}`);
                if (res.data.plans.length > 0) {
                    console.log(`First plan:`, JSON.stringify(res.data.plans[0]));
                }
            } else {
                console.log(`Body response:`, JSON.stringify(res.data));
            }
        } catch (err) {
            console.error(`Error for ${id}:`, err.response?.status, JSON.stringify(err.response?.data || err.message));
        }
    }
}

testPlans();
