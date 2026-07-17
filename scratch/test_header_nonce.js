import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

async function testHeaderNonce() {
    const url = "https://jarapoint.com/api/data-plans/";
    const key = process.env.JARAPOINT_API_KEY;
    const nonce = crypto.randomBytes(16).toString('hex');
    
    console.log("Testing Jarapoint with nonce in HEADERS...");
    try {
        const res = await axios.get(url, {
            headers: { 
                'Authorization': `Token ${key}`,
                'nonce': nonce
            }
        });
        console.log("Result:", res.data);
    } catch (e) {
        console.log("Error:", e.response?.data || e.message);
    }
}
testHeaderNonce();
