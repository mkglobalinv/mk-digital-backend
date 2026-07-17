import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function bruteFields() {
    const url = "https://jarapoint.com/api/airtime/";
    const key = process.env.JARAPOINT_API_KEY;
    const fields = ["type", "airtime_type", "network_type", "service_type", "plan_type"];
    
    for (const f of fields) {
        console.log(`Testing field name: ${f}`);
        const p = {
            network: "MTN",
            amount: 100,
            mobile_number: "08133131020",
            Ported_number: true,
        };
        p[f] = "VTU";
        
        try {
            const res = await axios.post(url, p, {
                headers: { 'Authorization': `Token ${key}`, 'Content-Type': 'application/json' }
            });
            console.log(`Result for ${f}:`, res.data);
        } catch (e) {
            console.log(`Error for ${f}:`, e.response?.data || e.message);
        }
        console.log("---");
    }
}
bruteFields();
