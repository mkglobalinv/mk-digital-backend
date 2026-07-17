import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testWorking() {
    const url = "https://jarapoint.com/api/airtime/";
    const key = process.env.JARAPOINT_API_KEY;
    
    const p = {
        network: "MTN",
        amount: 100,
        recipient: "08133131020",
        Ported_number: true,
        type: "vtu",
        provider: "mtn" // Matches the network
    };
    
    console.log("Testing with network-matched provider...");
    try {
        const res = await axios.post(url, p, {
            headers: { 'Authorization': `Token ${key}`, 'Content-Type': 'application/json' }
        });
        console.log("Response:", res.data);
    } catch (e) {
        console.log("Error:", e.response?.data || e.message);
    }
}
testWorking();
