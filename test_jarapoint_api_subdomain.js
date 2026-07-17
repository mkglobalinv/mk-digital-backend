import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testApiSubdomain() {
    const url = "https://api.jarapoint.com/data";
    const key = process.env.JARAPOINT_API_KEY;
    
    console.log("Testing api.jarapoint.com...");
    try {
        const res = await axios.post(url, {
            network: "MTN",
            mobile_number: "08133131020",
            plan: "1",
            Ported_number: true
        }, {
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            timeout: 5000
        });
        console.log("Result:", res.data);
    } catch (e) {
        console.log("Error:", e.response?.data || e.message);
        console.log("Status:", e.response?.status);
    }
}
testApiSubdomain();
