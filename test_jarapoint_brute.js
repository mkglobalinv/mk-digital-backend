import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function bruteForceJarapoint() {
    const key = process.env.JARAPOINT_API_KEY;
    const urls = [
        "https://jarapoint.com/api/data/",
        "https://jarapoint.com/api/topup/",
        "https://jarapoint.com/api/purchase/"
    ];
    
    const payloads = [
        { network: "MTN", plan: "500", recipient: "08133131020", type: "sme", provider: "mtn" },
        { network: "MTN", plan_id: "500", mobile_number: "08133131020", type: "sme", provider: "mtn" },
        { MobileNetwork: "MTN", DataPlan: "500", MobileNumber: "08133131020", Request_ID: "REQ-" + Date.now() }
    ];
    
    for (const url of urls) {
        for (const p of payloads) {
            console.log(`Testing URL: ${url} | Payload:`, p);
            try {
                const res = await axios.post(url, p, {
                    headers: { 'Authorization': `Token ${key}`, 'Content-Type': 'application/json' },
                    timeout: 5000
                });
                console.log("Success:", res.data);
                return;
            } catch (e) {
                console.log("Error:", e.response?.data || e.message);
            }
            console.log("---");
        }
    }
}
bruteForceJarapoint();
