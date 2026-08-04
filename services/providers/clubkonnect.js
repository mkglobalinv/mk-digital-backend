import axios from "axios";

const BASE_URL = "https://www.nellobytesystems.com";


/**
 * Robust HTTP GET Wrapper with Retries and JSON Validation for ClubKonnect
 */
const getWithRetry = async (endpoint, params, maxRetries = 2) => {
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            console.log(`\n======================================================`);
            console.log(`[BACKEND -> CLUBKONNECT] OUTBOUND REQUEST LOGGING`);
            console.log(`Endpoint: ${endpoint} (Attempt ${attempt + 1})`);
            console.log(`Params:`, JSON.stringify(params, null, 2));
            console.log(`======================================================\n`);

            const response = await axios.get(endpoint, { params, timeout: 30000 });
            
            console.log(`\n======================================================`);
            console.log(`[CLUBKONNECT -> BACKEND] INBOUND RESPONSE SUCCESS`);
            console.log(`Status: ${response.status}`);
            console.log(`Body:`, JSON.stringify(response.data, null, 2));
            console.log(`======================================================\n`);
            
            return { success: true, status: response.status, data: response.data, response };
        } catch (error) {
            const isTimeout = error.code === 'ECONNABORTED';
            const status = error.response ? error.response.status : null;
            const errorData = error.response ? error.response.data : null;
            
            console.log(`\n======================================================`);
            console.log(`[CLUBKONNECT -> BACKEND] INBOUND RESPONSE ERROR`);
            console.log(`Status: ${status}`);
            console.log(`Body:`, JSON.stringify(errorData, null, 2));
            console.log(`======================================================\n`);

            console.error(`[ClubKonnect] Error on ${endpoint}:`, error.message, status || '');

            // Retry on Timeout or 5xx server errors
            if (attempt < maxRetries && (isTimeout || (status >= 500 && status < 600))) {
                console.log(`[ClubKonnect] Retrying in 2 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempt++;
                continue;
            }
            
            // Treat 4xx as definitive failure, others as unknown
            let finalStatus = "failed";
            if (isTimeout || (status >= 500 && status < 600) || !status) {
                finalStatus = "unknown";
            }

            return {
                success: false,
                status: finalStatus,
                message: (errorData && errorData.remark) || error.message,
                data: errorData,
                httpStatus: status,
                response: error.response
            };
        }
    }
};

const generateRequestId = () => {
    return 'CK' + Date.now() + Math.floor(Math.random() * 10000);
};

const getNetworkCode = (network) => {
    const networkMap = { 
        'MTN': '01', 
        'GLO': '02', 
        '9MOBILE': '03', 
        'AIRTEL': '04' 
    };
    return networkMap[network.toUpperCase()];
};

/**
 * Fetch Data Plans from ClubKonnect
 */
export const fetchDataPlansFromClubkonnect = async (network) => {
    const UserID = process.env.CLUBKONNECT_USERID;
    const APIKey = process.env.CLUBKONNECT_API_KEY;

    console.log(`[ClubKonnect] FETCH PLANS | Endpoint: ${BASE_URL}/APIDatabundlePlansV1.asp | Network: ${network}`);

    try {
        const response = await axios.get(`${BASE_URL}/APIDatabundlePlansV1.asp`, {
            params: { userid: UserID, apikey: APIKey },
            timeout: 20000
        });

        const data = response.data;
        const networkMap = {
            'MTN': 'MTN',
            'GLO': 'Glo',
            '9MOBILE': 'm_9mobile',
            'AIRTEL': 'Airtel'
        };
        const netKey = networkMap[network.toUpperCase()];
        
        if (data && data.MOBILE_NETWORK && data.MOBILE_NETWORK[netKey]) {
            const plans = data.MOBILE_NETWORK[netKey].flatMap(item => {
                return item.PRODUCT.map(p => ({
                    plan_id: p.PRODUCT_ID,
                    plan_code: p.PRODUCT_ID,
                    network: network.toUpperCase(),
                    name: p.PRODUCT_NAME,
                    label: p.PRODUCT_NAME,
                    price: parseFloat(p.PRODUCT_AMOUNT),
                    provider: "clubkonnect"
                }));
            });
            return { success: true, plans };
        }

        return { success: false, message: `No data plans found for ${network} in response` };
    } catch (error) {
        console.error(`[ClubKonnect] FETCH PLANS ERROR:`, error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Buy Airtime with Clubkonnect
 */
export const buyAirtimeWithClubkonnect = async (network, amount, phone) => {
    const UserID = process.env.CLUBKONNECT_USERID;
    const APIKey = process.env.CLUBKONNECT_API_KEY;
    const MobileNetwork = getNetworkCode(network);
    const RequestID = generateRequestId();

    if (!MobileNetwork) return { success: false, status: "failed", message: "Unsupported network provider" };

    const params = {
        UserID,
        APIKey,
        MobileNetwork,
        Amount: amount,
        MobileNumber: phone,
        RequestID
    };

    const endpoint = `${BASE_URL}/APIAirtimeV1.asp`;
    console.log(`[ClubKonnect] AIRTIME REQ | Endpoint: ${endpoint} | Payload:`, JSON.stringify(params));

    try {
        const result = await getWithRetry(endpoint, params);
        if (!result.success && result.status !== "failed" && result.status !== "unknown") throw new Error(result.message);
        
        if (!result.success && result.status === "unknown") {
            return {
                success: false,
                status: "unknown",
                reference: RequestID,
                message: result.message || "Provider communication error. Pending reconciliation.",
                provider_used: 'clubkonnect'
            };
        }
        const response = result.response;
        const data = result.data;
        console.log(`[ClubKonnect] AIRTIME RES | HTTP: ${response.status} | Raw:`, JSON.stringify(data));

        const statusStr = String(data?.status || "").toUpperCase();
        const statusCode = String(data?.statuscode || "");

        if (statusStr === "SUCCESS" || statusStr === "SUCCESSFUL" || statusStr === "ORDER_COMPLETED" || statusStr === "COMPLETED") {
            return { 
                success: true, 
                status: "success",
                reference: data.orderid || RequestID, 
                data: data,
                provider_used: 'clubkonnect'
            };
        }

        if (statusCode === "100" || statusStr === "ORDER_RECEIVED" || statusStr === "ORDER_PROCESSING" || !statusStr) {
            return {
                success: false,
                status: "unknown",
                reference: data.orderid || RequestID,
                message: data?.remark || data?.status_desc || "Transaction is being processed",
                data: data,
                provider_used: 'clubkonnect'
            };
        }

        return { 
            success: false, 
            status: "failed",
            message: data?.remark || data?.status_desc || "Transaction failed", 
            data: data 
        };
    } catch (error) {
        console.error(`[ClubKonnect] AIRTIME CRITICAL ERROR:`, error.message);
        
        // If we have a response from the server, log it fully
        if (error.response) {
            console.error(`[ClubKonnect] AIRTIME RAW HTTP ERROR:`, JSON.stringify(error.response.data));
            return { 
                success: false, 
                status: "unknown", // Changed from failed to unknown to prevent false auto-refunds
                reference: RequestID,
                message: `ClubKonnect Error (${error.response.status}): ${JSON.stringify(error.response.data)}`,
                provider_used: 'clubkonnect'
            };
        }

        // Network error or timeout -> unknown status for requery
        return { 
            success: false, 
            status: "unknown",
            reference: RequestID,
            message: `Connection Error: ${error.message}`,
            provider_used: 'clubkonnect'
        };
    }
};

/**
 * Buy Data with Clubkonnect
 */
export const buyDataWithClubkonnect = async (network, planId, phone) => {
    const UserID = process.env.CLUBKONNECT_USERID;
    const APIKey = process.env.CLUBKONNECT_API_KEY;
    const MobileNetwork = getNetworkCode(network);
    const RequestID = generateRequestId();
    const CallBackURL = process.env.CALLBACK_URL || "";

    if (!MobileNetwork) return { success: false, status: "failed", message: "Unsupported network provider" };

    // Strip network prefix if it exists (e.g., 'GLO_100.01' -> '100.01')
    const rawPlanId = planId.includes('_') ? planId.split('_')[1] : planId;

    const params = {
        UserID,
        APIKey,
        MobileNetwork,
        DataPlan: rawPlanId,
        MobileNumber: phone,
        RequestID,
        CallBackURL
    };

    // UPDATED ENDPOINT: APIDatabundleV1.asp as per documentation
    const endpoint = `${BASE_URL}/APIDatabundleV1.asp`;
    console.log(`[ClubKonnect] DATA REQ | Endpoint: ${endpoint} | Payload:`, JSON.stringify(params));

    try {
        const result = await getWithRetry(endpoint, params);
        if (!result.success && result.status !== "failed" && result.status !== "unknown") throw new Error(result.message);
        
        if (!result.success && result.status === "unknown") {
            return {
                success: false,
                status: "unknown",
                reference: RequestID,
                message: result.message || "Provider communication error. Pending reconciliation.",
                provider_used: 'clubkonnect'
            };
        }
        const response = result.response;
        const data = result.data;
        console.log(`[ClubKonnect] DATA RES | HTTP: ${response.status} | Raw:`, JSON.stringify(data));

        const statusStr = String(data?.status || "").toUpperCase();
        const statusCode = String(data?.statuscode || "");

        if (statusStr === "SUCCESS" || statusStr === "SUCCESSFUL" || statusStr === "ORDER_COMPLETED" || statusStr === "COMPLETED") {
            return { 
                success: true, 
                status: "success",
                reference: data.orderid || RequestID, 
                data: data,
                provider_used: 'clubkonnect'
            };
        }

        if (statusCode === "100" || statusStr === "ORDER_RECEIVED" || statusStr === "ORDER_PROCESSING" || !statusStr) {
            return {
                success: false,
                status: "unknown",
                reference: data.orderid || RequestID,
                message: data?.remark || data?.status_desc || "Transaction is being processed",
                data: data,
                provider_used: 'clubkonnect'
            };
        }

        return { 
            success: false, 
            status: "failed",
            message: data?.remark || data?.status_desc || "Transaction failed", 
            data: data 
        };
    } catch (error) {
        console.error(`[ClubKonnect] DATA CRITICAL ERROR:`, error.message);
        
        if (error.response) {
            console.error(`[ClubKonnect] DATA RAW HTTP ERROR:`, JSON.stringify(error.response.data));
            return { 
                success: false, 
                status: "unknown", // Changed from failed to unknown to prevent false auto-refunds
                reference: RequestID,
                message: `ClubKonnect Error (${error.response.status}): ${JSON.stringify(error.response.data)}`,
                provider_used: 'clubkonnect'
            };
        }

        return { 
            success: false, 
            status: "unknown",
            reference: RequestID,
            message: `Connection Error: ${error.message}`,
            provider_used: 'clubkonnect'
        };
    }
};

/**
 * Requery ClubKonnect Transaction (by OrderID or RequestID)
 */
export const requeryClubkonnect = async (reference) => {
    const UserID = process.env.CLUBKONNECT_USERID;
    const APIKey = process.env.CLUBKONNECT_API_KEY;

    const endpoint = `${BASE_URL}/APIQueryV1.asp`;
    
    // Check if reference looks like a RequestID (CK...) or an OrderID (numeric)
    const params = { UserID, APIKey };
    if (String(reference).startsWith('CK')) {
        params.RequestID = reference;
    } else {
        params.OrderID = reference;
    }

    console.log(`[ClubKonnect] REQUERY REQ | Endpoint: ${endpoint} | Params:`, JSON.stringify(params));

    try {
        const response = await axios.get(endpoint, { params, timeout: 15000 });
        const data = response.data;
        console.log(`[ClubKonnect] REQUERY RES | HTTP: ${response.status} | Raw:`, JSON.stringify(data));

        const statusStr = String(data?.status || "").toUpperCase();
        const statusCode = String(data?.statuscode || "");

        if (statusStr === "SUCCESS" || statusStr === "SUCCESSFUL" || statusStr === "ORDER_COMPLETED" || statusStr === "COMPLETED") {
            return { status: "success", data };
        } else if (statusCode === "100" || statusStr === "ORDER_RECEIVED" || statusStr === "ORDER_PROCESSING" || statusStr === "PENDING") {
            return { status: "pending", data };
        } else if (statusStr === "MISSING_ORDERID" || statusCode === "400") {
            if (String(reference).startsWith('CK')) {
                // If we queried with RequestID, we can't definitively say it failed.
                return { status: "pending", data };
            }
            return { status: "failed", message: data?.remark || data?.status_desc || "Transaction failed", data };
        } else {
            return { status: "failed", message: data?.remark || data?.status_desc || "Transaction failed", data };
        }
    } catch (error) {
        console.error(`[ClubKonnect] REQUERY ERROR:`, error.message);
        if (error.response) {
            console.error(`[ClubKonnect] REQUERY RAW HTTP ERROR:`, JSON.stringify(error.response.data));
        }
        return { status: "unknown", message: error.message };
    }
};

/**
 * Cancel ClubKonnect Transaction
 */
export const cancelClubkonnectTransaction = async (orderId) => {
    const UserID = process.env.CLUBKONNECT_USERID;
    const APIKey = process.env.CLUBKONNECT_API_KEY;

    const endpoint = `${BASE_URL}/APICancelV1.asp`;
    console.log(`[ClubKonnect] CANCEL REQ | Endpoint: ${endpoint} | OrderID: ${orderId}`);

    try {
        const response = await axios.get(endpoint, {
            params: { UserID, APIKey, OrderID: orderId },
            timeout: 10000
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error(`[ClubKonnect] CANCEL ERROR:`, error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Buy Electricity with Clubkonnect
 */
export const buyElectricityWithClubkonnect = async (discoId, meterType, meterNumber, amount, phone) => {
    const UserID = process.env.CLUBKONNECT_USERID;
    const APIKey = process.env.CLUBKONNECT_API_KEY;
    const RequestID = generateRequestId();

    const params = {
        UserID, APIKey,
        ElectricCompany: discoId,
        MeterType: meterType,
        MeterNo: meterNumber,
        Amount: amount,
        PhoneNo: phone,
        RequestID
    };

    const endpoint = `${BASE_URL}/APIElectricityV1.asp`;
    console.log(`[ClubKonnect] ELECTRICITY REQ | Endpoint: ${endpoint} | Payload:`, JSON.stringify(params));

    try {
        const result = await getWithRetry(endpoint, params);
        if (!result.success && result.status !== "failed" && result.status !== "unknown") throw new Error(result.message);
        
        if (!result.success && result.status === "unknown") {
            return { status: "unknown", message: result.message || "Provider communication error.", reference: RequestID, provider_used: 'clubkonnect' };
        }
        
        const response = result.response;
        const data = result.data;
        console.log(`[ClubKonnect] ELECTRICITY RES | HTTP: ${response.status} | Raw:`, JSON.stringify(data));

        const statusStr = String(data?.status || "").toUpperCase();
        
        if (statusStr === "SUCCESS" || statusStr === "SUCCESSFUL" || statusStr === "ORDER_COMPLETED" || statusStr === "COMPLETED") {
            return {
                status: "success",
                data: data,
                reference: data.orderid || RequestID,
                token: data.metertoken || data.token || null
            };
        }
        
        if (!statusStr || String(data?.statuscode) === "100" || statusStr === "ORDER_RECEIVED" || statusStr === "ORDER_PROCESSING") {
            return { status: "unknown", message: data?.remark || data?.status_desc || "Transaction processing or unknown state", reference: RequestID, provider_used: 'clubkonnect' };
        }
        
        return { status: "failed", message: data?.remark || data?.status_desc || "Transaction failed", data };
    } catch (error) {
        console.error(`[ClubKonnect] ELECTRICITY ERROR:`, error.message);
        return { status: "unknown", message: error.message, reference: RequestID };
    }
};

/**
 * Buy CableTV with Clubkonnect
 */
export const buyCableTVWithClubkonnect = async (cableId, packageId, smartcard, phone) => {
    const UserID = process.env.CLUBKONNECT_USERID;
    const APIKey = process.env.CLUBKONNECT_API_KEY;
    const RequestID = generateRequestId();

    const params = {
        UserID, APIKey,
        CableCompany: cableId,
        Package: packageId,
        SmartCardNo: smartcard,
        PhoneNo: phone,
        RequestID
    };

    const endpoint = `${BASE_URL}/APICableTVV1.asp`;
    console.log(`[ClubKonnect] CABLE REQ | Endpoint: ${endpoint} | Payload:`, JSON.stringify(params));

    try {
        const result = await getWithRetry(endpoint, params);
        if (!result.success && result.status !== "failed" && result.status !== "unknown") throw new Error(result.message);
        
        if (!result.success && result.status === "unknown") {
            return { status: "unknown", message: result.message || "Provider communication error.", reference: RequestID, provider_used: 'clubkonnect' };
        }
        
        const response = result.response;
        const data = result.data;
        console.log(`[ClubKonnect] CABLE RES | HTTP: ${response.status} | Raw:`, JSON.stringify(data));

        const statusStr = String(data?.status || "").toUpperCase();
        if (statusStr === "SUCCESS" || statusStr === "SUCCESSFUL" || statusStr === "ORDER_COMPLETED" || statusStr === "COMPLETED") {
            return { status: "success", data, reference: data.orderid || RequestID };
        }
        
        if (!statusStr || String(data?.statuscode) === "100" || statusStr === "ORDER_RECEIVED" || statusStr === "ORDER_PROCESSING") {
            return { status: "unknown", message: data?.remark || data?.status_desc || "Transaction processing or unknown state", reference: RequestID, provider_used: 'clubkonnect' };
        }
        
        return { status: "failed", message: data?.remark || data?.status_desc || "Transaction failed", data };
    } catch (error) {
        console.error(`[ClubKonnect] CABLE ERROR:`, error.message);
        return { status: "unknown", message: error.message, reference: RequestID };
    }
};

/**
 * Buy EPIN with Clubkonnect
 */
export const buyEPINWithClubkonnect = async (networkCode, value, quantity) => {
    const UserID = process.env.CLUBKONNECT_USERID;
    const APIKey = process.env.CLUBKONNECT_API_KEY;
    const RequestID = generateRequestId();

    const params = {
        UserID, APIKey,
        MobileNetwork: networkCode,
        Value: value,
        Quantity: quantity,
        RequestID
    };

    const endpoint = `${BASE_URL}/APIEPINV1.asp`;
    console.log(`[ClubKonnect] EPIN REQ | Endpoint: ${endpoint} | Payload:`, JSON.stringify(params));

    try {
        const result = await getWithRetry(endpoint, params);
        if (!result.success && result.status !== "failed" && result.status !== "unknown") throw new Error(result.message);
        
        if (!result.success && result.status === "unknown") {
            return { status: "unknown", message: result.message || "Provider communication error.", reference: RequestID, provider_used: 'clubkonnect' };
        }
        
        const response = result.response;
        const data = result.data;
        console.log(`[ClubKonnect] EPIN RES | HTTP: ${response.status} | Raw:`, JSON.stringify(data));

        const statusStr = String(data?.status || "").toUpperCase();
        if (statusStr === "SUCCESS" || data.TXN_EPIN) {
            return {
                status: "success",
                data: data,
                reference: data.orderid || RequestID,
                token: JSON.stringify(data.TXN_EPIN || data.pins)
            };
        }
        
        if (!statusStr || String(data?.statuscode) === "100" || statusStr === "ORDER_RECEIVED" || statusStr === "ORDER_PROCESSING") {
            return { status: "unknown", message: data?.remark || data?.status_desc || "Transaction processing or unknown state", reference: RequestID, provider_used: 'clubkonnect' };
        }
        
        return { status: "failed", message: data?.remark || data?.status_desc || "Transaction failed", data };
    } catch (error) {
        console.error(`[ClubKonnect] EPIN ERROR:`, error.message);
        return { status: "unknown", message: error.message, reference: RequestID };
    }
};

/**
 * Buy Education with Clubkonnect
 */
export const buyEducationWithClubkonnect = async (examType, phone) => {
    const UserID = process.env.CLUBKONNECT_USERID;
    const APIKey = process.env.CLUBKONNECT_API_KEY;
    const RequestID = generateRequestId();

    const isJamb = examType.toLowerCase().includes("jamb") || examType.toLowerCase() === "de" || examType.toLowerCase().startsWith("utme");
    const endpointPath = isJamb ? "/APIJAMBV1.asp" : "/APIWAECV1.asp";

    const examMap = {
        'waecdirect': '1',
        'waec-registration': '3',
        'jamb': '4',
        'de': '4',
        'utme': '4'
    };
    const finalExamType = examMap[examType.toLowerCase()] || examType;

    const params = {
        UserID, APIKey,
        ExamType: finalExamType,
        PhoneNo: phone,
        RequestID
    };

    const endpoint = `${BASE_URL}${endpointPath}`;
    console.log(`[ClubKonnect] EDUCATION REQ | Endpoint: ${endpoint} | Payload:`, JSON.stringify(params));

    try {
        const result = await getWithRetry(endpoint, params);
        if (!result.success && result.status !== "failed" && result.status !== "unknown") throw new Error(result.message);
        
        if (!result.success && result.status === "unknown") {
            return { status: "unknown", message: result.message || "Provider communication error.", reference: RequestID, provider_used: 'clubkonnect' };
        }
        
        const response = result.response;
        const data = result.data;
        console.log(`[ClubKonnect] EDUCATION RES | HTTP: ${response.status} | Raw:`, JSON.stringify(data));

        const statusStr = String(data?.status || "").toUpperCase();
        if (statusStr === "SUCCESS" || statusStr === "SUCCESSFUL" || statusStr === "ORDER_COMPLETED" || statusStr === "COMPLETED") {
            return {
                status: "success",
                data: data,
                reference: data.orderid || RequestID,
                token: data.carddetails || data.pin || null
            };
        }
        
        if (!statusStr || String(data?.statuscode) === "100" || statusStr === "ORDER_RECEIVED" || statusStr === "ORDER_PROCESSING") {
            return { status: "unknown", message: data?.remark || data?.status_desc || "Transaction processing or unknown state", reference: RequestID, provider_used: 'clubkonnect' };
        }
        
        return { status: "failed", message: data?.remark || data?.status_desc || "Transaction failed", data };
    } catch (error) {
        console.error(`[ClubKonnect] EDUCATION ERROR:`, error.message);
        return { status: "unknown", message: error.message, reference: RequestID };
    }
};
