import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const PAYMENTPOINT_BASE_URL = "https://api.paymentpoint.co";
const PAYMENTPOINT_SECRET_KEY = process.env.PAYMENTPOINT_SECRET_KEY;
const PAYMENTPOINT_API_KEY = process.env.PAYMENTPOINT_API_KEY;
const PAYMENTPOINT_BUSINESS_ID = process.env.PAYMENTPOINT_BUSINESS_ID;

// Partner bank codes documented by PaymentPoint for reserved account issuance.
const DEFAULT_BANK_CODES = ["20946", "20897"]; // PalmPay, OPay

function authHeaders() {
  return {
    Authorization: `Bearer ${PAYMENTPOINT_SECRET_KEY}`,
    "api-key": PAYMENTPOINT_API_KEY,
    "Content-Type": "application/json"
  };
}

/**
 * Create a PaymentPoint reserved virtual account.
 *
 * Accepts the same userData shape accountService.js already builds for
 * Flutterwave's createVirtualAccount (email, phone, firstname, lastname,
 * bvn, nin) and returns a response shaped identically to Flutterwave's
 * { status, data: { account_number, bank_name, order_ref, expiry_date } }
 * so callers can treat both providers interchangeably without branching.
 */
export const createVirtualAccount = async (userData) => {
  if (!PAYMENTPOINT_SECRET_KEY || !PAYMENTPOINT_API_KEY || !PAYMENTPOINT_BUSINESS_ID) {
    return { status: "error", message: "PaymentPoint credentials are not configured" };
  }

  const name = [userData.firstname, userData.lastname].filter(Boolean).join(" ").trim() || userData.name || "Customer";

  const body = {
    email: userData.email,
    name,
    phoneNumber: userData.phone,
    bankCode: DEFAULT_BANK_CODES,
    businessId: PAYMENTPOINT_BUSINESS_ID
  };

  if (userData.bvn) {
    body.idType = "bvn";
    body.idNumber = userData.bvn;
  } else if (userData.nin) {
    body.idType = "nin";
    body.idNumber = userData.nin;
  }

  try {
    const response = await axios.post(
      `${PAYMENTPOINT_BASE_URL}/api/v1/createVirtualAccount`,
      body,
      { headers: authHeaders(), timeout: 15000 }
    );

    const data = response.data;
    if (data?.status !== "success" || !Array.isArray(data.bankAccounts) || data.bankAccounts.length === 0) {
      return { status: "error", message: data?.message || "PaymentPoint did not return a virtual account" };
    }

    const account = data.bankAccounts[0];
    return {
      status: "success",
      data: {
        account_number: account.accountNumber,
        bank_name: account.bankName,
        order_ref: account.Reserved_Account_Id,
        customer_id: data.customer?.customer_id,
        // PaymentPoint reserved accounts are not time/amount-locked like
        // Flutterwave's temporary VAs, so no expiry is returned. Callers
        // already fall back to their own default when expiry_date is unset.
        expiry_date: undefined
      }
    };
  } catch (error) {
    console.error("PaymentPoint VA Error:", error.response?.data || error.message);
    return { status: "error", message: error.response?.data?.message || error.message };
  }
};
