import axios from "axios";
import dotenv from "dotenv";
import { getReloadlyAccessToken } from "../services/reloadlyAuth.js";
dotenv.config();

async function run() {
    try {
        console.log("Fetching Reloadly access token...");
        const token = await getReloadlyAccessToken();
        const baseUrl = process.env.RELOADLY_BASE_URL || 'https://topups.reloadly.com';
        
        console.log(`Querying Reloadly Balance at: ${baseUrl}/accounts/balance`);
        const res = await axios.get(`${baseUrl}/accounts/balance`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/com.reloadly.topups-v1+json'
            },
            timeout: 10000
        });
        console.log("Reloadly Balance Response:", res.status, JSON.stringify(res.data));
    } catch (e) {
        console.error("Reloadly failed:", e.response?.data || e.message);
    }
}

run();
