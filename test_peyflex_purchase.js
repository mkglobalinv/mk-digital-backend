import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const PEYFLEX_API_URL = "https://client.peyflex.com.ng";
const PEYFLEX_API_TOKEN = process.env.PEYFLEX_API_TOKEN || process.env.PEYFLEX_API_KEY;

const peyflexClient = axios.create({
    baseURL: PEYFLEX_API_URL,
    headers: {
        'Authorization': `Token ${PEYFLEX_API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

async function testPurchase() {
    const payload = {
        network: "mtn_gifting_data",
        plan_code: "M110MBS",
        mobile_number: "08031234567",
        Ported_number: true
    };
    
    console.log("Sending payload:", payload);
    
    try {
        const response = await peyflexClient.post('/api/data/purchase/', payload);
        console.log("Success Response:", response.status, response.data);
    } catch (e) {
        console.error("Error Status:", e.response?.status);
        console.error("Error Response:", JSON.stringify(e.response?.data, null, 2));
    }
}

testPurchase();
