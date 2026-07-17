import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const key = process.env.JARAPOINT_API_KEY;
    try {
        console.log("Testing POST /api/data-plans/ with provider: MTN");
        const res = await axios.post("https://jarapoint.com/api/data-plans/", {
            provider: "MTN"
        }, {
            headers: { 'Authorization': `Token ${key}`, 'Content-Type': 'application/json' }
        });
        console.log("POST Result:", JSON.stringify(res.data, null, 2));
    } catch(e) { console.log("POST Error:", e.response?.data || e.message); }
}
test();
