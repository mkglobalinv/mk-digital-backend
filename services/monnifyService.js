import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const MONNIFY_BASE_URL = process.env.MONNIFY_BASE_URL || "https://sandbox.monnify.com";
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY;

/**
 * Get Bearer Token from Monnify
 */
export const getMonnifyToken = async () => {
  try {
    const authString = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString("base64");
    const response = await axios.post(
      `${MONNIFY_BASE_URL}/api/v1/auth/login`,
      {},
      {
        headers: {
          Authorization: `Basic ${authString}`,
        },
      }
    );
    return response.data.responseBody.accessToken;
  } catch (error) {
    console.error("Monnify Auth Error:", error.response?.data || error.message);
    throw new Error("Failed to authenticate with Monnify");
  }
};

/**
 * Initialize Transaction
 */
export const initializeTransaction = async (data) => {
  try {
    const token = await getMonnifyToken();
    const response = await axios.post(
      `${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`,
      {
        amount: data.amount,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        paymentReference: data.paymentReference,
        paymentDescription: data.paymentDescription || "Wallet Funding",
        currencyCode: "NGN",
        contractCode: process.env.MONNIFY_CONTRACT_CODE,
        redirectUrl: data.redirectUrl,
        paymentMethods: ["CARD", "ACCOUNT_TRANSFER"],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Monnify Initialization Error:", error.response?.data || error.message);
    throw new Error("Failed to initialize Monnify transaction");
  }
};

/**
 * Verify Transaction Status
 */
export const verifyMonnifyTransaction = async (transactionReference) => {
  try {
    const token = await getMonnifyToken();
    const response = await axios.get(
      `${MONNIFY_BASE_URL}/api/v2/merchant/transactions/query?paymentReference=${transactionReference}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.responseBody;
  } catch (error) {
    console.error("Monnify Verification Error:", error.response?.data || error.message);
    throw new Error("Failed to verify Monnify transaction");
  }
};
