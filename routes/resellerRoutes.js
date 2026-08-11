import express from "express";
import { auth, restrictToBusinessSession } from "../middlewares/auth.js";
import { 
    getResellerStats, 
    getResellerUsers, 
    updateBranding, 
    getPriceOverrides, 
    setPriceOverride,
    resetPriceOverride,
    resetAllPriceOverrides,
    withdrawProfitToWallet,
    requestBankWithdrawal,
    getWithdrawalHistory,
    setWithdrawalPin,
    saveAppSettings,
    getAppStatus,
    triggerAssetRegeneration,
    getBuildStatus,
    getBuildHistory,
    submitAppRequest,
    getAppRequest,
    submitDomainRequest,
    getDomainRequest,
    getResellerContent,
    createResellerContent,
    deleteResellerContent,
    getResellerCustomerTransactions,
    getBusinessProfileStats,
    registerResellerUser,
    toggleResellerUserSuspension,
    notifyCustomer,
    claimSubdomain,
    updateEnabledPlatforms,
    getPremiumPricing,
    upgradeToPremium,
    payActivation,
    registerResellerWithPayment,
    getPremiumNotificationHistory,
    sendPremiumNotification,
    seenWelcomeBanner,
    seenBusinessGuide,
    toggleManualService
} from "../controllers/resellerController.js";
import { getEmailCampaigns, sendEmailCampaign } from "../controllers/resellerEmailCampaignController.js";
import { restrictToPremium, restrictToBasicOrPremium } from "../middlewares/tierMiddleware.js";
import { restrictToMainDomain } from "../middlewares/whiteLabel.js";

const router = express.Router();

// Public routes (No auth required)
router.post("/register-with-payment", restrictToMainDomain, registerResellerWithPayment);

// All routes below require auth
router.use(auth);
router.use(restrictToBusinessSession);

// Dashboard & User management (Available to all resellers)
router.get("/stats", restrictToBasicOrPremium, getResellerStats);
router.get("/users", restrictToBasicOrPremium, getResellerUsers);
router.post("/register-user", restrictToBasicOrPremium, registerResellerUser);
router.post("/users/:id/toggle-suspension", restrictToBasicOrPremium, toggleResellerUserSuspension);
router.get("/customers/transactions", restrictToBasicOrPremium, getResellerCustomerTransactions);
router.get("/profile-stats", restrictToBasicOrPremium, getBusinessProfileStats);
router.post("/withdraw-profit", restrictToBasicOrPremium, withdrawProfitToWallet);
router.post("/withdraw-bank", restrictToBasicOrPremium, requestBankWithdrawal);
router.get("/withdrawals", restrictToBasicOrPremium, getWithdrawalHistory);
router.post("/security/pin", restrictToBasicOrPremium, setWithdrawalPin);
// router.post("/register-user", restrictToBasicOrPremium, registerUser); // Replaced by registerResellerUser above

// Premium Feature: Pricing Controls
router.get("/prices", restrictToBasicOrPremium, getPriceOverrides);
router.post("/prices", restrictToPremium, setPriceOverride);
// Reset: single plan revert to Super Admin pricing (Premium only)
router.delete("/prices", restrictToPremium, resetPriceOverride);
// Reset: all plans revert to Super Admin pricing (Premium only)
router.delete("/prices/all", restrictToPremium, resetAllPriceOverrides);

// Premium Feature: Custom Content (Banners/Marquee)
router.get("/content", restrictToPremium, getResellerContent);
router.post("/content", restrictToPremium, createResellerContent);
router.delete("/content/:id", restrictToPremium, deleteResellerContent);

// Premium Feature: Advanced Branding
router.post("/branding", restrictToPremium, updateBranding);
router.post("/manual-services/toggle", restrictToBasicOrPremium, toggleManualService);
router.post("/app-settings", restrictToPremium, saveAppSettings);
router.get("/app-status", restrictToPremium, getAppStatus);
router.post("/generate-assets", restrictToPremium, triggerAssetRegeneration);
router.get("/build-status", restrictToPremium, getBuildStatus);
router.get("/build-history", restrictToPremium, getBuildHistory);

// Upgrade logic (Available to all resellers)
router.get("/premium-pricing", getPremiumPricing);
router.post("/upgrade-premium", upgradeToPremium);
router.post("/pay-activation", payActivation);
router.post("/seen-welcome", restrictToBasicOrPremium, seenWelcomeBanner);
router.post("/seen-business-guide", restrictToBasicOrPremium, seenBusinessGuide);

// Managed Operations (Available to all resellers, but specific features gated inside)
router.post("/app-request", restrictToBasicOrPremium, submitAppRequest);
router.get("/app-request", restrictToBasicOrPremium, getAppRequest);
router.post("/domain-request", restrictToBasicOrPremium, submitDomainRequest);
router.get("/domain-request", restrictToBasicOrPremium, getDomainRequest);

// Self-service: claim a subdomain if not yet assigned
router.post("/claim-subdomain", restrictToBasicOrPremium, claimSubdomain);

// Platform addons
router.post("/update-platforms", restrictToBasicOrPremium, updateEnabledPlatforms);

// Email Campaign (Premium Only)
router.get("/email-campaigns", restrictToPremium, getEmailCampaigns);
router.post("/email-campaign", restrictToPremium, sendEmailCampaign);

// Premium Customer Notification Center
router.get("/notifications/history", restrictToPremium, getPremiumNotificationHistory);
router.post("/notifications/send", restrictToPremium, sendPremiumNotification);

export default router;

// router.post('/users/:id/adjust-wallet', restrictToBasicOrPremium, adjustCustomerWallet);
router.post('/users/:id/notify', restrictToBasicOrPremium, notifyCustomer);
