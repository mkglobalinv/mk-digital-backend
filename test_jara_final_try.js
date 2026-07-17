import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const key = process.env.JARAPOINT_API_KEY;
    const urls = [
        "https://jarapoint.com/api/data/",
        "https://jarapoint.com/api/data",
        "https://jarapoint.com/api/plans",
        "https://jarapoint.com/api/data-plans",
    ];

    for (const u of urls) {
        console.log("Testing:", u);
        try {
            const res = await axios.get(u, {
                headers: { 'Authorization': `Token ${key}` },
                timeout: 3000
            });
            console.log("SUCCESS:", u);
            console.log(JSON.stringify(res.data).substring(0, 100));
        } catch(e) { console.log("FAIL:", e.response?.status || e.message); }
    }
}
test();
