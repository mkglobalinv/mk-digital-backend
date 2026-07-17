import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function findEndpoint() {
    const key = process.env.JARAPOINT_API_KEY;
    const base = "https://jarapoint.com/api";
    const endpoints = [
        "/data/plans/",
        "/data/plans",
        "/data_plans/",
        "/data-plans/",
        "/data/list/",
        "/plans/data/",
        "/plans/",
        "/data/",
    ];

    for (const ep of endpoints) {
        console.log(`Testing: ${base}${ep}`);
        try {
            const res = await axios.get(`${base}${ep}`, {
                headers: { 'Authorization': `Token ${key}` },
                timeout: 3000
            });
            console.log(`SUCCESS [${ep}]:`, typeof res.data);
            if (res.data && res.data.plans) console.log("PLANS FOUND!");
        } catch (e) {
            console.log(`FAILED [${ep}]:`, e.response?.status || e.message);
        }
    }
}
findEndpoint();
