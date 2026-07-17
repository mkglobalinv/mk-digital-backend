import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function testAirtime() {
    const userid = process.env.CLUBKONNECT_USERID;
    const apikey = process.env.CLUBKONNECT_API_KEY;
    const baseUrl = "https://www.nellobytesystems.com";

    console.log(`Testing Airtime with ${baseUrl}/APIAirtimeV1.asp ...`);

    try {
        const response = await axios.get(`${baseUrl}/APIAirtimeV1.asp`, {
            params: {
                userid,
                apikey,
                MobileNetwork: '01',
                Amount: '100',
                MobileNumber: '08030000000',
                RequestID: 'TEST' + Date.now()
            },
            timeout: 10000
        });
        console.log("RESPONSE:", JSON.stringify(response.data));
    } catch (e) {
        console.error("ERROR:", e.message);
        if (e.response) console.log("DATA:", e.response.data);
    }
}

testAirtime();
