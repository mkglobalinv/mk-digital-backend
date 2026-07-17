import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testJarapointPlans() {
    const key = process.env.JARAPOINT_API_KEY;
    const url = "https://jarapoint.com/api/data/?network=MTN";

    try {
        const res = await axios.get(url, {
            headers: { 'Authorization': `Token ${key}`, 'Accept': 'application/json' }
        });
        console.log("Full Data:", JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log("Error:", e.response?.status || e.message);
    }
}
testJarapointPlans();
