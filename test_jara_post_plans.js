import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testFetchPlans() {
    const key = process.env.JARAPOINT_API_KEY;
    const url = "https://jarapoint.com/api/data/";
    
    try {
        const res = await axios.post(url, {
            provider: "mtn_sme",
            type: "sme",
            nonce: Date.now().toString()
        }, {
            headers: { 
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        console.log("Success:", JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log("Error:", e.response?.data || e.message);
    }
}

testFetchPlans();
