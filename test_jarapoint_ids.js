import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function bruteForceJarapointIDs() {
    const key = process.env.JARAPOINT_API_KEY;
    const ids = ["1", "500", "500MB", "M500MB", "SME500", "SME500MB", "1000", "1GB", "SME1GB"];
    
    for (const id of ids) {
        console.log(`Testing ID: ${id}`);
        try {
            const res = await axios.post('https://jarapoint.com/api/data/', {
                network: 'MTN',
                plan: id,
                recipient: '08133131020',
                type: 'sme',
                provider: 'mtn'
            }, {
                headers: { 'Authorization': `Token ${key}`, 'Content-Type': 'application/json' },
                timeout: 5000
            });
            console.log(`Result for ${id}:`, res.data);
            if (res.data.status === 'success' || !res.data.message.includes('Invalid Plan')) {
                console.log("FOUND POTENTIAL ID!");
            }
        } catch (e) {
            console.log(`Error for ${id}:`, e.response?.data || e.message);
        }
        console.log("---");
    }
}
bruteForceJarapointIDs();
