// RESTART: 2026-05-01T13:42:00Z
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import { startRequeryJob, triggerImmediateVerification } from "./services/requeryService.js";
import Transaction from "./models/Transaction.js";
import User from "./models/User.js";
import OTP from "./models/OTP.js";
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import Notification from "./models/Notification.js";
import SystemNotification from "./models/SystemNotification.js";
import Session from "./models/Session.js";
import biometricRoutes from "./routes/biometricRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import { sendTransactionReceiptEmail, sendOTPEmail, sendSupportEmail, sendTransactionNotification } from "./services/emailService.js";
import { handleVACreation } from "./services/accountService.js";
import { buyAirtime, buyElectricity, buyEPIN, buyEducation, buyData, buyCableTV } from "./services/vtuService.js";
import Withdrawal from "./models/Withdrawal.js";
import { deductBalance, refundBalance } from "./services/walletService.js";
import { getReloadlyOperators } from "./services/providers/reloadly.js";
import { createVirtualAccount } from "./services/flutterwaveService.js";
import { CONNECTBRIDGE_PLANS } from "./config/connectBridgePlans.js";
import fs from "fs";
const JARAPOINT_PLANS = JSON.parse(fs.readFileSync("./services/providers/jarapoint_plans.json", "utf8"));
console.log(`[Startup] Loaded ${JARAPOINT_PLANS.length} Jarapoint plans.`);


const app = express();
app.use(express.json());

// Request Logger for Debugging
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
});

app.use(cors({
  origin: "*",
  credentials: true
}));

const connectDB = async () => {
    try {
        const connString = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";
        console.log(`Connecting to MongoDB...`);
        
        await mongoose.connect(connString, {
            serverSelectionTimeoutMS: 15000, // 15 seconds timeout
            socketTimeoutMS: 45000, // 45 seconds
        });
        
        console.log(`MongoDB Connected ✅ (${mongoose.connection.host})`);
        
        // Clear any stuck transaction locks on startup
        try {
            await User.updateMany({}, { isProcessingTx: false });
            console.log("Cleared all transaction locks 🔓");
        } catch (e) {
            console.error("Failed to clear transaction locks:", e.message);
        }
        
        // Start Background Requery Job
        startRequeryJob();
    } catch (err) {
        console.error("MongoDB Connection Error ❌:", err.message);
        // Don't exit process, let it retry or stay alive for static files
    }
};

connectDB();

const auth = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (!token) {
        console.log(`[Auth] No token for ${req.path}`);
        return res.status(401).json({ message: "No token" });
    }
    if (token.startsWith("Bearer ") || token.startsWith("Token ")) token = token.split(" ")[1];
    
    const secret = process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium";
    const verified = jwt.verify(token, secret);
    req.user = verified;
    
    const session = await Session.findOne({ token, userId: verified.id, isValid: true });
    if (!session) {
        console.log(`[Auth] Session invalid or expired for user ${verified.id}`);
        return res.status(401).json({ message: "Session expired." });
    }

    const user = await User.findById(verified.id);
    if (user && user.isSuspended) {
        console.log(`[Auth] User suspended: ${user.email}`);
        return res.status(403).json({ message: "Account suspended." });
    }
    
    next();
  } catch (err) { 
    console.error(`[Auth] Verification failed for ${req.path}:`, err.message);
    res.status(401).json({ message: "Invalid token" }); 
  }
};

const verifyTransactionPin = async (req, res, next) => {
    try {
        let { transactionPin, amount, biometricData } = req.body;
        if (!amount && req.body.value && req.body.quantity) amount = req.body.value * req.body.quantity;
        
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // BIOMETRIC AUTHENTICATION PATH
        if (biometricData) {
            console.log(`[PinVerify] Biometric path for ${user.email}`);
            // Check if biometric is enabled
            if (!user.biometricEnabled) return res.status(400).json({ message: "Biometric not enabled" });
            
            // Verify the credential ID exists for this user
            const hasCred = user.webauthnCredentials.some(c => c.credentialID === biometricData.credentialID);
            if (!hasCred) {
                console.warn(`[PinVerify] Invalid biometric credential for ${user.email}`);
                return res.status(400).json({ message: "Invalid biometric credential" });
            }
            
            // In a full implementation, we verify signature here. 
            // For now, we trust the device-released assertion.
            console.log(`[PinVerify] SUCCESS via Biometrics for ${user.email}`);
        } 
        // TRADITIONAL PIN PATH
        else {
            if (!transactionPin) return res.status(400).json({ message: "Transaction PIN required" });
            
            const isPinMatch = await bcrypt.compare(String(transactionPin), user.transactionPin);
            if (!isPinMatch) {
                console.log(`[PinVerify] FAILED: Incorrect PIN for ${user.email}`);
                return res.status(400).json({ message: "Incorrect PIN" });
            }
        }
        
        if (!user.kycVerified && amount > user.transactionLimit) {
            console.log(`[PinVerify] FAILED: Limit exceeded for ${user.email}. Amount: ${amount}, Limit: ${user.transactionLimit}`);
            return res.status(400).json({ message: "Limit exceeded" });
        }
        
        req.fullUser = user;
        next();
    } catch(err) { 
        console.error("[PinVerify] ERROR:", err);
        res.status(500).json({ message: "Error" }); 
    }
};

app.use("/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/biometric", biometricRoutes);
app.use("/api/webhook", webhookRoutes);

// RELOADLY PROXY
app.get("/api/reloadly/operators/:countryCode", auth, async (req, res) => {
    try {
        console.log(`[Proxy] Fetching operators for ${req.params.countryCode}`);
        const operators = await getReloadlyOperators(req.params.countryCode);
        console.log(`[Proxy] SUCCESS: Returning ${operators?.length} operators`);
        res.json(operators);
    } catch (err) {
        console.error(`[Proxy] ERROR for ${req.params.countryCode}:`, err.message);
        res.status(500).json({ 
            message: "Error fetching international operators", 
            error: err.message,
            stack: err.stack 
        });
    }
});

// INTERNATIONAL INTEREST TRACKING
import InternationalInterest from "./models/InternationalInterest.js";
app.post("/api/international/track", auth, async (req, res) => {
    try {
        const { serviceType, country } = req.body;
        await InternationalInterest.create({
            userId: req.user.id,
            serviceType,
            country
        });
        res.json({ success: true, message: "International services are coming soon. Stay tuned!" });
    } catch (err) {
        res.status(500).json({ message: "Error tracking interest" });
    }
});

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, transactionPin } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User exists" });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPin = transactionPin ? await bcrypt.hash(transactionPin, 10) : "";
    
    const user = new User({ 
        name: name || email.split('@')[0], 
        email, 
        password: hashedPassword,
        transactionPin: hashedPin
    });
    
    await user.save();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    await OTP.create({ userId: user._id, hashedOtp, expiresAt: new Date(Date.now() + 5*60*1000) });
    await sendOTPEmail(user.email, otp);
    res.json({ message: "Registered. Verify email.", email: user.email });
  } catch (err) { 
    console.error("Register Error:", err);
    res.status(500).json({ message: "Error" }); 
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (!user.isEmailVerified) return res.status(403).json({ message: "Verify email", unverified: true });
    if (!user.isSignupComplete) return res.status(403).json({ message: "Complete signup", incompleteSignup: true });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium");
    await Session.create({ userId: user._id, token, deviceInfo: req.headers['user-agent'] || "Unknown" });
    res.json({ token, balance: user.totalBalance });
  } catch (err) { 
    console.error("Login Error:", err);
    res.status(500).json({ message: "Error", error: err.message }); 
  }
});

// CONTINUE SIGNUP
app.post("/continue-signup", async (req, res) => {
    const { email, bvn, transactionPin, securityQuestions, phone, firstname, lastname } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });
        
        const hashedPin = await bcrypt.hash(transactionPin, 10);
        const hashedQuestions = await Promise.all(securityQuestions.map(async (sq) => ({ 
            question: sq.question, 
            answer: await bcrypt.hash(sq.answer.toLowerCase().trim(), 10) 
        })));
        
        user.transactionPin = hashedPin;
        user.securityQuestions = hashedQuestions;
        if (bvn) user.bvn = bvn;
        if (phone) user.kycData.phone = phone; // Store phone in kycData or direct field if exists
        
        user.isSignupComplete = true;
        await user.save();

        // Trigger Virtual Account Creation in Background
        console.log(`[VA] Triggering account generation for ${user.email}...`);
        handleVACreation(user, firstname, lastname, phone);

        res.json({ success: true, message: "Signup complete. Generating virtual account..." });
    } catch (err) {
        res.status(500).json({ message: "Error during signup continuation" });
    }
});

// MANUAL VIRTUAL ACCOUNT GENERATION (RETRY)
app.post("/user/generate-va", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.account_number) return res.status(400).json({ message: "Account already exists" });
        
        const { firstname, lastname, phone } = req.body;
        const result = await handleVACreation(user, firstname, lastname, phone);
        
        if (result.success) {
            res.json({ success: true, account: result.account });
        } else {
            res.status(400).json({ success: false, message: result.message });
        }
    } catch (err) {
        res.status(500).json({ message: "Error generating account" });
    }
});

// (Keep internal helper import logic handled at top)

app.get("/user/me", auth, async (req, res) => {
  res.json(await User.findById(req.user.id).select("-password"));
});

// ---------------- VTU SERVICES ----------------
import { smartBuyAirtime, smartBuyData, smartFetchDataPlans } from "./services/switcher.js";

app.get("/api/vtu/data-plans/:network", auth, async (req, res) => {
    try {
        const { network } = req.params;
        const { option } = req.query;
        console.log(`[VTU] Fetching data plans for ${network} (Option: ${option || 'smart'})`);
        const plans = await smartFetchDataPlans(network, option || 'smart');
        
        // Ensure we return an array even if something went wrong internally
        if (!plans || plans.length === 0) {
            console.log(`[VTU Plans Warning] No data plans available for ${network} on ${option || 'smart'}`);
            return res.json([]); 
        }
        
        res.json(plans);
    } catch (err) {
        console.error(`[VTU Plans Error]`, err.message);
        res.status(500).json({ message: "Failed to fetch data plans" });
    }
});

app.post("/buy-airtime", auth, verifyTransactionPin, async (req, res) => {
    const { amount, phone, network, countryCode, operatorId, option } = req.body;
    
    // TEMPORARY: Disable International Airtime & Track Interest
    if (countryCode && countryCode.toUpperCase() !== 'NG') {
        try {
            await InternationalInterest.create({ userId: req.user.id, serviceType: 'airtime', country: countryCode });
        } catch (e) {}
        return res.json({ message: "International services are coming soon. Stay tuned!" });
    }

    // Atomic check and set lock
    const lockedUser = await User.findOneAndUpdate(
        { _id: req.user.id, isProcessingTx: false },
        { isProcessingTx: true },
        { new: true }
    );

    if (!lockedUser) {
        return res.status(400).json({ message: "Please wait, your previous transaction is still processing" });
    }

    let transaction = null;
    try {
        let finalAmount = Number(amount);
        if (isNaN(finalAmount) || finalAmount < 1) {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "Amount must be at least 1" });
        }
        
        // Kobo to Naira conversion logic
        if (finalAmount > lockedUser.totalBalance && (finalAmount / 100) <= lockedUser.totalBalance && finalAmount >= 100) {
            finalAmount = finalAmount / 100;
        }

        // Initial balance check
        if (lockedUser.totalBalance < finalAmount) {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "Insufficient balance" });
        }

        console.log(`[VTU] Initiating Airtime for ${lockedUser.email} with amount: ${finalAmount}`);
        
        // 1. Create PENDING Transaction Record
        transaction = await Transaction.create({ 
            userId: req.user.id, 
            type: "debit", 
            status: "pending", 
            amount: finalAmount, 
            phone, 
            network, 
            countryCode: countryCode || 'NG',
            reference: `AIR-PND-${Date.now()}`,
            provider_used: "pending",
            description: "Airtime (Pending)" 
        });

        const vtu = await buyAirtime(network, finalAmount, phone, countryCode, operatorId, option || 'smart');
        console.log(`[VTU] Airtime API Result for ${transaction._id}:`, vtu?.status || "ERROR");

        if (vtu && vtu.status === "success") {
            // 2. Deduct ONLY after success
            const deducted = await deductBalance(req.user.id, finalAmount);
            
            // 3. Update Transaction to SUCCESS
            transaction.status = "success";
            transaction.reference = vtu.reference || transaction.reference;
            transaction.provider_used = vtu.provider_used;
            transaction.api_response = vtu.data;
            transaction.description = "Airtime";
            await transaction.save();

            sendTransactionNotification(transaction);
            return res.json({ message: "Success", balance: deducted ? deducted.totalBalance : lockedUser.totalBalance });
        } else if (vtu && vtu.status === "unknown") {
            // 2. Keep PENDING and update reference if available
            transaction.reference = vtu.reference || transaction.reference;
            transaction.provider_used = vtu.provider_used;
            transaction.api_response = vtu.data;
            transaction.description = "Airtime (Processing)";
            await transaction.save();
            
            // Trigger immediate verification check
            triggerImmediateVerification(transaction.reference);
            
            return res.json({ 
                message: "Transaction is being processed. Please check history for status.", 
                status: "pending",
                reference: transaction.reference 
            });
        } else {
            // 2. Update Transaction to FAILED
            transaction.status = "failed";
            transaction.description = "Airtime (Failed)";
            transaction.provider_used = vtu?.provider_used || "none";
            transaction.api_response = vtu?.data || { error: vtu?.message || "Unknown error" };
            await transaction.save();

            sendTransactionNotification(transaction);
            return res.status(400).json({ message: vtu?.message || "Airtime purchase failed" });
        }
    } catch (err) {
        console.error("[Airtime Error]", err.response?.data || err.message);
        // Ensure the SPECIFIC transaction is marked failed in case of crash
        try {
            if (transaction && transaction._id) {
                await Transaction.findByIdAndUpdate(transaction._id, { 
                    status: 'failed', 
                    description: 'Airtime (System Error)',
                    api_response: { error: err.response?.data || err.message }
                });
            }
        } catch (e) {
            console.error("[Airtime Error Recovery Failed]", e.message);
        }
        return res.status(500).json({ success: false, message: "Failed to process request" });
    } finally {
        // Unlock user
        await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
    }
});

app.post("/api/vtu/data/purchase", auth, verifyTransactionPin, async (req, res) => {
    // Standardize input fields
    const { phone, mobile_number, network, plan_id, plan_code, dataPlan, countryCode, operatorId, network_id, option, provider } = req.body;
    // Note: 'amount' is explicitly ignored here for data as requested
    const finalPhone = phone || mobile_number;
    const finalPlanCode = plan_id || plan_code || dataPlan; 
    const finalOption = provider === "connectbridge" ? "premium" : (option || "smart");

    if (!finalPhone || !network) {
        return res.status(400).json({ message: "Please enter a phone number and select a network" });
    }

    if (!finalPlanCode) {
        return res.status(400).json({ message: "Please select a data plan" });
    }

    // TEMPORARY: Disable International Data & Track Interest
    if (countryCode && countryCode.toUpperCase() !== 'NG') {
        try {
            await InternationalInterest.create({ userId: req.user.id, serviceType: 'data', country: countryCode });
        } catch (e) {}
        return res.json({ message: "International services are coming soon. Stay tuned!" });
    }

    // Atomic check and set lock
    const lockedUser = await User.findOneAndUpdate(
        { _id: req.user.id, isProcessingTx: false },
        { isProcessingTx: true },
        { new: true }
    );

    if (!lockedUser) {
        return res.status(400).json({ message: "Please wait, your previous transaction is still processing" });
    }

    let transaction = null;
    try {
        let derivedPrice = 0;

        // Derive price for Premium (Jarapoint) from local config
        if (finalOption === "premium") {
            console.log(`[VTU] Looking for plan: ${finalPlanCode} in ${JARAPOINT_PLANS.length} plans`);
            const selectedPlan = JARAPOINT_PLANS.find(p => String(p.plan_id) === String(finalPlanCode));
            if (selectedPlan) {
                derivedPrice = selectedPlan.price;
                console.log(`[VTU] Found! Derived Jarapoint Price: ₦${derivedPrice} for plan ${finalPlanCode}`);
            } else {
                console.log(`[VTU] Plan ${finalPlanCode} NOT found in Jarapoint plans!`);
                // Fallback to legacy ConnectBridge plans if not in Jarapoint
                const netPlans = CONNECTBRIDGE_PLANS[network.toUpperCase()];
                const cbPlan = netPlans?.find(p => String(p.plan_code) === String(finalPlanCode));
                if (cbPlan) {
                    derivedPrice = cbPlan.amount;
                } else {
                    await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
                    return res.status(400).json({ message: "Invalid data plan selected" });
                }
            }

        } else {
            // For other providers (Smart/Value), we still need the price, 
            // but we'll use req.body.amount if available or 0
            derivedPrice = Number(req.body.amount) || 0;
        }

        if (derivedPrice <= 0 && finalOption === "premium") {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "Invalid plan price. Please contact support." });
        }
        
        // Initial balance check
        if (lockedUser.totalBalance < derivedPrice) {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "Insufficient balance" });
        }

        console.log(`[VTU] Initiating Data: ${lockedUser.email} | Plan: ${finalPlanCode} | Network: ${network} | Option: ${finalOption}`);
        
        // 1. Create PENDING Transaction Record
        transaction = await Transaction.create({ 
            userId: req.user.id, 
            type: "debit", 
            status: "pending", 
            amount: derivedPrice, 
            phone: finalPhone, 
            network, 
            countryCode: countryCode || 'NG',
            reference: `DATA-PND-${Date.now()}`,
            provider_used: finalOption,
            description: `Data: ${finalPlanCode} (Pending)` 
        });

        const vtu = await buyData(network, finalPlanCode, finalPhone, derivedPrice, countryCode, operatorId, network_id, finalOption);
        console.log(`[VTU] Data API Result for ${transaction._id}:`, vtu?.status || "ERROR");

        if (vtu && vtu.status === "success") {
            // 2. Deduct ONLY after success
            const deducted = await deductBalance(req.user.id, derivedPrice);
            if (!deducted) {
                console.error(`[CRITICAL] Deduction failed for SUCCESSFUL transaction ${transaction._id}`);
            }
            
            // 3. Update Transaction to SUCCESS
            transaction.status = "success";
            transaction.reference = vtu.reference || transaction.reference;
            transaction.provider_used = vtu.provider_used;
            transaction.api_response = vtu.data;
            transaction.description = `Data: ${finalPlanCode}`;
            await transaction.save();

            sendTransactionNotification(transaction);
            return res.json({ message: "Success", balance: deducted ? deducted.totalBalance : lockedUser.totalBalance });
        } else if (vtu && vtu.status === "unknown") {
            // 2. Keep PENDING
            transaction.reference = vtu.reference || transaction.reference;
            transaction.provider_used = vtu.provider_used;
            transaction.api_response = vtu.data;
            transaction.description = `Data: ${finalPlanCode} (Processing)`;
            await transaction.save();
            
            // Trigger immediate verification check
            triggerImmediateVerification(transaction.reference);
            
            return res.json({ 
                message: "Transaction is being processed. Please check history for status.", 
                status: "pending",
                reference: transaction.reference 
            });
        } else {
            // 2. Update Transaction to FAILED
            transaction.status = "failed";
            transaction.description = `Data: ${finalPlanCode} (Failed)`;
            transaction.provider_used = vtu?.provider_used || "none";
            transaction.api_response = vtu?.data || { error: vtu?.message || "Unknown error" };
            await transaction.save();

            sendTransactionNotification(transaction);
            return res.status(400).json({ message: vtu?.message || "Purchase failed" });
        }
    } catch (err) {
        console.error("[Data Error]", err.response?.data || err.message);
        // Ensure the SPECIFIC transaction is marked failed in case of crash
        try {
            if (transaction && transaction._id) {
                await Transaction.findByIdAndUpdate(transaction._id, { 
                    status: 'failed', 
                    description: `Data: ${finalPlanCode} (System Error)`,
                    api_response: { error: err.response?.data || err.message }
                });
            }
        } catch (e) {
            console.error("[Data Error Recovery Failed]", e.message);
        }
        return res.status(500).json({ success: false, message: "Failed to process request" });
    } finally {
        // Unlock user
        await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
    }
});

// Alias for data purchase to fix 404s
app.post("/buy-data", auth, verifyTransactionPin, async (req, res) => {
    // Redirect to the unified data purchase handler
    req.url = "/api/vtu/data/purchase";
    return app._router.handle(req, res);
});

app.post("/buy-cable", auth, verifyTransactionPin, async (req, res) => {
    const { cableId, packageId, smartcard, phone, amount } = req.body;
    const finalAmount = Number(amount) || 0;

    const lockedUser = await User.findOneAndUpdate({ _id: req.user.id, isProcessingTx: false }, { isProcessingTx: true }, { new: true });
    if (!lockedUser) return res.status(400).json({ message: "Transaction in progress" });

    let transaction = null;
    try {
        if (lockedUser.totalBalance < finalAmount) {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "Insufficient balance" });
        }

        transaction = await Transaction.create({ 
            userId: req.user.id, type: "debit", status: "pending", amount: finalAmount, phone, 
            description: `Cable TV: ${cableId} (${smartcard})`, reference: `CBL-PND-${Date.now()}`
        });

        const vtu = await buyCableTV(cableId, packageId, smartcard, phone);
        if (vtu && vtu.status === "success") {
            const deducted = await deductBalance(req.user.id, finalAmount);
            transaction.status = "success";
            transaction.reference = vtu.reference || transaction.reference;
            transaction.api_response = vtu.data;
            await transaction.save();
            sendTransactionNotification(transaction);
            return res.json({ message: "Success", reference: transaction.reference });
        } else {
            transaction.status = "failed";
            transaction.api_response = vtu?.data || { error: vtu?.message || "Purchase failed" };
            await transaction.save();
            sendTransactionNotification(transaction);
            return res.status(400).json({ message: vtu?.message || "Purchase failed" });
        }
    } catch (err) {
        console.error("[Cable Error]", err);
        try {
            if (transaction && transaction._id) {
                await Transaction.findByIdAndUpdate(transaction._id, { status: 'failed', description: `Cable: ${cableId} (System Error)`, api_response: { error: err.message } });
            }
        } catch (e) {}
        return res.status(500).json({ message: "System error" });
    } finally {
        await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
    }
});

app.post("/buy-electricity", auth, verifyTransactionPin, async (req, res) => {
    const { discoId, meterType, meterNumber, amount, phone } = req.body;
    const finalAmount = Number(amount);

    const lockedUser = await User.findOneAndUpdate({ _id: req.user.id, isProcessingTx: false }, { isProcessingTx: true }, { new: true });
    if (!lockedUser) return res.status(400).json({ message: "Transaction in progress" });

    let transaction = null;
    try {
        if (lockedUser.totalBalance < finalAmount) {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "Insufficient balance" });
        }

        transaction = await Transaction.create({ 
            userId: req.user.id, type: "debit", status: "pending", amount: finalAmount, phone, 
            description: `Electricity: ${discoId} (${meterNumber})`, reference: `ELE-PND-${Date.now()}`
        });

        const vtu = await buyElectricity(discoId, meterType, meterNumber, finalAmount, phone);
        if (vtu && vtu.status === "success") {
            const deducted = await deductBalance(req.user.id, finalAmount);
            transaction.status = "success";
            transaction.token = vtu.token;
            transaction.api_response = vtu.data;
            await transaction.save();
            sendTransactionNotification(transaction);
            return res.json({ message: "Success", token: vtu.token, reference: transaction.reference });
        } else {
            transaction.status = "failed";
            transaction.api_response = vtu?.data || { error: vtu?.message || "Purchase failed" };
            await transaction.save();
            sendTransactionNotification(transaction);
            return res.status(400).json({ message: vtu?.message || "Purchase failed" });
        }
    } catch (err) {
        console.error("[Electricity Error]", err);
        try {
            if (transaction && transaction._id) {
                await Transaction.findByIdAndUpdate(transaction._id, { status: 'failed', description: `Electricity: ${discoId} (System Error)`, api_response: { error: err.message } });
            }
        } catch (e) {}
        return res.status(500).json({ message: "System error" });
    } finally {
        await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
    }
});

app.post("/buy-epin", auth, verifyTransactionPin, async (req, res) => {
    const { network, amount, quantity } = req.body;
    const finalAmount = Number(amount);

    const lockedUser = await User.findOneAndUpdate({ _id: req.user.id, isProcessingTx: false }, { isProcessingTx: true }, { new: true });
    if (!lockedUser) return res.status(400).json({ message: "Transaction in progress" });

    let transaction = null;
    try {
        if (lockedUser.totalBalance < finalAmount) {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "Insufficient balance" });
        }

        transaction = await Transaction.create({ 
            userId: req.user.id, type: "debit", status: "pending", amount: finalAmount, 
            description: `${network} EPIN (Qty: ${quantity})`, reference: `EPN-PND-${Date.now()}`
        });

        const vtu = await buyEPIN(network, finalAmount / quantity, quantity);
        if (vtu && vtu.status === "success") {
            const deducted = await deductBalance(req.user.id, finalAmount);
            transaction.status = "success";
            transaction.token = vtu.token;
            transaction.api_response = vtu.data;
            await transaction.save();
            sendTransactionNotification(transaction);
            return res.json({ message: "Success", token: vtu.token, reference: transaction.reference });
        } else {
            transaction.status = "failed";
            transaction.api_response = vtu?.data || { error: vtu?.message || "Purchase failed" };
            await transaction.save();
            sendTransactionNotification(transaction);
            return res.status(400).json({ message: vtu?.message || "Purchase failed" });
        }
    } catch (err) {
        console.error("[EPIN Error]", err);
        try {
            if (transaction && transaction._id) {
                await Transaction.findByIdAndUpdate(transaction._id, { status: 'failed', description: `EPIN: ${network} (System Error)`, api_response: { error: err.message } });
            }
        } catch (e) {}
        return res.status(500).json({ message: "System error" });
    } finally {
        await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
    }
});

app.post("/buy-education", auth, verifyTransactionPin, async (req, res) => {
    const { examType, phone, amount } = req.body;
    const finalAmount = Number(amount) || 2000;

    const lockedUser = await User.findOneAndUpdate({ _id: req.user.id, isProcessingTx: false }, { isProcessingTx: true }, { new: true });
    if (!lockedUser) return res.status(400).json({ message: "Transaction in progress" });

    let transaction = null;
    try {
        if (lockedUser.totalBalance < finalAmount) {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "Insufficient balance" });
        }

        transaction = await Transaction.create({ 
            userId: req.user.id, type: "debit", status: "pending", amount: finalAmount, phone, 
            description: `Education: ${examType}`, reference: `EDU-PND-${Date.now()}`
        });

        const vtu = await buyEducation(examType, phone);
        if (vtu && vtu.status === "success") {
            const deducted = await deductBalance(req.user.id, finalAmount);
            transaction.status = "success";
            transaction.token = vtu.token;
            transaction.api_response = vtu.data;
            await transaction.save();
            sendTransactionNotification(transaction);
            return res.json({ message: "Success", token: vtu.token, reference: transaction.reference });
        } else {
            transaction.status = "failed";
            transaction.api_response = vtu?.data || { error: vtu?.message || "Purchase failed" };
            await transaction.save();
            sendTransactionNotification(transaction);
            return res.status(400).json({ message: vtu?.message || "Purchase failed" });
        }
    } catch (err) {
        console.error("[Education Error]", err);
        try {
            if (transaction && transaction._id) {
                await Transaction.findByIdAndUpdate(transaction._id, { status: 'failed', description: `Education: ${examType} (System Error)`, api_response: { error: err.message } });
            }
        } catch (e) {}
        return res.status(500).json({ message: "System error" });
    } finally {
        await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
    }
});

app.get("/transactions", auth, async (req, res) => {
    res.json(await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 }));
});

app.get("/notifications", auth, async (req, res) => {
  try {
    const personal = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const system = await SystemNotification.find({ $or: [{ target: 'all' }, { target: 'individual', userId: req.user.id }] }).sort({ createdAt: -1 });
    const combined = [...personal.map(n => ({...n._doc, source: 'personal'})), ...system.map(n => ({...n._doc, source: 'system'}))].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(combined);
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.post("/logout", auth, async (req, res) => {
    let token = req.headers.authorization.split(" ")[1];
    await Session.findOneAndUpdate({ token }, { isValid: false });
    res.json({ message: "Logged out" });
});

// USER WALLET ROUTES
app.get("/user/withdrawals", auth, async (req, res) => {
  try {
    const history = await Withdrawal.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Error fetching withdrawals" });
  }
});

app.post("/user/withdraw", auth, verifyTransactionPin, async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountName } = req.body;
    if (amount < 100) return res.status(400).json({ message: "Minimum withdrawal is ₦100" });
    
    const user = await User.findById(req.user.id);
    let finalAmount = Number(amount);

    console.log("--- Withdrawal Debug ---");
    console.log("Wallet (Total):", user.totalBalance);
    console.log("Request Amount:", amount);

    if (user.totalBalance < finalAmount) return res.status(400).json({ message: "Insufficient balance" });

    const deducted = await deductBalance(req.user.id, finalAmount);
    if (!deducted) return res.status(400).json({ message: "Insufficient balance" });

    const withdrawal = new Withdrawal({
      userId: req.user.id,
      amount,
      bankName,
      accountNumber,
      accountName,
      status: 'pending'
    });
    await withdrawal.save();

    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'debit',
      status: 'pending',
      amount,
      description: `Withdrawal to ${bankName}`,
      reference: `WDR-${Date.now()}`
    });

    sendTransactionNotification(transaction);

    res.json({ message: "Withdrawal request submitted successfully", balance: (deducted.balance1 + deducted.balance2) });
  } catch (err) {
    console.error("WITHDRAW ERROR:", err);
    res.status(500).json({ message: "Error submitting withdrawal" });
  }
});

app.post("/fund", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);
    // Fund balance1 for test
    user.balance1 += Number(amount);
    await user.save();
    
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'credit',
      status: 'success',
      amount: Number(amount),
      description: 'Test Funding (Wallet)',
      reference: `FUND-${Date.now()}`
    });

    sendTransactionNotification(transaction);
    
    res.json({ message: "Wallet funded successfully!", balance: (user.balance1 + user.balance2) });
  } catch (err) {
    res.status(500).json({ message: "Error funding wallet" });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "mk-vtu-frontend", "dist")));
app.get(/.*/, (req, res) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/auth") || req.path.startsWith("/user") || req.path.startsWith("/buy-")) return res.status(404).end();
    res.sendFile(path.join(__dirname, "mk-vtu-frontend", "dist", "index.html"));
});



app.listen(process.env.PORT || 3000, () => {
    console.log("Server running 🚀");
});
