import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const url = "https://jarapoint.com/api/topup/";
    const key = process.env.JARAPOINT_API_KEY;
    
    const p = { network: "MTN", amount: 100, mobile_number: "08133131020", Ported_number: true, airtime_type: "VTU" };

    console.log("Testing topup endpoint with payload:", p);
    try {
        const res = await axios.post(url, p, {
            headers: { 'Authorization': `Token ${key}`, 'Content-Type': 'application/json' },
            timeout: 10000
        });
        console.log("Response:", res.data);
    } catch (e) {
        if (e.response) {
            console.log("Error Status:", e.response.status);
            console.log("Error Data:", e.response.data);
        } else {
            console.log("Error Message:", e.message);
        }
    }
}
test();
