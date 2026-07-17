import axios from "axios";

async function probe() {
    const url = "https://www.nellobytesystems.com/APIDatabundlePlansV1.asp";
    try {
        console.log(`Probing ${url}...`);
        const res = await axios.get(url);
        console.log(`   Success: ${res.status}`);
        console.log(`   Data: ${JSON.stringify(res.data).substring(0, 200)}`);
    } catch (e) {
        console.log(`   Failed: ${e.response?.status || e.message}`);
    }
}

probe();
