import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function testCapitalizedParams() {
    const UserID = process.env.CLUBKONNECT_USERID;
    const APIKey = process.env.CLUBKONNECT_API_KEY;
    const baseUrl = "https://www.nellobytesystems.com";

    console.log("Testing with CAPITALIZED params (UserID, APIKey)...");

    try {
        const response = await axios.get(`${baseUrl}/APIDatabundlePlansV1.asp`, {
            params: { UserID, APIKey },
            timeout: 10000
        });
        
        if (response.data && response.data.MOBILE_NETWORK) {
            console.log("SUCCESS: API accepts capitalized params.");
        } else {
            console.log("FAILED: API response was unexpected.", JSON.stringify(response.data));
        }
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}

testCapitalizedParams();
