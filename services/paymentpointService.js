import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const PAYMENTPOINT_BASE_URL = "https://api.paymentpoint.co";
const PAYMENTPOINT_SECRET_KEY = process.env.PAYMENTPOINT_SECRET_KEY;
const PAYMENTPOINT_API_KEY = process.env.PAYMENTPOINT_API_KEY;
const PAYMENTPOINT_BUSINESS_ID = process.env.PAYMENTPOINT_BUSINESS_ID;

// Partner bank codes documented by PaymentPoint for reserved account issuance.
// Confirmed via production tests (brand-new customer, OPay-only request) that
// PaymentPoint currently fails to provision a reserved bank account for ANY
// bank code -- not a PalmPay-specific issue. Their own response returns
// bankAccounts: [] with no error detail, and business.business_Id is null,
// pointing to the business account itself not being fully provisioned/
// approved on PaymentPoint's side. Restored to both documented codes since
// narrowing to one made no difference; this needs PaymentPoint support.
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

  // accountService.js already builds "<reseller site name or 9JASUB> - <firstname>"
  // into `narration` for Flutterwave's benefit; PaymentPoint has no separate
  // narration field, so the account's registered name (what the payer's bank
  // app displays as the beneficiary) must come from the same branded string
  // here too -- otherwise a reseller's customers would see plain customer
  // names instead of their reseller's own storefront name.
  const name = userData.narration || [userData.firstname, userData.lastname].filter(Boolean).join(" ").trim() || userData.name || "Customer";

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
      // PaymentPoint's top-level status/message can read as success
      // ("Customer account created successfully...") even when it failed to
      // actually provision a bank account for the requested bank code --
      // the real reason lives in `errors`. Surface that instead of the
      // misleading top-level message so callers/logs show what actually
      // went wrong (e.g. "Failed to create reserved account for bank code
      // 20946.") rather than a confusing success-sounding string.
      const reason = Array.isArray(data?.errors) && data.errors.length > 0
        ? data.errors.join("; ")
        : (data?.message || "PaymentPoint did not return a virtual account");
      console.error("[PaymentPoint] Failed to provision a bank account:", JSON.stringify(data));
      return { status: "error", message: reason };
    }

    const account = data.bankAccounts[0];
    // TEMP DIAGNOSTIC: confirming the registered account holder name
    // (what the payer's bank app actually displays) matches the branded
    // `name` we sent, not a stale/cached one -- remove once confirmed.
    console.log(`[PaymentPoint] Created account ${account.accountNumber} with registered holder name: "${account.accountName}" (we sent name: "${name}")`);
    return {
      status: "success",
      data: {
        account_number: account.accountNumber,
        bank_name: account.bankName,
        account_name: account.accountName,
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
