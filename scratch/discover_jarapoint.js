import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const JARAPOINT_API_URL = "https://jarapoint.com/api";
const JARAPOINT_API_KEY = process.env.JARAPOINT_API_KEY;

const endpoints = [
    "/data/plans",
    "/data-plans",
    "/plans/data",
    "/data/list",
    "/network/plans",
    "/fetch-plans",
    "/data_plans"
];

async function discover() {
    for (const ep of endpoints) {
        try {
            console.log(`Trying ${ep}...`);
            const response = await axios.get(`${JARAPOINT_API_URL}${ep}`, {
                headers: { 'Authorization': `Bearer ${JARAPOINT_API_KEY}` }
            });
            console.log(`SUCCESS at ${ep}:`, JSON.stringify(response.data).substring(0, 200));
        } catch (e) {
            console.log(`Failed at ${ep}: ${e.response?.status || e.message}`);
        }
    }
}

discover();
