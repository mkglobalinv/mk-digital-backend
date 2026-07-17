import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const key = process.env.JARAPOINT_API_KEY;
    const url = "https://jarapoint.com/api/data/plans/";
    try {
        const res = await axios.get(url, {
            params: { network: "MTN" },
            headers: { 'Authorization': `Token ${key}` }
        });
        console.log("Result:", res.data);
    } catch(e) { console.log("Error:", e.response?.status || e.message); }
}
test();
