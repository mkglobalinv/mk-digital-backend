import axios from "axios";

async function probe() {
    const url = "https://www.nellobytesystems.com/APIDatabundlePlansV1.asp";
    try {
        const res = await axios.get(url);
        console.log("Keys in MOBILE_NETWORK:", Object.keys(res.data.MOBILE_NETWORK));
    } catch (e) {
        console.log("Failed:", e.message);
    }
}

probe();
