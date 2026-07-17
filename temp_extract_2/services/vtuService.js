import axios from "axios";

// ClubKonnect API Base URL 
const CLUBKONNECT_API_URL = "https://www.clubkonnect.com/api/airtime";

// Helper to generate unique request ID
const generateRequestId = () => {
    return 'ck_' + Date.now() + Math.floor(Math.random() * 10000);
};

export const buyAirtime = async (network, amount, phone) => {
    // Determine the network code for ClubKonnect
    // 01=MTN, 02=GLO, 03=9Mobile, 04=Airtel
    const networkMap = {
        'MTN': '01',
        'GLO': '02',
        '9MOBILE': '03',
        'AIRTEL': '04'
    };

    const networkCode = networkMap[network.toUpperCase()];
    if (!networkCode) throw new Error("Unsupported network provider");

    const requestId = generateRequestId();

    try {
        const response = await axios.get(CLUBKONNECT_API_URL, {
            params: {
                UserID: process.env.CLUBKONNECT_USER_ID,
                APIKey: process.env.CLUBKONNECT_API_KEY,
                MobileNetwork: networkCode,
                Amount: amount,
                MobileNumber: phone,
                RequestID: requestId
            }
        });

        // ClubKonnect API typically returns a 200 character status code
        if (response.data && (response.data.status === "200" || response.data.statuscode === "200")) {
            return {
                status: "success",
                data: response.data,
                reference: requestId
            };
        } else {
            return {
                status: "failed",
                message: response.data.status_desc || "Transaction failed",
                data: response.data
            };
        }
    } catch (error) {
        console.error("ClubKonnect API Error:", error.response?.data || error.message);
        throw new Error("Failed to connect to VTU provider");
    }
};
