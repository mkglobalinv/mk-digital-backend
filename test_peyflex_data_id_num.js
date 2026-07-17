import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testPeyflexData() {
    const url = "https://client.peyflex.com.ng/api/data/purchase/";
    const token = process.env.PEYFLEX_API_TOKEN;
    
    const p = {
        network: 1, // Using ID instead of string
        plan: "M1m2GB",
        mobile_number: "08133131020",
        Ported_number: true
    };
    
    console.log("Testing Peyflex Data with network ID 1...");
    try {
        const res = await axios.post(url, p, {
            headers: { 'Authorization': `Token ${token}`, 'Accept': 'application/json' }
        });
        console.log("Success:", res.data);
    } catch (e) {
        console.log("Error:", e.response?.data || e.message);
    }
}
testPeyflexData();
