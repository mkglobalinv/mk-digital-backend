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

async function checkBalance() {
    try {
        const response = await peyflexClient.get('/api/user/profile/');
        console.log("Peyflex Profile:", JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error("Error Status:", e.response?.status);
        console.error("Error Response:", JSON.stringify(e.response?.data, null, 2));
    }
}

checkBalance();
