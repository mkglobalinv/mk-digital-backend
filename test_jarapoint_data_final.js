import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testData() {
    const url = "https://jarapoint.com/api/data/";
    const key = process.env.JARAPOINT_API_KEY;
    
    // Most data plans use IDs. I'll try to find a valid ID by brute forcing or searching.
    // But first, let's see if it needs the same fields.
    const p = {
        network: "MTN",
        plan: "500", // Example plan ID
        recipient: "08133131020",
        Ported_number: true,
        type: "vtu", // Or maybe "sme"?
        provider: "mtn"
    };
    
    console.log("Testing data with guessed fields...");
    try {
        const res = await axios.post(url, p, {
            headers: { 'Authorization': `Token ${key}`, 'Content-Type': 'application/json' }
        });
        console.log("Response:", res.data);
    } catch (e) {
        console.log("Error:", e.response?.data || e.message);
    }
}
testData();
