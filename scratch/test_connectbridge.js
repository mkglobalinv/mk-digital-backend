import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function testConnectBridge() {
    const key = process.env.CONNECTBRIDGE_API_KEY;
    const url = process.env.CONNECTBRIDGE_BASE_URL;

    console.log("--- ConnectBridge Integration Test ---");
    console.log("URL:", url);
    console.log("Key:", key ? "PRESENT" : "MISSING");

    if (!key || !url) {
        console.error("Missing ConnectBridge config in .env");
        return;
    }

    const axiosInstance = axios.create({
        baseURL: url,
        headers: {
            "Authorization": `Token ${key}`,
            "Content-Type": "application/json"
        }
    });

    // 1. Test Get Balance
    console.log("\n1. Testing GET /user (Balance)...");
    try {
        const res = await axiosInstance.get("/user");
        console.log("Balance Response:", res.data);
    } catch (e) {
        console.error("Balance Error:", e.response?.data || e.message);
    }

    // 2. Test Data Purchase
    console.log("\n2. Testing POST /data (with Bearer)...");
    try {
        const dataAxios = axios.create({
            baseURL: url,
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json"
            }
        });
        const payload = {
            plan_id: 1818,
            phone: "08133131020",
            Ported_number: true
        };
        console.log("Payload:", payload);
        const res = await dataAxios.post("/data", payload);
        console.log("Data Response:", res.data);
    } catch (e) {
        console.error("Data Error:", e.response?.data || e.message);
    }
}

testConnectBridge();
