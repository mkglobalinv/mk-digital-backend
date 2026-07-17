import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Must load env correctly
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function bruteForceSchema() {
    console.log("Brute-forcing Peyflex Data payload schema...");
    const token = process.env.PEYFLEX_API_TOKEN;
    const url = "https://client.peyflex.com.ng/api/data/purchase/";

    const payloads = [
        { name: "Current peyflex.js payload", data: { network: "mtn_awoof_gifting", plan_code: "M1GBA", mobile_number: "08133131020", ported_number: true } },
        { name: "Current peyflex.js payload (no ported)", data: { network: "mtn_awoof_gifting", plan_code: "M1GBA", mobile_number: "08133131020" } }
    ];

    for (const test of payloads) {
        console.log(`\nTesting: ${test.name}`);
        console.log(`Payload: ${JSON.stringify(test.data)}`);
        
        try {
            const res = await axios.post(url, test.data, {
                headers: { 
                    'Authorization': `Token ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            console.log(`[SUCCESS HTTP ${res.status}] Response:`, res.data);
        } catch (error) {
            const status = error.response?.status;
            const errorData = error.response?.data;
            console.log(`[FAILED HTTP ${status}] Response:`, errorData || error.message);
        }
    }
}

bruteForceSchema();
