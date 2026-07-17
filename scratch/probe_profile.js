import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function run() {
    console.log("=== PROBING PROVIDER PROFILES ===");

    // 1. Peyflex
    const PEYFLEX_API_URL = (process.env.PEYFLEX_API_URL || "https://client.peyflex.com.ng").replace(/\/$/, "");
    const PEYFLEX_API_TOKEN = process.env.PEYFLEX_API_TOKEN || process.env.PEYFLEX_API_KEY;
    if (PEYFLEX_API_TOKEN) {
        try {
            console.log("\nProbing Peyflex Profile...");
            const res = await axios.get(`${PEYFLEX_API_URL}/api/user/profile/`, {
                headers: { 'Authorization': `Token ${PEYFLEX_API_TOKEN}` },
                timeout: 10000
            });
            console.log("Peyflex Profile Keys:", Object.keys(res.data));
            console.log("Peyflex Profile Data:", JSON.stringify(res.data, null, 2));
        } catch (e) {
            console.error("Peyflex failed:", e.response?.data || e.message);
        }
    } else {
        console.log("Peyflex token missing in env.");
    }

    // 2. Clubkonnect
    const CLUB_USERID = process.env.CLUBKONNECT_USERID;
    const CLUB_APIKEY = process.env.CLUBKONNECT_API_KEY;
    if (CLUB_USERID && CLUB_APIKEY) {
        try {
            console.log("\nProbing Clubkonnect Balance...");
            const res = await axios.get("https://www.nellobytesystems.com/APIBalanceV1.asp", {
                params: { userid: CLUB_USERID, apikey: CLUB_APIKEY },
                timeout: 10000
            });
            console.log("Clubkonnect Balance Response Keys:", Object.keys(res.data));
            console.log("Clubkonnect Balance Data:", JSON.stringify(res.data, null, 2));
        } catch (e) {
            console.error("Clubkonnect failed:", e.response?.data || e.message);
        }
    } else {
        console.log("Clubkonnect credentials missing in env.");
    }
}

run();
