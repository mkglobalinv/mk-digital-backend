import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testPeyflexData() {
    const url = "https://client.peyflex.com.ng/api/data/purchase/";
    const token = process.env.PEYFLEX_API_TOKEN;
    
    // Variation 1: plan_id instead of plan
    const payloads = [
        { network: "mtn_gifting_data", plan: "M1m2GB", mobile_number: "08133131020", Ported_number: true },
        { network: "mtn_gifting_data", plan_id: "M1m2GB", mobile_number: "08133131020", Ported_number: true },
        { network: "MTN", plan: "M1m2GB", mobile_number: "08133131020", Ported_number: true },
        { network: "MTN", plan_id: "M1m2GB", mobile_number: "08133131020", Ported_number: true }
    ];
    
    for (const p of payloads) {
        console.log("Testing payload:", p);
        try {
            const res = await axios.post(url, p, {
                headers: { 'Authorization': `Token ${token}`, 'Accept': 'application/json' }
            });
            console.log("Success:", res.data);
            break;
        } catch (e) {
            console.log("Error:", e.response?.data || e.message);
        }
        console.log("---");
    }
}
testPeyflexData();
