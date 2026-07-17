import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function getPlans() {
    const key = process.env.JARAPOINT_API_KEY || "vtu-69eb579e0620c";
    const networks = ["MTN", "GLO", "AIRTEL", "9MOBILE"];
    const types = ["sme", "gifting", "corporate"];
    
    console.log("Starting Jarapoint Plan Discovery...");
    
    for (const network of networks) {
        for (const type of types) {
            console.log(`Checking ${network} - ${type}...`);
            try {
                // Try the endpoint that seems most likely based on previous scripts
                const url = `https://jarapoint.com/api/data/?network=${network}&type=${type}`;
                const res = await axios.get(url, {
                    headers: { 'Authorization': `Token ${key}`, 'Accept': 'application/json' },
                    timeout: 10000
                });
                
                if (res.data && (Array.isArray(res.data) || res.data.data)) {
                    const plans = res.data.data || res.data;
                    console.log(`SUCCESS! Found ${plans.length} plans for ${network} ${type}`);
                    fs.appendFileSync('found_plans.json', JSON.stringify({ network, type, plans }, null, 2) + ",\n");
                } else {
                    console.log(`Response for ${network} ${type}:`, JSON.stringify(res.data).substring(0, 100));
                }
            } catch (e) {
                console.log(`Failed for ${network} ${type}: ${e.response?.status || e.message}`);
                if (e.response?.data) console.log("Error details:", JSON.stringify(e.response.data));
            }
        }
    }
    console.log("Done.");
}

getPlans();
