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

    const domains = [
        "https://www.nellobytesystems.com",
        "https://www.clubkonnect.com"
    ];

    const paths = [
        "APIBalanceV1.asp",
        "APICheckBalance.asp",
        "APIBalance.asp",
        "APIShareBalanceV1.asp",
        "APIWalletBalanceV1.asp"
    ];

    for (const domain of domains) {
        for (const path of paths) {
            const url = `${domain}/${path}?UserID=${UserID}&APIKey=${APIKey}`;
            try {
                console.log(`Testing: ${url}`);
                const res = await axios.get(url, { timeout: 8000 });
                console.log(`SUCCESS! Status: ${res.status}. Data:`, typeof res.data === 'object' ? JSON.stringify(res.data) : res.data);
                return;
            } catch (e) {
                console.log(`FAILED for ${domain}/${path}: ${e.response?.status || e.message}`);
            }
        }
    }
}

run();
