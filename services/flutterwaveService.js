import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

/**
 * Verify Flutterwave Transaction
 * @param {string} transactionId - The ID returned by Flutterwave frontend/inline
 */
export const verifyFlutterwaveTransaction = async (transactionId) => {
  try {
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
        },
        timeout: 15000
      }
    );
    return response.data;
  } catch (error) {
    console.error("Flutterwave Verification Error:", error.response?.data || error.message);
    throw new Error("Failed to verify transaction with Flutterwave");
  }
};

/**
 * Create Live Virtual Account
 */
export const createVirtualAccount = async (userData) => {
  try {
    const response = await axios.post(
      "https://api.flutterwave.com/v3/virtual-account-numbers",
      {
        email: userData.email,
        is_permanent: userData.is_permanent,
        bvn: userData.bvn || undefined,
        nin: userData.nin || undefined,
        amount: userData.amount || undefined,
        tx_ref: userData.tx_ref || `VA-${Date.now()}-${userData.email.split('@')[0]}`,
        phonenumber: userData.phone,
        firstname: userData.firstname,
        lastname: userData.lastname,
        narration: userData.narration || "9JASUB Payment Gateway"
      },
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    );
    return response.data;
  } catch (error) {
    console.error("Flutterwave VA Error:", error.response?.data || error.message);
    return { status: "error", message: error.response?.data?.message || error.message };
  }
};

/**
 * Initialize Flutterwave Transaction (Standard Checkout)
 */
export const initializeFlutterwaveTransaction = async (data) => {
  try {
    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: data.tx_ref,
        amount: data.amount,
        currency: "NGN",
        redirect_url: data.redirect_url,
        customer: {
          email: data.email,
          name: data.name,
          phonenumber: data.phone
        },
        customizations: {
          title: "Wallet Funding",
          description: "Fund your wallet"
        }
      },
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    );
    return response.data;
  } catch (error) {
    console.error("Flutterwave Init Error:", error.response?.data || error.message);
    throw new Error("Failed to initialize Flutterwave transaction");
  }
};
