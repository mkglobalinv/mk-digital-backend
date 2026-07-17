import crypto from "crypto";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { initializeTransaction as initMonnify, verifyMonnifyTransaction } from "../services/monnifyService.js";
import PaystackService from "../services/paystackService.js";
import { sendTransactionNotification } from "../services/emailService.js";
import socketService from "../services/socketService.js";
import { creditBalance } from "../services/walletService.js";

/**
 * Initialize Payment (Supports Monnify and Paystack)
 */
export const initPayment = async (req, res) => {
  try {
    const { amount, provider = 'monnify' } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });

    const user = await User.findById(req.user.id);
    const paymentReference = `MK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let response;
    if (provider === 'paystack') {
        response = await PaystackService.initializeTransaction(user.email, amount);
        if (response.status) {
            await Transaction.create({
                userId: user._id, amount, type: "credit", status: "pending",
                reference: response.data.reference, description: "Wallet Funding via Paystack", provider: "Paystack"
            });
            return res.json({ checkoutUrl: response.data.authorization_url, paymentReference: response.data.reference });
        }
    } else {
        response = await initMonnify({
            amount, customerName: user.name, customerEmail: user.email,
            paymentReference, redirectUrl: process.env.FRONTEND_URL + "/wallet-confirm",
        });
        if (response.requestSuccessful) {
            await Transaction.create({
                userId: user._id, amount, type: "credit", status: "pending",
                reference: paymentReference, description: "Wallet Funding via Monnify", provider: "Monnify"
            });
            return res.json({ checkoutUrl: response.responseBody.checkoutUrl, paymentReference });
        }
    }

    res.status(400).json({ message: "Payment initialization failed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Verify Paystack Transaction
 */
export const verifyPaystack = async (req, res) => {
    try {
        const { reference } = req.params;
        const data = await PaystackService.verifyTransaction(reference);

        if (data.status && data.data.status === 'success') {
            const amount = data.data.amount / 100;
            const transaction = await Transaction.findOne({ reference });

            if (transaction && transaction.status === 'pending') {
                if (transaction.type === 'debit') {
                    // Prevent VTU purchases from being treated as wallet funding
                    console.log(`[Payment Warning] Attempted to process VTU debit transaction ${reference} as wallet funding via Paystack`);
                    return res.status(400).json({ status: 'error', message: 'VTU purchases cannot be processed via wallet funding endpoints' });
                }

                transaction.status = 'success';
                await transaction.save();

                // Let walletService handle balance addition and referral activation rewards
                const updatedUser = await creditBalance(transaction.userId, amount, reference, "Wallet Funding via Paystack");

                // Referral Commission (1%)
                if (updatedUser && updatedUser.referredBy) {
                    const commission = amount * 0.01;
                    await User.findByIdAndUpdate(updatedUser.referredBy, { $inc: { earningsBalance: commission } });
                    console.log(`[Referral] Commission of ₦${commission} paid to ${updatedUser.referredBy}`);
                }

                return res.json({ status: 'success', message: 'Wallet funded' });
            }
            return res.json({ status: 'info', message: 'Already processed or not found' });
        }
        res.status(400).json({ status: 'error', message: 'Verification failed' });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

/**
 * Monnify Webhook Handler
 */
export const monnifyWebhook = async (req, res) => {
  try {
    const secret = process.env.MONNIFY_SECRET_KEY;
    const signature = req.headers["x-monnify-signature"];
    const payload = JSON.stringify(req.body);

    const hash = crypto.createHmac("sha512", secret).update(payload).digest("hex");
    if (hash !== signature) {
      console.warn("[Monnify Webhook] Invalid signature received. Hash mismatch.");
      console.log(`[Monnify Webhook] Expected Hash: ${hash}, Received: ${signature}`);
      return res.status(400).send("Invalid signature");
    }

    const { eventType, eventData } = req.body;
    if (eventType === "SUCCESSFUL_TRANSACTION") {
      const { paymentReference } = eventData;
      const verifiedData = await verifyMonnifyTransaction(paymentReference);
      
      if (verifiedData.paymentStatus === "PAID") {
        const existingTx = await Transaction.findOne({ reference: paymentReference });
        if (existingTx && existingTx.status === "pending") {
          if (existingTx.type === "debit") {
             // Prevent VTU purchases from being treated as wallet funding
             console.log(`[Payment Warning] Attempted to process VTU debit transaction ${paymentReference} as wallet funding via Monnify`);
             return res.status(400).send("VTU transactions cannot be processed here");
          }

          // Let walletService handle balance addition and referral activation rewards
          const updatedUser = await creditBalance(existingTx.userId, verifiedData.amountPaid, paymentReference, "Wallet Funding via Monnify");

          // Referral Commission (1%)
          if (updatedUser && updatedUser.referredBy) {
            const commission = verifiedData.amountPaid * 0.01;
            await User.findByIdAndUpdate(updatedUser.referredBy, { $inc: { earningsBalance: commission } });
          }

          existingTx.status = "success";
          await existingTx.save();
        }
      }
    }
    res.status(200).send("Webhook Processed");
  } catch (error) { res.status(500).send("Internal Error"); }
};
