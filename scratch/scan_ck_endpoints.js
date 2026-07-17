import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function run() {
    const UserID = process.env.CLUBKONNECT_USERID;
    const APIKey = process.env.CLUBKONNECT_API_KEY;
    if (!UserID || !APIKey) {
        console.log("Credentials missing.");
        return;
    }

    const paths = [
        "APIBalanceV1.asp",
        "APIBalance.asp",
        "APIBalanceV2.asp",
        "APIBalanceV1.php",
        "APIBalance.php",
        "APIBalanceV1.aspx",
        "APIBalance.aspx"
    ];

    for (const path of paths) {
        const url = `https://www.nellobytesystems.com/${path}?UserID=${UserID}&APIKey=${APIKey}`;
        try {
            console.log(`Testing: ${url}`);
            const res = await axios.get(url, { timeout: 8000 });
            console.log(`SUCCESS for ${path}! Status: ${res.status}. Data:`, typeof res.data === 'object' ? JSON.stringify(res.data) : res.data);
            return;
        } catch (e) {
            console.log(`FAILED for ${path}: ${e.response?.status || e.message}`);
        }
    }
}

run();
