import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const PEYFLEX_API_URL = process.env.PEYFLEX_API_URL;
const PEYFLEX_API_TOKEN = process.env.PEYFLEX_API_TOKEN;

async function probe() {
    const id = "mtn_gifting_data";
    try {
        console.log(`Probing plans for ${id}...`);
        const res = await axios.get(`${PEYFLEX_API_URL}/api/data/plans/`, {
            params: { network: id },
            headers: { 'Authorization': `Token ${PEYFLEX_API_TOKEN}` }
        });
        console.log("Plans Success:", res.data.plans?.length);
    } catch (e) {
        console.log("Failed:", e.response?.data || e.message);
    }
}

probe();
