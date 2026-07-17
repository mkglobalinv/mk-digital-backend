import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function bruteDataType() {
    const url = "https://jarapoint.com/api/data/";
    const key = process.env.JARAPOINT_API_KEY;
    const types = ["sme", "gifting", "corporate", "cg", "vtu", "data"];
    
    for (const t of types) {
        console.log(`Testing Data type: ${t}`);
        const p = {
            network: "MTN",
            plan: "500", // Guesstimated plan ID
            recipient: "08133131020",
            Ported_number: true,
            type: t,
            provider: "mtn"
        };
        
        try {
            const res = await axios.post(url, p, {
                headers: { 'Authorization': `Token ${key}`, 'Content-Type': 'application/json' }
            });
            console.log(`Result for ${t}:`, res.data);
            if (res.data.success) break;
        } catch (e) {
            console.log(`Error for ${t}:`, e.response?.data || e.message);
        }
        console.log("---");
    }
}
bruteDataType();
