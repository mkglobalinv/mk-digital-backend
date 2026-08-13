import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const PEYFLEX_API_URL = (process.env.PEYFLEX_API_URL || "https://client.peyflex.com.ng").replace(/\/$/, "");
const PEYFLEX_API_TOKEN = process.env.PEYFLEX_API_TOKEN || process.env.PEYFLEX_API_KEY;

async function run() {
    try {
        const response = await axios.get(`${PEYFLEX_API_URL}/api/education/`, {
            headers: {
                'Authorization': `Token ${PEYFLEX_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        fs.writeFileSync('peyflex-edu.json', JSON.stringify(response.data, null, 2));
        console.log("Wrote to peyflex-edu.json");
    } catch (e) {
        fs.writeFileSync('peyflex-edu-error.json', JSON.stringify({ message: e.message, data: e.response?.data }, null, 2));
        console.log("Wrote error to peyflex-edu-error.json");
    }
}
run();
