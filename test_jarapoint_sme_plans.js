import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testJarapointSmePlans() {
    const key = process.env.JARAPOINT_API_KEY;
    const url = "https://jarapoint.com/api/data/?network=MTN&type=sme";

    try {
        const res = await axios.get(url, {
            headers: { 'Authorization': `Token ${key}`, 'Accept': 'application/json' }
        });
        console.log("SME Plans:", JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log("Error:", e.response?.status || e.message);
    }
}
testJarapointSmePlans();
