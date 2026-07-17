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

async function testPurchase(networkValue) {
    const payload = {
        network: networkValue,
        plan_code: "M110MBS",
        mobile_number: "08133131020", // same number used in backend log
        Ported_number: true
    };
    
    console.log(`\nTesting with network = ${networkValue} (${typeof networkValue})`);
    console.log("Payload:", payload);
    
    try {
        const response = await peyflexClient.post('/api/data/purchase/', payload);
        console.log("Success Response:", response.status, response.data);
    } catch (e) {
        console.error("Error Status:", e.response?.status);
        console.error("Error Response:", JSON.stringify(e.response?.data, null, 2));
    }
}

async function runTests() {
    await testPurchase(1);
    await testPurchase("1");
    await testPurchase("MTN");
    await testPurchase("mtn_gifting_data"); // Just to reproduce the exact error
}

runTests();
