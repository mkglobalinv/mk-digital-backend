import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const PEYFLEX_API_URL = process.env.PEYFLEX_API_URL || "https://client.peyflex.com.ng";
const PEYFLEX_API_TOKEN = process.env.PEYFLEX_API_TOKEN;

async function probe() {
    const id = "16047";
    const endpoints = [
        `/api/data/purchase/?id=${id}`,
        `/api/airtime/topup/?id=${id}`,
        `/api/data/?id=${id}`,
        `/api/airtime/?id=${id}`,
        `/api/topup/?id=${id}`,
        `/api/transaction/?id=${id}`,
        `/api/verify/?id=${id}`
    ];

    for (const ep of endpoints) {
        try {
            const url = `${PEYFLEX_API_URL}${ep}`;
            console.log(`Probing ${url}...`);
            const res = await axios.get(url, {
                headers: { 'Authorization': `Token ${PEYFLEX_API_TOKEN}` }
            });
            console.log(`   SUCCESS: ${res.status}`);
            console.log(`   DATA: ${JSON.stringify(res.data).substring(0, 200)}`);
            return;
        } catch (e) {
            console.log(`   FAILED: ${e.response?.status || e.message}`);
        }
    }
}

probe();
