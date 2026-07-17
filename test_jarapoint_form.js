import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';
import qs from 'qs';
dotenv.config();

async function testJarapointForm() {
    const url = "https://jarapoint.com/api/data/";
    const key = process.env.JARAPOINT_API_KEY;
    const nonce = crypto.randomBytes(8).toString('hex');
    
    const p = {
        network: "MTN",
        plan: "500",
        recipient: "08133131020",
        Ported_number: "true",
        type: "sme",
        provider: "mtn",
        nonce: nonce
    };
    
    console.log("Testing Jarapoint with Form Data (x-www-form-urlencoded)...");
    try {
        const res = await axios.post(url, qs.stringify(p), {
            headers: { 
                'Authorization': `Token ${key}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log("Result:", res.data);
    } catch (e) {
        console.log("Error:", e.response?.data || e.message);
    }
}
testJarapointForm();
