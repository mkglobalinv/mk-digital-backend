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

async function testPayload(payload, label) {
    console.log(`\nTesting: ${label}`);
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
    await testPayload({
        network_id: "mtn_gifting_data",
        plan_id: "M110MBS",
        mobile_number: "08133131020",
        Ported_number: true
    }, "Using network_id and plan_id");

    await testPayload({
        network: 1,
        plan_id: "M110MBS",
        mobile_number: "08133131020",
        Ported_number: true
    }, "Using network (numeric) and plan_id");
    
    await testPayload({
        network: "mtn_gifting_data",
        plan: "M110MBS",
        mobile_number: "08133131020",
        Ported_number: true
    }, "Using plan instead of plan_code");
    
    await testPayload({
        network: "mtn_gifting_data",
        plan_code: "M110MBS",
        phone: "08133131020",
        Ported_number: true
    }, "Using phone instead of mobile_number");
}

runTests();
