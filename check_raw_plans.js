import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function checkRawPlans() {
    const userid = process.env.CLUBKONNECT_USERID;
    const apikey = process.env.CLUBKONNECT_API_KEY;
    const baseUrl = "https://www.nellobytesystems.com";

    try {
        const response = await axios.get(`${baseUrl}/APIDatabundlePlansV1.asp`, {
            params: { userid, apikey }
        });
        console.log("MTN PLANS RAW:", JSON.stringify(response.data.MOBILE_NETWORK.MTN, null, 2));
    } catch (e) {
        console.error(e.message);
    }
}

checkRawPlans();
