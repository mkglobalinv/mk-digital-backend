import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const BASE_URL = "https://www.nellobytesystems.com";

async function checkClubkonnect() {
    const UserID = process.env.CLUBKONNECT_USERID;
    const APIKey = process.env.CLUBKONNECT_API_KEY;

    console.log("Clubkonnect UserID:", UserID);
    console.log("Clubkonnect APIKey present:", APIKey ? "Yes" : "No");

    if (!UserID || !APIKey) {
        console.error("Credentials missing in .env");
        process.exit(1);
    }

    // Check balance endpoint
    const endpoint = `${BASE_URL}/APIWalletBalanceV1.asp`;
    const params = { UserID, APIKey };

    try {
        console.log(`Querying Clubkonnect balance from ${endpoint}...`);
        const response = await axios.get(endpoint, { params, timeout: 10000 });
        console.log("Response Status:", response.status);
        console.log("Response Body:", JSON.stringify(response.data));
        process.exit(0);
    } catch (err) {
        console.error("Clubkonnect API Error:", err.message);
        if (err.response) {
            console.error("HTTP Response data:", err.response.data);
        }
        process.exit(1);
    }
}

checkClubkonnect();
