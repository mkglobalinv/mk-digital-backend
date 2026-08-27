import User from "../models/User.js";
import { performance } from "perf_hooks";
import { calculateBulkDataPrices } from "../services/pricing/vtuPricing.js";
import Transaction from "../models/Transaction.js";
import PriceOverride from "../models/PriceOverride.js";
import DataPlan from "../models/DataPlan.js";
import SystemSetting from "../models/SystemSetting.js";
import Withdrawal from "../models/Withdrawal.js";
import Notification from "../models/Notification.js";
import bcrypt from "bcrypt";
import AppBuildJob from "../models/AppBuildJob.js";
import AppRequest from "../models/AppRequest.js";
import CustomDomainRequest from "../models/CustomDomainRequest.js";
import Content from "../models/Content.js";
import { jobQueue } from "../services/jobQueueService.js";
import socketService from "../services/socketService.js";
import { getAnalyticsFromSupabase } from "../services/supabaseAnalytics.js";
import { insertLedgerEntry } from "../services/supabaseLedger.js";
import { deductBalance, deductEarnings } from "../services/walletService.js";
import SubscriptionService from "../services/subscriptionService.js";
// Utility to ensure plan names never leak wholesale or api prices
const cleanPlanName = (name) => {
    if (!name) return '';
    return name
        .replace(/(?:[-=@]?\s*\(?(?:₦|NGN|#)\s*\d+(?:,\d{3})*(?:\.\d+)?\)?|\bN\s*\d+(?:,\d{3})*(?:\.\d+)?\b)/gi, '')
        .replace(/\(\s*\)/g, '')
        .replace(/\s+-\s*$/, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
};

// Get Reseller Dashboard Stats
export const getResellerStats = async (req, res) => {
    try {
        const resellerId = req.user.id;
        
        // Use Supabase for heavy analytics
        const analyticsRes = await getAnalyticsFromSupabase(resellerId, 1);
        
        // Fallback or base calculation
        let totalUsers = 0;
        let totalTransactions = 0;
        let revenueTotal = 0;
        let totalProfit = 0;

        totalUsers = await User.countDocuments({ tenantOwnerId: resellerId });
        
        // Use optimized query combining old transactions and new resellerId mapped transactions
        const customerIds = await User.find({ tenantOwnerId: resellerId }).distinct('_id');
        const txMatch = { $or: [{ resellerId }, { userId: { $in: customerIds } }] };
        
        totalTransactions = await Transaction.countDocuments(txMatch);
        
        const aggregation = await Transaction.aggregate([
            { $match: { 
                status: 'success', 
                type: 'debit',
                ...txMatch
            }},
            { $group: { 
                _id: null, 
                totalRevenue: { $sum: "$amount" },
                totalProfit: { $sum: "$profit" }
            } }
        ]);

        if (aggregation[0]) {
            revenueTotal = aggregation[0].totalRevenue;
            totalProfit = aggregation[0].totalProfit;
        }

        // If Supabase synced data exists, it overrides the fallback, but the fallback ensures real-time accuracy if cron hasn't run.
        if (analyticsRes.data && analyticsRes.data.length > 0) {
            const todayStats = analyticsRes.data[0];
            // If the fallback calculated more than Supabase (due to real-time lag), prefer fallback
            if (totalTransactions < todayStats.total_transactions) {
                totalTransactions = todayStats.total_transactions;
                revenueTotal = todayStats.total_revenue;
                totalProfit = todayStats.total_profit || totalProfit;
            }
        }

        // Preload all data plans and pricing rules instantly
        const allPlans = await DataPlan.find({ status: true });
        const overrides = await PriceOverride.find({ resellerId });
        
        const resellerUser = await User.findById(resellerId);
        const isPremium = resellerUser?.resellerTier === 'premium';
        
        const pricingRules = allPlans.map(plan => {
            const override = isPremium ? overrides.find(o => o.planId === plan.api_plan_id && o.network === plan.network) : null;
            return {
                planId: plan.api_plan_id,
                network: plan.network,
                plan_name: plan.plan_name,
                buyingPrice: plan.reseller_price || plan.selling_price,
                sellingPrice: override ? override.sellingPrice : plan.selling_price,
                status: override ? override.status : 'enabled',
                isOverridden: !!override
            };
        });

        res.json({
            totalUsers,
            totalTransactions,
            revenue: revenueTotal,
            totalProfit,
            walletBalance: req.user.profitBalance || req.user.earningsBalance || 0,
            pricingRules,
            pricingSet: overrides.length > 0,
            daily: []
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching stats" });
    }
};

// Manage Users for Reseller
export const getResellerUsers = async (req, res) => {
    try {
        const users = await User.find({ tenantOwnerId: req.user.id })
            .select("-password")
            .sort({ createdAt: -1 });
            
        const formattedUsers = users.map(user => {
            const userObj = user.toObject();
            userObj.totalBalance = (userObj.balance1 || 0) + (userObj.balance2 || 0);
            return userObj;
        });
        res.json(formattedUsers);
    } catch (err) {
        res.status(500).json({ message: "Error fetching users" });
    }
};

export const registerResellerUser = async (req, res) => {
    try {
        const { name, email, password, pin } = req.body;
        const resellerId = req.user.id;
        
        const existingUser = await User.findOne({
            email,
            tenantOwnerId: resellerId
        });
        if (existingUser) return res.status(400).json({ message: "Email already in use." });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedPin = pin ? await bcrypt.hash(pin, 10) : "";
        
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            transactionPin: hashedPin,
            referredBy: resellerId,      // kept for referral commission tracking
            tenantOwnerId: resellerId,    // portal access isolation
            role: "user",
            isEmailVerified: true // Assume reseller verification is trusted
        });
        
        await newUser.save();
        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (err) {
        res.status(500).json({ message: "Failed to register user" });
    }
};

export const registerResellerWithPayment = async (req, res) => {
    const reqStart = performance.now();
    console.log("=== ENTER registerResellerWithPayment ===");
    console.log("Request URL:", req.originalUrl);
    console.log("HTTP Method:", req.method);
    const safeHeaders = { ...req.headers };
    if (safeHeaders.authorization) safeHeaders.authorization = "[REDACTED]";
    console.log("Headers:", JSON.stringify(safeHeaders, null, 2));
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = "[REDACTED]";
    console.log("JSON request body:", JSON.stringify(safeBody, null, 2));

    try {
        const { name, email, phone, businessName, state, password, enabledFuturePlatforms } = req.body;
        console.log("1. Extracted body fields.");
        if (!email || !password || !businessName) {
            console.log("validation fail: missing required fields");
            return res.status(400).json({ message: "All required fields must be provided." });
        }

        console.log("2. DB Query: User.findOne({ email: email.toLowerCase() })");
        let existing = await User.findOne({
            email: email.toLowerCase(),
            tenantOwnerId: null
        });
        console.log("   -> Returned:", existing ? existing._id : "null");
        
        let isUpgrade = false;

        if (existing) {
            if (existing.role === 'reseller_admin' || existing.resellerActivationStatus === 'active' || existing.whiteLabelStatus === 'active') {
                return res.status(400).json({ message: "An account with this email already exists." });
            }
            console.log("3. Verifying password for upgrade...");
            const isMatch = await bcrypt.compare(password, existing.password);
            if (!isMatch) {
                return res.status(400).json({ message: "This email is already registered. Please provide your correct account password to upgrade to a Business account." });
            }
            isUpgrade = true;
        }

        console.log("4. Hashing password...");
        const hashStart = performance.now();
        const hashedPassword = await bcrypt.hash(password, 10);
        const hashTime = performance.now() - hashStart;
        
        let baseSubdomain = businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!baseSubdomain) baseSubdomain = 'store';
        
        let uniqueSubdomain = baseSubdomain;
        let counter = 1;
        while (true) {
            console.log(`5. DB Query: User.findOne({ $or: [{ subdomain: '${uniqueSubdomain}' }, { admin_subdomain: '${uniqueSubdomain}' }] })`);
            const sub = await User.findOne({ $or: [{ subdomain: uniqueSubdomain }, { admin_subdomain: uniqueSubdomain }] });
            console.log("   -> Returned:", sub ? sub._id : "null");
            if (!sub) break;
            uniqueSubdomain = `${baseSubdomain}${counter}`;
            counter++;
        }
        
        let targetUser;

        if (isUpgrade) {
            existing.phone = phone || existing.phone;
            existing.name = name || existing.name || businessName;
            existing.password = hashedPassword;
            existing.role = "reseller_admin";
            existing.resellerActivationStatus = "pending_onboarding";
            existing.whiteLabelStatus = "pending";
            existing.isResellerActivated = false;
            existing.resellerTier = "basic";
            existing.trialEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            existing.subdomain = uniqueSubdomain;
            existing.admin_subdomain = uniqueSubdomain;
            existing.independence_redirect_enabled = true;
            existing.branding = {
                siteName: businessName,
                contactEmail: email.toLowerCase(),
                whatsappNumber: phone
            };
            existing.enabledFuturePlatforms = enabledFuturePlatforms || [];
            
            targetUser = existing;
        } else {
            targetUser = new User({
                name: name || businessName,
                email: email.toLowerCase(),
                phone,
                password: hashedPassword,
                role: "reseller_admin",
                resellerActivationStatus: "pending_onboarding",
                whiteLabelStatus: "pending",
                isResellerActivated: false,
                resellerTier: "basic",
                trialEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                isEmailVerified: true,
                isSignupComplete: true,
                subdomain: uniqueSubdomain,
                admin_subdomain: uniqueSubdomain,
                independence_redirect_enabled: true,
                branding: {
                    siteName: businessName,
                    contactEmail: email.toLowerCase(),
                    whatsappNumber: phone
                },
                enabledFuturePlatforms: enabledFuturePlatforms || []
            });
        }

        console.log("=== IMMEDIATELY BEFORE SAVE ===");
        console.log("Entire Document:", JSON.stringify(targetUser.toObject(), null, 2));
        
        console.log("Running Mongoose validateSync()...");
        const validationError = targetUser.validateSync();
        console.log("Validation Result:", validationError || "PASS");
        
        console.log("Modified paths:", targetUser.modifiedPaths());
        
        // Output indexes
        const collectionIndexes = await User.collection.indexes();
        console.log("Collection Indexes:", JSON.stringify(collectionIndexes, null, 2));

        console.log(`6. Executing save() on user (isUpgrade: ${isUpgrade})...`);
        const dbStart = performance.now();
        try {
            await targetUser.save();
        } catch (saveError) {
            console.log("=== EXCEPTION CAUGHT DURING SAVE ===");
            console.log(saveError);
            console.log("Name:", saveError.name);
            console.log("Message:", saveError.message);
            console.log("Code:", saveError.code);
            console.log("CodeName:", saveError.codeName);
            console.log("Stack:", saveError.stack);
            console.log("KeyPattern:", saveError.keyPattern);
            console.log("KeyValue:", saveError.keyValue);
            throw saveError; // rethrow to outer catch
        }
        const dbTime = performance.now() - dbStart;

        console.log("=== IMMEDIATELY AFTER SAVE ===");
        console.log("Returned _id:", targetUser._id);
        console.log("createdAt:", targetUser.createdAt);
        console.log("updatedAt:", targetUser.updatedAt);

        console.log("7. response");
        const reqTime = performance.now() - reqStart;
        console.log(`[Perf] registerResellerWithPayment: Hash=${hashTime.toFixed(2)}ms, DBSave=${dbTime.toFixed(2)}ms, Total=${reqTime.toFixed(2)}ms`);

        res.status(201).json({ 
            message: "Reseller account created successfully", 
            userId: targetUser._id,
            admin_subdomain: targetUser.admin_subdomain
        });
        console.log("=== EXIT registerResellerWithPayment ===");
    } catch (err) {
        console.error("=== COMPLETE EXCEPTION CAUGHT ===");
        console.error(err);
        res.status(500).json({ message: "Failed to process registration: " + err.message });
        console.log("=== EXIT registerResellerWithPayment (ERROR) ===");
    }
};


export const claimSubdomain = async (req, res) => {
    try {
        const resellerId = req.user.id;
        const user = await User.findById(resellerId);

        if (!user) return res.status(404).json({ message: "User not found." });

        // Already has one — return it
        if (user.subdomain) {
            return res.json({ subdomain: user.subdomain, message: "Subdomain already assigned." });
        }

        const { baseName } = req.body;
        let base = (baseName || user.branding?.siteName || user.name || 'store')
            .toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
        if (!base) base = 'store';

        // Find unique subdomain
        let candidate = base;
        let counter = 1;
        while (await User.findOne({ subdomain: candidate })) {
            candidate = `${base}${counter}`;
            counter++;
        }

        user.subdomain = candidate;
        if (!user.isResellerActivated && !user.trialEndDate) {
            user.trialStartDate = new Date();
            user.trialEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            user.resellerActivationStatus = "pending_onboarding";
        }
        await user.save();

        res.json({ subdomain: candidate, message: `Store URL activated: https://${candidate}.9jasub.com` });
    } catch (err) {
        console.error("[ClaimSubdomain Error]", err);
        res.status(500).json({ message: "Failed to claim subdomain." });
    }
};

export const toggleResellerUserSuspension = async (req, res) => {
    try {
        const { id } = req.params;
        if (id && !id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid resource identifier format." });
        const user = await User.findById(id);
        
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!user.tenantOwnerId || user.tenantOwnerId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "Unauthorized action" });
        }
        
        user.isSuspended = !user.isSuspended;
        await user.save();
        res.json({ message: `User ${user.isSuspended ? 'suspended' : 'activated'} successfully.` });
    } catch (err) {
        res.status(500).json({ message: "Failed to toggle suspension" });
    }
};

export const getResellerCustomerTransactions = async (req, res) => {
    try {
        const { limit = 100, page = 1 } = req.query;
        const parsedLimit = Math.max(1, parseInt(limit, 10) || 100);
        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const skip = (parsedPage - 1) * parsedLimit;

        // Find all customers belonging to this reseller's portal
        const customers = await User.find({ tenantOwnerId: req.user.id }).select("_id name phone");
        const customerIds = customers.map(c => c._id);
        
        // Find transactions for these customers using the dual query
        const transactions = await Transaction.find({ 
            $or: [{ resellerId: req.user.id }, { userId: { $in: customerIds } }, { userId: req.user.id }] 
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('userId', 'name phone email');
                                             
        const seenCashbacks = new Set();
        const filteredTransactions = transactions.filter(tx => {
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

        const formattedTx = filteredTransactions.map(tx => ({
            id: tx._id,
            reference: tx.reference,
            customerName: tx.userId ? (tx.userId.name || tx.userId.phone) : 'Unknown',
            phone: tx.phone || (tx.userId ? tx.userId.phone : ''),
            description: tx.description,
            amount: tx.amount,
            profit: tx.profit,
            status: tx.status,
            createdAt: tx.createdAt
        }));
        
        res.json({ status: 'success', data: formattedTx });
    } catch (err) {
        console.error("Reseller Tx Error", err);
        res.status(500).json({ message: "Error fetching transactions" });
    }
};

// Update Reseller Branding
export const updateBranding = async (req, res) => {
    try {
        const { branding, maintenanceMode, serviceControl } = req.body;
        const user = await User.findById(req.user.id);
        
        if (branding) {
            // Ensure branding exists
            if (!user.branding) user.branding = {};
            
            // Merge changes
            Object.assign(user.branding, branding);
            
            // Explicitly mark as modified for Mongoose to save nested changes
            user.markModified('branding');
        }
        
        if (maintenanceMode !== undefined) user.maintenanceMode = maintenanceMode;
        
        if (serviceControl) {
            if (!user.serviceControl) user.serviceControl = {};
            Object.assign(user.serviceControl, serviceControl);
            user.markModified('serviceControl');
        }
        
        await user.save();
        
        // Notify connected customers in real-time
        if (branding) {
            socketService.emitBrandingSync(user._id, user.branding);
        }

        res.json({ message: "Settings updated successfully", branding: user.branding, maintenanceMode: user.maintenanceMode, serviceControl: user.serviceControl });
    } catch (err) {
        console.error("[UpdateBranding Error]", err);
        res.status(500).json({ message: "Error updating settings", error: err.message });
    }
};

// Price Management
export const getPriceOverrides = async (req, res) => {
    try {
        const resellerId = req.user.id;
        
        // Fetch all active system plans
        const allPlans = await DataPlan.find({ status: true });
        
        const resellerUser = await User.findById(resellerId);
        const canOverride = resellerUser && (
            resellerUser.canOverridePricing ||
            resellerUser.resellerTier === 'premium' ||
            resellerUser.resellerTier === 'vip'
        );
        const isPremium = canOverride; // alias for frontend compatibility
        const isBasic = !canOverride;

        const bulkPrices = await calculateBulkDataPrices(resellerId, allPlans);

        const combined = bulkPrices.map(({ plan, sellingPrice, basePrice, pricingSource }) => {
            const fallbackBasePrice = isPremium ? (plan.vip_price || plan.selling_price) : (plan.reseller_price || plan.selling_price);
            
            return {
                planId: plan.api_plan_id,
                network: plan.network,
                plan_name: plan.plan_name.replace(/\|\|/g, '').replace(/Direct/ig, '').trim(),
                serviceType: 'data',
                buyingPrice: basePrice !== undefined ? basePrice : fallbackBasePrice,
                sellingPrice: sellingPrice,
                status: 'enabled',
                isOverridden: pricingSource === 'reseller_custom',
                hasAdminAssigned: pricingSource === 'admin_assigned',
                priceSource: pricingSource
            };
        });

        res.json({
            isPremium,
            canOverridePricing: canOverride,
            prices: combined
        });
    } catch (err) {
        console.error("[GetPrices Error]", err.message);
        res.status(500).json({ message: "Error fetching prices" });
    }
};

export const setPriceOverride = async (req, res) => {
    try {
        const { serviceType, network, planId, sellingPrice, status } = req.body;
        const resellerId = req.user.id;

        const user = await User.findById(resellerId);
        const canOverride = user.canOverridePricing ||
            user.resellerTier === 'premium' ||
            user.resellerTier === 'vip' ||
            user.resellerType === 'premium';
        if (!canOverride) {
            return res.status(403).json({ message: "Custom pricing is only available for Premium Resellers. Upgrade your tier to unlock this feature." });
        }

        // Validation: Must get the base price first to ensure protection
        let basePrice = 0;
        let planName = "";
        if (serviceType === 'data') {
            const plan = await DataPlan.findOne({ api_plan_id: planId, network: network.toUpperCase() });
            if (!plan) return res.status(404).json({ message: "Plan not found" });
            basePrice = plan.reseller_price || plan.selling_price;
            planName = plan.plan_name;
        } else {
            basePrice = sellingPrice;
        }

        if (sellingPrice < basePrice) {
            return res.status(400).json({ message: `Selling price cannot be lower than base price (₦${basePrice})` });
        }
        
        let override = null;
        
        // Try Supabase First
        const { getSupabaseClient } = await import('../services/supabaseClient.js');
        const supabase = getSupabaseClient();
        
        if (supabase) {
            // First ensure global_base_prices exists for this plan
            let globalPriceId = null;
            const { data: globalMatch, error: globalErr } = await supabase
                .from('global_base_prices')
                .select('id')
                .eq('service_type', serviceType)
                .eq('network', network.toUpperCase())
                .eq('plan_id', planId)
                .single();
                
            if (globalMatch) {
                globalPriceId = globalMatch.id;
            } else if (globalErr && globalErr.code !== '42P01') {
                // If it doesn't exist, create it idempotently
                const { data: newGlobal, error: insertErr } = await supabase
                    .from('global_base_prices')
                    .insert({
                        service_type: serviceType,
                        network: network.toUpperCase(),
                        plan_id: planId,
                        plan_name: planName,
                        base_cost: basePrice
                    })
                    .select('id')
                    .single();
                
                if (newGlobal) globalPriceId = newGlobal.id;
            }
            
            if (globalPriceId) {
                // Upsert custom price
                const { data: updatedData, error: upsertErr } = await supabase
                    .from('reseller_custom_prices')
                    .upsert({
                        reseller_id: String(resellerId),
                        global_price_id: globalPriceId,
                        selling_price: sellingPrice,
                        status: status
                    }, { onConflict: 'reseller_id,global_price_id' })
                    .select()
                    .single();
                    
                if (!upsertErr) override = updatedData;
            }
        }
        
        // Always update MongoDB as the primary source of truth for the local backend API
        const mongoOverride = await PriceOverride.findOneAndUpdate(
            { resellerId, serviceType, network: network.toUpperCase(), planId },
            { sellingPrice, status, buyingPrice: basePrice },
            { upsert: true, new: true }
        );
        if (!override) override = mongoOverride;

        // Sync to reseller's User document customPrices Map (single source of truth for engine)
        if (!user.customPrices) user.customPrices = new Map();
        const key = String(planId || serviceType).replace(/\./g, '_dot_');
        user.customPrices.set(key, Number(sellingPrice));
        user.markModified('customPrices');
        await user.save();

        // Emit Real-time Sync (this works regardless of Mongo/Supabase)
        socketService.emitPricingSync(resellerId);

        res.json({ message: "Price updated successfully", override });
    } catch (err) {
        console.error("[SetPrice Error]", err.message);
        res.status(500).json({ message: "Error updating price" });
    }
};

// Reset a single custom price override (Premium Reseller reverts one plan to Super Admin pricing)
export const resetPriceOverride = async (req, res) => {
    try {
        const { planId, network, serviceType } = req.body;
        const resellerId = req.user.id;

        const user = await User.findById(resellerId);
        if (!user || (user.resellerType !== 'premium' && user.resellerTier !== 'premium' && user.resellerTier !== 'vip' && !user.canOverridePricing)) {
            return res.status(403).json({ message: "Access denied. Premium resellers only." });
        }

        // Remove from MongoDB PriceOverride collection
        if (planId && network) {
            await PriceOverride.findOneAndDelete({ resellerId, planId, network: network.toUpperCase(), serviceType: serviceType || 'data' });
            
            // Remove from Supabase
            const { getSupabaseClient } = await import('../services/supabaseClient.js');
            const supabase = getSupabaseClient();
            if (supabase) {
                // Find global price id
                const { data: globalMatch } = await supabase
                    .from('global_base_prices')
                    .select('id')
                    .eq('service_type', serviceType || 'data')
                    .eq('network', network.toUpperCase())
                    .eq('plan_id', planId)
                    .single();
                
                if (globalMatch) {
                    await supabase
                        .from('reseller_custom_prices')
                        .delete()
                        .match({ reseller_id: String(resellerId), global_price_id: globalMatch.id });
                }
                
                // Also clean up old format just in case
                await supabase
                    .from('reseller_custom_prices')
                    .delete()
                    .match({ reseller_id: String(resellerId), plan_id: planId });
            }
        }

        // Remove from customPrices Map
        if (user.customPrices) {
            const key = String(planId || serviceType).replace(/\./g, '_dot_');
            user.customPrices.delete(key);
            user.markModified('customPrices');
            await user.save();
        }

        // Emit Real-time Sync
        socketService.emitPricingSync(resellerId);

        res.json({ message: "Price reset to Super Admin assigned pricing." });
    } catch (err) {
        console.error("[ResetPrice Error]", err.message);
        res.status(500).json({ message: "Error resetting price" });
    }
};

// Reset ALL custom price overrides for a Premium Reseller (full revert to Super Admin pricing)
export const resetAllPriceOverrides = async (req, res) => {
    try {
        const resellerId = req.user.id;

        const user = await User.findById(resellerId);
        if (!user || (user.resellerType !== 'premium' && user.resellerTier !== 'premium' && user.resellerTier !== 'vip' && !user.canOverridePricing)) {
            return res.status(403).json({ message: "Access denied. Premium resellers only." });
        }

        // Remove all MongoDB PriceOverride records
        const result = await PriceOverride.deleteMany({ resellerId });

        // Remove from Supabase
        const { getSupabaseClient } = await import('../services/supabaseClient.js');
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase
                .from('reseller_custom_prices')
                .delete()
                .eq('reseller_id', String(resellerId));
        }

        // Clear entire customPrices Map
        user.customPrices = new Map();
        user.markModified('customPrices');
        await user.save();

        // Emit Real-time Sync
        socketService.emitPricingSync(resellerId);

        res.json({ message: `All custom prices reset. ${result.deletedCount} overrides removed. Now using Super Admin assigned prices.` });
    } catch (err) {
        console.error("[ResetAllPrices Error]", err.message);
        res.status(500).json({ message: "Error resetting all prices" });
    }
};



export const withdrawProfitToWallet = async (req, res) => {
    try {
        const { amount, pin } = req.body;
        const user = await User.findById(req.user.id);
        if (!user.isEmailVerified) return res.status(403).json({ message: "Email verification required before performing this action." });
        
        if (!user.withdrawalPin) {
            return res.status(400).json({ message: "Withdrawal PIN not set. Set it in security settings." });
        }

        const isMatch = await bcrypt.compare(pin, user.withdrawalPin);
        if (!isMatch) return res.status(400).json({ message: "Invalid Withdrawal PIN" });

        const freshUser = await User.findById(req.user.id).select('earningsBalance');
        if (freshUser.earningsBalance < amount) {
            return res.status(400).json({ message: "Insufficient profit balance" });
        }

        // Atomically deduct from earnings and add to main wallet
        await User.findByIdAndUpdate(user._id, { 
            $inc: { earningsBalance: -Number(amount), balance1: Number(amount) } 
        });

        const reference = `PRF-TRF-${Date.now()}`;

        await Transaction.create({
            userId: user._id,
            resellerId: user._id,
            amount,
            type: 'credit',
            status: 'success',
            description: 'Profit Transfer to Wallet',
            provider: 'System',
            reference
        });

        // Sync with Supabase Ledger
        await insertLedgerEntry(user._id, amount, 'debit', 'earnings', reference, 'Transfer profit to main wallet');
        await insertLedgerEntry(user._id, amount, 'credit', 'wallet', reference, 'Received profit transfer');

        const updatedUser = await User.findById(req.user.id);

        res.json({ message: "Profit transferred to wallet successfully", profitBalance: updatedUser.earningsBalance, walletBalance: updatedUser.balance1 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error transferring profit" });
    }
};

export const requestBankWithdrawal = async (req, res) => {
    try {
        const { amount, bankName, accountNumber, accountName, pin } = req.body;
        const user = await User.findById(req.user.id);
        if (!user.isEmailVerified) return res.status(403).json({ message: "Email verification required before performing this action." });

        if (!user.withdrawalPin) {
            return res.status(400).json({ message: "Withdrawal PIN not set. Set it in security settings." });
        }

        const isMatch = await bcrypt.compare(pin, user.withdrawalPin);
        if (!isMatch) return res.status(400).json({ message: "Invalid Withdrawal PIN" });

        const freshUser = await User.findById(req.user.id).select('earningsBalance');
        if (freshUser.earningsBalance < amount) {
            return res.status(400).json({ message: "Insufficient profit balance" });
        }
        if (amount < 100) {
            return res.status(400).json({ message: "Minimum withdrawal amount is 100" });
        }

        const reference = `WD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const desc = `Bank Withdrawal Request to ${bankName} (${accountNumber})`;

        // Deduct using our unified pipeline (which handles MongoDB, Supabase Ledger, and Transaction creation)
        const updatedUser = await deductEarnings(user._id, amount, reference, desc);
        if (!updatedUser) {
            return res.status(400).json({ message: "Insufficient profit balance" });
        }

        // Find the transaction created by the unified pipeline to associate it with the withdrawal request
        const tx = await Transaction.findOne({ reference });

        await Withdrawal.create({
            userId: user._id,
            amount,
            bankName,
            accountNumber,
            accountName,
            reference,
            status: 'pending',
            transactionId: tx ? tx._id : null
        });

        // Notify reseller
        await Notification.create({
            userId: user._id,
            title: "Withdrawal Request Submitted",
            message: `Your request to withdraw ₦${amount} to ${bankName} (${accountNumber}) has been submitted for approval.`,
            type: 'system'
        });

        // Notify admin
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            await Notification.create({
                userId: admin._id,
                title: "New Reseller Withdrawal Request",
                message: `Reseller ${user.name} (${user.email}) requested a withdrawal of ₦${amount} to ${bankName}.`,
                type: 'system'
            });
        }

        // Fetch updated reseller and emit detailed realtime socket update
        const updatedReseller = await User.findById(user._id);
        if (updatedReseller) {
            socketService.emitWalletSync(user._id, {
                balance: updatedReseller.balance1,
                earningsBalance: updatedReseller.earningsBalance,
                message: `Withdrawal request submitted: ₦${amount} deducted.`
            });
        }

        res.json({ message: "Withdrawal request submitted for approval", reference });
    } catch (err) {
        console.error("[Withdrawal Request Error]", err);
        res.status(500).json({ message: "Error submitting withdrawal request" });
    }
};

export const getWithdrawalHistory = async (req, res) => {
    try {
        const requests = await Withdrawal.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json({ status: 'success', data: requests });
    } catch (err) {
        res.status(500).json({ message: "Error fetching withdrawal history" });
    }
};

export const setWithdrawalPin = async (req, res) => {
    try {
        const { pin, password } = req.body;
        const user = await User.findById(req.user.id);
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid password" });

        user.withdrawalPin = await bcrypt.hash(pin, 10);
        await user.save();

        res.json({ message: "Withdrawal PIN set successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error setting PIN" });
    }
};

// Register User Manually
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, pin } = req.body;
        const resellerId = req.user.id;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Check if user exists in this reseller's tenant
        const existing = await User.findOne({ email: email.toLowerCase(), tenantOwnerId: resellerId });
        if (existing) {
            return res.status(400).json({ message: "A user with this email already exists in your platform." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedPin = await bcrypt.hash(pin || '1234', 10);

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            transactionPin: hashedPin,
            referredBy: resellerId,      // kept for referral commission tracking
            tenantOwnerId: resellerId,    // portal access isolation
            isEmailVerified: true, // Manually registered users are pre-verified
            isSignupComplete: true  // Skip onboarding for manual users
        });

        await newUser.save();
        res.json({ message: "User registered successfully", userId: newUser._id });
    } catch (err) {
        console.error("[ManualRegister Error]", err.message);
        res.status(500).json({ message: "Failed to register user" });
    }
};


// Public Marketing Showcase — safe, name/logo-only list of ALL registered
// resellers (any tier, active or inactive) for the 9JASUB homepage
// social-proof carousel. No PII, no internal identifiers.
export const getPublicResellerShowcase = async (req, res) => {
    try {
        // Include every registered reseller regardless of tier (basic/premium)
        // or activation status (active/inactive/trial) — only genuinely
        // suspended/rejected/blocked accounts are excluded.
        const resellers = await User.find({
            role: 'reseller_admin',
            isSuspended: { $ne: true },
            resellerActivationStatus: { $ne: 'suspended' },
            whiteLabelStatus: { $nin: ['suspended', 'disabled', 'under_review', 'rejected'] },
            $or: [
                { subdomain: { $exists: true, $nin: [null, ''] } },
                { admin_subdomain: { $exists: true, $nin: [null, ''] } }
            ]
        })
            .select('branding.siteName branding.logo onboardingData.brandName onboardingData.businessName subdomain admin_subdomain createdAt')
            .sort({ createdAt: -1 })
            .limit(15)
            .lean();

        const businesses = resellers
            .map(r => {
                const name = r.branding?.siteName || r.onboardingData?.brandName || r.onboardingData?.businessName;
                const host = r.subdomain || r.admin_subdomain;
                if (!name || !host) return null;
                return {
                    name,
                    logo: r.branding?.logo || null,
                    url: `https://${host}.9jasub.com`
                };
            })
            .filter(Boolean)
            .slice(0, 10);

        res.json({ status: 'success', data: businesses });
    } catch (err) {
        res.status(500).json({ status: 'error', message: "Error fetching business showcase" });
    }
};

// Premium Features & Upgrades
export const getPremiumPricing = async (req, res) => {
    try {
        const settings = await SystemSetting.findOne();
        res.json(settings?.premiumPricing || { sixMonths: 20000, yearly: 35000 });
    } catch (err) {
        res.status(500).json({ message: "Error fetching pricing" });
    }
};

export const upgradeToPremium = async (req, res) => {
    try {
        const { duration } = req.body; // '6months' or '12months'
        const months = duration === '6months' ? 6 : 12;

        const result = await SubscriptionService.processSubscription(req.user.id, 'premium', months);

        res.json({ 
            message: "Successfully activated Website Hosting & Maintenance!", 
            tier: result.tier, 
            expiresAt: result.expiresAt,
            user: await User.findById(req.user.id).select("-password")
        });
    } catch (err) {
        console.error("[Upgrade Error]", err.message);
        res.status(500).json({ message: "Upgrade failed: " + err.message });
    }
};

export const payActivation = async (req, res) => {
    try {
        const result = await SubscriptionService.processSubscription(req.user.id, 'basic', 0);

        // Auto-dismiss welcome banner since they activated
        await User.findByIdAndUpdate(req.user.id, { welcomeBannerSeen: true });

        res.json({
            message: "Website Setup & Activation successful!",
            tier: result.tier,
            user: await User.findById(req.user.id).select("-password")
        });
    } catch (err) {
        console.error("[Activation Error]", err.message);
        res.status(500).json({ message: "Activation failed: " + err.message });
    }
};

export const saveAppSettings = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        // Feature gate
        if (!user.features?.apk_generation && user.role !== 'admin') {
            return res.status(403).json({ message: "APK generation is an advanced feature. Please activate Website Hosting & Maintenance." });
        }

        // Clean and update settings
        const newSettings = req.body.appSettings || {};
        
        const cleanName = (newSettings.appName || user.branding?.siteName || 'app').toLowerCase().replace(/[^a-z0-9]/g, '');
        const packageName = newSettings.packageName || `com.mksubdata.${cleanName || 'app'}`;

        const job = await jobQueue.enqueueJob(
            user._id, 
            newSettings.appName || user.branding?.siteName || 'Reseller App', 
            packageName
        );

        user.appSettings = { 
            ...(user.appSettings || {}), 
            ...newSettings,
            packageName,
            updatedAt: new Date()
        };
        
        // Save reference to job for status checks
        user.appSettings.lastBuildJob = job._id;

        // Also update branding if siteName is provided
        if (newSettings.appName) {
            if (!user.branding) user.branding = {};
            user.branding.siteName = newSettings.appName;
            user.markModified('branding');
        }

        user.markModified('appSettings');
        await user.save();

        res.json({ 
            status: 'success', 
            message: 'App settings saved and background build queue started!', 
            appSettings: user.appSettings,
            jobId: job._id
        });
    } catch (err) {
        console.error("[SaveAppSettings Error]", err);
        res.status(500).json({ message: "Failed to save app settings: " + err.message });
    }
};

export const getAppStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.appSettings) {
            return res.status(404).json({ message: "No app settings found" });
        }
        res.json({
            status: 'success',
            appSettings: user.appSettings
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching app status" });
    }
};

export const triggerAssetRegeneration = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.appSettings?.appName) {
            return res.status(400).json({ message: "App name required before generation" });
        }
        
        const cleanName = user.appSettings.appName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const packageName = user.appSettings.packageName || `com.mksubdata.${cleanName || 'app'}`;

        const job = await jobQueue.enqueueJob(
            user._id,
            user.appSettings.appName,
            packageName
        );

        user.appSettings.lastBuildJob = job._id;
        user.appSettings.managedStatus = 'Generating...';
        user.markModified('appSettings');
        await user.save();

        // Update AppRequest status if exists
        const request = await AppRequest.findOne({ resellerId: user._id });
        if (request) {
            request.status = 'Generating...';
            request.adminNotes = 'Regeneration retriggered by reseller.';
            await request.save();
        }

        socketService.emitAppBuildStatus(user._id, {
            status: 'Generating...',
            adminNotes: 'Regeneration retriggered by reseller.'
        });
        
        res.json({ status: 'success', message: 'Asset regeneration executing asynchronously', jobId: job._id });
    } catch (err) {
        res.status(500).json({ message: "Generation failed: " + err.message });
    }
};

export const getBuildStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const jobId = req.query.jobId || user?.appSettings?.lastBuildJob;
        
        let job = null;
        if (jobId) {
            job = await AppBuildJob.findOne({ _id: jobId, resellerId: req.user.id });
        }

        if (!job && user?.appSettings?.generatedAssets?.isReady) {
            return res.json({
                status: 'success',
                job: {
                    status: 'completed',
                    stage: 'Completed Successfully',
                    progressPct: 100,
                    outputArtifacts: user.appSettings.generatedAssets,
                    completedAt: user.appSettings.generatedAssets.lastGeneratedAt,
                    buildLogs: ['Legacy build verification complete.']
                },
                appSettings: user.appSettings
            });
        }

        res.json({
            status: 'success',
            job: job || { status: 'idle', stage: 'No active builds', progressPct: 0, buildLogs: [] },
            appSettings: user?.appSettings || {}
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching build status" });
    }
};

export const getBuildHistory = async (req, res) => {
    try {
        const history = await AppBuildJob.find({ resellerId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json({ status: 'success', history });
    } catch (err) {
        res.status(500).json({ message: "Error fetching build history" });
    }
};

// --- MANAGED APP REQUEST SYSTEM CONTROLLERS ---
export const submitAppRequest = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.features?.apk_generation && user.role !== 'admin') {
            return res.status(403).json({ message: "Mobile App generation is an Advanced Business feature. Please activate Website Hosting & Maintenance." });
        }

        const { appName, logo, primaryColor, accentColor, splashScreen, supportEmail, notes } = req.body;
        if (!appName) {
            return res.status(400).json({ message: "App Name is required." });
        }

        // Fetch dynamic delivery time from System Setting
        const setting = await SystemSetting.findOne({}) || {};
        const estTime = setting.estimatedAppDeliveryTime || "72 hours";

        // Auto-extract reseller phone number for instant WhatsApp connection
        const attachedPhone = user.onboardingData?.whatsapp || user.kycData?.phone || user.branding?.whatsappNumber || "";

        // Hybrid Managed Studio Precomputed Properties
        const cleanAppNameStr = (appName || 'app').toLowerCase().replace(/[^a-z0-9]/g, '');
        const computedPackageName = `com.${cleanAppNameStr || 'app'}.app`;
        const computedAppUrl = `https://${user.subdomain || cleanAppNameStr || 'app'}.9jasub.com`;
        
        const computedManifest = {
            name: appName,
            short_name: appName,
            start_url: '/',
            display: 'standalone',
            background_color: primaryColor || '#3b82f6',
            theme_color: primaryColor || '#3b82f6'
        };

        const computedMetadata = {
            targetSdk: 34,
            compileSdk: 34,
            versionCode: 1,
            versionName: '1.0.0',
            generatedEngine: 'Hybrid Managed Studio v1'
        };

        // Find existing request or create new
        let request = await AppRequest.findOne({ resellerId: user._id });
        if (request) {
            request.appName = appName;
            if (logo) request.logo = logo;
            if (primaryColor) request.primaryColor = primaryColor;
            if (accentColor) request.accentColor = accentColor;
            if (splashScreen) request.splashScreen = splashScreen;
            if (supportEmail) request.supportEmail = supportEmail;
            if (attachedPhone) request.resellerPhone = attachedPhone;
            if (notes) request.notes = notes;
            
            // Assign Hybrid parameters
            request.resellerAppUrl = computedAppUrl;
            request.packageIdentifiers = { packageName: computedPackageName, bundleId: computedPackageName };
            request.manifestConfig = computedManifest;
            request.packageMetadata = computedMetadata;

            request.status = 'Pending Review';
            request.estimatedDeliveryTime = estTime;
            await request.save();
        } else {
            request = await AppRequest.create({
                resellerId: user._id,
                appName,
                logo,
                primaryColor,
                accentColor,
                splashScreen,
                supportEmail,
                resellerPhone: attachedPhone,
                notes,
                resellerAppUrl: computedAppUrl,
                packageIdentifiers: { packageName: computedPackageName, bundleId: computedPackageName },
                manifestConfig: computedManifest,
                packageMetadata: computedMetadata,
                status: 'Pending Review',
                estimatedDeliveryTime: estTime
            });
        }

        // Sync branding to user doc for universal dashboard consistency
        if (!user.branding) user.branding = {};
        user.branding.siteName = appName;
        if (logo && logo.startsWith('data:image')) {
            user.branding.logo = logo;
        }
        if (primaryColor) user.branding.primaryColor = primaryColor;

        // Keep appSettings struct compatible
        user.appSettings = {
            ...(user.appSettings || {}),
            appName,
            appLogo: logo || user.appSettings?.appLogo,
            splashScreen: splashScreen || user.appSettings?.splashScreen,
            appColors: {
                primary: primaryColor || '#3b82f6',
                secondary: primaryColor || '#2563eb',
                accent: accentColor || '#f59e0b'
            },
            managedStatus: request.status
        };

        user.markModified('branding');
        user.markModified('appSettings');
        await user.save();

        // Emit socket updates to dashboard
        socketService.emitAppBuildStatus(user._id, {
            status: 'Pending Review',
            appName: request.appName
        });

        res.json({
            status: 'success',
            message: 'App request submitted successfully. Our team will review your application.',
            request
        });
    } catch (err) {
        console.error("[SubmitAppRequest Error]", err);
        res.status(500).json({ message: "Failed to submit app request: " + err.message });
    }
};

export const getAppRequest = async (req, res) => {
    try {
        const request = await AppRequest.findOne({ resellerId: req.user.id });
        const setting = await SystemSetting.findOne({}) || {};
        const estTime = setting.estimatedAppDeliveryTime || "72 hours";

        const user = await User.findById(req.user.id);

        res.json({
            status: 'success',
            request: request || null,
            estimatedDeliveryTime: estTime,
            appSettings: user?.appSettings || {},
            branding: user?.branding || {}
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching app request details" });
    }
};

// --- MANAGED CUSTOM DOMAIN SYSTEM CONTROLLERS ---
export const submitDomainRequest = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { domainOption, domainName, registrarProvider, whatsappNumber, contactEmail, adminNotes } = req.body;

        if (!domainOption || !domainName) {
            return res.status(400).json({ message: "Domain choice and Domain Name are required." });
        }

        if (domainOption === 'custom_domain' && !user.features?.custom_domain && user.role !== 'admin') {
            return res.status(403).json({ message: "Custom Domain integration is an Advanced Business feature. Please activate Website Hosting & Maintenance." });
        }

        let request = await CustomDomainRequest.findOne({ resellerId: user._id });
        if (request) {
            request.domainOption = domainOption;
            request.domainName = domainName;
            if (registrarProvider) request.registrarProvider = registrarProvider;
            if (whatsappNumber) request.whatsappNumber = whatsappNumber;
            if (contactEmail) request.contactEmail = contactEmail;
            if (adminNotes) request.adminNotes = adminNotes;
            if (request.status === 'Failed / Needs Correction') request.status = 'Domain Verification';
            if (domainOption === 'subdomain') request.status = 'Connected Successfully';
            await request.save();
        } else {
            request = await CustomDomainRequest.create({
                resellerId: user._id,
                domainOption,
                domainName,
                registrarProvider,
                whatsappNumber,
                contactEmail,
                adminNotes,
                status: domainOption === 'subdomain' ? 'Connected Successfully' : 'Request Submitted',
                lifecycleStatus: domainOption === 'subdomain' ? 'Connected Successfully' : 'Request Submitted'
            });
        }

        // Update main user doc domain string if custom domain mapping
        if (domainOption === 'custom_domain') {
            user.customDomain = domainName.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
            await user.save();
        }

        res.json({
            status: 'success',
            message: domainOption === 'subdomain' 
                ? 'Subdomain configuration preserved successfully.' 
                : 'Custom Domain operations requested successfully. Our network operations team handles DNS bindings manually.',
            request
        });
    } catch (err) {
        console.error("[SubmitDomainRequest Error]", err);
        res.status(500).json({ message: "Failed to process domain configuration: " + err.message });
    }
};

export const getDomainRequest = async (req, res) => {
    try {
        const request = await CustomDomainRequest.findOne({ resellerId: req.user.id });
        const user = await User.findById(req.user.id).select("subdomain customDomain features");
        res.json({
            status: 'success',
            request: request || null,
            user
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching domain details" });
    }
};

// --- CUSTOM CONTENT MANAGEMENT (Banners/Marquee) ---
export const getResellerContent = async (req, res) => {
    try {
        const { type } = req.query;
        let query = { resellerId: req.user.id, ownerType: 'reseller' };
        if (type) query.type = type;

        const contents = await Content.find(query).sort({ created_at: -1 });
        res.json(contents);
    } catch (err) {
        res.status(500).json({ message: "Error fetching custom content" });
    }
};

export const createResellerContent = async (req, res) => {
    try {
        const { type, title, message, image, link, is_active } = req.body;
        
        if (type === "marquee" && is_active !== false) {
            await Content.updateMany({ resellerId: req.user.id, type: "marquee" }, { is_active: false });
        }

        const content = new Content({
            type,
            title,
            message,
            image,
            link,
            is_active,
            ownerType: 'reseller',
            resellerId: req.user.id
        });

        await content.save();
        res.status(201).json(content);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const deleteResellerContent = async (req, res) => {
    try {
        const { id } = req.params;
        if (id && !id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid resource identifier format." });
        const content = await Content.findOneAndDelete({ _id: id, resellerId: req.user.id });
        if (!content) return res.status(404).json({ message: "Content not found or unauthorized" });
        res.json({ message: "Content deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getBusinessProfileStats = async (req, res) => {
    try {
        const resellerId = req.user.id;
        const totalCustomers = await User.countDocuments({ tenantOwnerId: resellerId });
        
        // Find successful debit transactions from this reseller's customers
        const transactions = await Transaction.find({ resellerId, status: 'success', type: 'debit' });
        
        const totalProfit = transactions.reduce((sum, tx) => sum + (tx.profit || 0), 0);
        
        const resellerUser = await User.findById(resellerId);
        
        res.json({
            businessName: resellerUser.branding?.siteName || resellerUser.name,
            tier: resellerUser.resellerTier,
            verifiedContact: resellerUser.kycData?.phone || resellerUser.branding?.whatsappNumber,
            whatsapp: resellerUser.branding?.whatsappNumber,
            supportEmail: resellerUser.branding?.contactEmail || resellerUser.email,
            totalCustomers,
            totalProfit,
            transactionCount: transactions.length
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


export const adjustCustomerWallet = async (req, res) => {
    try {
        const { id } = req.params;
        if (id && !id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid resource identifier format." });
        const { action, amount, reason, pin } = req.body;
        const numAmount = Number(amount);

        if (!numAmount || numAmount <= 0) return res.status(400).json({ message: 'Invalid amount' });
        if (!pin) return res.status(400).json({ message: 'Withdrawal PIN required' });

        const User = (await import('../models/User.js')).default;
        const bcrypt = (await import('bcrypt')).default;
        const Transaction = (await import('../models/Transaction.js')).default;
        const { insertLedgerEntry } = await import('../services/supabaseLedger.js');

        const reseller = await User.findById(req.user.id);
        const isMatch = await bcrypt.compare(pin, reseller.withdrawalPin || '');
        if (!isMatch) return res.status(401).json({ message: 'Invalid withdrawal PIN' });

        const customer = await User.findOne({ _id: id, tenantOwnerId: req.user.id });
        if (!customer) return res.status(404).json({ message: 'Customer not found or access denied' });

        if (action === 'credit') {
            if (reseller.balance1 < numAmount) return res.status(400).json({ message: 'Insufficient balance to credit customer' });
            
            reseller.balance1 -= numAmount;
            customer.balance1 += numAmount;

            await reseller.save();
            await customer.save();

            await Transaction.create({
                userId: customer._id, amount: numAmount, type: 'credit', status: 'success',
                description: `Wallet funded by Reseller: ${reason || 'N/A'}`, provider: 'System', reference: `WCR-${Date.now()}`
            });
            await Transaction.create({
                userId: reseller._id, amount: numAmount, type: 'debit', status: 'success',
                description: `Funded Customer Wallet (${customer.email})`, provider: 'System', reference: `WDB-${Date.now()}`
            });

            await insertLedgerEntry(reseller._id, -numAmount, 'withdrawal', 'wallet', `WDB-${Date.now()}`, `Funded Customer (${customer.email})`);
            await insertLedgerEntry(customer._id, numAmount, 'deposit', 'wallet', `WCR-${Date.now()}`, 'Reseller Funding');
        } else if (action === 'debit') {
            if (customer.balance1 < numAmount) return res.status(400).json({ message: 'Customer has insufficient balance' });

            customer.balance1 -= numAmount;
            reseller.balance1 += numAmount;

            await customer.save();
            await reseller.save();

            await Transaction.create({
                userId: customer._id, amount: numAmount, type: 'debit', status: 'success',
                description: `Wallet debited by Reseller: ${reason || 'N/A'}`, provider: 'System', reference: `WDB-${Date.now()}`
            });
            await Transaction.create({
                userId: reseller._id, amount: numAmount, type: 'credit', status: 'success',
                description: `Debited Customer Wallet (${customer.email})`, provider: 'System', reference: `WCR-${Date.now()}`
            });

            await insertLedgerEntry(customer._id, -numAmount, 'withdrawal', 'wallet', `WDB-${Date.now()}`, 'Reseller Debit');
            await insertLedgerEntry(reseller._id, numAmount, 'deposit', 'wallet', `WCR-${Date.now()}`, `Debited Customer (${customer.email})`);
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        res.json({ message: `Successfully ${action}ed ₦${numAmount} to customer.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

export const notifyCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        if (id && !id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid resource identifier format." });
        const { subject, message } = req.body;

        const User = (await import('../models/User.js')).default;
        const Notification = (await import('../models/Notification.js')).default;

        const customer = await User.findOne({ _id: id, tenantOwnerId: req.user.id });
        if (!customer) return res.status(404).json({ message: 'Customer not found or access denied' });

        await Notification.create({
            userId: customer._id,
            title: subject,
            message: message,
            type: 'system',
            read: false
        });

        res.json({ message: 'Notification sent successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// Update Reseller's enabled Future Platforms
export const updateEnabledPlatforms = async (req, res) => {
    try {
        const { enabledFuturePlatforms } = req.body;
        
        if (!Array.isArray(enabledFuturePlatforms)) {
            return res.status(400).json({ status: 'error', message: 'Invalid format for platforms' });
        }
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Reseller not found' });
        }
        
        user.enabledFuturePlatforms = enabledFuturePlatforms;
        await user.save();
        
        res.status(200).json({
            status: 'success',
            message: 'Platforms updated successfully',
            enabledFuturePlatforms: user.enabledFuturePlatforms
        });
        
    } catch (error) {
        console.error("Update Platforms Error:", error);
        res.status(500).json({ status: 'error', message: 'Failed to update platforms' });
    }
};

export const getPremiumNotificationHistory = async (req, res) => {
    try {
        const { default: ResellerEmailCampaign } = await import('../models/ResellerEmailCampaign.js');
        const { default: ResellerNotificationCampaign } = await import('../models/ResellerNotificationCampaign.js');

        const emailCampaigns = await ResellerEmailCampaign.find({ resellerId: req.user.id }).lean();
        const inAppCampaigns = await ResellerNotificationCampaign.find({ resellerId: req.user.id }).lean();

        // Format and merge
        const merged = [
            ...emailCampaigns.map(c => ({
                _id: c._id,
                title: c.subject,
                type: 'Email Campaign',
                audience: c.recipientType,
                channel: 'Email',
                createdAt: c.createdAt,
                status: c.status,
                successCount: c.successCount,
                failedCount: c.failedCount
            })),
            ...inAppCampaigns.map(c => ({
                _id: c._id,
                title: c.title,
                type: c.notificationType,
                audience: c.recipientType,
                channel: 'In-App',
                createdAt: c.createdAt,
                status: c.status,
                successCount: c.successCount,
                failedCount: c.failedCount
            }))
        ];

        merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(merged);
    } catch (err) {
        console.error('[getPremiumNotificationHistory]', err);
        res.status(500).json({ message: "Error fetching notification history" });
    }
};

export const sendPremiumNotification = async (req, res) => {
    try {
        const { title, message, notificationType, recipientType, deliveryChannels } = req.body;

        if (!title || !message || !recipientType || !deliveryChannels || deliveryChannels.length === 0) {
            return res.status(400).json({ message: "All fields and at least one delivery channel are required." });
        }

        const { default: User } = await import('../models/User.js');
        const query = { tenantOwnerId: req.user.id };
        if (recipientType === 'active') {
            query.isSuspended = false;
        }

        const count = await User.countDocuments(query);
        if (count === 0) {
            return res.status(400).json({ message: "No customers found for the selected criteria." });
        }

        const { default: ResellerEmailCampaign } = await import('../models/ResellerEmailCampaign.js');
        const { default: ResellerNotificationCampaign } = await import('../models/ResellerNotificationCampaign.js');
        const { default: backgroundQueue } = await import('../services/backgroundQueue.js');

        // Execute Email Campaign exactly as it was
        if (deliveryChannels.includes('email')) {
            const emailCampaign = await ResellerEmailCampaign.create({
                resellerId: req.user.id,
                subject: title,
                message: message,
                recipientType: recipientType,
                recipientCount: count,
                status: 'pending'
            });

            backgroundQueue.push('EMAIL_CAMPAIGN', {
                campaignId: emailCampaign._id,
                resellerId: req.user.id,
                query: query,
                subject: title,
                html: message
            });
        }

        // Execute In-App Campaign separately
        if (deliveryChannels.includes('in-app')) {
            const inAppCampaign = await ResellerNotificationCampaign.create({
                resellerId: req.user.id,
                title: title,
                message: message,
                notificationType: notificationType || 'Announcement',
                recipientType: recipientType,
                recipientCount: count,
                status: 'pending'
            });

            backgroundQueue.push('IN_APP_CAMPAIGN', {
                campaignId: inAppCampaign._id,
                resellerId: req.user.id,
                query: query,
                title: title,
                message: message,
                notificationType: notificationType || 'Announcement'
            });
        }

        res.status(201).json({ message: "Notification cluster dispatched successfully." });
    } catch (err) {
        console.error('[sendPremiumNotification]', err);
        res.status(500).json({ message: "Error dispatching notifications." });
    }
};

export const seenWelcomeBanner = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { welcomeBannerSeen: true },
            { new: true }
        ).select("-password");
        res.json({ status: "success", user });
    } catch (err) {
        console.error("[seenWelcomeBanner Error]", err);
        res.status(500).json({ message: "Failed to update onboarding state" });
    }
};

export const seenBusinessGuide = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { businessGuideSeen: true },
            { new: true }
        ).select("-password");
        res.json({ status: "success", user });
    } catch (err) {
        console.error("[seenBusinessGuide Error]", err);
        res.status(500).json({ message: "Failed to update onboarding state" });
    }
};

import { clearResellerCache } from '../middlewares/whiteLabel.js';

export const toggleManualService = async (req, res) => {
    try {
        const { serviceType, enabled } = req.body;
        const validServices = ['nin_modification', 'bvn_modification', 'cac_registration', 'birth_attestation', 'court_affidavit'];
        
        if (!validServices.includes(serviceType)) {
            return res.status(400).json({ status: 'error', message: 'Invalid manual service type' });
        }
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        
        let activated = user.activatedManualServices || [];
        
        if (enabled) {
            if (!activated.includes(serviceType)) {
                activated.push(serviceType);
            }
        } else {
            activated = activated.filter(s => s !== serviceType);
        }
        
        user.activatedManualServices = activated;
        await user.save();
        clearResellerCache();
        
        return res.json({ 
            status: 'success', 
            message: 'Service successfully',
            data: { activatedManualServices: user.activatedManualServices }
        });
    } catch (error) {
        console.error('[ResellerController] toggleManualService error:', error);
        return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};
