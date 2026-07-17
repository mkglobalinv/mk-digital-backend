import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

async function testJarapointWithNonce() {
    const url = "https://jarapoint.com/api/data/";
    const key = process.env.JARAPOINT_API_KEY;
    const nonce = crypto.randomBytes(16).toString('hex');
    
    console.log("Testing Jarapoint with nonce...");
    try {
        const res = await axios.get(url, {
            params: { network: "MTN", type: "sme", nonce: nonce },
            headers: { 'Authorization': `Token ${key}` }
        });
        console.log("Result:", res.data);
    } catch (e) {
        console.log("Error:", e.response?.data || e.message);
    }
}
testJarapointWithNonce();
