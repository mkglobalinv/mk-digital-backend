import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function checkNetworks() {
    const token = process.env.PEYFLEX_API_TOKEN;
    const url = "https://client.peyflex.com.ng/api/data/networks/";
    try {
        const res = await axios.get(url, {
            headers: { 'Authorization': `Token ${token}`, 'Accept': 'application/json' }
        });
        console.log("Networks:", JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log("Error:", e.response?.status || e.message);
    }
}
checkNetworks();
