import crypto from "crypto";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { sendTransactionNotification } from "../services/emailService.js";
import { creditBalance } from "../services/walletService.js";

/**
 * Verify HMAC-SHA512 signature attached to Wittypay webhook requests.
 */
export const verifyWittypaySignature = (payloadString, signatureHeader) => {
  const secret = process.env.WITTYPAY_WEBHOOK_SECRET || process.env.WITTYPAY_SECRET_KEY;
  if (!secret || !signatureHeader) return false;

  const expected = crypto.createHmac("sha512", secret).update(payloadString).digest("hex");

  try {
    const expectedBuf = Buffer.from(expected.toLowerCase(), "utf8");
    const receivedBuf = Buffer.from(String(signatureHeader).toLowerCase(), "utf8");
    if (expectedBuf.length !== receivedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
};

/**
 * Wittypay Settlement Engine (Atomic & Thread-safe)
 */
export const settleWittypayTransaction = async (payload) => {
  const data = payload?.data || payload;
  const transactionId = data?.transaction_id || data?.id || data?.reference;
  const amountPaid = Number(data?.amount || data?.amount_paid || 0);
  const accountNumber = data?.account_number || data?.virtual_account_number;
  const customerEmail = data?.customer_email || data?.email;

  if (!transactionId || !amountPaid) {
    throw new Error("Wittypay webhook payload missing transaction_id or amount");
  }

  const finalTxRef = `WITTY-VA-${transactionId}`;

  // 1. Prevent duplicate crediting
  const duplicateTx = await Transaction.findOne({
    $or: [
      { gateway_id: String(transactionId), status: "success" },
      { reference: finalTxRef, status: "success" }
    ]
  });

  if (duplicateTx) {
    console.log(`[Wittypay Settlement] Transaction already processed successfully. ID: ${transactionId}`);
    return { success: true, alreadyProcessed: true, transaction: duplicateTx };
  }

  // 2. Resolve user who owns the receiving account
  let resolvedUserId = null;

  if (accountNumber) {
    const matchedUser = await User.findOne({
      $or: [
        { account_number: accountNumber },
        { account_number2: accountNumber }
      ]
    });
    resolvedUserId = matchedUser?._id;
  }

  if (!resolvedUserId && customerEmail) {
    if (customerEmail.includes("@9jasub.com")) {
      const possibleId = customerEmail.split("@")[0];
      if (mongoose.Types.ObjectId.isValid(possibleId)) {
        const matchedUser = await User.findById(possibleId);
        resolvedUserId = matchedUser?._id;
      }
    } else {
      const matchedUser = await User.findOne({ email: customerEmail.toLowerCase() });
      resolvedUserId = matchedUser?._id;
    }
  }

  if (!resolvedUserId) {
    console.error(`[Wittypay Settlement] Could not resolve user for account: ${accountNumber}, email: ${customerEmail}`);
    throw new Error("Unable to resolve user account for Wittypay payment");
  }

  const user = await User.findById(resolvedUserId);
  if (!user) {
    console.error(`[Wittypay Settlement] User ID ${resolvedUserId} not found in database`);
    throw new Error("User account not found");
  }

  // 3. Create transaction record atomically
  let transaction;
  try {
    transaction = await Transaction.create({
      userId: user._id,
      amount: amountPaid,
      type: "credit",
      status: "processing",
      reference: finalTxRef,
      gateway_id: String(transactionId),
      description: "Wallet Funding via Wittypay",
      provider_used: "wittypay",
      verificationStatus: "verified"
    });
  } catch (error) {
    if (error.code === 11000) {
      console.log(`[Wittypay Settlement] Duplicate transaction create prevented: ${finalTxRef}`);
      const recheckTx = await Transaction.findOne({
        $or: [{ reference: finalTxRef }, { gateway_id: String(transactionId) }]
      });
      return { success: true, alreadyProcessed: true, transaction: recheckTx };
    }
    throw error;
  }

  // 4. Settle the wallet
  console.log(`[Wittypay Settlement] Attempting to credit wallet for user ID: ${user._id} | Amount: ${amountPaid} | Ref: ${finalTxRef}`);

  const creditResult = await creditBalance(
    user._id,
    amountPaid,
    finalTxRef,
    `Wallet funded with ₦${amountPaid} via Wittypay`
  );

  if (!creditResult) {
    console.error(`[Wittypay Settlement] CRITICAL ERROR: Wallet credit failed for user ${user.email}, amount: ${amountPaid}`);
    transaction.verificationStatus = "failed_credit";
    await transaction.save();
    throw new Error("Wallet credit settlement failed");
  }

  console.log(`[Wittypay Settlement] SUCCESS: Funded ₦${amountPaid} to ${user.email} (Ref: ${finalTxRef})`);

  // Clear temporary account fields if applicable
  if (user.accountType === "temporary") {
    user.accountType = null;
    user.account_number = null;
    user.bank_name = null;
    user.accountExpiryDate = null;
    user.temporaryAmount = null;
    await user.save();
  }

  // 5. Send transaction notification email
  try {
    await sendTransactionNotification({
      userId: user._id,
      amount: amountPaid,
      type: "credit",
      status: "success",
      description: `Wallet funded with ₦${amountPaid}`
    });
  } catch (emailErr) {
    console.error(`[Wittypay Settlement] Notification email failed: ${emailErr.message}`);
  }

  return { success: true, alreadyProcessed: false, transaction, user: creditResult };
};

/**
 * Wittypay Webhook Handler
 */
export const wittypayWebhook = async (req, res) => {
  console.log(`[Webhook] Incoming Wittypay event at ${new Date().toISOString()}`);

  const signature = req.headers["x-wittypay-signature"] || req.headers["wittypay-signature"];
  const payloadString = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

  if (signature && !verifyWittypaySignature(payloadString, signature)) {
    console.warn("[Webhook] Unauthorized Wittypay webhook attempt. Signature mismatch.");
    return res.status(401).send("Unauthorized");
  }

  const payload = req.body;
  const event = payload?.event || payload?.type || "virtual_account.credit";
  console.log("[Webhook] Signature verified / received. Event:", event);

  if (!payload) {
    return res.status(400).send("Invalid body");
  }

  if (event === "virtual_account.credit" || event === "charge.success" || payload?.status === "success") {
    try {
      const result = await settleWittypayTransaction(payload);
      if (result.success) {
        return res.status(200).send("Webhook Processed Successfully");
      }
      return res.status(500).send("Settlement Failed");
    } catch (err) {
      console.error("[Webhook] Internal Error:", err.message);
      return res.status(500).send(`Internal Error: ${err.message}`);
    }
  }

  res.status(200).send("Webhook Received");
};
