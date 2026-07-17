import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function checkPlans() {
    const key = process.env.JARAPOINT_API_KEY;
    try {
        const res = await axios.get("https://jarapoint.com/api/data_plans/", {
            headers: { 'Authorization': `Token ${key}` }
        });
        console.log("Plans:", JSON.stringify(res.data, null, 2));
    } catch(e) { console.log("Error:", e.response?.status || e.message); }
}
checkPlans();
