import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const WITTYPAY_BASE_URL = process.env.WITTYPAY_BASE_URL || "https://wittypay.co/api/merchant/v1";
const WITTYPAY_SECRET_KEY = process.env.WITTYPAY_SECRET_KEY;

function authHeaders() {
  return {
    Authorization: `Bearer ${WITTYPAY_SECRET_KEY}`,
    "Content-Type": "application/json"
  };
}

/**
 * Create a Wittypay temporary payment virtual account (via /payments endpoint).
 * Does NOT require BVN or NIN.
 */
export const createTemporaryVirtualAccount = async (userData) => {
  if (!WITTYPAY_SECRET_KEY) {
    return { status: "error", message: "Wittypay credentials are not configured (WITTYPAY_SECRET_KEY missing)" };
  }

  const brand = userData.brandName || userData.tenantBrand || userData.title || "9JASUB";
  const name = userData.fullName || [userData.firstname, userData.lastname].filter(Boolean).join(" ").trim() || userData.name || "Customer";
  const formattedCustomerName = buildWittypayTemporaryCustomerName(brand, name);
  const reference = userData.tx_ref || userData.reference || `TEMP-VA-${Date.now()}`;

  const body = {
    amount: userData.amount || 100,
    reference: reference,
    callback_url: userData.callback_url || "https://9jasub.com/api/virtual-account-webhook.php",
    customer_name: formattedCustomerName,
    customer_email: userData.email || "test@example.com",
    customer_phone: userData.phone || "08012345678",
    title: brand,
    description: userData.narration || "Customer wallet top-up"
  };

  try {
    const url = `${WITTYPAY_BASE_URL.replace(/\/$/, '')}/payments`;
    console.log(`[Wittypay] Sending temporary payment request to ${url} with customer_name: "${body.customer_name}" and reference: "${body.reference}"`);

    const response = await axios.post(
      url,
      body,
      { headers: authHeaders(), timeout: 15000 }
    );

    if (response.data?.status === "success") {
      const transferUrl = `https://wittypay.co/checkout/transfer.php?ref=${encodeURIComponent(reference)}`;
      console.log(`[Wittypay] Fetching temporary transfer account details from ${transferUrl}`);
      
      const transferRes = await axios.get(transferUrl, { timeout: 10000 });
      const transferData = transferRes.data?.data || {};

      if (transferData.account_number && transferData.bank_name) {
        console.log(`[Wittypay] Successfully issued temporary VA ${transferData.account_number} (${transferData.bank_name}) - ${transferData.account_name}`);
        return {
          status: "success",
          data: {
            account_number: transferData.account_number,
            bank_name: transferData.bank_name,
            account_name: transferData.account_name,
            order_ref: reference,
            expiry_date: new Date(Date.now() + 60 * 60 * 1000).toISOString().replace("T", " ").split(".")[0]
          },
          raw: transferRes.data
        };
      }
    }

    const reason = response.data?.message || "Failed to resolve temporary virtual account details";
    console.error("[Wittypay] Temporary account creation returned non-success response:", JSON.stringify(response.data));
    return { status: "error", message: reason, raw: response.data };

  } catch (error) {
    const errorDetail = error.response?.data || error.message;
    console.error("Wittypay Temporary Account Error:", JSON.stringify(errorDetail));
    return {
      status: "error",
      message: error.response?.data?.message || error.message,
      raw: error.response?.data
    };
  }
};

/**
 * Create a Wittypay virtual account.
 * Routes to /payments for temporary accounts (is_permanent === false) without BVN/NIN requirement,
 * or /virtual-accounts for permanent accounts (is_permanent === true) enforcing BVN/NIN KYC.
 */
export const createVirtualAccount = async (userData) => {
  if (!WITTYPAY_SECRET_KEY) {
    return { status: "error", message: "Wittypay credentials are not configured (WITTYPAY_SECRET_KEY missing)" };
  }

  // Branch to temporary payment flow if is_permanent === false
  if (userData.is_permanent === false) {
    return createTemporaryVirtualAccount(userData);
  }

  // Determine identity_type and license_number for permanent accounts
  let identityType = null;
  let licenseNumber = null;

  if (userData.bvn && String(userData.bvn).trim() !== "") {
    identityType = "BVN";
    licenseNumber = String(userData.bvn).trim();
  } else if (userData.nin && String(userData.nin).trim() !== "") {
    identityType = "NIN";
    licenseNumber = String(userData.nin).trim();
  } else {
    // Fail safely according to strict KYC rules - do not send undefined or empty license number
    console.warn("[Wittypay] Virtual account creation rejected: missing BVN/NIN");
    return {
      status: "error",
      message: "KYC required: BVN or NIN must be provided for Wittypay virtual account generation"
    };
  }

  // Account name formatted dynamically from accountService.js narration (e.g., "9JASUB - MUK" or "MIDATA - MUK")
  const accountName = userData.narration || [userData.firstname, userData.lastname].filter(Boolean).join(" ").trim() || userData.name || "Customer";
  
  // Legal/verified customer name
  const customerName = userData.fullName || [userData.firstname, userData.lastname].filter(Boolean).join(" ").trim() || userData.name || "Customer";

  const body = {
    account_name: accountName,
    identity_type: identityType,
    license_number: licenseNumber,
    customer_name: customerName,
    customer_email: userData.email,
    description: userData.description || "Customer wallet top-up",
    is_permanent: true
  };

  try {
    const url = `${WITTYPAY_BASE_URL.replace(/\/$/, '')}/virtual-accounts`;
    console.log(`[Wittypay] Sending permanent VA request to ${url} with account_name: "${accountName}"`);
    
    const response = await axios.post(
      url,
      body,
      { headers: authHeaders(), timeout: 15000 }
    );

    const resData = response.data;
    
    // Check if Wittypay response returned success
    if (resData?.status === "success" && resData?.data) {
      const acc = resData.data;
      console.log(`[Wittypay] Successfully created VA ${acc.account_number} (${acc.bank_name}) with account_name: "${acc.account_name}"`);
      return {
        status: "success",
        data: {
          account_number: acc.account_number,
          bank_name: acc.bank_name,
          account_name: acc.account_name,
          order_ref: acc.reference || String(acc.id),
          customer_id: acc.id,
          expiry_date: undefined
        },
        raw: resData
      };
    }

    const reason = resData?.message || "Wittypay did not return a valid virtual account";
    console.error("[Wittypay] VA Creation returned non-success response:", JSON.stringify(resData));
    return { status: "error", message: reason, raw: resData };

  } catch (error) {
    const errorDetail = error.response?.data || error.message;
    console.error("Wittypay VA Error:", JSON.stringify(errorDetail));
    return {
      status: "error",
      message: error.response?.data?.message || error.message,
      raw: error.response?.data
    };
  }
};


/**
 * Helper to construct the temporary account customer_name sent to Wittypay.
 * Format: {TENANT_CODE}-{CUSTOMER_CODE}
 * Wittypay automatically prepends "9JASUB-" and appends "(WITTYPAY)" to yield:
 * 9JASUB-{TENANT_CODE}-{CUSTOMER_CODE}(WITTYPAY)
 *
 * @param {string} tenantBrandName - e.g. "MIDATA", "ABC DIGITAL", "MK GLOBAL", "9JASUB"
 * @param {string} customerName - e.g. "MUKTAR UMAR IBRAHIM", "AHMAD BELLO USMAN"
 * @returns {string} - e.g. "MID-MUK", "ABC-AHM", "MKG-ALI"
 */
export const buildWittypayTemporaryCustomerName = (tenantBrandName, customerName) => {
  // 1. Clean and extract TENANT_CODE (first 3 alphanumeric chars of tenant brand)
  const rawBrand = String(tenantBrandName || "9JASUB").trim();
  const cleanBrand = rawBrand.replace(/[^a-zA-Z0-9]/g, "");
  const tenantCode = (cleanBrand.length > 0 ? cleanBrand.slice(0, 3) : "9JA").toUpperCase();

  // 2. Clean and extract CUSTOMER_CODE (first 3 alphanumeric chars of customer's FIRST name)
  const rawCustomer = String(customerName || "Customer").trim();
  const firstName = rawCustomer.split(/\s+/)[0] || "Customer";
  const cleanFirstName = firstName.replace(/[^a-zA-Z0-9]/g, "");
  const customerCode = (cleanFirstName.length > 0 ? cleanFirstName.slice(0, 3) : "CUS").toUpperCase();

  return `${tenantCode}-${customerCode}`;
};

/**
 * Controlled investigation & integration function for Wittypay /payments endpoint (temporary payment order).
 */
export const createTemporaryPayment = async (paymentData) => {
  if (!WITTYPAY_SECRET_KEY) {
    return { status: "error", message: "Wittypay credentials are not configured (WITTYPAY_SECRET_KEY missing)" };
  }

  let formattedCustomerName;
  if (paymentData.customer_name && /^[A-Z0-9]{1,3}-[A-Z0-9]{1,3}$/i.test(String(paymentData.customer_name).trim())) {
    formattedCustomerName = String(paymentData.customer_name).trim().toUpperCase();
  } else {
    const brand = paymentData.brandName || paymentData.tenantBrand || paymentData.title || "9JASUB";
    const name = paymentData.customer_name || paymentData.name || "Customer";
    formattedCustomerName = buildWittypayTemporaryCustomerName(brand, name);
  }

  const body = {
    amount: paymentData.amount || 100,
    reference: paymentData.reference || `WITTY-TEST-${Date.now()}`,
    callback_url: paymentData.callback_url || "https://9jasub.com/api/payment/wittypay/callback",
    customer_name: formattedCustomerName,
    customer_email: paymentData.customer_email || "test@example.com",
    customer_phone: paymentData.customer_phone || "08012345678",
    title: paymentData.title || paymentData.brandName || "9JASUB",
    description: paymentData.description || "Wittypay temporary payment",
    metadata: paymentData.metadata || {}
  };

  try {
    const url = `${WITTYPAY_BASE_URL.replace(/\/$/, '')}/payments`;
    console.log(`[Wittypay] Sending temporary payment request to ${url} with customer_name: "${body.customer_name}" and reference: "${body.reference}"`);

    const response = await axios.post(
      url,
      body,
      { headers: authHeaders(), timeout: 15000 }
    );

    return {
      status: "success",
      data: response.data?.data || response.data,
      raw: response.data
    };
  } catch (error) {
    const errorDetail = error.response?.data || error.message;
    console.error("Wittypay /payments Error:", JSON.stringify(errorDetail));
    return {
      status: "error",
      message: error.response?.data?.message || error.message,
      raw: error.response?.data
    };
  }
};
