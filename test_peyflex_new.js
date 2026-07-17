import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testPeyflex() {
    const url = "https://client.peyflex.com.ng/api/airtime/topup/";
    const token = process.env.PEYFLEX_API_TOKEN;
    
    const p = {
        network: "MTN",
        amount: 100,
        mobile_number: "08133131020",
        Ported_number: true,
        airtime_type: "VTU"
    };
    
    console.log("Testing Peyflex with new endpoint:", url);
    try {
        const res = await axios.post(url, p, {
            headers: { 
                'Authorization': `Token ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        console.log("Response:", res.data);
    } catch (e) {
        console.log("Error:", e.response?.data || e.message);
    }
}
testPeyflex();
