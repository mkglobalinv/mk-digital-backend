import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function inspect() {
    const key = process.env.JARAPOINT_API_KEY;
    const base = "https://jarapoint.com/api";
    const eps = ["/data_plans/", "/data-plans/", "/plans/", "/data/"];

    for (const ep of eps) {
        console.log(`Inspecting: ${ep}`);
        try {
            const res = await axios.get(`${base}${ep}`, {
                headers: { 'Authorization': `Token ${key}` }
            });
            console.log(`Content of ${ep}:`, JSON.stringify(res.data).substring(0, 500));
        } catch (e) {
            console.log(`Error at ${ep}:`, e.response?.data || e.message);
        }
    }
}
inspect();
