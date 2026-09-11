import express from "express";
import { 
  adminLogin,
  getDashboardStats,
  getProfitStats,
  getUsers,
  getTransactions,
  updateUserStatus,
  initiateWalletAction,
  confirmWalletAction,
  getKycSubmissions,
  verifyKyc,
  getSettings,
  updateSetting,
  sendNotification,
  getAdminLogs,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getInternationalAnalytics,
  changePassword,
  getResellers,
  getResellerCustomers,
  updateResellerStatus,
  updateResellerTier,
  toggleUserFreeze,
  reverseTransaction,
  updateResellerBranding,
  broadcastToResellers,
  broadcastToResellerCustomers,
  adminResetPassword,
  updateResellerSettings,
  getMonitoringStats,
  getSystemSettings,
  updateSystemSettings,
  getAppRequests,
  updateAppRequestStatus,
  getDomainRequests,
  updateDomainRequestStatus,
  approveDomainDeployment,
  getServiceRequests,
  updateServiceRequestStatus,
  getServiceRequestDocuments,

  adminLoginStep2,
  adminLoginStep3,
  setupAdminSecurityQuestions,
  setupAdminFundingPassword,
  getAdminSecurityLogs,
  getAdminSecurityStatus,
  uploadApk,
  uploadAab,
  getTelemetry,
  updateResellerLifecycle,
  generateAppAssetsForRequest,
  downloadAssetsZip,
  getResellerRequests,
  approveResellerRequest,
  rejectResellerRequest,
  upgradeReseller,
  updateResellerFeatures,
  initiateResellerWalletAction,
  confirmResellerWalletAction,
  forceRebuildApp,
  forceSyncReseller,
  triggerManualBackup,
  restoreBackupFromFile,
  getAvailableBackups,
  getReconciliationReports,
  triggerManualReconciliation,
  getSystemLogs,
  getOperationsStats,
  getReconciliationDryRun,
  executeReconciliationRepair,
  executeBackupDiagnosticTest,
  executeRestoreDiagnosticTest,
  executeEmailDiagnosticTest,
  getProviders,
  updateProviderStatus,
  getOgdamsProviderStatus,
  getProviderRouting,
  setProviderRouting,
  queryAIAssistant,
  regenerateResellerUrl,
  getResellerPricingDashboard,
  setResellerAssignedPrice,
  removeResellerAssignedPrice,
  toggleResellerPricingPermission,
  toggleIndependence,
  getManualApplications,
  processManualApplicationCommission
} from "../controllers/adminController.js";
import { 
  searchUserByEmergencyId,
  getEmergencyPricing,
  approveEmergencyRequest,
  rejectEmergencyRequest,
  getEmergencyHistory
} from "../controllers/adminEmergencyDataController.js";
import {
  createPlatform,
  getAllPlatforms,
  updatePlatform,
  deletePlatform
} from "../controllers/futurePlatformController.js";
import {
  getUserAudit,
  getResellerCustomersAudit,
  getProfitLedgerAudit,
  getWithdrawalVerification,
  getResellerAnalyticsOverview
} from "../controllers/auditController.js";

import rateLimit from "express-rate-limit";

import { uploadBuild, uploadBuildMemory, uploadAsset, uploadDomain } from "../middlewares/uploadMiddleware.js";

import { adminAuth } from "../middlewares/adminAuth.js";
import { requireOwner } from "../middlewares/requireOwner.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import DataPlan from "../models/DataPlan.js";
import PriceOverride from "../models/PriceOverride.js";
import AdminPricingOverride from "../models/AdminPricingOverride.js";
import SystemSetting from "../models/SystemSetting.js";
import { smartFetchDataPlans } from "../services/switcher.js";
import { MTN_DATA_GIFTING_PLAN_IDS as OGDAMS_MTN_DATA_GIFTING_PLAN_IDS, diagnoseOgdamsDataPlanVersions } from "../services/providers/ogdams.js";
import { MTN_DATA_GIFTING_PLAN_IDS as SMEPLUG_MTN_DATA_GIFTING_PLAN_IDS } from "../services/providers/smeplug.js";
import fs from "fs";
import ApiLog from "../models/ApiLog.js";
import PricingSettings from "../models/PricingSettings.js";
import PricingRule from "../models/PricingRule.js";
import ServiceStatus from "../models/ServiceStatus.js";
import AnalyticsService from "../services/analyticsService.js";
import ProviderStatus from "../models/ProviderStatus.js";
const JARAPOINT_PLANS = JSON.parse(fs.readFileSync("./services/providers/jarapoint_plans.json", "utf8"));

const router = express.Router();

router.post("/login", adminLogin); // Legacy/Step1
router.post("/login/verify-otp", adminLoginStep2);
router.post("/login/verify-security", adminLoginStep3);

// Protect all following routes with adminAuth middleware
router.use(adminAuth);

router.post("/security/setup-questions", setupAdminSecurityQuestions);
router.post("/security/setup-funding-password", setupAdminFundingPassword);
router.get("/security/logs", getAdminSecurityLogs);
router.get("/security/status", getAdminSecurityStatus);

router.get("/stats", getDashboardStats);
router.get("/profit-stats", getProfitStats);
router.get("/users", getUsers);
router.get("/transactions", getTransactions);
router.post("/users/status", updateUserStatus);
router.post("/users/wallet/initiate", initiateWalletAction);
router.post("/users/wallet/confirm", confirmWalletAction);
router.get("/kyc", getKycSubmissions);
router.post("/kyc/verify", verifyKyc);
router.get("/settings", getSettings);
router.post("/settings", updateSetting);
router.post("/notifications", sendNotification);
router.get("/logs", getAdminLogs);
router.get("/withdrawals", getWithdrawals);
router.post("/withdrawals/approve", approveWithdrawal);
router.post("/withdrawals/reject", rejectWithdrawal);
router.get("/international-stats", getInternationalAnalytics);
router.post("/change-password", changePassword);

// --- REFERRAL ANALYTICS (SUPER ADMIN) ---
router.get("/referral-analytics", async (req, res) => {
    try {
        // 1. Total Referrals Platform-Wide
        const totalReferrals = await User.countDocuments({ referredBy: { $exists: true, $ne: null } });

        // 2. Active Referrals (referred users who have been fully activated — activationRewardGiven = true)
        const activeReferrals = await User.countDocuments({
            referredBy: { $exists: true, $ne: null },
            activationRewardGiven: true
        });

        // 3. Pending Referrals (referred users not yet activated)
        const pendingReferrals = totalReferrals - activeReferrals;

        // 4. Total Activation Rewards Paid (REF-REWARD- and CASHBACK- transactions)
        const activationRewardAggr = await Transaction.aggregate([
            { $match: {
                reference: { $regex: /^(REF-REWARD-|REF-ACT-|CASHBACK-)/i },
                status: "success"
            }},
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalActivationRewardsPaid = activationRewardAggr[0]?.total || 0;

        // 5. Total Lifetime Commissions (LREF- prefix — lifetime referral share transactions)
        const lifetimeCommissionAggr = await Transaction.aggregate([
            { $match: {
                $or: [
                    { reference: { $regex: /^LREF-/i } },
                    { ledger_type: 'LIFETIME_REFERRAL_SHARE' }
                ],
                status: "success"
            }},
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalLifetimeCommissions = lifetimeCommissionAggr[0]?.total || 0;

        // 6. Total Rewards Issued (combined)
        const totalRewardsIssued = totalActivationRewardsPaid + totalLifetimeCommissions;

        // 7. Recent Referral Reward Transactions (last 20)
        const rewardTransactions = await Transaction.find({
            $or: [
                { reference: { $regex: /^(REF-REWARD-|REF-ACT-|CASHBACK-|LREF-)/i } },
                { ledger_type: 'LIFETIME_REFERRAL_SHARE' }
            ],
            status: "success"
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('userId amount type description reference createdAt ledger_type');

        // Populate user names for reward transactions
        const rewardTxsWithNames = await Promise.all(
            rewardTransactions.map(async (tx) => {
                const u = await User.findById(tx.userId).select('name email').lean();
                return {
                    id: tx._id,
                    recipientName: u?.name || 'Unknown',
                    recipientEmail: u?.email || '',
                    amount: tx.amount,
                    type: tx.reference?.startsWith('LREF-') ? 'Lifetime Commission' :
                          tx.reference?.startsWith('CASHBACK-') ? 'Cashback' :
                          tx.reference?.startsWith('REF-REWARD-') ? 'Activation Reward' : 'Referral',
                    description: tx.description,
                    reference: tx.reference,
                    date: tx.createdAt
                };
            })
        );

        // 8. Top Referrers
        const topReferrersAggr = await User.aggregate([
            { $match: { referredBy: { $exists: true, $ne: null } } },
            { $group: { _id: "$referredBy", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const topReferrers = [];
        for (const aggr of topReferrersAggr) {
            const rUser = await User.findById(aggr._id).select('name email phone');
            if (rUser) {
                topReferrers.push({
                    name: rUser.name,
                    email: rUser.email,
                    phone: rUser.phone,
                    referralCount: aggr.count
                });
            }
        }

        // 9. Recent Activations (referred users who activated as website owners)
        const recentActivations = await User.find({
            referredBy: { $exists: true, $ne: null },
            activationRewardGiven: true
        })
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate('referredBy', 'name email');

        const mappedRecentActivations = recentActivations.map(u => ({
            name: u.name,
            email: u.email,
            tier: u.resellerTier,
            activatedAt: u.updatedAt,
            referrerName: u.referredBy?.name || 'Unknown'
        }));

        // 10. Referral Growth Statistics — new referrals per day for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const growthAggr = await User.aggregate([
            { $match: {
                referredBy: { $exists: true, $ne: null },
                createdAt: { $gte: thirtyDaysAgo }
            }},
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]);

        const referralGrowth = growthAggr.map(g => ({
            date: g._id,
            newReferrals: g.count
        }));

        res.json({
            totalReferrals,
            activeReferrals,
            pendingReferrals,
            totalActivationRewardsPaid,
            totalLifetimeCommissions,
            totalRewardsIssued,
            rewardTransactions: rewardTxsWithNames,
            topReferrers,
            recentActivations: mappedRecentActivations,
            referralGrowth
        });
    } catch (error) {
        console.error("[Admin Referral Analytics Error]", error);
        res.status(500).json({ message: "Error fetching referral analytics" });
    }
});


// --- AUDIT SYSTEM ROUTES (READ-ONLY) ---
router.get("/audit/user/:userId", getUserAudit);
router.get("/audit/reseller-customers/:resellerId", getResellerCustomersAudit);
router.get("/reseller-analytics", requireOwner, getResellerAnalyticsOverview);
router.get("/audit/profit-ledger/:resellerId", getProfitLedgerAudit);
router.get("/audit/withdrawal-verification/:withdrawalId", getWithdrawalVerification);

// --- PROVIDER MANAGEMENT ROUTES ---
router.get("/providers", requireOwner, getProviders);
router.get("/providers/ogdams/status", requireOwner, getOgdamsProviderStatus);
router.put("/providers/:id", requireOwner, updateProviderStatus);
router.get("/provider-routing", requireOwner, getProviderRouting);
router.post("/provider-routing", requireOwner, setProviderRouting);

// --- RESELLER MANAGEMENT ROUTES ---
router.get("/resellers", getResellers);
router.get("/resellers/:resellerId/customers", getResellerCustomers);
router.post("/resellers/status", updateResellerStatus);
router.post("/resellers/:resellerId/tier", updateResellerTier);
router.post("/users/freeze", toggleUserFreeze);
router.post("/transactions/reverse", reverseTransaction);
router.post("/resellers/:id/branding", updateResellerBranding);
router.post("/resellers/broadcast", broadcastToResellers);
router.post("/resellers/:id/customers/broadcast", broadcastToResellerCustomers);
router.post("/users/reset-password", adminResetPassword);
router.post("/resellers/:id/lifecycle", updateResellerLifecycle);
router.post("/resellers/:id/settings", updateResellerSettings);
router.post("/resellers/regenerate-url", regenerateResellerUrl);
router.post("/resellers/:id/upgrade", upgradeReseller);
router.post("/resellers/:id/features", updateResellerFeatures);
router.post("/resellers/:id/wallet/initiate", initiateResellerWalletAction);
router.post("/resellers/:id/wallet/confirm", confirmResellerWalletAction);
router.get("/reseller-requests", getResellerRequests);
router.post("/reseller-requests/:id/approve", approveResellerRequest);
router.post("/reseller-requests/:id/reject", rejectResellerRequest);

// Phase 11 Super Admin Controls
router.post("/resellers/:id/independence", toggleIndependence);
// router.post("/resellers/:id/reset-branding", resetTenantBranding);
// router.post("/resellers/:id/force-logout", forceLogoutTenant);

// Emergency Data Purchase Engine (Phase 12)
router.get("/emergency-data/search", searchUserByEmergencyId);
router.get("/emergency-data/pricing", getEmergencyPricing);
router.post("/emergency-data/approve", approveEmergencyRequest);
router.post("/emergency-data/reject", rejectEmergencyRequest);
router.get("/emergency-data/history", getEmergencyHistory);

// Reseller Pricing Management (Super Admin)
router.get("/resellers/:id/pricing-dashboard", getResellerPricingDashboard);
router.post("/resellers/:id/assign-price", setResellerAssignedPrice);
router.delete("/resellers/:id/assign-price", removeResellerAssignedPrice);
router.post("/resellers/:id/pricing-permission", toggleResellerPricingPermission);

// Manual Applications
router.get("/manual-applications", getManualApplications);
router.post("/manual-applications/commission", processManualApplicationCommission);

// --- ADMIN RESELLER PRICING MANAGEMENT ---

router.get("/resellers/:id/pricing", async (req, res) => {
    try {
        const resellerId = req.params.id;
        const reseller = await User.findById(resellerId);
        if (!reseller) return res.status(404).json({ message: "Reseller not found" });

        const allPlans = await DataPlan.find({ status: true }).sort({ network: 1, selling_price: 1 });
        const overrides = await PriceOverride.find({ resellerId });
        const adminOverrides = await AdminPricingOverride.find({ resellerId });

        const pricing = allPlans.map(plan => {
            const override = overrides.find(o => o.planId === plan.api_plan_id && o.network === plan.network);
            const adminOverride = adminOverrides.find(o => o.planId === plan.api_plan_id && o.network === plan.network && o.serviceType === 'data');
            
            let resellerCost = plan.basic_price || plan.reseller_price || plan.selling_price;
            if (reseller.resellerTier === 'premium') resellerCost = plan.premium_price || plan.vip_price || resellerCost;
            else if (reseller.resellerTier === 'vip') resellerCost = plan.vip_price || resellerCost;
            
            if (adminOverride && adminOverride.buyingPrice) {
                resellerCost = adminOverride.buyingPrice;
            }

            return {
                planId: plan.api_plan_id,
                planName: plan.plan_name,
                planSize: plan.plan_size,
                network: plan.network,
                category: plan.category,
                validity: plan.validity,
                basePrice: plan.selling_price, // Global retail
                resellerPrice: resellerCost, // Cost to this specific reseller
                sellingPrice: override ? override.sellingPrice : (plan.selling_price), // Price to their customers
                isOverridden: !!override,
                isAdminOverridden: !!adminOverride,
                overrideId: override ? override._id : null,
                status: override ? override.status : 'enabled'
            };
        });

        res.json({ isPremium: reseller.resellerTier === 'premium', tier: reseller.resellerTier, pricing });
    } catch (err) {
        res.status(500).json({ message: "Error fetching reseller pricing: " + err.message });
    }
});

router.post("/resellers/:id/admin-override", async (req, res) => {
    try {
        const resellerId = req.params.id;
        const { serviceType, network, planId, buyingPrice, marginPercentage, assignedSellingPrice } = req.body;

        if (!serviceType) {
            return res.status(400).json({ message: "serviceType is required" });
        }

        const override = await AdminPricingOverride.findOneAndUpdate(
            { resellerId, serviceType, network: network ? network.toUpperCase() : undefined, planId },
            { 
                buyingPrice: buyingPrice ? Number(buyingPrice) : undefined, 
                marginPercentage: marginPercentage ? Number(marginPercentage) : undefined, 
                assignedSellingPrice: assignedSellingPrice ? Number(assignedSellingPrice) : undefined,
                status: 'enabled' 
            },
            { upsert: true, new: true }
        );

        res.json({ message: "Admin price override saved", override });
    } catch (err) {
        res.status(500).json({ message: "Error saving admin price override: " + err.message });
    }
});

router.delete("/resellers/:id/admin-override", async (req, res) => {
    try {
        const resellerId = req.params.id;
        const { serviceType, network, planId } = req.body;

        if (serviceType) {
            await AdminPricingOverride.findOneAndDelete({ resellerId, serviceType, planId, network: network ? network.toUpperCase() : undefined });
            res.json({ message: "Admin price override removed" });
        } else {
            const result = await AdminPricingOverride.deleteMany({ resellerId });
            res.json({ message: `All ${result.deletedCount} admin price overrides reset` });
        }
    } catch (err) {
        res.status(500).json({ message: "Error resetting admin price overrides: " + err.message });
    }
});

router.post("/resellers/:id/pricing", async (req, res) => {
    try {
        const resellerId = req.params.id;
        const { planId, network, customPrice } = req.body;

        if (!planId || customPrice === undefined) {
            return res.status(400).json({ message: "planId and customPrice are required" });
        }

        const { getSupabaseClient } = await import('../services/supabaseClient.js');
        const supabase = getSupabaseClient();
        if (!supabase) return res.status(500).json({ message: "Supabase not connected" });

        const { data, error } = await supabase
            .from('reseller_custom_price_overrides')
            .upsert({ 
                reseller_id: resellerId,
                plan_id: planId,
                custom_price: Number(customPrice),
                updated_at: new Date()
            }, { onConflict: 'reseller_id, plan_id' });

        if (error) throw error;

        res.json({ message: "Price override saved", override: data });
    } catch (err) {
        res.status(500).json({ message: "Error saving price override: " + err.message });
    }
});

router.delete("/resellers/:id/pricing", async (req, res) => {
    try {
        const resellerId = req.params.id;
        const { planId, network } = req.body;

        if (planId && network) {
            // Reset single plan
            await PriceOverride.findOneAndDelete({ resellerId, planId, network: network.toUpperCase() });
            res.json({ message: "Price override reset to default" });
        } else {
            // Reset ALL overrides for this reseller
            const result = await PriceOverride.deleteMany({ resellerId });
            res.json({ message: `All ${result.deletedCount} price overrides reset to default` });
        }
    } catch (err) {
        res.status(500).json({ message: "Error resetting price overrides: " + err.message });
    }
});

// --- SYSTEM SETTINGS, BACKUP, RECONCILIATION MOVED TO SUPER ADMIN ROUTES ---

// --- DATA PLAN PRICING ROUTES ---
router.get("/data-plans", async (req, res) => {
    try {
        const { network, category, provider, status, search, page = 1, limit = 50 } = req.query;
        let query = {};
        if (network) query.network = network;
        if (category) query.category = category;
        if (provider) query.provider = provider;
        if (status !== undefined && status !== '') query.status = status === 'true';
        if (search) {
            query.$or = [
                { plan_name: { $regex: search, $options: 'i' } },
                { plan_size: { $regex: search, $options: 'i' } }
            ];
        }

          let plans = [];
          let retries = 3;
          let lastError = null;
          
          while (retries > 0) {
              try {
                  plans = await DataPlan.find(query)
                      .sort({ network: 1, api_price: 1 })
                      .limit(parseInt(limit))
                      .skip((parseInt(page) - 1) * parseInt(limit))
                      .maxTimeMS(8000); // Fail fast to allow retry
                  break; // Success
              } catch (err) {
                  lastError = err;
                  retries--;
                  console.error(`[Pricing Engine Diagnostics] MongoDB fetch failed. Retries left: ${retries}. Error:`, err.message);
                  if (retries > 0) await new Promise(res => setTimeout(res, 1500)); // wait before retry
              }
          }
          
          if (retries === 0) {
              console.error("[Pricing Engine Diagnostics] Exhausted all retries for /data-plans. Returning 500.", lastError);
              return res.status(500).json({ message: "Failed to fetch data plans from MongoDB after retries." });
          }
            
        const total = await DataPlan.countDocuments(query);
        const activeCount = await DataPlan.countDocuments({ status: true });
        
        const allActive = await DataPlan.find({ status: true });
        const totalProfit = allActive.reduce((sum, p) => sum + (p.profit || 0), 0);

        res.json({ 
            plans, 
            total, 
            activeCount,
            totalProfit,
            page: parseInt(page), 
            pages: Math.ceil(total / limit) 
        });
    } catch (err) {
        console.error("[Admin API] Error fetching data plans:", err);
        res.status(500).json({ message: "Error fetching data plans: " + err.message });
    }
});

// Pure merge used by GET /data-plans/ogdams-sme below -- exported for direct
// unit testing without a DB. Always returns exactly one row per confirmed
// whitelist entry, in whitelist order, so a plan ID that hasn't been synced
// yet still shows up (synced: false, no editable pricing) instead of
// silently disappearing from the admin's view.
function mergeOgdamsSmePlans(existingPlans, whitelist) {
    const byPlanId = new Map(existingPlans.map((p) => [p.api_plan_id, p]));
    return Object.entries(whitelist).map(([planId, description]) => {
        const existing = byPlanId.get(planId);
        if (existing) {
            return {
                _id: existing._id,
                plan_id: planId,
                description,
                plan_name: existing.plan_name,
                plan_size: existing.plan_size,
                validity: existing.validity,
                api_price: existing.api_price,
                selling_price: existing.selling_price,
                reseller_price: existing.reseller_price,
                vip_price: existing.vip_price,
                premium_price: existing.premium_price,
                profit: existing.profit,
                status: existing.status,
                synced: true
            };
        }
        return {
            _id: null,
            plan_id: planId,
            description,
            plan_name: null,
            plan_size: null,
            validity: null,
            api_price: null,
            selling_price: null,
            reseller_price: null,
            vip_price: null,
            premium_price: null,
            profit: null,
            status: false,
            synced: false
        };
    });
}

// Independent Ogdams MTN SME (Gifting) pricing view -- separate from the
// generic /data-plans list/pagination used by "Legacy Data Pricing" (Peyflex
// and every other provider). Always returns exactly the 9 confirmed
// MTN_DATA_GIFTING_PLAN_IDS whitelisted in services/providers/ogdams.js (the
// same whitelist the sync route enforces), merged with whatever DataPlan
// document already exists for each. Editing still goes through the existing
// PUT /data-plans/:id -- this route is read-only.
router.get("/data-plans/ogdams-sme", async (req, res) => {
    try {
        const existingPlans = await DataPlan.find({ provider: 'ogdams', network: 'MTN', category: 'Gifting' }).lean();
        const plans = mergeOgdamsSmePlans(existingPlans, OGDAMS_MTN_DATA_GIFTING_PLAN_IDS);
        res.json({ plans });
    } catch (err) {
        console.error("[Admin API] Error fetching Ogdams SME plans:", err);
        res.status(500).json({ message: "Error fetching Ogdams SME plans: " + err.message });
    }
});

// Same independent view as GET /data-plans/ogdams-sme above, but for SmePlug's
// user-selected MTN Gifting plan IDs (services/providers/smeplug.js's
// MTN_DATA_GIFTING_PLAN_IDS). mergeOgdamsSmePlans() is fully generic (takes
// any existingPlans+whitelist pair) so it's reused as-is, no duplicate needed.
router.get("/data-plans/smeplug-gifting", async (req, res) => {
    try {
        const existingPlans = await DataPlan.find({ provider: 'smeplug', network: 'MTN', category: 'Gifting' }).lean();
        const plans = mergeOgdamsSmePlans(existingPlans, SMEPLUG_MTN_DATA_GIFTING_PLAN_IDS);
        res.json({ plans });
    } catch (err) {
        console.error("[Admin API] Error fetching SmePlug Gifting plans:", err);
        res.status(500).json({ message: "Error fetching SmePlug Gifting plans: " + err.message });
    }
});

// Used only by the "combine catalog" step in POST /data-plans/sync below, to
// decide whether an Ogdams MTN Gifting plan and an existing MTN Gifting plan
// from another provider represent the exact same customer-facing bundle
// (same data volume + same validity). Returns null when either the size or
// the validity text can't be confidently parsed -- callers must treat null
// as "no match", never as "match everything", so an ambiguous plan is safely
// left alone (kept unchanged) rather than risking an incorrect merge.
function parseDataSizeToMB(sizeStr) {
    const m = String(sizeStr || '').match(/(\d+(?:\.\d+)?)\s*(MB|GB|TB)/i);
    if (!m) return null;
    const num = parseFloat(m[1]);
    const unit = m[2].toUpperCase();
    if (unit === 'TB') return num * 1000 * 1000;
    if (unit === 'GB') return num * 1000;
    return num;
}

function parseValidityToDays(validityStr) {
    const s = String(validityStr || '').toLowerCase();
    const dayMatch = s.match(/(\d+(?:\.\d+)?)\s*day/);
    if (dayMatch) return parseFloat(dayMatch[1]);
    const hourMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:hr|hour)/);
    if (hourMatch) return parseFloat(hourMatch[1]) / 24;
    if (/\bdaily\b/.test(s)) return 1;
    if (/\bweekly\b/.test(s)) return 7;
    if (/\bmonthly\b/.test(s)) return 30;
    return null;
}

function dataPlanMatchKey(planSize, validity) {
    const sizeMB = parseDataSizeToMB(planSize);
    const days = parseValidityToDays(validity);
    if (sizeMB === null || days === null) return null;
    return `${sizeMB}|${days}`;
}

// Creates or updates the single DataPlan document for one normalized
// provider plan (provider/plan_code|plan_id/name/price/validity). Shared by
// the full multi-provider sync loop and the fast, Ogdams-only sync below --
// extracted so both stay in sync instead of drifting apart.
async function upsertDataPlanFromProviderPlan(p, network) {
    let category = 'Direct';
    if (p.provider === 'ogdams' || p.provider === 'smeplug') {
        // Every plan getOgdamsMtnGiftingPlans()/getSmeplugMtnGiftingPlans()
        // returns is, by construction, one of the confirmed MTN Data Gifting
        // plan IDs -- never derived from name-substring matching for these
        // providers, since their own plan name text isn't guaranteed to say
        // "gifting" and guessing it from the name would be exactly the kind
        // of assumption this integration was told not to make.
        category = 'Gifting';
    } else {
        const nLower = String(p.name || '').toLowerCase();
        if (nLower.includes('smart sme')) category = 'Smart SME';
        else if (nLower.includes('sme')) category = 'SME';
        else if (nLower.includes('corporate') || nLower.includes('cg')) category = 'Corporate';
        else if (nLower.includes('data share')) category = 'Data Share';
        else if (nLower.includes('gifting') || nLower.includes('gift')) category = 'Gifting';
    }

    const sizeMatch = (p.name || '').match(/(\d+(?:\.\d+)?\s*(?:MB|GB|TB))/i);
    const planSize = sizeMatch ? sizeMatch[1].toUpperCase() : '';
    const apiPrice = Number(p.price) || 0;
    const planId = String(p.plan_code || p.plan_id);

    const existingPlan = await DataPlan.findOne({ api_plan_id: planId, provider: p.provider, network: network.toUpperCase() });

    if (existingPlan) {
        try {
            existingPlan.api_price = apiPrice;
            existingPlan.plan_name = p.name || p.plan_name;
            existingPlan.plan_size = planSize;
            await existingPlan.save();
            return { created: false };
        } catch (updateErr) {
            console.error(`[Sync] Failed to update plan ${planId} on ${network}:`, updateErr.message);
            return null;
        }
    }
    try {
        const sellingPrice = apiPrice + 20;
        await DataPlan.create({
            network: network.toUpperCase(),
            category,
            plan_name: p.name || p.plan_name,
            plan_size: planSize,
            api_plan_id: planId,
            api_price: apiPrice,
            selling_price: sellingPrice,
            provider: p.provider,
            validity: p.validity || '30 Days',
            status: true
        });
        return { created: true };
    } catch (createErr) {
        console.error(`[Sync] Failed to create plan ${planId} on ${network}:`, createErr.message);
        return null;
    }
}

// Combine catalog: a `providerName` MTN Data Gifting plan that matches an
// existing MTN Gifting-category plan from another provider -- by exact data
// volume + validity -- is the customer-facing "same plan" as that other
// provider's version. Rather than showing two duplicate plans for the same
// bundle, deactivate the other provider's duplicate (via the existing,
// already admin-editable DataPlan.status flag) and let `providerName`'s plan
// represent it going forward. Any other Gifting plan with no match is left
// completely untouched. Shared by the full sync route and each provider's
// own fast sync (syncOgdamsMtnPlans, syncSmeplugMtnPlans).
async function combineProviderCatalog(providerName) {
    let combined = 0;
    try {
        const providerGiftingPlans = await DataPlan.find({ provider: providerName, network: 'MTN', category: 'Gifting', status: true });
        if (providerGiftingPlans.length > 0) {
            const otherGiftingPlans = await DataPlan.find({ provider: { $ne: providerName }, network: 'MTN', category: 'Gifting', status: true });
            for (const ownPlan of providerGiftingPlans) {
                const ownKey = dataPlanMatchKey(ownPlan.plan_size, ownPlan.validity);
                if (!ownKey) continue;
                for (const other of otherGiftingPlans) {
                    if (other.status === false) continue; // already deactivated by an earlier match this run
                    const otherKey = dataPlanMatchKey(other.plan_size, other.validity);
                    if (otherKey && otherKey === ownKey) {
                        other.status = false;
                        await other.save();
                        combined++;
                        console.log(`[Sync] Combined catalog: deactivated duplicate ${other.provider} MTN Gifting plan "${other.plan_name}" (matches ${providerName} plan "${ownPlan.plan_name}")`);
                    }
                }
            }
        }
    } catch (err) {
        console.error(`[Sync] Combine catalog step failed for ${providerName} (non-fatal):`, err.message);
    }
    return combined;
}
const combineOgdamsCatalog = () => combineProviderCatalog('ogdams');
const combineSmeplugCatalog = () => combineProviderCatalog('smeplug');

// Fast, Ogdams-only sync: fetches just the 9 confirmed MTN Data Gifting
// plans from Ogdams (one HTTP call), upserts their DataPlan documents, then
// runs the combine-catalog step. Unlike the full multi-provider sync below
// (which also re-fetches Peyflex and ClubKonnect for every network and can
// take minutes), this touches only Ogdams' own MTN plans, so it's safe to
// run automatically every time the Ogdams SME pricing rule is saved.
async function syncOgdamsMtnPlans() {
    const plans = await smartFetchDataPlans('MTN', 'ogdams');
    let added = 0;
    let updated = 0;
    for (const p of plans || []) {
        const result = await upsertDataPlanFromProviderPlan(p, 'MTN');
        if (result) result.created ? added++ : updated++;
    }
    const combined = await combineOgdamsCatalog();
    return { added, updated, combined };
}

router.post("/data-plans/ogdams-sme/sync", async (req, res) => {
    try {
        console.log("[Admin] Starting Ogdams-only MTN SME sync...");
        const { added, updated, combined } = await syncOgdamsMtnPlans();
        res.json({ message: "Ogdams sync complete", added, updated, combined });
    } catch (err) {
        console.error("Ogdams Sync Error:", err);
        res.status(500).json({ message: "Error syncing Ogdams plans: " + err.message });
    }
});

// Fast, SmePlug-only sync -- same pattern as syncOgdamsMtnPlans above, fetches
// just the 8 user-selected MTN Data Gifting plans from SmePlug.
async function syncSmeplugMtnPlans() {
    const plans = await smartFetchDataPlans('MTN', 'smeplug');
    let added = 0;
    let updated = 0;
    for (const p of plans || []) {
        const result = await upsertDataPlanFromProviderPlan(p, 'MTN');
        if (result) result.created ? added++ : updated++;
    }
    const combined = await combineSmeplugCatalog();
    return { added, updated, combined };
}

router.post("/data-plans/smeplug-gifting/sync", async (req, res) => {
    try {
        console.log("[Admin] Starting SmePlug-only MTN Gifting sync...");
        const { added, updated, combined } = await syncSmeplugMtnPlans();
        res.json({ message: "SmePlug sync complete", added, updated, combined });
    } catch (err) {
        console.error("SmePlug Sync Error:", err);
        res.status(500).json({ message: "Error syncing SmePlug plans: " + err.message });
    }
});

// Diagnostic only -- does not write anything to the catalog. Probes
// /get/data/plans v1-v4 (Ogdams support suggested trying the other versions
// after v1 kept returning zero plans) and logs each raw response body
// server-side, since the docs don't supply a shape for v2-v4 to parse
// against. Returns a small summary so the admin can see item counts without
// digging through logs, but the actual investigation happens in the logs.
router.get("/data-plans/ogdams-sme/diagnose", async (req, res) => {
    try {
        console.log("[Admin] Starting Ogdams /get/data/plans version diagnosis...");
        const results = await diagnoseOgdamsDataPlanVersions();
        res.json({ message: "Diagnosis complete -- see server logs for raw response bodies", results });
    } catch (err) {
        console.error("Ogdams Diagnose Error:", err);
        res.status(500).json({ message: "Error diagnosing Ogdams plan versions: " + err.message });
    }
});

router.post("/data-plans/sync", async (req, res) => {
    try {
        console.log("[Admin] Starting Data Plan Sync...");
        const networks = ['MTN', 'GLO', 'AIRTEL', '9MOBILE'];
        // 'ogdams'/'smeplug' are scoped to MTN only for now (see
        // smartFetchDataPlans) -- they safely no-op (return []) for
        // GLO/AIRTEL/9MOBILE rather than fetching anything for them.
        const options = ['smart', 'value', 'ogdams', 'smeplug'];
        let added = 0;
        let updated = 0;

        for (const option of options) {
            for (const network of networks) {
                const plans = await smartFetchDataPlans(network, option);
                if (plans && plans.length > 0) {
                    for (const p of plans) {
                        const result = await upsertDataPlanFromProviderPlan(p, network);
                        if (result) result.created ? added++ : updated++;
                    }
                }
            }
        }

        const combined = (await combineOgdamsCatalog()) + (await combineSmeplugCatalog());

        for (const p of JARAPOINT_PLANS) {
            const apiPrice = Number(p.price) || 0;
            const planId = String(p.plan_id);
            const sizeMatch = (p.name || '').match(/(\d+(?:\.\d+)?\s*(?:MB|GB|TB))/i);
            const planSize = sizeMatch ? sizeMatch[1].toUpperCase() : '';

            const existingPlan = await DataPlan.findOne({ api_plan_id: planId, provider: 'connectbridge' });
            if (existingPlan) {
                existingPlan.api_price = apiPrice;
                existingPlan.plan_name = p.name;
                existingPlan.plan_size = planSize;
                await existingPlan.save();
                updated++;
            } else {
                const sellingPrice = apiPrice + 50;
                await DataPlan.create({
                    network: p.network,
                    category: p.type?.toUpperCase() || 'SME',
                    plan_name: p.name,
                    plan_size: planSize,
                    api_plan_id: planId,
                    api_price: apiPrice,
                    selling_price: sellingPrice,
                    provider: 'connectbridge',
                    validity: '30 Days',
                    status: true
                });
                added++;
            }
        }
        // Sync to Supabase Master Table
        try {
            const { getSupabaseClient } = await import('../services/supabaseClient.js');
            const supabase = getSupabaseClient();
            if (supabase) {
                const allPlans = await DataPlan.find({ status: true });
                for (const p of allPlans) {
                    await supabase.from('data_plans_master').upsert({
                        network: p.network.toUpperCase(),
                        provider_plan_id: p.api_plan_id,
                        plan_name: p.plan_name,
                        category: p.category,
                        api_price: p.api_price || 0,
                        status: p.status
                    }, { onConflict: 'network, provider_plan_id' });
                }
            }
        } catch (syncErr) {
            console.error("[Supabase Master Sync Error]", syncErr);
        }

        res.json({ message: "Sync complete", added, updated, combined });
    } catch (err) {
        console.error("Sync Error:", err);
        res.status(500).json({ message: "Error syncing plans: " + err.message });
    }
});

router.put("/data-plans/:id", async (req, res) => {
    try {
        const { api_price, selling_price, status, reseller_price, vip_price, premium_price } = req.body;
        const plan = await DataPlan.findById(req.params.id);
        if (!plan) return res.status(404).json({ message: "Plan not found" });

        if (api_price !== undefined) {
            const n = Number(api_price);
            if (isNaN(n) || n < 0) return res.status(400).json({ message: "api_price must be a non-negative number" });
            plan.api_price = n;
        }
        if (selling_price !== undefined) {
            const n = Number(selling_price);
            if (isNaN(n) || n < 0) return res.status(400).json({ message: "selling_price must be a non-negative number" });
            plan.selling_price = n;
        }
        if (status !== undefined) plan.status = Boolean(status);
        if (reseller_price !== undefined) plan.reseller_price = Number(reseller_price);
        if (vip_price !== undefined) plan.vip_price = Number(vip_price);
        if (premium_price !== undefined) plan.premium_price = Number(premium_price);
        
        await plan.save();
        
        // Supabase Master Sync
        try {
            const { getSupabaseClient } = await import('../services/supabaseClient.js');
            const supabase = getSupabaseClient();
            if (supabase) {
                await supabase.from('data_plans_master').upsert({
                    network: plan.network.toUpperCase(),
                    provider_plan_id: plan.api_plan_id,
                    plan_name: plan.plan_name,
                    category: plan.category,
                    api_price: plan.api_price || 0,
                    status: plan.status
                }, { onConflict: 'network, provider_plan_id' });
            }
        } catch (syncErr) {
            console.error("[Supabase Master Sync Error]", syncErr);
        }

        res.json({ message: "Plan updated successfully", plan });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error updating plan" });
    }
});

router.post("/data-plans/bulk", async (req, res) => {
    try {
        const { ids, action, value } = req.body;
        if (!ids || !ids.length) return res.status(400).json({ message: "No plans selected" });

        if (action === 'enable') {
            await DataPlan.updateMany({ _id: { $in: ids } }, { status: true });
        } else if (action === 'disable') {
            await DataPlan.updateMany({ _id: { $in: ids } }, { status: false });
        } else if (action === 'increase_flat') {
            const plans = await DataPlan.find({ _id: { $in: ids } });
            for (const plan of plans) {
                plan.selling_price += Number(value);
                await plan.save();
            }
        } else if (action === 'increase_percent') {
            const plans = await DataPlan.find({ _id: { $in: ids } });
            for (const plan of plans) {
                const increase = plan.selling_price * (Number(value) / 100);
                plan.selling_price += increase;
                await plan.save();
            }
        }
        res.json({ message: "Bulk action applied successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error applying bulk action" });
    }
});

// --- TIER PRICING ROUTES (SUPABASE) ---
router.get("/pricing/:tier", async (req, res) => {
    try {
        const { tier } = req.params;
        const validTiers = { retail: 'retail_prices', vip: 'vip_prices', basic: 'basic_prices' };
        if (!validTiers[tier]) return res.status(400).json({ message: "Invalid tier" });
        
        const { getSupabaseClient } = await import('../services/supabaseClient.js');
        const supabase = getSupabaseClient();
        if (!supabase) return res.status(500).json({ message: "Supabase not connected" });
        
        let selectQuery = `*, ${validTiers[tier]} (selling_price)`;
        if (tier === 'basic' || tier === 'vip') {
            selectQuery = `*, ${validTiers[tier]} (selling_price, reseller_cost, reseller_selling_price)`;
        }

        const { data, error } = await supabase
            .from('data_plans_master')
            .select(selectQuery)
            .eq('status', true)
            .order('api_price', { ascending: true });
            
        if (error) throw error;
        res.json({ plans: data });
    } catch (err) {
        res.status(500).json({ message: "Error fetching pricing: " + err.message });
    }
});

router.post("/pricing/:tier", async (req, res) => {
    try {
        const { tier } = req.params;
        const { plan_id, selling_price, reseller_cost, reseller_selling_price } = req.body;
        const validTiers = { retail: 'retail_prices', vip: 'vip_prices', basic: 'basic_prices' };
        if (!validTiers[tier]) return res.status(400).json({ message: "Invalid tier" });
        
        const { getSupabaseClient } = await import('../services/supabaseClient.js');
        const supabase = getSupabaseClient();
        if (!supabase) return res.status(500).json({ message: "Supabase not connected" });
        
        const payload = {
            plan_id,
            selling_price: Number(selling_price),
            updated_at: new Date().toISOString()
        };

        if (tier === 'basic' || tier === 'vip') {
            if (reseller_cost !== undefined) payload.reseller_cost = Number(reseller_cost);
            if (reseller_selling_price !== undefined) payload.reseller_selling_price = Number(reseller_selling_price);
            // Sync selling_price for legacy compatibility if not provided
            if (selling_price === undefined && reseller_cost !== undefined) payload.selling_price = Number(reseller_cost);
        }

        const { error: upsertError } = await supabase
            .from(validTiers[tier])
            .upsert(payload, { onConflict: 'plan_id' });
            
        if (upsertError) throw upsertError;

        // SYNC TO MONGODB SO THE TRANSACTION ENGINE PROCESSES IT CORRECTLY
        // Lookup Supabase plan_id to get provider_plan_id
        const { data: masterPlan, error: fetchError } = await supabase
            .from('data_plans_master')
            .select('provider_plan_id')
            .eq('id', plan_id)
            .single();

        if (fetchError || !masterPlan) {
            console.error('[AdminPricing] Master plan lookup failed:', fetchError);
            return res.status(404).json({ message: "Master plan not found for MongoDB sync" });
        }

        const api_plan_id = masterPlan.provider_plan_id;
        let updateResult = { matchedCount: 0, modifiedCount: 0 };

        if (tier === 'retail') {
            // Retail: update the main selling_price field used by the transaction engine
            updateResult = await DataPlan.updateMany({ api_plan_id }, { selling_price: Number(selling_price) });

        } else if (tier === 'vip') {
            // VIP/Premium: update vip_selling_price & premium_selling_price (read by calculateVtuPrice Priority 3)
            // Also update reseller cost fields used to calculate basePrice
            updateResult = await DataPlan.updateMany({ api_plan_id }, { 
                premium_price: Number(reseller_cost || selling_price),
                vip_price: Number(reseller_cost || selling_price),
                vip_selling_price: Number(reseller_selling_price || selling_price),
                premium_selling_price: Number(reseller_selling_price || selling_price)
            });

        } else if (tier === 'basic') {
            // Basic: update reseller_price (cost) & basic_selling_price (customer price, read by calculateVtuPrice Priority 3)
            updateResult = await DataPlan.updateMany({ api_plan_id }, { 
                reseller_price: Number(reseller_cost || selling_price),
                basic_selling_price: Number(reseller_selling_price || selling_price)
            });
        }

        console.log(`[AdminPricing] MongoDB sync for ${api_plan_id}: matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}`);

        res.json({ message: "Price updated" });
    } catch (err) {
        console.error('[AdminPricing] Error updating pricing:', err);
        res.status(500).json({ message: "Error updating pricing: " + err.message });
    }
});



// --- ENTERPRISE API ROUTES ---
router.get("/api/traffic", async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const logs = await ApiLog.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        const total = await ApiLog.countDocuments();
        res.json({ logs, total, pages: Math.ceil(total / limit) });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post("/users/api-config", async (req, res) => {
    try {
        const { userId, apiLevel, isSuspended } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (apiLevel) user.apiLevel = apiLevel;
        if (isSuspended !== undefined) user.isSuspended = isSuspended;

        await user.save();
        res.json({ message: "API Configuration updated", user });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post("/users/white-label-approve", async (req, res) => {
    try {
        const { userId, status } = req.body;
        const user = await User.findByIdAndUpdate(userId, { whiteLabelStatus: status }, { new: true });
        res.json({ message: `White Label status updated to ${status}`, user });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get("/api/enterprise-stats", async (req, res) => {
    try {
        const stats = await AnalyticsService.getAdminStats();
        res.json({ status: 'success', data: stats });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- SUPER ADMIN / OPERATIONS CENTER ROUTES RESTORED ---
router.get("/system-settings", requireOwner, getSystemSettings);
router.post("/system-settings", requireOwner, updateSystemSettings);
router.get("/operations-stats", requireOwner, getOperationsStats);
router.get("/telemetry", requireOwner, getTelemetry);
router.get("/system-logs", requireOwner, getSystemLogs);
router.get("/monitoring-stats", requireOwner, getMonitoringStats);

// --- FUTURE PLATFORMS ROUTES ---
router.post("/future-platforms", requireOwner, createPlatform);
router.get("/future-platforms", requireOwner, getAllPlatforms);
router.put("/future-platforms/:id", requireOwner, updatePlatform);
router.delete("/future-platforms/:id", requireOwner, deletePlatform);

router.get("/backups", requireOwner, getAvailableBackups);
router.post("/backups/trigger", requireOwner, triggerManualBackup);
router.post("/backups/restore", requireOwner, restoreBackupFromFile);
router.post("/backups/diagnostic", requireOwner, executeBackupDiagnosticTest);
router.post("/backups/restore-diagnostic", requireOwner, executeRestoreDiagnosticTest);

router.get("/reconciliation/reports", requireOwner, getReconciliationReports);
router.post("/reconciliation/trigger", requireOwner, triggerManualReconciliation);
router.get("/reconciliation/dry-run", requireOwner, getReconciliationDryRun);
router.post("/reconciliation/repair", requireOwner, executeReconciliationRepair);

router.get("/app-requests", requireOwner, getAppRequests);
router.put("/app-requests/:id", requireOwner, updateAppRequestStatus);
router.post("/app-requests/:id/assets", requireOwner, generateAppAssetsForRequest);
router.get("/app-requests/:id/assets/download", requireOwner, downloadAssetsZip);

router.get("/service-requests", requireOwner, getServiceRequests);
router.put("/service-requests/:id", requireOwner, updateServiceRequestStatus);
router.get("/service-requests/:id/documents", requireOwner, getServiceRequestDocuments);

router.post("/upload-apk", requireOwner, uploadBuild.single('file'), uploadApk);
router.post("/upload-aab", requireOwner, uploadBuild.single('file'), uploadAab);
router.post("/force-rebuild", requireOwner, forceRebuildApp);
router.post("/force-sync", requireOwner, forceSyncReseller);

router.get("/domain-requests", requireOwner, getDomainRequests);
router.put("/domain-requests/:id", requireOwner, updateDomainRequestStatus);
router.post("/domain-requests/:id/deploy", requireOwner, approveDomainDeployment);

router.post("/diagnostics/email", requireOwner, executeEmailDiagnosticTest);

// Reset stale failure counter for a provider (admin action)
router.post("/providers/:name/reset-failures", async (req, res) => {
    try {
        const { name } = req.params;
        const validProviders = ['peyflex', 'clubkonnect', 'reloadly', 'ogdams', 'smeplug'];
        if (!validProviders.includes(name)) {
            return res.status(400).json({ message: `Unknown provider: ${name}. Valid: ${validProviders.join(', ')}` });
        }
        const { resetProviderFailures } = await import('../services/providerMonitoringService.js');
        const result = await resetProviderFailures(name);
        res.json({ status: 'success', message: `Failure counter reset for ${name}`, ...result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Operations Center Routes restored above.

// Migration: auto-assign subdomains to resellers who don't have one
router.post("/resellers/migrate-subdomains", requireOwner, async (req, res) => {
    try {
        const resellersWithout = await User.find({ role: 'reseller_admin', subdomain: { $in: [null, '', undefined] } });
        let assigned = 0;
        let skipped = 0;

        for (const r of resellersWithout) {
            let base = (r.branding?.siteName || r.name || 'store')
                .toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'store';
            let candidate = base;
            let counter = 1;
            while (await User.findOne({ subdomain: candidate })) {
                candidate = `${base}${counter}`;
                counter++;
            }
            try {
                r.subdomain = candidate;
                await r.save();
                assigned++;
            } catch (e) {
                console.error(`[Migration] Failed for ${r._id}: ${e.message}`);
                skipped++;
            }
        }

        res.json({ message: `Migration complete. Assigned: ${assigned}, Skipped: ${skipped}` });
    } catch (err) {
        res.status(500).json({ message: "Migration failed: " + err.message });
    }
});

router.post("/ai-assistant/query", queryAIAssistant);

// --- V3 PRICING ENGINE RULES ---

// Pure -- decides which DataPlan.provider value(s) a rule's percentages
// apply to. A provider-scoped rule (e.g. an Ogdams-only rule) only ever
// touches its own provider. A default (no-provider) rule touches every
// provider's plans EXCEPT providers that have their own active
// provider-scoped rule for the same network+category, so a provider-specific
// rule stays independent and isn't immediately overwritten the next time the
// shared default rule is saved. Returns undefined when no provider filter
// should be applied at all (default rule, no provider-scoped rules exist).
function pricingRuleProviderFilter(rule, scopedProviders) {
    if (rule.provider) return rule.provider;
    if (scopedProviders && scopedProviders.length > 0) return { $nin: scopedProviders };
    return undefined;
}

// Pure -- the V3 percentage-markup math, unchanged from the original engine.
function computeV3Prices(apiPrice, rule) {
    const cost = apiPrice || 0;
    const retailMarkup = cost * (rule.retailPercentage / 100);
    const retailPrice = cost + retailMarkup;
    const basicExtraProfit = retailMarkup * (rule.basicPercentage / 100);
    const vipMarkup = cost * (rule.vipPercentage / 100);
    const vipPrice = cost + vipMarkup;
    return {
        selling_price: retailPrice,
        reseller_price: retailPrice, // Wholesale cost to basic reseller
        basic_selling_price: retailPrice + basicExtraProfit,
        vip_price: vipPrice, // Wholesale cost to VIP/Premium reseller
        vip_selling_price: vipPrice, // Default selling price is their wholesale cost unless overridden
        premium_price: vipPrice,
        premium_selling_price: vipPrice
    };
}

const applyPricingRuleToPlans = async (rule) => {
    if (!rule.isActive) return 0;
    try {
        const scopedProviders = rule.provider ? [] : await PricingRule.find({
            network: rule.network.toUpperCase(),
            category: rule.category,
            provider: { $exists: true, $ne: null },
            isActive: true
        }).distinct('provider');

        const query = { network: rule.network.toUpperCase(), category: rule.category };
        const providerFilter = pricingRuleProviderFilter(rule, scopedProviders);
        if (providerFilter !== undefined) query.provider = providerFilter;

        const plans = await DataPlan.find(query);
        let updatedCount = 0;
        for (const plan of plans) {
            Object.assign(plan, computeV3Prices(plan.api_price, rule));
            await plan.save(); // Save triggers the Supabase sync hook in DataPlan schema
            updatedCount++;
        }
        return updatedCount;
    } catch (err) {
        console.error(`[Pricing Engine V3] Error applying rule for ${rule.network} - ${rule.category}:`, err);
        return 0;
    }
};

router.get("/pricing-rules", async (req, res) => {
    try {
        const { network, category, provider } = req.query;
        const query = {};
        if (network) query.network = network.toUpperCase();
        if (category) query.category = category;
        // provider='' asks for only the default (no-provider) rule; a real
        // provider name asks for only that provider's rule(s); omitted
        // (undefined) keeps the original "return everything" behavior.
        if (provider !== undefined) query.provider = provider === '' ? { $exists: false } : provider.toLowerCase();
        const rules = await PricingRule.find(query).sort({ network: 1, category: 1 });
        res.json(rules);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch pricing rules", error: err.message });
    }
});

router.post("/pricing-rules", async (req, res) => {
    try {
        const { network, category, provider, retailPercentage, basicPercentage, vipPercentage, isActive } = req.body;

        if (!network || !category) {
            return res.status(400).json({ message: "Network and Category are required" });
        }
        if (retailPercentage < 0 || basicPercentage < 0 || vipPercentage < 0) {
            return res.status(400).json({ message: "Percentages cannot be negative" });
        }

        // Target either the default (no-provider) rule for this network+
        // category, or one specific provider's own rule -- never match the
        // wrong one when both exist for the same network+category.
        const filter = { network: network.toUpperCase(), category };
        filter.provider = provider ? String(provider).toLowerCase() : { $exists: false };

        const update = {
            retailPercentage: Number(retailPercentage),
            basicPercentage: Number(basicPercentage),
            vipPercentage: Number(vipPercentage),
            isActive: isActive !== undefined ? isActive : true
        };
        if (provider) update.provider = String(provider).toLowerCase();

        const rule = await PricingRule.findOneAndUpdate(filter, update, { new: true, upsert: true });

        await applyPricingRuleToPlans(rule);

        res.json({ message: "Pricing rule saved successfully", rule });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "A rule for this network, category and provider already exists." });
        }
        res.status(500).json({ message: "Failed to save pricing rule", error: err.message });
    }
});

router.delete("/pricing-rules/:id", async (req, res) => {
    try {
        await PricingRule.findByIdAndDelete(req.params.id);
        res.json({ message: "Pricing rule deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete pricing rule", error: err.message });
    }
});

// QUICK FIX TO ENABLE ALL RULES
router.post("/pricing-rules/enable-all", async (req, res) => {
    try {
        const result = await PricingRule.updateMany({}, { isActive: true });
        
        const allRules = await PricingRule.find({ isActive: true });
        for (const rule of allRules) {
            await applyPricingRuleToPlans(rule);
        }

        res.json({ message: "All rules enabled successfully", count: result.modifiedCount });
    } catch (err) {
        res.status(500).json({ message: "Failed to enable rules", error: err.message });
    }
});

// BULK GENERATOR
router.post("/pricing-rules/bulk", async (req, res) => {
    try {
        const { network, categories, retailPercentage, basicPercentage, vipPercentage } = req.body;
        
        if (!network || !categories || !Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({ message: "Network and at least one Category are required." });
        }
        if (retailPercentage < 0 || basicPercentage < 0 || vipPercentage < 0) {
            return res.status(400).json({ message: "Percentages cannot be negative." });
        }

        let created = 0;
        let updated = 0;
        let failed = 0;

        for (const category of categories) {
            try {
                // Bulk generation only ever targets the default (no-provider)
                // rule for each category -- a provider-scoped rule (e.g.
                // Ogdams') is managed on its own dedicated page and must never
                // be silently matched/overwritten here.
                const filter = { network: network.toUpperCase(), category, provider: { $exists: false } };
                const existing = await PricingRule.findOne(filter);
                if (existing) updated++; else created++;

                const rule = await PricingRule.findOneAndUpdate(
                    filter,
                    {
                        retailPercentage: Number(retailPercentage),
                        basicPercentage: Number(basicPercentage),
                        vipPercentage: Number(vipPercentage),
                        isActive: true
                    },
                    { new: true, upsert: true }
                );
                await applyPricingRuleToPlans(rule);
            } catch (e) {
                failed++;
            }
        }

        res.json({ message: "Pricing Rules Updated Successfully", created, updated, skipped: 0, failed });
    } catch (err) {
        res.status(500).json({ message: "Bulk generation failed", error: err.message });
    }
});

// CLONE GENERATOR
router.post("/pricing-rules/clone", async (req, res) => {
    try {
        const { sourceNetwork, destinationNetwork } = req.body;

        if (!sourceNetwork || !destinationNetwork) {
            return res.status(400).json({ message: "Source and Destination networks are required." });
        }
        if (sourceNetwork.toUpperCase() === destinationNetwork.toUpperCase()) {
            return res.status(400).json({ message: "Source and destination cannot be the same." });
        }

        // Clone only ever operates on default (no-provider) rules -- a
        // provider-scoped rule (e.g. Ogdams') is managed on its own
        // dedicated page and must never be cloned or silently overwritten
        // here.
        const sourceRules = await PricingRule.find({ network: sourceNetwork.toUpperCase(), isActive: true, provider: { $exists: false } });
        if (sourceRules.length === 0) {
            return res.status(400).json({ message: `No active rules found for source network: ${sourceNetwork}` });
        }

        let created = 0;
        let updated = 0;
        let failed = 0;

        for (const rule of sourceRules) {
            try {
                const filter = { network: destinationNetwork.toUpperCase(), category: rule.category, provider: { $exists: false } };
                const existing = await PricingRule.findOne(filter);
                if (existing) updated++; else created++;

                const newRule = await PricingRule.findOneAndUpdate(
                    filter,
                    {
                        retailPercentage: rule.retailPercentage,
                        basicPercentage: rule.basicPercentage,
                        vipPercentage: rule.vipPercentage,
                        isActive: true
                    },
                    { new: true, upsert: true }
                );
                await applyPricingRuleToPlans(newRule);
            } catch (e) {
                failed++;
            }
        }

        res.json({ message: "Pricing Rules Cloned Successfully", created, updated, skipped: 0, failed });
    } catch (err) {
        res.status(500).json({ message: "Clone generation failed", error: err.message });
    }
});

// Exported for direct unit testing of the "combine catalog" matching logic
// used by POST /data-plans/sync, without needing an HTTP/DB test harness.
export { dataPlanMatchKey, parseDataSizeToMB, parseValidityToDays, mergeOgdamsSmePlans, pricingRuleProviderFilter, computeV3Prices };

export default router;
