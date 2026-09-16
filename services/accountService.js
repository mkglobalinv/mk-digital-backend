import mongoose from "mongoose";
import User from "../models/User.js";
import Setting from "../models/Setting.js";
import { createVirtualAccount as createFlutterwaveVirtualAccount } from "./flutterwaveService.js";
import { createVirtualAccount as createPaymentPointVirtualAccount } from "./paymentpointService.js";
import { createVirtualAccount as createWittypayVirtualAccount } from "./wittypayService.js";

// PaymentPoint's business account is currently unable to provision ANY
// reserved bank account (confirmed via production testing: every bank code,
// every customer, fails with bankAccounts: [] and business_Id: null on
// their end) -- so Flutterwave is the default primary for now, with
// PaymentPoint fallback OFF (attempting it first/as fallback would just add
// a guaranteed-failing request and misleading log noise). Once PaymentPoint
// support confirms their business account is fixed, switch this back (or
// just use the admin dashboard's "Virtual Account Gateway" page, which
// overrides this default without needing a redeploy).
const VA_PROVIDERS = {
    wittypay: { name: "Wittypay", fn: createWittypayVirtualAccount },
    paymentpoint: { name: "PaymentPoint", fn: createPaymentPointVirtualAccount },
    flutterwave: { name: "Flutterwave", fn: createFlutterwaveVirtualAccount }
};

const DEFAULT_VA_PROVIDER_CONFIG = {
    priority: ["wittypay", "flutterwave", "paymentpoint"],
    enabled: {
        wittypay: true,
        flutterwave: true,
        paymentpoint: true
    }
};

/**
 * Reads the admin-controlled virtual account provider switch (Setting doc,
 * key 'virtualAccountProvider' -- managed from the admin dashboard's
 * "Virtual Account Gateway" page). Defaults to Wittypay -> Flutterwave -> PaymentPoint.
 */
export const getVirtualAccountProviderConfig = async () => {
    if (mongoose.connection.readyState !== 1) return DEFAULT_VA_PROVIDER_CONFIG;
    try {
        const setting = await Setting.findOne({ key: "virtualAccountProvider" });
        if (!setting?.value) return DEFAULT_VA_PROVIDER_CONFIG;

        const val = setting.value;

        // Custom multi-provider schema support
        let priority = Array.isArray(val.priority) && val.priority.length > 0 
            ? val.priority.filter(p => VA_PROVIDERS[p])
            : null;
        
        let enabled = typeof val.enabled === "object" && val.enabled !== null
            ? val.enabled
            : null;

        // Backward compatibility with legacy { primary: "flutterwave", fallbackEnabled: boolean }
        if (!priority && val.primary) {
            const primary = VA_PROVIDERS[val.primary] ? val.primary : "wittypay";
            const others = Object.keys(VA_PROVIDERS).filter(p => p !== primary);
            priority = [primary, ...others];
            
            if (val.fallbackEnabled === false) {
                enabled = { [primary]: true };
                others.forEach(p => { enabled[p] = false; });
            }
        }

        if (!priority || priority.length === 0) {
            priority = [...DEFAULT_VA_PROVIDER_CONFIG.priority];
        }

        if (!enabled) {
            enabled = { ...DEFAULT_VA_PROVIDER_CONFIG.enabled };
        }

        return { priority, enabled };
    } catch (err) {
        console.warn(`[AccountService] Failed to read virtual account provider setting, using default: ${err.message}`);
        return DEFAULT_VA_PROVIDER_CONFIG;
    }
};

/**
 * Calls enabled virtual account providers in priority order (Wittypay -> Flutterwave -> PaymentPoint).
 * Failover occurs ONLY if creation fails. Once account creation succeeds, failover STOPS immediately.
 * If all providers are disabled, returns a clear error without calling any provider.
 */
export const createVirtualAccountWithFallback = async (vaData) => {
    const { priority, enabled } = await getVirtualAccountProviderConfig();

    // Filter active enabled providers in priority order
    const activeProviders = priority.filter(pKey => VA_PROVIDERS[pKey] && enabled[pKey] !== false);

    if (activeProviders.length === 0) {
        console.warn("[AccountService] All virtual account providers are currently disabled.");
        return { status: "error", message: "No payment provider enabled" };
    }

    let lastErrorMessage = "Payment provider service unavailable.";

    for (let i = 0; i < activeProviders.length; i++) {
        const pKey = activeProviders[i];
        const provider = VA_PROVIDERS[pKey];
        const isPrimary = (i === 0);
        console.log(`[AccountService] Attempting virtual account creation via ${provider.name} (${pKey}, step ${i + 1}/${activeProviders.length})...`);
        try {
            const response = await provider.fn(vaData);
            if (response?.status === "success" && response?.data) {
                console.log(`[AccountService] Virtual account successfully issued via ${provider.name} (${isPrimary ? "primary" : "fallback"}) for ${vaData.email}`);
                return {
                    ...response,
                    provider: pKey
                };
            }
            lastErrorMessage = response?.message || `${provider.name} creation returned non-success`;
            console.warn(`[AccountService] ${provider.name} VA creation failed: ${lastErrorMessage}`);
        } catch (err) {
            lastErrorMessage = err.message;
            console.warn(`[AccountService] ${provider.name} VA creation threw an error: ${err.message}`);
        }
    }

    console.warn(`[AccountService] All enabled payment providers failed. Last error: ${lastErrorMessage}`);
    return { status: "error", message: lastErrorMessage || "All enabled payment providers are currently unavailable." };
};

/**
 * Internal helper to handle VA creation and DB update
 */
export const generateTemporaryAccount = async (user, amount, reseller = null) => {
    try {
        const names = user.name.split(' ');
        const providerEmail = `${user._id}@9jasub.com`;
        const firstName = names[0] || "User";
        let actualReseller = null;
        if (user.tenantOwnerId) {
            actualReseller = await User.findById(user.tenantOwnerId).select('branding name');
        } else if (user.role === 'reseller_admin') {
            actualReseller = user;
        }

        const brandName = actualReseller?.branding?.siteName || "9JASUB";

        const vaData = {
            email: providerEmail,
            phone: user.kycData?.phone || `080${String(parseInt(user._id.toString().slice(-8), 16)).slice(0, 8).padStart(8, '0')}`,
            firstname: firstName,
            lastname: names.length > 1 ? names[1] : "Customer",
            is_permanent: false,
            amount: amount,
            tx_ref: `TEMP-VA-${Date.now()}`,
            narration: `${brandName} - ${firstName}`
        };

        console.log(`[AccountService] Initiating temporary virtual account creation for user ${user.email} with expected amount: ${amount}`);
        const response = await createVirtualAccountWithFallback(vaData);
        if (response && response.status === "success") {
            console.log(`[AccountService] Virtual account generated successfully. Account: ${response.data.account_number}, Bank: ${response.data.bank_name}, Ref: ${response.data.order_ref || response.data.flw_ref}`);
            const acc = response.data;
            user.account_number = acc.account_number;
            user.bank_name = acc.bank_name;
            user.account_reference = acc.order_ref || acc.flw_ref;
            user.accountType = "temporary";
            
            // Flutterwave returns expiry_date in "YYYY-MM-DD HH:MM:SS" format
            if (acc.expiry_date) {
               user.accountExpiryDate = new Date(acc.expiry_date.replace(" ", "T") + "Z");
            } else {
               user.accountExpiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour default
            }
            user.temporaryAmount = amount;

            await user.save();
            return { success: true, account: acc };
        } else {
            console.error(`[AccountService] Failed to generate virtual account for ${user.email}. Provider response:`, response?.message);
            return { success: false, message: response.message };
        }
    } catch (err) {
        console.error(`[AccountService] Exception during virtual account generation: ${err.message}`, err);
        return { success: false, message: err.message };
    }
};

export const generatePermanentAccount = async (user, identifier, type, reseller = null) => {
    try {
        const names = user.name.split(' ');
        const providerEmail = `${user._id}@9jasub.com`;
        const firstName = names[0] || "User";
        let actualReseller = null;
        if (user.tenantOwnerId) {
            actualReseller = await User.findById(user.tenantOwnerId).select('branding name');
        } else if (user.role === 'reseller_admin') {
            actualReseller = user;
        }

        const brandName = actualReseller?.branding?.siteName || "9JASUB";

        const vaData = {
            email: providerEmail,
            phone: user.kycData?.phone || `080${String(parseInt(user._id.toString().slice(-8), 16)).slice(0, 8).padStart(8, '0')}`,
            firstname: firstName,
            lastname: names.length > 1 ? names[1] : "Customer",
            is_permanent: true,
            narration: `${brandName} - ${firstName}`
        };
        
        if (type === "nin") {
            vaData.nin = identifier;
        } else {
            vaData.bvn = identifier;
        }

        const response = await createVirtualAccountWithFallback(vaData);
        if (response && response.status === "success") {
            const acc = response.data;
            user.account_number = acc.account_number;
            user.bank_name = acc.bank_name;
            user.account_reference = acc.order_ref || acc.flw_ref;
            user.accountType = "permanent";
            user.accountExpiryDate = undefined;
            if (type === "bvn") user.bvn = identifier;
            await user.save();
            return { success: true, account: acc };
        } else {
            return { success: false, message: response.message };
        }
    } catch (err) {
        return { success: false, message: err.message };
    }
};

