import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testJ() {
    const key = process.env.JARAPOINT_API_KEY;
    try {
        const res = await axios.get("https://jarapoint.com/api/data/", {
            headers: { 'Authorization': `Token ${key}`, 'Content-Type': 'application/json' }
        });
        console.log("Data GET:", res.data);
    } catch(e) { console.log("Data GET Error:", e.response?.data || e.message); }

    try {
        const res = await axios.post("https://jarapoint.com/api/data/", {}, {
            headers: { 'Authorization': `Token ${key}`, 'Content-Type': 'application/json' }
        });
        console.log("Data POST:", res.data);
    } catch(e) { console.log("Data POST Error:", e.response?.data || e.message); }
}
testJ();
