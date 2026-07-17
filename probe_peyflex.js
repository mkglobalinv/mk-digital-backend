import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const PEYFLEX_API_URL = process.env.PEYFLEX_API_URL;
const PEYFLEX_API_TOKEN = process.env.PEYFLEX_API_TOKEN;

async function probe() {
    try {
        console.log("Probing Peyflex Profile...");
        const res = await axios.get(`${PEYFLEX_API_URL}/api/user/profile/`, {
            headers: { 'Authorization': `Token ${PEYFLEX_API_TOKEN}` }
        });
        console.log("Profile Success:", res.data.username);

        console.log("Probing Peyflex Networks...");
        const netRes = await axios.get(`${PEYFLEX_API_URL}/api/data/networks/`, {
            headers: { 'Authorization': `Token ${PEYFLEX_API_TOKEN}` }
        });
        console.log("Networks:", netRes.data.networks);
    } catch (e) {
        console.log("Failed:", e.response?.data || e.message);
    }
}

probe();
