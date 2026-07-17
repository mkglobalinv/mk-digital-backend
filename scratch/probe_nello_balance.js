import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function run() {
    const CLUB_USERID = process.env.CLUBKONNECT_USERID;
    const CLUB_APIKEY = process.env.CLUBKONNECT_API_KEY;
    if (CLUB_USERID && CLUB_APIKEY) {
        try {
            console.log("Probing Clubkonnect with APICheckBalance.asp...");
            const res = await axios.get("https://www.nellobytesystems.com/APICheckBalance.asp", {
                params: { UserID: CLUB_USERID, APIKey: CLUB_APIKEY },
                timeout: 10000
            });
            console.log("Clubkonnect HTTP Status:", res.status);
            console.log("Clubkonnect Raw Data:", typeof res.data === 'object' ? JSON.stringify(res.data) : res.data);
        } catch (e) {
            console.error("Clubkonnect failed:", e.response?.data || e.message);
        }
    } else {
        console.log("Credentials missing");
    }
}

run();
