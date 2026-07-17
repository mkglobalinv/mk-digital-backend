import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function bruteTypeValues() {
    const url = "https://jarapoint.com/api/airtime/";
    const key = process.env.JARAPOINT_API_KEY;
    const values = ["vtu", "airtime", "topup", "1", "01", "VTU", "AIRTIME", "Direct", "Share", "A"];
    
    for (const v of values) {
        console.log(`Testing type: ${v}`);
        const p = {
            network: "MTN",
            amount: 100,
            mobile_number: "08133131020",
            Ported_number: true,
            type: v
        };
        
        try {
            const res = await axios.post(url, p, {
                headers: { 'Authorization': `Token ${key}`, 'Content-Type': 'application/json' }
            });
            console.log(`Result for ${v}:`, res.data);
        } catch (e) {
            console.log(`Error for ${v}:`, e.response?.data || e.message);
        }
        console.log("---");
    }
}
bruteTypeValues();
