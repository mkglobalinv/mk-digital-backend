import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { verifyFlutterwaveTransaction } from "../services/flutterwaveService.js";
import { sendTransactionNotification } from "../services/emailService.js";
import { creditBalance } from "../services/walletService.js";
import socketService from "../services/socketService.js";

/**
 * Unified Payment Settlement Engine (Atomic & Thread-safe)
 */
export const settleTransaction = async (transactionId, txRef, authUserId = null, webhookPayload = null) => {
    console.log(`[Settlement] Starting settlement for transactionId: ${transactionId}, txRef: ${txRef}`);
    
    // 1. Double Verify with Flutterwave API (Crucial for Live/Production security)
    const verification = await verifyFlutterwaveTransaction(transactionId);
    if (!verification || verification.status !== "success" || !verification.data || verification.data.status !== "successful") {
        console.error(`[Settlement] Flutterwave API verification failed for ID: ${transactionId}`);
        throw new Error("Payment verification failed with Flutterwave API");
    }

    const { amount, currency, customer, tx_ref: flwTxRef } = verification.data;
    
    // Use the reference returned by Flutterwave if txRef is not provided
    const finalTxRef = txRef || flwTxRef;
    
    if (!finalTxRef) {
        console.error(`[Settlement] No payment reference found for transaction ID: ${transactionId}`);
        throw new Error("Payment reference missing");
    }

    // 2. Prevent Duplicate Crediting (Check unique gateway_id/reference already successful)
    const duplicateTx = await Transaction.findOne({
        $or: [
            { gateway_id: String(transactionId), status: "success" },
            { reference: finalTxRef, status: "success" }
        ]
    });

    if (duplicateTx) {
        console.log(`[Settlement] Transaction already processed successfully. ID: ${transactionId}, Ref: ${finalTxRef}`);
        return { success: true, alreadyProcessed: true, transaction: duplicateTx };
    }

    // 3. Find/Update or Create the Transaction document atomically
    let transaction = await Transaction.findOne({ reference: finalTxRef });
    
    // Determine user ID
    let resolvedUserId = transaction?.userId || authUserId;
    
    if (!resolvedUserId) {
        // Fallback user lookup from customer data
        const payloadAccount = webhookPayload?.virtual_account_number || webhookPayload?.account_number;
        if (payloadAccount) {
            const matchedUser = await User.findOne({
                $or: [
                    { account_number: payloadAccount },
                    { account_number2: payloadAccount }
                ]
            });
            resolvedUserId = matchedUser?._id;
        }

        if (!resolvedUserId && customer?.email) {
            if (customer.email.includes("@9jasub.com")) {
                const possibleId = customer.email.split("@")[0];
                if (mongoose.Types.ObjectId.isValid(possibleId)) {
                    const matchedUser = await User.findById(possibleId);
                    resolvedUserId = matchedUser?._id;
                }
            }
        }
    }

    if (!resolvedUserId) {
        console.error(`[Settlement] User could not be resolved for payment: ID=${transactionId}, Email=${customer?.email}. Webhook data: Account=${webhookPayload?.virtual_account_number || webhookPayload?.account_number}`);
        throw new Error("Unable to resolve reseller account for payment");
    }

    const user = await User.findById(resolvedUserId);
    if (!user) {
        console.error(`[Settlement] User with ID ${resolvedUserId} not found in database`);
        throw new Error("Reseller account not found");
    }

    if (transaction) {
        if (transaction.type === 'debit') {
            // Prevent VTU purchases from being treated as wallet funding
            console.log(`[Settlement Warning] Attempted to process VTU debit transaction ${finalTxRef} as wallet funding via Flutterwave`);
            return { success: false, alreadyProcessed: false, message: 'VTU transactions cannot be processed as wallet funding' };
        }

        // Atomically transition the transaction to successful to prevent race conditions
        const updatedTx = await Transaction.findOneAndUpdate(
            { _id: transaction._id, status: { $ne: "success" } },
            {
                status: "success",
                gateway_id: String(transactionId),
                amount: amount,
                provider_used: "flutterwave",
                verificationStatus: "verified"
            },
            { new: true }
        );

        if (!updatedTx) {
            console.log(`[Settlement] Transaction was concurrently marked successful: ${finalTxRef}`);
            const recheckTx = await Transaction.findById(transaction._id);
            return { success: true, alreadyProcessed: true, transaction: recheckTx };
        }
        transaction = updatedTx;
    } else {
        // Create new transaction record (e.g. for Virtual Account transfers)
        try {
            transaction = await Transaction.create({
                userId: user._id,
                amount: amount,
                type: "credit",
                status: "success",
                reference: finalTxRef.startsWith("VA-") ? `${finalTxRef}-${transactionId}` : finalTxRef,
                gateway_id: String(transactionId),
                description: "Wallet Funding",
                provider_used: "flutterwave",
                verificationStatus: "verified"
            });
        } catch (error) {
            if (error.code === 11000) {
                console.log(`[Settlement] Duplicate transaction create prevented: ${finalTxRef}`);
                const recheckTx = await Transaction.findOne({
                    $or: [
                        { reference: finalTxRef },
                        { gateway_id: String(transactionId) }
                    ]
                });
                return { success: true, alreadyProcessed: true, transaction: recheckTx };
            }
            throw error;
        }
    }

    // 4. Settle the Wallet (Atomically credit the user's wallet in both MongoDB and Supabase)
    const walletReference = transaction.reference;
    console.log(`[Settlement] Attempting to credit wallet for user ID: ${user._id} | Amount: ${amount} | Ref: ${walletReference}`);
    
    const creditResult = await creditBalance(
        user._id,
        amount,
        walletReference,
        `Wallet funded with ₦${amount} via Flutterwave`
    );

    if (!creditResult) {
        console.error(`[Settlement] CRITICAL ERROR: Wallet credit failed for user ${user.email}, user ID: ${user._id}, amount: ${amount}, reference: ${walletReference}`);
        transaction.verificationStatus = "failed_credit";
        await transaction.save();
        throw new Error("Wallet credit settlement failed");
    }

    console.log(`[Settlement] SUCCESS: Funded ₦${amount} to ${user.email} (Transaction Reference: ${walletReference})`);

    // Clear temporary account fields if applicable
    if (user.accountType === "temporary") {
        user.accountType = null;
        user.account_number = null;
        user.bank_name = null;
        user.accountExpiryDate = null;
        user.temporaryAmount = null;
        await user.save();
    }

    // 5. Send Transaction Notification Email
    try {
        await sendTransactionNotification({
            userId: user._id,
            amount: amount,
            type: "credit",
            status: "success",
            description: `Wallet funded with ₦${amount}`
        });
    } catch (emailErr) {
        console.error(`[Settlement] Notification email failed: ${emailErr.message}`);
    }

    // Referral Commission (1%)
    try {
        if (user.referredBy) {
            const commission = amount * 0.01;
            const referrer = await User.findById(user.referredBy);
            if (referrer) {
                await creditBalance(
                    referrer._id,
                    commission,
                    `REF-COM-${transactionId}`,
                    `Referral commission from ${user.email} funding`
                );
                console.log(`[Referral] Commission of ₦${commission} paid to ${referrer.email}`);
            }
        }
    } catch (refErr) {
        console.error(`[Settlement] Referral commission processing failed: ${refErr.message}`);
    }

    return { success: true, alreadyProcessed: false, transaction, user: creditResult };
};

/**
 * Verify Flutterwave Payment (Manual Check)
 */
export const verifyPayment = async (req, res) => {
    const { transaction_id, tx_ref } = req.body;
    
    try {
        if (!transaction_id) {
            return res.status(400).json({ success: false, message: "transaction_id is required" });
        }
        
        const result = await settleTransaction(transaction_id, tx_ref, req.user.id);
        if (result.success) {
            res.json({ success: true, data: result.transaction, user: result.user });
        } else {
            res.status(400).json({ success: false, message: "Payment verification failed" });
        }
    } catch (error) {
        console.error("[VerifyPayment Error]", error.message);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Flutterwave Webhook Handler (SAFE PRODUCTION SETUP)
 */
export const flutterwaveWebhook = async (req, res) => {
    console.log(`[Webhook] Incoming Flutterwave event at ${new Date().toISOString()}`);
    
    // 1. Verify Signature
    const secretHash = process.env.FLW_WEBHOOK_HASH;
    const signature = req.headers["verif-hash"];

    if (!signature || signature !== secretHash) {
        console.warn("[Webhook] Unauthorized Flutterwave webhook attempt. Hash mismatch or missing.");
        console.log("[Webhook] Received Hash:", signature);
        console.log("[Webhook] Expected Hash (first 5 chars):", secretHash ? secretHash.substring(0, 5) + "..." : "NOT SET");
        return res.status(401).send("Unauthorized");
    }

    const payload = req.body;
    console.log("[Webhook] Signature verified. Event:", payload?.event);
    console.log("[Webhook] RAW PAYLOAD RECEIVED:", JSON.stringify(payload, null, 2));
    
    if (!payload || !payload.data) {
        console.error("[Webhook] Received empty or invalid payload body.");
        return res.status(400).send("Invalid body");
    }

    // Only handle successful payments
    if (payload.event === "charge.completed") {
        const { id, tx_ref } = payload.data;

        try {
            const result = await settleTransaction(id, tx_ref, null, payload.data);
            if (result.success) {
                return res.status(200).send("Webhook Processed Successfully");
            } else {
                return res.status(500).send("Settlement Failed");
            }
        } catch (err) {
            console.error("[Webhook] Internal Error:", err.message);
            return res.status(500).send(`Internal Error: ${err.message}`);
        }
    }

    res.status(200).send("Webhook Received");
};
