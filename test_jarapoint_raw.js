import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const url = "https://jarapoint.com/api/airtime";
    const key = process.env.JARAPOINT_API_KEY;
    
    const payloads = [
        { network: "MTN", amount: 100, mobile_number: "08133131020", Ported_number: true, airtime_type: "VTU" },
        { network: 1, amount: 100, mobile_number: "08133131020", Ported_number: true, airtime_type: "VTU" },
        { network: "MTN", amount: 100, mobile_number: "08133131020", Ported_number: true, type: "VTU" },
        { network: 1, amount: 100, mobile_number: "08133131020", Ported_number: true, type: "VTU" }
    ];

    for (const p of payloads) {
        console.log("Testing payload:", p);
        try {
            const res = await axios.post(url, p, {
                headers: { 'Authorization': `Token ${key}`, 'Content-Type': 'application/json' }
            });
            console.log("Response:", res.data);
        } catch (e) {
            console.log("Error:", e.response?.data || e.message);
        }
        console.log("---");
    }
}
test();
