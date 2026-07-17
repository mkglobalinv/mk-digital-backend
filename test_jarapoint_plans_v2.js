import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testJarapointPlans() {
    const key = process.env.JARAPOINT_API_KEY;
    const urls = [
        "https://jarapoint.com/api/data/plan/",
        "https://jarapoint.com/api/data/networks/",
    ];

    for (const url of urls) {
        console.log(`Testing URL: ${url}`);
        try {
            const res = await axios.get(url, {
                headers: { 'Authorization': `Token ${key}` }
            });
            console.log("Success! Data preview:", JSON.stringify(res.data).substring(0, 200));
        } catch (e) {
            console.log("Error:", e.response?.status || e.message);
        }
        console.log("---");
    }
}
testJarapointPlans();
