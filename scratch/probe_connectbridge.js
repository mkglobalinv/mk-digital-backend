import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function probeConnectBridge() {
    const key = process.env.CONNECTBRIDGE_API_KEY;
    const url = "https://connectbridge.com.ng/api/user";

    console.log("--- ConnectBridge Auth Probe ---");
    
    const variations = [
        { name: "Raw Key", headers: { "Authorization": key } },
        { name: "Token Prefix", headers: { "Authorization": `Token ${key}` } },
        { name: "Bearer Prefix", headers: { "Authorization": `Bearer ${key}` } },
        { name: "Api-Key Custom Header", headers: { "Api-Key": key } },
        { name: "Basic Auth (Base64)", headers: { "Authorization": `Basic ${Buffer.from(key).toString('base64')}` } }
    ];

    for (const v of variations) {
        console.log(`\nTesting: ${v.name}`);
        try {
            const res = await axios.get(url, { headers: { ...v.headers, "Content-Type": "application/json" } });
            console.log("SUCCESS!", res.data);
            break; 
        } catch (e) {
            console.log("Failed:", e.response?.data || e.message);
        }
    }
}

probeConnectBridge();
