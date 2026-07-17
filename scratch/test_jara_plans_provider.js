import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const key = process.env.JARAPOINT_API_KEY;
    try {
        console.log("Testing GET /api/data-plans/?provider=MTN");
        const res = await axios.get("https://jarapoint.com/api/data-plans/", {
            params: { provider: "MTN" },
            headers: { 'Authorization': `Token ${key}` }
        });
        console.log("Result:", JSON.stringify(res.data, null, 2));
    } catch(e) { console.log("Error:", e.response?.data || e.message); }
}
test();
