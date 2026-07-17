import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function probe() {
    const key = process.env.JARAPOINT_API_KEY;
    const endpoints = [
        'https://jarapoint.com/api/data',
        'https://jarapoint.com/api/plans',
        'https://jarapoint.com/api/data-plans',
        'https://jarapoint.com/api/networks'
    ];

    for (const url of endpoints) {
        console.log(`Probing GET ${url}`);
        try {
            const res = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${key}` }
            });
            console.log(`Success ${url}:`, JSON.stringify(res.data).substring(0, 500));
        } catch (e) {
            console.log(`Failed ${url}:`, e.response?.status, e.response?.data);
        }
        console.log("---");
    }
}
probe();
