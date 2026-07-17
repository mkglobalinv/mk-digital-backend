import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testPeyflexPlans() {
    const token = process.env.PEYFLEX_API_TOKEN;
    const url = "https://client.peyflex.com.ng/api/data/plans/?network=glo_data";

    try {
        const res = await axios.get(url, {
            headers: { 'Authorization': `Token ${token}`, 'Accept': 'application/json' }
        });
        console.log("Response Type:", typeof res.data);
        console.log("Full Data:", JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log("Error:", e.response?.status || e.message);
    }
}
testPeyflexPlans();
