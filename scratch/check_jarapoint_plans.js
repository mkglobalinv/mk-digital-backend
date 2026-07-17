import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const getBaseUrl = () => process.env.JARAPOINT_API_URL || "https://jarapoint.com/api/";
const getApiKey = () => process.env.JARAPOINT_API_KEY || "vtu-69eb579e0620c";

const test = async () => {
    const apiKey = getApiKey();
    const baseUrl = getBaseUrl();
    const url = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/data`;
    console.log("Fetching JaraPoint plans via POST to: " + url);
    try {
        const response = await axios.post(url, {
            network: "MTN",
            type: "sme",
            plan: "1",
            recipient: "08133131020",
            provider: "mtn"
        }, {
            headers: { 
                'Authorization': `Token ${apiKey}`, 
                'Content-Type': 'application/json',
                'Accept': 'application/json' 
            }
        });
        console.log("POST Result:", JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error("FAILED:", e.response?.data || e.message);
    }
};

test();
