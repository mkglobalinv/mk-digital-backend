import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function checkClubkonnectBalance() {
    const UserID = process.env.CLUBKONNECT_USERID;
    const APIKey = process.env.CLUBKONNECT_API_KEY;
    const url = `https://www.nellobytesystems.com/APIBalanceV1.asp?UserID=${UserID}&APIKey=${APIKey}`;

    try {
        const res = await axios.get(url);
        console.log("Clubkonnect Balance Result:", res.data);
    } catch (e) {
        console.log("Error:", e.message);
    }
}
checkClubkonnectBalance();
