// RESTART: 2026-05-01T13:42:00Z
import dotenv from "dotenv";
import http from "http";
import systemLogger from "./services/logger.js";

process.on("uncaughtException", (err) => {
    systemLogger.critical({
        service: "system",
        module: "server",
        action: "uncaught_exception",
        message: err.message || "Unhandled server error",
        stack_trace: err.stack,
        recommended_action: "Restart the node application and check stack trace"
    });
});

process.on("unhandledRejection", (reason, promise) => {
    systemLogger.error({
        service: "system",
        module: "server",
        action: "unhandled_rejection",
        message: reason instanceof Error ? reason.message : String(reason),
        stack_trace: reason instanceof Error ? reason.stack : undefined,
        recommended_action: "Debug the unhandled promise rejection"
    });
});
import cron from "node-cron";
import { syncDailyAnalytics } from "./services/supabaseAnalytics.js";
import dns from "dns";
// dns.setServers(['8.8.8.8', '8.8.4.4']);
import path from "path";
const stage = process.argv.find(arg => arg.startsWith('--stage='))?.split('=')[1] || 'production';
const envFile = stage === 'staging' ? '.env.staging' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
console.log(`[System] Initializing in ${stage.toUpperCase()} mode using ${envFile}`);
import cors from "cors";
import compression from "compression";
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import multer from "multer";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import axios from "axios";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import os from "os";
import { startRequeryJob, triggerImmediateVerification } from "./services/requeryService.js";
import Transaction from "./models/Transaction.js";
import User from "./models/User.js";
import SystemSetting from "./models/SystemSetting.js";
import PriceOverride from "./models/PriceOverride.js";
import AdminPricingOverride from "./models/AdminPricingOverride.js";
import PricingSettings from "./models/PricingSettings.js";
import PricingRule from "./models/PricingRule.js";
import OTP from "./models/OTP.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import contentRoutes from "./routes/contentRoutes.js";
import Notification from "./models/Notification.js";
import SystemNotification from "./models/SystemNotification.js";
import Session from "./models/Session.js";
import biometricRoutes from "./routes/biometricRoutes.js";
import dataCategoryRoutes from "./routes/dataCategoryRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import publicApiRoutes from "./routes/publicApiRoutes.js";
import developerRoutes from "./routes/developerRoutes.js";
import { transactionIdempotency } from "./middlewares/idempotency.js";
import { startMemoryMonitor, registerCleanup } from "./services/memoryProtectionService.js";
import { clearResellerCache } from "./middlewares/whiteLabel.js";
import { initializeTestMode } from "./utils/testModeAdapter.js";

// Initialize mock adapter if in TEST_MODE
initializeTestMode();
import { clearTelemetryCache, getLatestCpuUsage } from "./controllers/adminController.js";
import resellerPricingRoutes from "./routes/reseller/resellerPricingRoutes.js";
import retailPurchaseRoutes from "./routes/retail/retailPurchaseRoutes.js";
import plotRoutes from "./routes/plotRoutes.js";
import serviceStatusRoutes from "./routes/serviceStatusRoutes.js";
import marketingRoutes from "./routes/marketingRoutes.js";
import { sendTransactionReceiptEmail, sendOTPEmail, sendSupportEmail, sendTransactionNotification } from "./services/emailService.js";
import { generateTemporaryAccount, generatePermanentAccount } from "./services/accountService.js";
import { apiAuth, generateApiCredentials } from "./middlewares/apiAuth.js";
import { buyAirtime, buyElectricity, buyEPIN, buyEducation, buyData, buyCableTV } from "./services/vtuService.js";
import Withdrawal from "./models/Withdrawal.js";
import { deductBalance, refundBalance, deductEarnings } from "./services/walletService.js";
import BlogPost from "./models/BlogPost.js";
import DataPlan from "./models/DataPlan.js";
import ProviderCategory from "./models/ProviderCategory.js";
import ResellerRequest from "./models/ResellerRequest.js";
import { adminAuth } from "./middlewares/adminAuth.js";
import { getReloadlyOperators } from "./services/providers/reloadly.js";
import { createVirtualAccount } from "./services/flutterwaveService.js";
import { whiteLabelMiddleware } from "./middlewares/whiteLabel.js";
import { maintenanceMiddleware } from "./middlewares/maintenanceMiddleware.js";
import resellerRoutes from "./routes/resellerRoutes.js";
import { smartFetchDataPlans, smartBuyAirtime, smartBuyData } from "./services/switcher.js";
import { startResellerMaintenanceWorker } from "./services/resellerService.js";
import { checkProviderAvailability } from "./services/providerMonitoringService.js";
import managementRoutes from "./routes/managementRoutes.js";
import intelligenceRoutes from "./routes/intelligenceRoutes.js";
import diagnosticRoutes from "./routes/diagnosticRoutes.js";
import aiAssistantRoutes from "./routes/aiAssistantRoutes.js";
import deploymentRoutes from "./routes/deploymentRoutes.js";
import tenantRoutes from "./routes/tenantRoutes.js";

// Utility to ensure plan names never leak wholesale or api prices
const cleanPlanName = (name) => {
    if (!name) return '';
    return name
        .replace(/(?:[-=@]?\s*\(?(?:₦|NGN|#)\s*\d+(?:,\d{3})*(?:\.\d+)?\)?|\bN\s*\d+(?:,\d{3})*(?:\.\d+)?\b)/gi, '')
        .replace(/(?:[-=@]\s*)?\b\d{2,}\b\s*$/, '')
        .replace(/\(\s*\)/g, '')
        .replace(/\s+-\s*$/, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
};
import { CONNECTBRIDGE_PLANS } from "./config/connectBridgePlans.js";
import fs from "fs";
const JARAPOINT_PLANS = JSON.parse(fs.readFileSync("./services/providers/jarapoint_plans.json", "utf8"));
console.log(`[Startup] Loaded ${JARAPOINT_PLANS.length} Jarapoint plans.`);


import { calculateVtuPrice, calculateBulkDataPrices } from './services/pricing/vtuPricing.js';
import queueService from './services/queueService.js';
import { jobQueue } from './services/jobQueueService.js';
import { startProviderMonitoring } from './services/providerMonitoringService.js';
import logger from './services/loggerService.js';
import { initBackupScheduler } from './services/backupService.js';
import storage from './services/storageAdapter.js';
import socketService from './services/socketService.js';
import reconciliationService from './services/reconciliationService.js';

const app = express();
app.set('trust proxy', 1);

// DEBUG LOGGING MIDDLEWARE
app.use((req, res, next) => {
    if (req.url.includes('EIO=')) {
        console.log('[SOCKET DEBUG] HTTP Request received in Express:', req.method, req.url, req.headers);
    }
    next();
});

// queueService.startWorker(); // Moved to startServer

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(compression());

// --- HIGH-SECURITY BINARY APK STREAMING ENDPOINT ---
app.get("/reseller-assets/:brandName/:filename", async (req, res, next) => {
    const { brandName, filename } = req.params;
    if (!filename?.toLowerCase().endsWith(".apk")) {
        return next(); // Let standard static images/logs fall through standardly
    }

    const targetPath = path.join(process.cwd(), "reseller-assets", brandName, filename);
    const universalPath = path.join(process.cwd(), "reseller-assets", "testbrandedapp", "app-release.apk");
    
    let finalApkPath = null;
    if (fs.existsSync(targetPath)) {
        finalApkPath = targetPath;
    } else if (fs.existsSync(universalPath)) {
        finalApkPath = universalPath;
    }

    if (!finalApkPath) {
        return res.status(404).json({ 
            status: "error", 
            message: "Requested APK file is not found or build generation is currently in progress." 
        });
    }

    try {
        const relativePath = `reseller-assets/${brandName}/${filename}`;
        const stats = await storage.getStats(relativePath);
        
        if (!stats || stats.size < 1024 * 1024) {
            return res.status(404).json({ 
                status: "error", 
                message: "APK download validation failed: Payload missing or corrupted." 
            });
        }

        // Set robust Content-Type and download forcing Content-Disposition headers
        res.setHeader("Content-Type", "application/vnd.android.package-archive");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Length", stats.size);
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        
        const absolutePath = path.join(process.cwd(), relativePath);
        const fileStream = fs.createReadStream(absolutePath);
        fileStream.pipe(res);
        
        logger.info(`APK Downloaded: ${filename}`, { brandName, size: stats.sizeMb });
    } catch (err) {
        logger.error("APK Stream Failure", { brandName, filename, error: err.message });
        res.status(500).json({ status: "error", message: "Failed to read binary package." });
    }
});

// Serve Reseller Assets with optimization headers
app.use("/reseller-assets", express.static(path.join(process.cwd(), "reseller-assets"), {
    maxAge: '1d',
    etag: true,
    lastModified: true
}));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), {
    maxAge: '1h',
    etag: true
}));

// SECURITY MIDDLEWARE
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Root Health Check (must be before SPA wildcard and whiteLabel)
const healthHandler = (req, res) => {
    const dbState = mongoose.connection.readyState;
    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
    };
    const isHealthy = dbState === 1;
    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? "success" : "error",
        database: states[dbState] || "unknown",
        timestamp: new Date().toISOString()
    });
};
app.get("/health", healthHandler);
app.get("/api/health", healthHandler);
app.use(whiteLabelMiddleware);
app.use(maintenanceMiddleware);

// --- DYNAMIC MULTI-TENANT PWA MANIFEST GENERATION ---
app.get("/manifest.json", async (req, res) => {
    try {
        const reseller = req.reseller;
        const appName = reseller?.appSettings?.appName || reseller?.branding?.siteName || reseller?.name || "MKSubData";
        const cleanBrand = appName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const primaryColor = reseller?.appSettings?.appColors?.primary || reseller?.branding?.primaryColor || "#3B82F6";
        const bgColor = reseller?.appSettings?.appColors?.secondary || reseller?.branding?.backgroundColor || "#0a0a0a";
        
        // Ensure absolute paths for asset rendering reliability inside PWABuilder Android engine
        const hostUrl = `${req.protocol}://${req.get('host')}`;
        const hasCustomAssets = reseller?.appSettings?.generatedAssets?.isReady;
        
        const defaultIcons = [
            {
                src: `${hostUrl}/logo192.png`,
                sizes: "192x192",
                type: "image/png",
                purpose: "any maskable"
            },
            {
                src: `${hostUrl}/logo512.png`,
                sizes: "512x512",
                type: "image/png",
                purpose: "any maskable"
            }
        ];

        const customIcons = hasCustomAssets ? [
            {
                src: `${hostUrl}/reseller-assets/${cleanBrand}/icon.png`,
                sizes: "192x192",
                type: "image/png",
                purpose: "any maskable"
            },
            {
                src: `${hostUrl}/reseller-assets/${cleanBrand}/icon.png`,
                sizes: "512x512",
                type: "image/png",
                purpose: "any maskable"
            }
        ] : defaultIcons;

        const screenshots = hasCustomAssets && reseller.appSettings.generatedAssets.screenshots?.length > 0
            ? reseller.appSettings.generatedAssets.screenshots.map(ss => ({
                src: ss.startsWith('http') ? ss : `${hostUrl}${ss}`,
                sizes: "1080x1920",
                type: "image/png",
                form_factor: "narrow"
            }))
            : [];

        const manifestPayload = {
            name: appName,
            short_name: appName.length > 12 ? appName.substring(0, 12) : appName,
            start_url: "/",
            display: "standalone",
            orientation: "portrait",
            background_color: bgColor,
            theme_color: primaryColor,
            description: reseller?.appSettings?.playStoreMetadata?.shortDescription || `Top up airtime, data, and pay bills instantly with ${appName}.`,
            icons: customIcons,
            screenshots: screenshots
        };

        res.setHeader("Content-Type", "application/manifest+json");
        return res.json(manifestPayload);
    } catch (err) {
        console.error("[ManifestGen] Error generating dynamic manifest:", err.message);
        return res.status(500).json({ error: "Failed to load manifest properties." });
    }
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000, // Increased for development
  message: { message: "Too many requests, please try again later." },
  skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === 'localhost'
});
app.use("/api", limiter);
app.use("/auth", limiter);

// --- PUBLIC GUARANTEED BINARY APK STREAMING ROUTE ---
// DEPRECATED: Reseller APK delivery has migrated entirely to Supabase Storage.
// Legacy localhost streaming route has been removed.

// Request Logger for Debugging
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path} from ${req.headers.origin || 'No Origin'}`);
    next();
});

const connectDB = async () => {
    let retries = 5;
    while (retries) {
        try {
            const connString = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";
            mongoose.set('bufferCommands', true);
            await mongoose.connect(connString, {
                serverSelectionTimeoutMS: 15000, // 15 seconds fast-fail
                socketTimeoutMS: 45000, // 45 seconds
                maxPoolSize: 100,
                minPoolSize: 10,
                retryWrites: true
            });
            
            console.log(`MongoDB Connected ✅ (${mongoose.connection.host})`);
            
            // Clear any stuck transaction locks on startup
            try {
                await User.updateMany({}, { isProcessingTx: false });
                console.log("Cleared all transaction locks 🔓");
            } catch (e) {
                console.warn("Could not clear transaction locks on startup:", e.message);
            }
            break;
        } catch (err) {
            console.error("MongoDB Connection Error ❌:", err.message);
            retries -= 1;
            console.log(`Retrying connection in 5 seconds... (${retries} retries left)`);
            if (retries === 0) {
                console.error("Could not connect to MongoDB after multiple retries. Exiting...");
                process.exit(1);
            }
            await new Promise(res => setTimeout(res, 5000));
        }
    }
};



const auth = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: "No token" });
    }
    if (token.startsWith("Bearer ") || token.startsWith("Token ")) token = token.split(" ")[1];
    
    const secret = process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium";
    const verified = jwt.verify(token, secret);
    req.session_type = verified.session_type || 'retail';
    
    const session = await Session.findOne({ token, userId: verified.id, isValid: true });
    if (!session) {
        return res.status(401).json({ message: "Session expired." });
    }

    const resellerId = req.reseller?._id || null;
    const user = await User.findByIdAndTenant(verified.id, resellerId);

    if (!user) {
        return res.status(401).json({ message: "Session invalid for this platform." });
    }

    if (user.isSuspended) {
        return res.status(403).json({ message: "Account suspended." });
    }
    
    req.user = user;
    next();
  } catch (err) { 
    console.error(`[Auth] Verification failed for ${req.path}:`, err.message);
    res.status(401).json({ message: "Invalid token" }); 
  }
};


const restrictToRetailSession = (req, res, next) => {
  if (req.user && req.user.role !== 'admin' && req.session_type !== 'retail') {
    return res.status(403).json({ message: "Access Denied: Retail Session Required." });
  }
  next();
};

const restrictToBusinessSession = (req, res, next) => {
  if (req.user && req.user.role !== 'admin' && req.session_type !== 'business') {
    return res.status(403).json({ message: "Access Denied: Business Session Required." });
  }
  next();
};

const verifyTransactionPin = async (req, res, next) => {
    try {
        let { transactionPin, amount, biometricData } = req.body;
        if (!amount && req.body.value && req.body.quantity) amount = req.body.value * req.body.quantity;
        
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check PIN Lockout
        if (user.pinLockoutUntil && user.pinLockoutUntil > new Date()) {
            const remaining = Math.ceil((user.pinLockoutUntil - new Date()) / 60000);
            return res.status(403).json({ message: `Transaction PIN locked. Try again in ${remaining} minutes.` });
        }

        // Reset lock if expired
        if (user.pinLockoutUntil && user.pinLockoutUntil <= new Date()) {
            user.failedPinAttempts = 0;
            user.pinLockoutUntil = undefined;
            await user.save();
        }

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
                
                user.failedPinAttempts = (user.failedPinAttempts || 0) + 1;
                if (user.failedPinAttempts >= 3) {
                    user.pinLockoutUntil = new Date(Date.now() + 10 * 60000); // 10 minutes lockout
                    await user.save();
                    return res.status(403).json({ message: "Incorrect PIN. Max attempts reached. Wallet transactions locked for 10 minutes." });
                }
                
                await user.save();
                return res.status(400).json({ message: `Incorrect PIN. ${3 - user.failedPinAttempts} attempts remaining.` });
            }
        }
        
        if (user.failedPinAttempts > 0 || user.pinLockoutUntil) {
            user.failedPinAttempts = 0;
            user.pinLockoutUntil = undefined;
            await user.save();
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
app.use("/api/user", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/content", contentRoutes);
app.use("/api/biometric", biometricRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/plots", plotRoutes);
app.use("/api/public", publicApiRoutes);
app.use("/api/marketing", marketingRoutes);
app.use("/api/developer", developerRoutes);
app.use("/api/reseller/v2/pricing", resellerPricingRoutes);
app.use("/api/retail/purchase", retailPurchaseRoutes);
app.use("/api/service-status", serviceStatusRoutes);
app.use("/api/data-categories", dataCategoryRoutes);
app.use("/api/management", managementRoutes);
app.use("/api/intelligence", intelligenceRoutes);
app.use("/api/diagnostics", diagnosticRoutes);
app.use("/api/ai", aiAssistantRoutes);
app.use("/api/deployment", deploymentRoutes);
app.use("/api/tenant", tenantRoutes);

// --- NEW INSERTION: PAYMENT GATEWAY CONFIG (Strictly Additive) ---
import gatewayConfigRoutes from "./routes/gatewayConfigRoutes.js";
app.use("/api/admin/gateways", gatewayConfigRoutes);
// -----------------------------------------------------------------

// --- RESELLER ONBOARDING & ACTIVATION (MUST BE BEFORE /api/reseller ROUTER) ---
app.post("/api/reseller/activate-intent", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.isEmailVerified) return res.status(403).json({ message: "Email verification required before performing this action." });
        if (user.role !== 'user') return res.status(400).json({ message: "You are already a reseller or admin." });
        // Block only users accessing from a reseller's tenant subdomain (white-label context).
        // Retail users who were referred via a referral link on the Main Platform are allowed to become Website Owners.
        if (req.reseller) {
            return res.status(400).json({ message: "Reseller customers are not eligible to become resellers." });
        }
        
        user.resellerActivationStatus = 'pending_onboarding';
        await user.save();
        res.json({ status: 'success', message: 'Ready to start. Please complete your brand profile.', user });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// [DEPRECATED] app.post("/api/reseller/pay-activation", auth, async (req, res) => {
// [DEPRECATED]     try {
// [DEPRECATED]         const user = await User.findById(req.user.id);
// [DEPRECATED]         if (!user.isEmailVerified) return res.status(403).json({ message: "Email verification required before performing this action." });
// [DEPRECATED]         if (user.role !== 'reseller_admin') return res.status(400).json({ message: "Only resellers can pay activation fees." });
// [DEPRECATED]         if (user.isResellerActivated) return res.status(400).json({ message: "Reseller account already activated." });
// [DEPRECATED]         
// [DEPRECATED]         const fee = 5000;
// [DEPRECATED]         if (user.totalBalance < fee) return res.status(400).json({ message: "Insufficient balance. Activation fee is ₦5,000." });
// [DEPRECATED] 
// [DEPRECATED]         const updatedUser = await deductBalance(user._id, fee);
// [DEPRECATED]         if (!updatedUser) {
// [DEPRECATED]             return res.status(500).json({ message: "Failed to process activation payment. Please try again." });
// [DEPRECATED]         }
// [DEPRECATED]         
// [DEPRECATED]         user.isResellerActivated = true;
// [DEPRECATED]         user.isGracePeriod = false;
// [DEPRECATED]         user.resellerActivationStatus = 'active';
// [DEPRECATED]         user.whiteLabelStatus = 'active';
// [DEPRECATED] 
// [DEPRECATED]         // --- REFERRAL REWARD: Credit the referrer on successful ₦5,000 Website Owner activation ---
// [DEPRECATED]         if (user.referredBy) {
// [DEPRECATED]             try {
// [DEPRECATED]                 const settings = await SystemSetting.findOne() || {};
// [DEPRECATED]                 const growthSettings = settings.growthInfrastructure || {};
// [DEPRECATED]                 const reward = growthSettings.websiteOwnerReferralReward || 2000;
// [DEPRECATED] 
// [DEPRECATED]                 const referrer = await User.findById(user.referredBy);
// [DEPRECATED]                 if (referrer && referrer._id.toString() !== user._id.toString()) {
// [DEPRECATED]                     // Idempotency guard: check if a Website Owner activation reward has already been
// [DEPRECATED]                     // issued for this referrer for this specific user's activation.
// [DEPRECATED]                     // We do NOT use activationRewardGiven because creditBalance() sets that flag
// [DEPRECATED]                     // on the first wallet funding (retail reward), before activation happens.
// [DEPRECATED]                     const alreadyRewarded = await Transaction.exists({
// [DEPRECATED]                         userId: referrer._id,
// [DEPRECATED]                         type: 'credit',
// [DEPRECATED]                         status: 'success',
// [DEPRECATED]                         reference: { $regex: new RegExp(`^REF-REWARD-`) },
// [DEPRECATED]                         description: { $regex: new RegExp(user._id.toString()) }
// [DEPRECATED]                     });
// [DEPRECATED] 
// [DEPRECATED]                     if (!alreadyRewarded) {
// [DEPRECATED]                         // Credit reward to referrer's earnings wallet
// [DEPRECATED]                         referrer.earningsBalance = (referrer.earningsBalance || 0) + reward;
// [DEPRECATED]                         await referrer.save();
// [DEPRECATED] 
// [DEPRECATED]                         // Create reward transaction for the referrer
// [DEPRECATED]                         await Transaction.create({
// [DEPRECATED]                             userId: referrer._id,
// [DEPRECATED]                             resellerId: referrer.referredBy || referrer._id,
// [DEPRECATED]                             amount: reward,
// [DEPRECATED]                             type: 'credit',
// [DEPRECATED]                             status: 'success',
// [DEPRECATED]                             description: `Activation Reward for referring ${user.name || 'New User'} (${user._id})`,
// [DEPRECATED]                             provider: 'System',
// [DEPRECATED]                             reference: `REF-REWARD-${Date.now()}`
// [DEPRECATED]                         });
// [DEPRECATED] 
// [DEPRECATED]                         // Notify the referrer
// [DEPRECATED]                         await Notification.create({
// [DEPRECATED]                             userId: referrer._id,
// [DEPRECATED]                             title: 'Referral Reward Earned!',
// [DEPRECATED]                             message: `You earned ₦${reward.toLocaleString()} because your referral (${user.name || user.email}) successfully activated their Basic Website Owner plan.`,
// [DEPRECATED]                             type: 'system'
// [DEPRECATED]                         });
// [DEPRECATED]                     }
// [DEPRECATED]                 }
// [DEPRECATED]             } catch (rewardErr) {
// [DEPRECATED]                 // Log but do not fail the activation — the payment has already been processed
// [DEPRECATED]                 console.error('[pay-activation] Referral reward error (non-fatal):', rewardErr.message);
// [DEPRECATED]             }
// [DEPRECATED]         }
// [DEPRECATED]         // --- END REFERRAL REWARD ---
// [DEPRECATED] 
// [DEPRECATED]         await user.save();
// [DEPRECATED] 
// [DEPRECATED]         await Transaction.create({
// [DEPRECATED]             userId: user._id,
// [DEPRECATED]             amount: fee,
// [DEPRECATED]             type: 'debit',
// [DEPRECATED]             status: 'success',
// [DEPRECATED]             description: 'Reseller Business Activation Fee',
// [DEPRECATED]             reference: 'RES-ACT-' + Date.now()
// [DEPRECATED]         });
// [DEPRECATED] 
// [DEPRECATED]         const freshUser = await User.findById(user._id).select('-password');
// [DEPRECATED]         res.json({ status: 'success', message: 'Business activated successfully!', user: freshUser });
// [DEPRECATED]     } catch (err) { res.status(500).json({ message: err.message }); }
// [DEPRECATED] });

app.get("/api/reseller/check-subdomain", auth, async (req, res) => {
    try {
        const { subdomain } = req.query;
        if (!subdomain) return res.status(400).json({ message: "Subdomain required" });
        const existing = await User.findOne({ subdomain: subdomain.toLowerCase() });
        res.json({ available: !existing });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/reseller/check-custom-domain", auth, async (req, res) => {
    try {
        const { domain } = req.query;
        if (!domain) return res.status(400).json({ message: "Domain required" });
        
        const cleanDomain = domain.toLowerCase().trim();
        
        // 1. Check active reseller custom domains
        const existingUser = await User.findOne({ customDomain: cleanDomain });
        if (existingUser) {
            return res.json({ available: false, reason: "This domain is already connected to another brand." });
        }
        
        // 2. Check pending/processing requests for the same domain
        const existingRequest = await ResellerRequest.findOne({
            requestedDomain: cleanDomain,
            domainOption: "own_domain",
            status: { $in: ["pending", "approved", "processing_domain"] }
        });
        if (existingRequest) {
            return res.json({ available: false, reason: "This domain is currently pending setup." });
        }
        
        res.json({ available: true });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/reseller/submit-onboarding", auth, async (req, res) => {
    try {
        const { branding, domainOption, requestedDomain } = req.body;
        const user = await User.findById(req.user.id);
        if (!user.isEmailVerified) return res.status(403).json({ message: "Email verification required before performing this action." });
        // Block only users in a reseller's white-label tenant context.
        // Main Platform retail users (including referred users) are allowed to convert to Website Owners.
        if (req.reseller) {
            return res.status(400).json({ message: "Reseller customers are not eligible to become resellers." });
        }
        
        const uniqueSubdomain = requestedDomain?.toLowerCase() || branding.siteName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() + Math.floor(1000 + Math.random() * 9000);

        const request = await ResellerRequest.create({
            userId: user._id,
            brandName: branding.siteName,
            whatsapp: branding.whatsappNumber,
            supportEmail: branding.contactEmail,
            domainOption,
            requestedDomain: requestedDomain?.toLowerCase() || uniqueSubdomain,
            primaryColor: branding.primaryColor,
            secondaryColor: branding.secondaryColor,
            isPaid: true
        });

        user.resellerActivationStatus = 'active';
        user.role = 'reseller_admin';
        user.subdomain = requestedDomain?.toLowerCase() || uniqueSubdomain;
        user.admin_subdomain = requestedDomain?.toLowerCase() || uniqueSubdomain;
        user.independence_redirect_enabled = true;
        user.onboardingData = { ...branding, requestedDomain, domainOption };
        await user.save();

        res.json({ status: 'success', message: 'Website Owner account created and activated successfully.', request });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.use("/api/reseller", resellerRoutes);

// Multi-Tenant Diagnostics (Internal Debug)
app.get("/api/diagnostics/tenant", (req, res) => {
    res.json({
        host: req.headers.host,
        detectedReseller: req.reseller ? {
            id: req.reseller._id,
            name: req.reseller.name,
            subdomain: req.reseller.subdomain
        } : "Main Platform (Tenant ID: null)"
    });
});

// calculateVtuPrice extracted


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



app.post("/api/register", async (req, res) => {
  try {
    const { name, password, transactionPin, referralCode } = req.body;
    const email = req.body.email?.toLowerCase();
    const host = req.headers.host;

    if (!email) return res.status(400).json({ message: "Email is required" });

    let resellerId = req.reseller?._id || null;
    
    // Process retail referral if on main domain
    if (!resellerId && referralCode) {
        try {
            const query = [{ referralCode: referralCode }];
            // Import mongoose at top or use from global if already there.
            // Assuming mongoose is already imported in server.js
            if (referralCode.match(/^[0-9a-fA-F]{24}$/)) {
                query.push({ _id: referralCode });
            }
            const referrer = await User.findOne({ $or: query });
            if (referrer && (referrer.role === 'reseller_admin' || referrer.resellerActivationStatus === 'active' || referrer.whiteLabelStatus === 'active')) {
                resellerId = referrer._id;
            }
        } catch (e) {
            // Ignore invalid referral code format
        }
    }

    console.log(`[Register] Request: email=${email}, Host=${req.headers.host}, TenantID=${resellerId || 'Main'}`);
    
    // 1. Strict existence check scoped to current tenant
    const existingUser = await User.findByTenant(email, resellerId);
    if (existingUser) {
        console.log(`[Register] BLOCKED: User ${email} already exists in tenant context: ${resellerId || 'Main'}`);
        return res.status(400).json({ message: "An account with this email already exists on this platform." });
    }
    
    // 2. Prepare user data
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPin = transactionPin ? await bcrypt.hash(transactionPin, 10) : "";
    
    // Resolve standard referrer if applicable
    let standardReferrerId = null;
    if (!resellerId && referralCode) {
        try {
            const rQuery = [{ referralCode: referralCode }];
            if (referralCode.match(/^[0-9a-fA-F]{24}$/)) rQuery.push({ _id: referralCode });
            const sRef = await User.findOne({ $or: rQuery });
            if (sRef) standardReferrerId = sRef._id;
        } catch (e) {}
    }

    const user = new User({ 
        name: name || email.split('@')[0], 
        email, 
        password: hashedPassword,
        transactionPin: hashedPin,
        referredBy: resellerId || standardReferrerId, // Use the reseller ID, or standard referrer
        referralCodeUsed: (!req.reseller && referralCode) ? referralCode : undefined,
        role: 'user', // Force role to 'user' to prevent privilege escalation / body injection
        tenantOwnerId: resellerId // Ensure tenant isolation works
    });
    
    await user.save();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    await OTP.create({ userId: user._id, hashedOtp, expiresAt: new Date(Date.now() + 5*60*1000) });
    sendOTPEmail(user.email, otp).catch(err => console.error("[Signup] OTP Email Error:", err.message));
    res.json({ message: "Registered. Verify email.", email: user.email });
  } catch (err) { 
    console.error("[Register] CRITICAL ERROR:", err);
    const isMongoError = err.name === 'MongoError' || err.name === 'MongooseError' || err.message.includes('buffering timed out');
    const isEmailError = err.message.includes('SMTP') || err.message.includes('Mail');
    
    let message = "Registration failed. Please try again.";
    if (isMongoError) message = "Database connection error. Our team is investigating.";
    if (isEmailError) message = "Account created but failed to send verification email. Please try logging in.";

    res.status(500).json({ 
        message,
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    }); 
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email?.toLowerCase();
    let sessionType = req.body.session_type || 'retail';

    if (!email) return res.status(400).json({ message: "Email is required" });

    // Tenant-aware login
    const resellerId = req.reseller?._id || null;
    sessionType = resellerId ? 'retail' : sessionType;

    let user = await User.findByTenant(email, resellerId);
    
    if (!user && resellerId) {
        // Fallback for allowing reseller owners to log into their own site
        const potentialOwner = await User.findById(resellerId);
        if (potentialOwner && potentialOwner.email.toLowerCase() === email) {
            user = potentialOwner;
        }
    }

    console.log(`[Login Debug] Searching for: ${email} in tenant ${resellerId || 'Main'} | Found: ${user ? 'YES' : 'NO'}`);
    
    if (!user) {
        console.log(`[Login] Failure: User not found (${email}) in tenant ${resellerId || 'Main'}`);
        return res.status(400).json({ message: "User not found" });
    }

    // Enforce dual-account role validation
    const isBusinessAccount = (u) => {
        return u && (
            u.role === 'reseller_admin' ||
            u.resellerActivationStatus === 'active' ||
            u.whiteLabelStatus === 'active' ||
            u.apiLevel === 'reseller'
        );
    };

    const isOwner = resellerId && user._id.toString() === resellerId.toString();
    const isGlobalReseller = !resellerId && isBusinessAccount(user);
    // On a reseller storefront login, all users act as retail customers
    const isBiz = resellerId ? false : (isOwner || isGlobalReseller);

    if (sessionType === 'retail' && isBiz) {
        console.log(`[Login] Blocked: Reseller logging in via Retail flow (${email})`);
        return res.status(403).json({ message: "Business Account Detected", isBusiness: true });
    }

    if (sessionType === 'business' && !isBiz) {
        console.log(`[Login] Blocked: Retail user logging in via Business flow (${email})`);
        return res.status(403).json({ 
            message: "This portal is for Business Console accounts only. Personal accounts should use the main login page.", 
            isRetail: true 
        });
    }

    console.log(`[Login Debug] User States: Verified=${user.isEmailVerified}, Complete=${user.isSignupComplete}, Suspended=${user.isSuspended}`);

    // Removed verification and signup completion blocks to allow non-blocking email verification
    // if (!user.isEmailVerified) {
    //     console.log(`[Login] Failure: Email not verified (${email})`);
    //     return res.status(403).json({ message: "Verify email", unverified: true });
    // }

    // if (!user.isSignupComplete) {
    //     console.log(`[Login] Failure: Signup incomplete (${email})`);
    //     return res.status(403).json({ message: "Complete signup", incompleteSignup: true });
    // }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`[Login Debug] Password Match: ${isMatch}`);

    if (!isMatch) {
        console.log(`[Login] Failure: Wrong password (${email})`);
        return res.status(400).json({ message: "Wrong password" });
    }

    if (user.isSuspended) {
        return res.status(403).json({ message: "Your account has been suspended. Contact support." });
    }

    // Security Tracking
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const device = req.headers['user-agent'] || "Unknown";
    
    user.lastLoginIp = ip;
    user.loginActivity.unshift({ ip, device, timestamp: new Date() });
    // Keep only last 10 activities
    if (user.loginActivity.length > 10) user.loginActivity.pop();
    await user.save();

    console.log(`[Login] Success: ${email} from ${ip}`);
    const tokenRole = resellerId ? 'user' : user.role;
    const token = jwt.sign({ id: user._id, session_type: sessionType, tenantRole: tokenRole }, process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium");
    await Session.create({ userId: user._id, token, deviceInfo: device });
    res.json({ token, balance: user.totalBalance, user: { name: user.name, email: user.email, role: tokenRole, isEmailVerified: user.isEmailVerified, isSignupComplete: user.isSignupComplete } });
  } catch (err) { 
    console.error("Login Error:", err);
    const isTimeout = err.message.includes('buffering timed out') || err.message.includes('topology');
    res.status(500).json({ 
        message: isTimeout ? "Database connection error. Please try again in a moment." : "Login failed due to a server error.", 
        error: err.message 
    }); 
  }
});

// CONTINUE SIGNUP
app.post("/continue-signup", async (req, res) => {
    const { email, transactionPin, securityQuestions, phone, firstname, lastname } = req.body;
    const resellerId = req.reseller?._id || null;
    try {
        const user = await User.findOne({ 
            email, 
            referredBy: resellerId === null ? { $in: [null, undefined] } : resellerId 
        });
        if (!user) return res.status(404).json({ message: "User not found" });
        
        const hashedPin = await bcrypt.hash(transactionPin, 10);
        const hashedQuestions = await Promise.all(securityQuestions.map(async (sq) => ({ 
            question: sq.question, 
            answer: await bcrypt.hash(sq.answer.toLowerCase().trim(), 10) 
        })));
        
        user.transactionPin = hashedPin;
        user.securityQuestions = hashedQuestions;
        if (phone) user.kycData.phone = phone; // Store phone in kycData or direct field if exists
        
        user.isSignupComplete = true;
        await user.save();

        res.json({ success: true, message: "Signup complete." });
    } catch (err) {
        res.status(500).json({ message: "Error during signup continuation" });
    }
});

app.post(["/user/generate-temp-va", "/api/user/generate-temp-va"], auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { amount } = req.body;
        
        if (!amount || Number(amount) < 1) {
            return res.status(400).json({ message: "Amount is required and must be greater than 0" });
        }

        const result = await generateTemporaryAccount(user, Number(amount), req.reseller);
        
        if (result.success) {
            res.json({ success: true, account: result.account });
        } else {
            res.status(400).json({ success: false, message: result.message });
        }
    } catch (err) {
        res.status(500).json({ message: "Error generating temporary account" });
    }
});

app.post(["/user/generate-permanent-va", "/api/user/generate-permanent-va"], auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { identifier, type } = req.body; // type: 'bvn' or 'nin'

        if (!identifier || (type !== 'bvn' && type !== 'nin')) {
            return res.status(400).json({ message: "Valid BVN or NIN is required" });
        }
        
        const result = await generatePermanentAccount(user, identifier, type, req.reseller);
        
        if (result.success) {
            res.json({ success: true, account: result.account });
        } else {
            res.status(400).json({ success: false, message: result.message });
        }
    } catch (err) {
        res.status(500).json({ message: "Error generating permanent account" });
    }
});

// (Keep internal helper import logic handled at top)

app.get("/api/user/me", auth, async (req, res) => {
  const userDoc = await User.findById(req.user.id).select("-password");
  if (userDoc && req.reseller) {
      const isOwner = req.reseller._id.toString() === userDoc._id.toString();
      if (!isOwner) {
          userDoc.role = 'user';
          userDoc.resellerActivationStatus = 'none';
          userDoc.whiteLabelStatus = 'none';
          userDoc.apiLevel = 'normal';
      }
  }
  res.json(userDoc);
});

app.post("/api/user/generate-api-keys", auth, async (req, res) => {
    try {
        const { apiKey, apiSecret } = generateApiCredentials();
        await User.findByIdAndUpdate(req.user.id, { apiKey, apiSecret });
        res.json({ status: 'success', apiKey, apiSecret });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.post("/api/user/update-api-settings", auth, async (req, res) => {
    try {
        const { webhookUrl, ipWhitelist } = req.body;
        await User.findByIdAndUpdate(req.user.id, { webhookUrl, ipWhitelist });
        res.json({ status: 'success', message: 'Settings updated' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.post("/api/user/generate-test-keys", auth, async (req, res) => {
    try {
        const { apiKey: testApiKey, apiSecret: testApiSecret } = generateApiCredentials();
        await User.findByIdAndUpdate(req.user.id, { testApiKey, testApiSecret });
        res.json({ status: 'success', testApiKey, testApiSecret });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- WHITE LABEL & BRANDING ---
app.get("/api/user/check-subdomain/:subdomain", auth, async (req, res) => {
    try {
        const { subdomain } = req.params;
        const exists = await User.findOne({ subdomain: subdomain.toLowerCase() });
        res.json({ available: !exists });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

const siteInfoCache = new Map();
app.get("/api/site-info", async (req, res) => {
    try {
        const { resellerId } = req.query;
        let reseller = req.reseller; // From middleware
        const cacheKey = resellerId || (reseller ? reseller._id.toString() : 'main');
        
        const settings = await SystemSetting.findOne();
        const systemMaintenance = settings ? {
            maintenanceMode: settings.maintenanceMode,
            maintenanceMessage: settings.maintenanceMessage,
            maintenanceTarget: settings.maintenanceTarget || 'all'
        } : { maintenanceMode: false, maintenanceMessage: '', maintenanceTarget: 'all' };

        const cached = siteInfoCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < 5000)) {
            return res.json({ 
                status: 'success', 
                reseller: cached.data.reseller, 
                systemMaintenance: cached.data.systemMaintenance 
            });
        }

        if (resellerId) {
            const found = await User.findById(resellerId);
            if (found && found.role === 'reseller_admin') {
                reseller = {
                    _id: found._id,
                    name: found.name,
                    branding: found.branding,
                    maintenanceMode: found.maintenanceMode,
                    serviceControl: found.serviceControl,
                    resellerTier: found.resellerTier,
                    enabledFuturePlatforms: found.enabledFuturePlatforms
                };
            }
        }

        const dataToCache = { reseller, systemMaintenance };
        siteInfoCache.set(cacheKey, { timestamp: Date.now(), data: dataToCache });
        res.json({ status: 'success', reseller, systemMaintenance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// (Onboarding routes moved to top)






app.get("/api/reseller/premium-pricing", auth, async (req, res) => {
    try {
        const settings = await SystemSetting.findOne();
        res.json(settings?.premiumPricing || { sixMonths: 15000, yearly: 25000 });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// [DEPRECATED] app.post("/api/reseller/upgrade-premium", auth, async (req, res) => {
// [DEPRECATED]     try {
// [DEPRECATED]         if (req.user.role !== 'reseller_admin') return res.status(403).json({ message: "Reseller access only" });
// [DEPRECATED]         const { duration } = req.body; // '6months' or '12months'
// [DEPRECATED]         
// [DEPRECATED]         const settings = await SystemSetting.findOne();
// [DEPRECATED]         if (!settings) return res.status(500).json({ message: "System settings not found" });
// [DEPRECATED] 
// [DEPRECATED]         const price = duration === '6months' ? settings.premiumPricing.sixMonths : settings.premiumPricing.yearly;
// [DEPRECATED]         if (!price) return res.status(400).json({ message: "Invalid subscription duration" });
// [DEPRECATED] 
// [DEPRECATED]         const user = await User.findById(req.user.id);
// [DEPRECATED]         if (user.totalBalance < price) {
// [DEPRECATED]             return res.status(400).json({ message: `Insufficient balance. You need ₦${price.toLocaleString()} to upgrade.` });
// [DEPRECATED]         }
// [DEPRECATED] 
// [DEPRECATED]         // Deduct balance
// [DEPRECATED]         await deductBalance(user, price, `Premium Upgrade (${duration})`);
// [DEPRECATED] 
// [DEPRECATED]         // Set expiration
// [DEPRECATED]         const now = new Date();
// [DEPRECATED]         let expiry = (user.subscriptionExpiresAt && user.subscriptionExpiresAt > now) 
// [DEPRECATED]             ? new Date(user.subscriptionExpiresAt) 
// [DEPRECATED]             : new Date(now);
// [DEPRECATED]         
// [DEPRECATED]         if (duration === '6months') {
// [DEPRECATED]             expiry.setMonth(expiry.getMonth() + 6);
// [DEPRECATED]         } else {
// [DEPRECATED]             expiry.setFullYear(expiry.getFullYear() + 1);
// [DEPRECATED]         }
// [DEPRECATED] 
// [DEPRECATED]         user.resellerTier = 'premium';
// [DEPRECATED]         user.premiumSubscriptionType = duration;
// [DEPRECATED]         user.subscriptionExpiresAt = expiry;
// [DEPRECATED]         
// [DEPRECATED]         // Enable premium features
// [DEPRECATED]         user.features = {
// [DEPRECATED]             ...user.features,
// [DEPRECATED]             custom_domain: true,
// [DEPRECATED]             apk_generation: true,
// [DEPRECATED]             premium_branding: true,
// [DEPRECATED]             premium_analytics: true,
// [DEPRECATED]             dedicated_support: true,
// [DEPRECATED]             push_notifications: true
// [DEPRECATED]         };
// [DEPRECATED] 
// [DEPRECATED]         await user.save();
// [DEPRECATED] 
// [DEPRECATED]         await Notification.create({
// [DEPRECATED]             userId: user._id,
// [DEPRECATED]             title: 'Premium Upgrade Successful',
// [DEPRECATED]             message: `Congratulations! Your account has been upgraded to Premium for ${duration === '6months' ? '6 months' : '1 year'}. Your features are now active.`,
// [DEPRECATED]             type: 'system'
// [DEPRECATED]         });
// [DEPRECATED] 
// [DEPRECATED]         res.json({ status: 'success', message: 'Upgrade successful!', user });
// [DEPRECATED]     } catch (err) { res.status(500).json({ message: err.message }); }
// [DEPRECATED] });

// ---------------- VTU SERVICES ----------------

app.get("/api/vtu/cable/plans", auth, async (req, res) => {
    try {
        const response = await axios.get("https://www.nellobytesystems.com/APICableTVPackagesV1.asp", { timeout: 15000 });
        const data = response.data;
        if (!data || !data.TV_ID) throw new Error("Invalid response from provider");
        
        let allPlans = [];
        for (const [providerName, providerArray] of Object.entries(data.TV_ID)) {
            if (Array.isArray(providerArray) && providerArray.length > 0) {
                const products = providerArray[0].PRODUCT;
                if (Array.isArray(products)) {
                    products.forEach(p => {
                        allPlans.push({
                            provider: providerName.toLowerCase(), // 'dstv', 'gotv', 'startimes'
                            plan_id: p.PACKAGE_ID,
                            name: p.PACKAGE_NAME,
                            price: parseFloat(p.PACKAGE_AMOUNT)
                        });
                    });
                }
            }
        }
        res.json({ status: "success", plans: allPlans });
    } catch (error) {
        console.error("[Cable] Error fetching plans:", error.message);
        res.status(500).json({ status: "failed", message: "Failed to fetch cable plans" });
    }
});

app.get("/api/vtu/data-plans/all", auth, async (req, res) => {
    try {
        console.log(`[VTU] Fetching ALL data plans for background preloading...`);
        const plans = await DataPlan.find({ status: true });
        const bulkPrices = await calculateBulkDataPrices(req.user.id, plans);
        
        const formattedPlans = bulkPrices.filter(p => p.sellingPrice !== null).map(({ plan: p, sellingPrice }) => {
            return {
                api_plan_id: p.api_plan_id,
                plan_code: p.api_plan_id,
                network: p.network,
                category: p.category,
                plan_name: cleanPlanName(p.plan_name),
                name: cleanPlanName(p.plan_name),
                api_price: p.api_price,
                selling_price: sellingPrice,
                price: sellingPrice,
                status: p.status,
                provider: p.provider,
                validity: p.validity,
                last_updated: p.updatedAt
            };
        });

        // Sort properly by price
        formattedPlans.sort((a,b) => a.price - b.price);

        res.json(formattedPlans);;
    } catch (err) {
        console.error(`[VTU All Plans Error]`, err.message);
        res.status(500).json({ message: "Failed to fetch all data plans" });
    }
});


app.get("/api/vtu/data-plans/:network", auth, async (req, res) => {
    try {
        const network = req.params.network.toUpperCase();
        const { category } = req.query;
        console.log(`[VTU] Fetching DB data plans for ${network}, category=${category || 'all'}`);

        let query = { network, status: true };
        if (category && category !== 'all') query.category = category;

        const plans = await DataPlan.find(query);
        const rules = await PricingRule.find({ isActive: true });

        if (!plans || plans.length === 0) {
            console.log(`[VTU Plans Warning] No DB plans for ${network}`);
            return res.json([]);
        }

        const providerCategories = await ProviderCategory.find({}).lean();

        const validPlans = plans.filter(p => {
            const compositeName = `${network} ${p.category || 'Direct'}`;
            const config = providerCategories.find(c => 
                c.category_name.toLowerCase() === compositeName.toLowerCase() &&
                c.provider_name.toLowerCase() === (p.provider || '').toLowerCase()
            );
            if (config && config.visibility === 'HIDDEN') return false;
            if (config && config.status === 'DISABLED') return false;
            return true;
        });

        const bulkPrices = await calculateBulkDataPrices(req.user.id, validPlans, network);

        const formattedPlans = bulkPrices.filter(p => p.sellingPrice !== null).map(({ plan: p, sellingPrice }) => {
            return {
                plan_id: p.api_plan_id,
                plan_code: p.api_plan_id,
                name: cleanPlanName(p.plan_name),
                plan_size: p.plan_size || '',
                price: sellingPrice,
                validity: p.validity,
                provider: p.provider,
                network: p.network,
                category: p.category || 'Direct',
                label: cleanPlanName(p.plan_name)
            };
        });

        formattedPlans.sort((a,b) => a.price - b.price);

        res.json(formattedPlans);;
    } catch (err) {
        console.error(`[VTU Plans Error]`, err.message);
        res.status(500).json({ message: "Failed to fetch data plans" });
    }
});

app.post("/api/retail/purchase/buy-airtime", auth, verifyTransactionPin, transactionIdempotency, async (req, res) => {
    let { amount, phone, network, countryCode, operatorId, option } = req.body;
    
    // TEMPORARY: Disable International Airtime & Track Interest
    if (countryCode && countryCode.toUpperCase() !== 'NG') {
        try {
            await InternationalInterest.create({ userId: req.user.id, serviceType: 'airtime', country: countryCode });
        } catch (e) {}
        return res.json({ message: "International services are coming soon. Stay tuned!" });
    }

    // Safety guard: Check provider availability BEFORE locking user or debiting
    const isAvailable = await checkProviderAvailability('airtime', network, option || 'smart', countryCode || 'NG');
    if (!isAvailable) {
        return res.status(400).json({ message: "Service temporarily unavailable. Please try again later." });
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
    let resellerTransaction = null;
    try {
        let inputAmount = Number(amount);
        // Kobo to Naira conversion logic
        if (inputAmount > lockedUser.totalBalance && (inputAmount / 100) <= lockedUser.totalBalance && inputAmount >= 100) {
            inputAmount = inputAmount / 100;
        }

        const { basePrice, sellingPrice, pricingSource, reseller } = await calculateVtuPrice(req.user.id, 'airtime', network, null, inputAmount);
        const finalAmount = sellingPrice;
        const resellerCost = basePrice;

        console.log(`[PricingEngine] Airtime | User: ${lockedUser.email} | Amount: ${inputAmount} | Price: ${finalAmount} | Source: ${pricingSource} | ResellerCost: ${resellerCost}`);

        if (isNaN(finalAmount) || finalAmount < 1) {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "Amount must be at least 1" });
        }

        // Initial balance check for Customer
        if (lockedUser.totalBalance < finalAmount) {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "Insufficient balance" });
        }

        // DUPLICATE PREVENTION ... (Existing logic)
        const recentTx = await Transaction.findOne({
            userId: req.user.id,
            phone,
            amount: finalAmount,
            network,
            createdAt: { $gte: new Date(Date.now() - 60000) },
            status: { $in: ['success', 'pending'] }
        });

        if (recentTx) {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "Duplicate transaction detected. Please wait 60 seconds." });
        }

        console.log(`[VTU] Initiating Airtime for ${lockedUser.email} | Price: ${finalAmount} | Cost: ${resellerCost}`);
        
        // 1. Deduct from Customer
        const deducted = await deductBalance(req.user.id, finalAmount);
        
        // 3. Create PENDING Transaction Record for Customer
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
            description: "Airtime",
            balance_deducted: true,
            isApiRequest: true, // Mark for background queue
            resellerId: reseller ? reseller._id : null,
            cost_price: resellerCost,
            selling_price: finalAmount,
            main_wallet_deducted: deducted.mainDeducted,
            cashback_wallet_deducted: deducted.cashbackDeducted,
            api_response: { inputAmount, operatorId }
        });

        // Link reseller transaction to customer transaction
        if (resellerTransaction) {
            resellerTransaction.parentTransactionId = transaction._id;
            await resellerTransaction.save();
        }

        return res.json({ 
            message: "Transaction is processing in the background. You will be notified shortly.", 
            status: "processing",
            balance: deducted.totalBalance,
            reference: transaction.reference 
        });

    } catch (err) {
        console.error("[Airtime Error]", err.message);
        
        // Final fallback refund
        try {
            await refundBalance(req.user.id, finalAmount);
            if (reseller) await refundBalance(reseller._id, resellerCost);
        } catch (e) {
            console.error("[Airtime Refund Error]", e.message);
        }

        return res.status(500).json({ success: false, message: "Failed to process request" });
    } finally {
        // Unlock user
        await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
    }
});

app.post("/api/vtu/data/purchase", auth, verifyTransactionPin, transactionIdempotency, async (req, res) => {
    console.log(`\n======================================================`);
    console.log(`[VTU FRONTEND -> BACKEND] INBOUND REQUEST LOGGING`);
    console.log(`Headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`Payload:`, JSON.stringify(req.body, null, 2));
    console.log(`======================================================\n`);

    // Standardize input fields
    const { phone, mobile_number, network, plan_id, plan_code, dataPlan, countryCode, operatorId, network_id, option, provider, category } = req.body;
    // Note: 'amount' is explicitly ignored here for data as requested
    const finalPhone = phone || mobile_number;
    const finalPlanCode = plan_id || plan_code || dataPlan; 
    const finalOption = provider === "connectbridge" ? "premium" : (option || "smart");
    console.log(`[VTU] Incoming Purchase: Network=${network}, Option=${option}, Provider=${provider} -> FinalOption=${finalOption}`);

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

    // Safety guard: Check provider availability BEFORE locking user or debiting
    const isAvailable = await checkProviderAvailability('data', network, finalOption, countryCode || 'NG');
    if (!isAvailable) {
        return res.status(400).json({ message: "Service temporarily unavailable. Please try again later." });
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
    let resellerTransaction = null;
    try {
        const { basePrice, sellingPrice, reseller } = await calculateVtuPrice(req.user.id, 'data', network, finalPlanCode);
        const derivedPrice = sellingPrice;

        // Balance Check for Customer
        if (lockedUser.totalBalance < derivedPrice) {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "Insufficient balance" });
        }

        // DUPLICATE PREVENTION: Check for identical transaction in last 60 seconds
        const recentTx = await Transaction.findOne({
            userId: req.user.id,
            phone: finalPhone,
            network,
            description: { $regex: new RegExp(finalPlanCode, 'i') },
            createdAt: { $gte: new Date(Date.now() - 60000) },
            status: { $in: ['success', 'pending'] }
        });

        if (recentTx) {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "Duplicate transaction detected. Please wait 60 seconds." });
        }

        // Detailed Diagnostics Logging for Value Plan verification
        const dbPlanInfo = await DataPlan.findOne({ api_plan_id: finalPlanCode, network: network.toUpperCase() });
        if (!dbPlanInfo) {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "Invalid data plan" });
        }

        const compositeName = `${network} ${dbPlanInfo.category || 'Direct'}`;
        const categoryConfig = await ProviderCategory.findOne({
            category_name: { $regex: new RegExp(`^${compositeName}$`, 'i') },
            provider_name: dbPlanInfo.provider.toLowerCase()
        });

        if (categoryConfig && categoryConfig.visibility === 'HIDDEN') {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "This plan is currently hidden and cannot be purchased." });
        }
        if (categoryConfig && categoryConfig.status === 'DISABLED') {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "This category is currently disabled." });
        }
        if (categoryConfig && categoryConfig.status === 'MAINTENANCE') {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: categoryConfig.maintenance_message || "This category is under maintenance." });
        }

        const displayedPlanName = dbPlanInfo.plan_name;
        const displayedPlanSize = dbPlanInfo.plan_size || 'Unknown';
        
        console.log(`\n======================================================`);
        console.log(`[VTU PURCHASE REQUEST - DIAGNOSTICS]`);
        console.log(`Customer Email        : ${lockedUser.email}`);
        console.log(`Phone / Network       : ${finalPhone} / ${network}`);
        console.log(`Selected Provider     : ${finalOption}`);
        console.log(`Selected Plan ID      : ${finalPlanCode}`);
        console.log(`Displayed Plan Name   : ${displayedPlanName}`);
        console.log(`Displayed Data Volume : ${displayedPlanSize}`);
        console.log(`Provider Plan ID Sent : ${finalPlanCode}`);
        console.log(`Price / Cost          : Customer: ₦${derivedPrice} | Reseller: ₦${basePrice}`);
        console.log(`======================================================\n`);
        
        console.log(`[VTU] Initiating Data: ${lockedUser.email} | CustomerPrice: ${derivedPrice} | ResellerCost: ${basePrice} | Reseller: ${reseller?.email || 'None'}`);
        
        // 1. Generate reference and description
        const reference = `DATA-PND-${Date.now()}`;
        const description = `Data: ${finalPlanCode}`;

        // 2. Deduct from Customer
        const deducted = await deductBalance(req.user.id, derivedPrice, reference, description, true);
        if (!deducted) {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "Insufficient balance" });
        }

        // 3. Create PENDING Transaction Record for Customer
        transaction = await Transaction.create({ 
            userId: req.user.id, 
            type: "debit", 
            status: "pending", 
            amount: derivedPrice, 
            phone: finalPhone, 
            network, 
            countryCode: countryCode || 'NG',
            reference,
            provider_used: finalOption,
            description,
            balance_deducted: true,
            isApiRequest: true, // Mark for background queue
            resellerId: reseller ? reseller._id : null,
            cost_price: basePrice,
            selling_price: derivedPrice,
            main_wallet_deducted: deducted.mainDeducted,
            cashback_wallet_deducted: deducted.cashbackDeducted,
            api_response: { planCode: finalPlanCode, operatorId, network_id, category }
        });

        // Link reseller transaction to customer transaction
        if (resellerTransaction) {
            resellerTransaction.parentTransactionId = transaction._id;
            await resellerTransaction.save();
        }

        return res.json({ 
            message: "Transaction is processing in the background. You will be notified shortly.", 
            status: "processing",
            balance: deducted.totalBalance,
            reference: transaction.reference 
        });

    } catch (err) {
        console.error("[Data Error]", err.message);
        
        // If we reach here, it means we didn't even create a transaction record, so refund everyone
        try {
            if (deducted) {
                await refundBalance(req.user.id, derivedPrice, {
                    main_wallet_deducted: deducted.mainDeducted,
                    cashback_wallet_deducted: deducted.cashbackDeducted
                });
            }
            if (reseller) await refundBalance(reseller._id, basePrice);
        } catch (e) {
            console.error("[Data Refund Error]", e.message);
        }

        return res.status(500).json({ success: false, message: "Failed to process request" });
    } finally {
        // Unlock user
        await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
    }
});

// Alias for data purchase to fix 404s
app.post("/api/retail/purchase/buy-data", auth, verifyTransactionPin, async (req, res) => {
    // Redirect to the unified data purchase handler
    req.url = "/api/vtu/data/purchase";
    return app._router.handle(req, res);
});

app.post("/api/retail/purchase/buy-cable", auth, verifyTransactionPin, transactionIdempotency, async (req, res) => {
    const { cableId, packageId, smartcard, phone, amount } = req.body;
    const rawAmount = Number(amount) || 0;

    // Safety guard: Check provider availability BEFORE locking user or debiting
    const isAvailable = await checkProviderAvailability('cable', cableId, 'value', 'NG');
    if (!isAvailable) {
        return res.status(400).json({ message: "Service temporarily unavailable. Please try again later." });
    }

    const lockedUser = await User.findOneAndUpdate({ _id: req.user.id, isProcessingTx: false }, { isProcessingTx: true }, { new: true });
    if (!lockedUser) return res.status(400).json({ message: "Transaction in progress" });

    let transaction = null;
    try {
        // Apply admin pricing engine for cable (uses amount + optional AdminPricingOverride margin/assigned price)
        const { sellingPrice, pricingSource } = await calculateVtuPrice(req.user.id, 'cable', cableId, null, rawAmount);
        const finalAmount = sellingPrice || rawAmount;

        console.log(`[PricingEngine] Cable | User: ${lockedUser.email} | Amount: ${rawAmount} | Price: ${finalAmount} | Source: ${pricingSource}`);

        if (lockedUser.totalBalance < finalAmount) {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "Insufficient balance" });
        }

        const deducted = await deductBalance(req.user.id, finalAmount);
        if (!deducted) {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(500).json({ message: "Failed to deduct balance" });
        }

        transaction = await Transaction.create({ 
            userId: req.user.id, type: "debit", status: "pending", amount: finalAmount, phone, 
            description: `Cable TV: ${cableId} (${smartcard})`, reference: `CBL-PND-${Date.now()}`,
            balance_deducted: true,
            isApiRequest: true,
            main_wallet_deducted: deducted.mainDeducted,
            cashback_wallet_deducted: deducted.cashbackDeducted,
            api_response: { cableId, packageId, smartcard }
        });

        return res.json({ 
            message: "Transaction is processing in the background. You will be notified shortly.", 
            status: "processing",
            reference: transaction.reference 
        });

    } catch (err) {
        console.error("[Cable Error]", err);
        try {
            if (transaction) await refundBalance(req.user.id, transaction.amount);
        } catch (e) {}
        return res.status(500).json({ message: "System error" });
    } finally {
        await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
    }
});


app.post("/api/retail/purchase/buy-electricity", auth, verifyTransactionPin, transactionIdempotency, async (req, res) => {
    const { discoId, meterType, meterNumber, amount, phone } = req.body;
    const rawAmount = Number(amount);

    // Safety guard: Check provider availability BEFORE locking user or debiting
    const isAvailable = await checkProviderAvailability('electricity', discoId, 'value', 'NG');
    if (!isAvailable) {
        return res.status(400).json({ message: "Service temporarily unavailable. Please try again later." });
    }

    const lockedUser = await User.findOneAndUpdate({ _id: req.user.id, isProcessingTx: false }, { isProcessingTx: true }, { new: true });
    if (!lockedUser) return res.status(400).json({ message: "Transaction in progress" });

    let transaction = null;
    try {
        // Apply admin pricing engine for electricity (uses amount + optional AdminPricingOverride margin/assigned price)
        const { sellingPrice, pricingSource } = await calculateVtuPrice(req.user.id, 'electricity', discoId, null, rawAmount);
        const finalAmount = sellingPrice || rawAmount;

        console.log(`[PricingEngine] Electricity | User: ${lockedUser.email} | Amount: ${rawAmount} | Price: ${finalAmount} | Source: ${pricingSource}`);

        if (lockedUser.totalBalance < finalAmount) {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(400).json({ message: "Insufficient balance" });
        }

        const deducted = await deductBalance(req.user.id, finalAmount);
        if (!deducted) {
            await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
            return res.status(500).json({ message: "Failed to deduct balance" });
        }

        transaction = await Transaction.create({ 
            userId: req.user.id, type: "debit", status: "pending", amount: finalAmount, phone, 
            description: `Electricity: ${discoId} (${meterNumber})`, reference: `ELE-PND-${Date.now()}`,
            balance_deducted: true,
            isApiRequest: true,
            main_wallet_deducted: deducted.mainDeducted,
            cashback_wallet_deducted: deducted.cashbackDeducted,
            api_response: { discoId, meterType, meterNumber }
        });

        return res.json({ 
            message: "Transaction is processing in the background. You will be notified shortly.", 
            status: "processing",
            reference: transaction.reference 
        });

    } catch (err) {
        console.error("[Electricity Error]", err);
        try {
            if (transaction) await refundBalance(req.user.id, transaction.amount);
        } catch (e) {}
        return res.status(500).json({ message: "System error" });
    } finally {
        await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
    }
});


app.post("/api/retail/purchase/buy-epin", auth, verifyTransactionPin, transactionIdempotency, async (req, res) => {
    const { network, amount, quantity } = req.body;
    const finalAmount = Number(amount);

    // Safety guard: Check provider availability BEFORE locking user or debiting
    const isAvailable = await checkProviderAvailability('epin', network, 'value', 'NG');
    if (!isAvailable) {
        return res.status(400).json({ message: "Service temporarily unavailable. Please try again later." });
    }

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
                await Transaction.findByIdAndUpdate(transaction._id, { status: 'failed', description: `EPIN: ${network}`, api_response: { error: err.message } });
            }
        } catch (e) {}
        return res.status(500).json({ message: "System error" });
    } finally {
        await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
    }
});

app.post("/api/retail/purchase/buy-education", auth, verifyTransactionPin, transactionIdempotency, async (req, res) => {
    const { examType, phone, amount } = req.body;
    const finalAmount = Number(amount) || 2000;

    // Safety guard: Check provider availability BEFORE locking user or debiting
    const isAvailable = await checkProviderAvailability('education', examType, 'value', 'NG');
    if (!isAvailable) {
        return res.status(400).json({ message: "Service temporarily unavailable. Please try again later." });
    }

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
                await Transaction.findByIdAndUpdate(transaction._id, { status: 'failed', description: `Education: ${examType}`, api_response: { error: err.message } });
            }
        } catch (e) {}
        return res.status(500).json({ message: "System error" });
    } finally {
        await User.findByIdAndUpdate(req.user.id, { isProcessingTx: false });
    }
});

app.get("/api/analytics/realtime", auth, async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const totalCustomers = await User.countDocuments({ role: 'user' });
        const successfulTodayCount = await Transaction.countDocuments({ status: 'success', createdAt: { $gte: startOfDay } });
        
        const fundingTodayAggr = await Transaction.aggregate([
            { $match: { type: 'credit', status: 'success', createdAt: { $gte: startOfDay } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const fundingToday = fundingTodayAggr[0]?.total || 0;

        // Simulate active users based on recent minutes (or random for now as a placeholder)
        const activeOnline = Math.floor(Math.random() * 20) + 10;
        const apiHealth = 99.9; // Base placeholder, can be expanded to check recent failures

        res.json({
            totalCustomers,
            successfulTodayCount,
            fundingToday,
            activeOnline,
            apiHealth
        });
    } catch (err) {
        console.error("Analytics Error", err);
        res.status(500).json({ message: "Error fetching analytics" });
    }
});

app.get("/api/transactions", auth, async (req, res) => {
    const rawTransactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const seenCashbacks = new Set();
    const filteredTransactions = rawTransactions.filter(tx => {
        if (tx.isInternal) {
            const isCashback = tx.ledger_type === 'LIFETIME_CASHBACK' || (tx.description && tx.description.toLowerCase().includes('cashback'));
            if (!isCashback) return false;
        }
        if (tx.description) {
            const desc = tx.description.toLowerCase();
            if (desc.includes('system wallet deduction') || 
                desc.includes('internal ledger') || 
                desc.includes('internal accounting') || 
                desc.includes('internal balance sync')) {
                return false;
            }
            if (desc.includes('cashback') || tx.ledger_type === 'LIFETIME_CASHBACK') {
                const dateStr = tx.createdAt ? new Date(tx.createdAt).toISOString().split('T')[0] : '';
                const descBase = tx.description.split('-')[0].trim();
                const key = `${tx.amount}_${descBase}_${dateStr}`;
                if (seenCashbacks.has(key)) return false;
                seenCashbacks.add(key);
            }
        }
        return true;
    });
    res.json(filteredTransactions);
});

app.get("/api/notifications", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (err) { res.status(500).json({ message: "Error fetching notifications" }); }
});

app.get("/api/notifications/unread-count", auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.id, isRead: false });
    res.json({ count });
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.post("/api/notifications/mark-all-read", auth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.post("/notifications/:id/read", auth, async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { isRead: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.post("/logout", auth, async (req, res) => {
    let token = req.headers.authorization.split(" ")[1];
    await Session.findOneAndUpdate({ token }, { isValid: false });
    res.json({ message: "Logged out" });
});

// USER WALLET ROUTES
app.get("/api/user/withdrawals", auth, async (req, res) => {
  try {
    const history = await Withdrawal.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Error fetching withdrawals" });
  }
});

app.get("/api/user/cashback-history", auth, async (req, res) => {
  try {
    const history = await Transaction.find({ 
        userId: req.user.id, 
        reference: { $regex: /^CASHBACK-/i } 
    }).sort({ createdAt: -1 });
    const seenCashbacks = new Set();
    const filteredHistory = history.filter(tx => {
        if (tx.isInternal) {
            const isCashback = tx.ledger_type === 'LIFETIME_CASHBACK' || (tx.description && tx.description.toLowerCase().includes('cashback'));
            if (!isCashback) return false;
        }
        const dateStr = tx.createdAt ? new Date(tx.createdAt).toISOString().split('T')[0] : '';
        const descBase = tx.description ? tx.description.split('-')[0].trim() : '';
        const key = `${tx.amount}_${descBase}_${dateStr}`;
        if (seenCashbacks.has(key)) return false;
        seenCashbacks.add(key);
        return true;
    });
    res.json(filteredHistory);
  } catch (err) {
    res.status(500).json({ message: "Error fetching cashback history" });
  }
});

app.get("/api/user/referral-analytics", auth, async (req, res) => {
  try {
    const referredUsers = await User.find({ referredBy: req.user.id }).select('name email resellerTier createdAt');
    const totalReferrals = referredUsers.length;
    const successfulActivations = referredUsers.filter(u => u.resellerTier && u.resellerTier !== 'trial').length;
    
    // Total Earnings from referrals
    const earningTxs = await Transaction.find({
        userId: req.user.id,
        reference: { $regex: /^REF-REWARD-/i },
        type: 'credit',
        status: 'success'
    });
    const totalEarnings = earningTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    res.json({
        totalReferrals,
        successfulActivations,
        totalEarnings,
        history: referredUsers.map(u => ({
            name: u.name,
            email: u.email,
            status: (u.resellerTier && u.resellerTier !== 'trial') ? 'Activated' : 'Pending',
            date: u.createdAt
        })).sort((a, b) => new Date(b.date) - new Date(a.date))
    });
  } catch (err) {
    console.error("[Referral Analytics Error]", err);
    res.status(500).json({ message: "Error fetching referral analytics" });
  }
});

app.post("/user/withdraw", auth, verifyTransactionPin, transactionIdempotency, async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountName } = req.body;
    if (amount < 100) return res.status(400).json({ message: "Minimum withdrawal is ₦100" });
    
    const user = await User.findById(req.user.id);
    let finalAmount = Number(amount);

    const reference = `WDR-${Date.now()}`;
    const description = `Withdrawal to ${bankName}`;
    const deducted = await deductEarnings(req.user.id, finalAmount, reference, description);
    if (!deducted) return res.status(400).json({ message: "Insufficient profit balance." });

    // Since the withdrawal is pending admin approval, update the MongoDB transaction status to pending
    const transaction = await Transaction.findOneAndUpdate(
      { reference },
      { $set: { status: 'pending' } },
      { new: true }
    );

    const withdrawal = new Withdrawal({
      userId: req.user.id,
      amount,
      bankName,
      accountNumber,
      accountName,
      status: 'pending',
      transactionId: transaction ? transaction._id : null,
      reference
    });
    await withdrawal.save();

    if (transaction) sendTransactionNotification(transaction);

    res.json({ message: "Withdrawal request submitted successfully", balance: (deducted.balance1 + deducted.balance2) });
  } catch (err) {
    console.error("WITHDRAW ERROR:", err);
    res.status(500).json({ message: "Error submitting withdrawal" });
  }
});

// [SECURITY] The /fund test route has been permanently removed (2026-06-09).
// It was a development-only shortcut that allowed any authenticated user to
// credit their own wallet with an arbitrary amount, bypassing all payment
// gateways, Supabase ledger recording, and permission validation.
// All legitimate wallet funding goes through Paystack / Monnify / Flutterwave
// webhooks or the admin manual-fund flow (which requires fundingPassword + OTP).

app.get("/api/announcements", async (req, res) => {
  try {
    const { category, sort, limit } = req.query;
    let query = { status: 'Published' }; // Only fetch published posts
    
    if (category && category !== 'All') {
      query.category = category;
    }

    let sortQuery = { createdAt: -1 }; // default latest
    if (sort === 'trending') {
      sortQuery = { views: -1 };
    }

    const limitNum = parseInt(limit) || 10;
    
    // For backwards compatibility, if no queries provided, we might still want latest 3 for dashboard
    // But since limit is 10 by default, frontend dashboard should pass ?limit=3. If not, it gets 10.
    // The previous implementation had a hardcoded .limit(3). I'll default to 10 for the blog, and VTU dashboard can slice it or we keep it flexible.
    
    const posts = await BlogPost.find(query).sort(sortQuery).limit(limitNum);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching announcements" });
  }
});

// Single post view
app.get("/api/announcements/:slug", async (req, res) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, status: 'Published' });
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Error fetching post" });
  }
});

// Increment views
app.post("/api/announcements/:slug/view", async (req, res) => {
  try {
    const post = await BlogPost.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } },
      { new: true }
    );
    res.json({ success: true, views: post?.views });
  } catch (err) {
    res.status(500).json({ message: "Error updating views" });
  }
});



// --- ADMIN BLOG CRUD ROUTES ---
const blogStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "blog");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  }
});
const uploadBlogImage = multer({ storage: blogStorage });

app.post("/api/admin/blog/upload", adminAuth, uploadBlogImage.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const hostUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${hostUrl}/uploads/blog/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ message: "Error uploading image" });
  }
});

app.get("/api/admin/blog", adminAuth, async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching posts" });
  }
});

app.post("/api/admin/blog", adminAuth, async (req, res) => {
  try {
    const newPost = new BlogPost(req.body);
    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put("/api/admin/blog/:id", adminAuth, async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(post);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete("/api/admin/blog/:id", adminAuth, async (req, res) => {
  try {
    await BlogPost.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Marketing Website Serve Logic
const marketingStatic = express.static(path.join(__dirname, "mk-subdata-website", "out"));
app.use((req, res, next) => {
    const host = req.hostname.toLowerCase();
    
    const envMarketingDomains = process.env.MARKETING_DOMAINS 
        ? process.env.MARKETING_DOMAINS.split(',').map(d => d.trim().toLowerCase()) 
        : ['9jasub.com', 'www.9jasub.com', 'app.9jasub.com', 'localhost', '127.0.0.1'];
        
    const previewSuffix = process.env.PREVIEW_DOMAIN_SUFFIX || '.up.railway.app';
    const isPreview = host.endsWith(previewSuffix);
    
    const isMarketingDomain = envMarketingDomains.includes(host) || isPreview;

    if (isMarketingDomain) {
        // 1. Use static for assets
        const isAsset = req.path.startsWith('/_next') || req.path.match(/\.(png|svg|jpg|ico|txt)$/);
        if (isAsset) {
            return marketingStatic(req, res, next);
        }

        // 2. Explicitly handle HTML paths for the marketing site ONLY
        const marketingPages = ['/about', '/services', '/get-started', '/developer', '/docs', '/privacy', '/terms'];
        const cleanPath = req.path.endsWith('/') && req.path.length > 1 ? req.path.slice(0, -1) : req.path;

        if (marketingPages.includes(cleanPath)) {
            const htmlPath = path.join(__dirname, "mk-subdata-website", "out", `${cleanPath.substring(1)}.html`);
            if (fs.existsSync(htmlPath)) {
                return res.sendFile(htmlPath);
            }
        }
        
        if (cleanPath === '/') {
            const index = path.join(__dirname, "mk-subdata-website", "out", "index.html");
            if (fs.existsSync(index)) {
                return res.sendFile(index);
            }
        }
        
        // Let everything else fall through to the SPA automatically.
        // API routes will work normally.
        // Valid React application routes will load perfectly.
        // Unknown routes will be caught by the React Router and display the correct SPA 404 page.
        return next();
    } else {
        next();
    }
});

app.use(express.static(path.join(__dirname, "mk-vtu-frontend", "dist")));

app.use(['/api', '/auth', '/user', '/buy-', '/reseller-assets', '/assets'], (req, res) => {
    res.status(404).json({ status: "error", message: "Endpoint or asset not found" });
});

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "mk-vtu-frontend", "dist", "index.html"));
});



// ERROR HANDLER
app.use((err, req, res, next) => {
    console.error(`[Global Error Handler] ${err.name}: ${err.message}`);
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ message: "Invalid JSON format" });
    }
    const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === undefined;
    res.status(500).json({ 
        message: "Internal server error", 
        error: isProd ? "An unexpected error occurred" : err.message 
    });
});

const startServer = async () => {
    try {
        await connectDB();
        
        // Clean up old default maintenance messages persistently in database
        try {
            await SystemSetting.updateMany(
                { maintenanceMessage: { $in: ["System is under scheduled maintenance. we are back now", "System is under scheduled maintenance. Please check back later."] } },
                { maintenanceMessage: "system is currently under maintenance" }
            );
            console.log("Updated default maintenance messages persistently.");
        } catch (dbErr) {
            console.error("Non-blocking maintenance message migration failed:", dbErr.message);
        }
        
        // Setup Cron Jobs
        cron.schedule('0 0 * * *', async () => {
            console.log('[Cron] Running daily analytics sync to Supabase...');
            const today = new Date().toISOString().split('T')[0];
            await syncDailyAnalytics(today, 'system');
            // In a real multi-tenant scenario, we'd loop through all active reseller IDs here
            // or aggregate globally first. The function handles 'system' by default.
        });
        
        // Start background services only after DB is ready
        queueService.startWorker();
        startProviderMonitoring();
        jobQueue.start();
        startRequeryJob();
        startResellerMaintenanceWorker();
        initBackupScheduler();
        reconciliationService.startScheduler();

        // Start Memory Protection and register cleanups
        startMemoryMonitor();
        registerCleanup('ResellerSubdomains', clearResellerCache);
        registerCleanup('Telemetry', clearTelemetryCache);
        
        const server = http.createServer(app);
        
        // Nginx proxy_pass path stripping workaround for Socket.IO
        server.prependListener('request', (req, res) => {
            if (req.url.includes('EIO=') && !req.url.startsWith('/socket.io')) {
                req.url = '/socket.io/' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
            }
        });
        server.prependListener('upgrade', (req, socket, head) => {
            if (req.url.includes('EIO=') && !req.url.startsWith('/socket.io')) {
                req.url = '/socket.io/' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
            }
        });

        // 4. Initialize Real-time Engine
        socketService.init(server);

        server.listen(process.env.PORT || 3000, () => {
            logger.info(`Server initialized in ${stage} mode on port ${process.env.PORT || 3000}`);
            console.log(`Server is running on port ${process.env.PORT || 3000}`);
        });

        // 5. Periodic Telemetry Broadcast
        setInterval(async () => {
            try {
                // Use the background-sampled CPU value (1s window + EMA) from adminController
                // This avoids hot-start spikes and gives accurate idle readings
                const cpuUsage = getLatestCpuUsage();
                const uptimeSec = process.uptime();
                const hrs = Math.floor(uptimeSec / 3600);
                const mins = Math.floor((uptimeSec % 3600) / 60);
                const secs = Math.floor(uptimeSec % 60);
                const uptimeStr = hrs > 0 ? `${hrs}h ${mins}m` : mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                const telemetry = {
                    cpu: cpuUsage,
                    memory: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
                    uptime: uptimeStr,
                    timestamp: new Date()
                };
                socketService.emitTelemetry({ telemetry: { system: telemetry } });
            } catch (e) {
                // Silent fail for background broadcast
            }
        }, 10000);

        // --- GRACEFUL SHUTDOWN HANDLERS ---
        const shutdown = async (signal) => {
            logger.warn(`Shutdown signal received: ${signal}. Commencing graceful exit...`);
            
            // 1. Stop accepting new builds
            jobQueue.stop();
            
            // 2. Close server (stop accepting new requests)
            server.close(() => {
                logger.info("HTTP server closed.");
            });

            // 3. Close DB connection
            try {
                await mongoose.connection.close();
                logger.info("MongoDB connection closed.");
                process.exit(0);
            } catch (err) {
                logger.error("Error during DB closure", { error: err.message });
                process.exit(1);
            }
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (err) {
        console.error("Failed to start server", err);
        process.exit(1);
    }
};

startServer();
