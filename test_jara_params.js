import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const key = process.env.JARAPOINT_API_KEY;
    const url = "https://jarapoint.com/api/data/";
    
    const attempts = [
        { network: "MTN" },
        { network: "MTN", type: "sme" },
        { network: "MTN", type: "gifting" },
        { network: "MTN", type: "corporate" },
    ];

    for (const a of attempts) {
        console.log("Testing:", a);
        try {
            const res = await axios.get(url, {
                params: a,
                headers: { 'Authorization': `Token ${key}` },
                timeout: 3000
            });
            console.log("Result:", res.data);
        } catch(e) { console.log("Error:", e.response?.data || e.message); }
    }
}
test();
