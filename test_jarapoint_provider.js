import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function bruteProvider() {
    const url = "https://jarapoint.com/api/airtime/";
    const key = process.env.JARAPOINT_API_KEY;
    const providers = ["mtn", "MTN", "Airtel", "Glo", "9mobile", "VTPass", "vtp", "clubkonnect", "Mtn"];
    
    for (const p_val of providers) {
        console.log(`Testing provider: ${p_val}`);
        const p = {
            network: "MTN",
            amount: 100,
            mobile_number: "08133131020",
            Ported_number: true,
            type: "vtu",
            provider: p_val
        };
        
        try {
            const res = await axios.post(url, p, {
                headers: { 'Authorization': `Token ${key}`, 'Content-Type': 'application/json' }
            });
            console.log(`Result for ${p_val}:`, res.data);
            if (res.data.success) break;
        } catch (e) {
            console.log(`Error for ${p_val}:`, e.response?.data || e.message);
        }
        console.log("---");
    }
}
bruteProvider();
