import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testPeyflexPurchase() {
    const key = process.env.PEYFLEX_API_TOKEN;
    const url = 'https://client.peyflex.com.ng/api/data/purchase/';

    const p = {
        network: 'mtn_gifting_data',
        plan_code: 'M110MBS',
        mobile_number: '08133131020',
        Ported_number: true
    };

    console.log("Testing Peyflex Purchase...");
    try {
        const res = await axios.post(url, p, {
            headers: {
                'Authorization': `Token ${key}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        console.log("Result:", res.data);
    } catch (e) {
        console.log("Error Status:", e.response?.status);
        console.log("Error Data:", e.response?.data);
    }
}
testPeyflexPurchase();
