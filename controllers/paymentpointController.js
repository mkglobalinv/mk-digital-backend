import crypto from "crypto";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { sendTransactionNotification } from "../services/emailService.js";
import { creditBalance } from "../services/walletService.js";

/**
 * Verify the HMAC-SHA256 signature PaymentPoint attaches to webhook requests.
 * Mirrors PaymentPoint's own reference implementation (their Node.js sample
 * hashes JSON.stringify(req.body), not the raw request bytes): hash the
 * re-serialized payload with the webhook security key and compare
 * (constant-time) to the Paymentpoint-Signature header.
 */
export const verifyPaymentPointSignature = (payloadString, signatureHeader) => {
  const secret = process.env.PAYMENTPOINT_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const expected = crypto.createHmac("sha256", secret).update(payloadString).digest("hex");

  try {
    const expectedBuf = Buffer.from(expected, "utf8");
    const receivedBuf = Buffer.from(signatureHeader, "utf8");
    if (expectedBuf.length !== receivedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
};

/**
 * PaymentPoint Settlement Engine (mirrors flutterwaveController.js's
 * settleTransaction, adapted for PaymentPoint's webhook-only settlement
 * model). PaymentPoint exposes no separate "verify transaction" API to
 * double-check against the way Flutterwave does — the verified webhook
 * signature is itself the source of truth for a completed payment.
 */
export const settlePaymentPointTransaction = async (payload) => {
  const { transaction_id, amount_paid, receiver, customer } = payload;

  if (!transaction_id) {
    throw new Error("PaymentPoint webhook missing transaction_id");
  }

  const finalTxRef = `PP-VA-${transaction_id}`;

  // 1. Prevent duplicate crediting
  const duplicateTx = await Transaction.findOne({
    $or: [
      { gateway_id: String(transaction_id), status: "success" },
      { reference: finalTxRef, status: "success" }
    ]
  });

  if (duplicateTx) {
    console.log(`[PaymentPoint Settlement] Transaction already processed successfully. ID: ${transaction_id}`);
    return { success: true, alreadyProcessed: true, transaction: duplicateTx };
  }

  // 2. Resolve the user who owns the receiving virtual account
  let resolvedUserId = null;
  const receivingAccount = receiver?.account_number;
  if (receivingAccount) {
    const matchedUser = await User.findOne({
      $or: [
        { account_number: receivingAccount },
        { account_number2: receivingAccount }
      ]
    });
    resolvedUserId = matchedUser?._id;
  }

  if (!resolvedUserId && customer?.email?.includes("@9jasub.com")) {
    const possibleId = customer.email.split("@")[0];
    if (mongoose.Types.ObjectId.isValid(possibleId)) {
      const matchedUser = await User.findById(possibleId);
      resolvedUserId = matchedUser?._id;
    }
  }

  if (!resolvedUserId) {
    console.error(`[PaymentPoint Settlement] User could not be resolved. Account=${receivingAccount}, Email=${customer?.email}`);
    throw new Error("Unable to resolve reseller account for PaymentPoint payment");
  }

  const user = await User.findById(resolvedUserId);
  if (!user) {
    console.error(`[PaymentPoint Settlement] User with ID ${resolvedUserId} not found in database`);
    throw new Error("Reseller account not found");
  }

  // 3. Create the transaction record atomically (unique index on reference/
  // gateway_id is the DB-level backstop against a race with step 1's check)
  let transaction;
  try {
    transaction = await Transaction.create({
      userId: user._id,
      amount: amount_paid,
      type: "credit",
      status: "processing",
      reference: finalTxRef,
      gateway_id: String(transaction_id),
      description: "Wallet Funding via PaymentPoint",
      provider_used: "paymentpoint",
      verificationStatus: "verified"
    });
  } catch (error) {
    if (error.code === 11000) {
      console.log(`[PaymentPoint Settlement] Duplicate transaction create prevented: ${finalTxRef}`);
      const recheckTx = await Transaction.findOne({
        $or: [{ reference: finalTxRef }, { gateway_id: String(transaction_id) }]
      });
      return { success: true, alreadyProcessed: true, transaction: recheckTx };
    }
    throw error;
  }

  // 4. Settle the wallet
  console.log(`[PaymentPoint Settlement] Attempting to credit wallet for user ID: ${user._id} | Amount: ${amount_paid} | Ref: ${finalTxRef}`);

  const creditResult = await creditBalance(
    user._id,
    amount_paid,
    finalTxRef,
    `Wallet funded with ₦${amount_paid} via PaymentPoint`
  );

  if (!creditResult) {
    console.error(`[PaymentPoint Settlement] CRITICAL ERROR: Wallet credit failed for user ${user.email}, user ID: ${user._id}, amount: ${amount_paid}, reference: ${finalTxRef}`);
    transaction.verificationStatus = "failed_credit";
    await transaction.save();
    throw new Error("Wallet credit settlement failed");
  }

  console.log(`[PaymentPoint Settlement] SUCCESS: Funded ₦${amount_paid} to ${user.email} (Transaction Reference: ${finalTxRef})`);

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
      amount: amount_paid,
      type: "credit",
      status: "success",
      description: `Wallet funded with ₦${amount_paid}`
    });
  } catch (emailErr) {
    console.error(`[PaymentPoint Settlement] Notification email failed: ${emailErr.message}`);
  }

  // Referral Commission (1%)
  try {
    if (user.referredBy) {
      const commission = amount_paid * 0.01;
      const referrer = await User.findById(user.referredBy);
      if (referrer) {
        await creditBalance(
          referrer._id,
          commission,
          `REF-COM-PP-${transaction_id}`,
          `Referral commission from ${user.email} funding`
        );
        console.log(`[Referral] Commission of ₦${commission} paid to ${referrer.email}`);
      }
    }
  } catch (refErr) {
    console.error(`[PaymentPoint Settlement] Referral commission processing failed: ${refErr.message}`);
  }

  return { success: true, alreadyProcessed: false, transaction, user: creditResult };
};

/**
 * PaymentPoint Webhook Handler (SAFE PRODUCTION SETUP)
 */
export const paymentpointWebhook = async (req, res) => {
  console.log(`[Webhook] Incoming PaymentPoint event at ${new Date().toISOString()}`);

  // 1. Verify Signature
  const signature = req.headers["paymentpoint-signature"];
  const payloadString = JSON.stringify(req.body);

  if (!verifyPaymentPointSignature(payloadString, signature)) {
    console.warn("[Webhook] Unauthorized PaymentPoint webhook attempt. Signature mismatch or missing.");
    return res.status(401).send("Unauthorized");
  }

  const payload = req.body;
  console.log("[Webhook] Signature verified. Status:", payload?.notification_status);

  if (!payload || !payload.transaction_id) {
    console.error("[Webhook] Received empty or invalid PaymentPoint payload body.");
    return res.status(400).send("Invalid body");
  }

  // Only handle successful payments
  if (payload.notification_status === "payment_successful" && payload.transaction_status === "success") {
    try {
      const result = await settlePaymentPointTransaction(payload);
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
