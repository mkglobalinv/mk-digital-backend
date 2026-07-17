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

// ========================
// ELECTRICITY BILL PAYMENT
// ========================
export const buyElectricity = async (discoId, meterType, meterNumber, amount, phone) => {
    const requestId = generateRequestId();
    try {
        const response = await axios.get("https://www.nellobytesystems.com/APIElectricityV1.asp", {
            params: {
                UserID: process.env.CLUBKONNECT_USER_ID,
                APIKey: process.env.CLUBKONNECT_API_KEY,
                ElectricCompany: discoId,
                MeterType: meterType, // 01 Prepaid, 02 Postpaid
                MeterNo: meterNumber,
                Amount: amount,
                PhoneNo: phone,
                RequestID: requestId
            }
        });

        const statusStr = String(response.data?.statuscode || response.data?.status);
        if (response.data && (statusStr === "100" || statusStr === "200" || statusStr === "ORDER_RECEIVED")) {
            return {
                status: "success",
                data: response.data,
                reference: requestId,
                token: response.data.metertoken || null
            };
        } else {
            return {
                status: "failed",
                message: response.data?.status_desc || "Transaction failed",
                data: response.data
            };
        }
    } catch (error) {
        console.error("Electricity API Error:", error.response?.data || error.message);
        throw new Error("Failed to connect to Electricity provider");
    }
};

// ========================
// RECHARGE CARD (EPIN)
// ========================
export const buyEPIN = async (network, value, quantity) => {
    const networkMap = { 'MTN': '01', 'GLO': '02', '9MOBILE': '03', 'AIRTEL': '04' };
    const networkCode = networkMap[network.toUpperCase()];
    if (!networkCode) throw new Error("Unsupported network provider");

    const requestId = generateRequestId();
    try {
        const response = await axios.get("https://www.nellobytesystems.com/APIEPINV1.asp", {
            params: {
                UserID: process.env.CLUBKONNECT_USER_ID,
                APIKey: process.env.CLUBKONNECT_API_KEY,
                MobileNetwork: networkCode,
                Value: value,
                Quantity: quantity,
                RequestID: requestId
            }
        });

        const statusStr = String(response.data?.statuscode || response.data?.status);
        if (response.data && (statusStr === "200" || response.data.TXN_EPIN)) {
            return {
                status: "success",
                data: response.data,
                reference: requestId,
                token: JSON.stringify(response.data.TXN_EPIN) // Store the PINs array as a string
            };
        } else {
            return {
                status: "failed",
                message: response.data?.status_desc || "Transaction failed",
                data: response.data
            };
        }
    } catch (error) {
        console.error("EPIN API Error:", error.response?.data || error.message);
        throw new Error("Failed to generate recharge PINs");
    }
};

// ========================
// EDUCATION PIN (WAEC/JAMB)
// ========================
export const buyEducation = async (examType, phone) => {
    const requestId = generateRequestId();
    
    // NelloByte uses different endpoints for JAMB vs WAEC
    const isJamb = examType.toLowerCase().includes("jamb") || examType.toLowerCase() === "de" || examType.toLowerCase().startsWith("utme");
    const endpoint = isJamb 
        ? "https://www.nellobytesystems.com/APIJAMBV1.asp" 
        : "https://www.nellobytesystems.com/APIWAECV1.asp";

    try {
        const response = await axios.get(endpoint, {
            params: {
                UserID: process.env.CLUBKONNECT_USER_ID,
                APIKey: process.env.CLUBKONNECT_API_KEY,
                ExamType: examType,
                PhoneNo: phone,
                RequestID: requestId
            }
        });

        const statusStr = String(response.data?.statuscode || response.data?.status);
        if (response.data && (statusStr === "200" || statusStr === "ORDER_COMPLETED" || statusStr === "ORDER_RECEIVED")) {
            return {
                status: "success",
                data: response.data,
                reference: requestId,
                token: response.data.carddetails || null
            };
        } else {
            return {
                status: "failed",
                message: response.data?.status_desc || "Transaction failed",
                data: response.data
            };
        }
    } catch (error) {
        console.error("Education API Error:", error.response?.data || error.message);
        throw new Error("Failed to purchase Education PIN");
    }
};

// ========================
// DATA BUNDLE
// ========================
export const buyData = async (network, dataPlan, phone) => {
    const networkMap = { 'MTN': '01', 'GLO': '02', '9MOBILE': '03', 'AIRTEL': '04' };
    const networkCode = networkMap[network.toUpperCase()];
    if (!networkCode) throw new Error("Unsupported network provider");

    const requestId = generateRequestId();
    try {
        const response = await axios.get("https://www.clubkonnect.com/api/data", {
            params: {
                UserID: process.env.CLUBKONNECT_USER_ID,
                APIKey: process.env.CLUBKONNECT_API_KEY,
                MobileNetwork: networkCode,
                DataPlan: dataPlan,
                MobileNumber: phone,
                RequestID: requestId
            }
        });

        const statusStr = String(response.data?.statuscode || response.data?.status);
        if (response.data && (statusStr === "200" || statusStr === "ORDER_RECEIVED")) {
            return {
                status: "success",
                data: response.data,
                reference: requestId
            };
        } else {
            return { status: "failed", message: response.data?.status_desc || "Transaction failed", data: response.data };
        }
    } catch (error) {
        throw new Error("Failed to purchase Data bundle");
    }
};

// ========================
// CABLE TV SUBSCRIPTION
// ========================
export const buyCableTV = async (cableId, packageId, smartcard, phone) => {
    const requestId = generateRequestId();
    try {
        // NelloByte standard Cable API endpoint pattern
        const response = await axios.get("https://www.nellobytesystems.com/APICableTVV1.asp", {
            params: {
                UserID: process.env.CLUBKONNECT_USER_ID,
                APIKey: process.env.CLUBKONNECT_API_KEY,
                CableCompany: cableId,
                Package: packageId,
                SmartCardNo: smartcard,
                PhoneNo: phone,
                RequestID: requestId
            }
        });

        const statusStr = String(response.data?.statuscode || response.data?.status);
        if (response.data && (statusStr === "200" || statusStr === "ORDER_RECEIVED")) {
            return {
                status: "success",
                data: response.data,
                reference: requestId
            };
        } else {
            return { status: "failed", message: response.data?.status_desc || "Transaction failed", data: response.data };
        }
    } catch (error) {
        throw new Error("Failed to process Cable TV subscription");
    }
};
