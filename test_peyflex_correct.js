import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testPeyflexCorrect() {
    const key = process.env.PEYFLEX_API_TOKEN;
    const url = 'https://client.peyflex.com.ng/api/data/plans/?network=mtn_gifting_data';
    
    console.log("Testing Peyflex with correct URL and Auth...");
    try {
        const res = await axios.get(url, {
            headers: { 
                'Authorization': `Token ${key}`,
                'Accept': 'application/json'
            }
        });
        console.log("Success! Found plans:", res.data.plans?.length);
        console.log("Sample plan:", res.data.plans?.[0]);
    } catch (e) {
        console.log("Error:", e.response?.data || e.message);
    }
}
testPeyflexCorrect();
