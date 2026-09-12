import mongoose from "mongoose";
import User from "../models/User.js";
import Setting from "../models/Setting.js";
import { createVirtualAccount as createFlutterwaveVirtualAccount } from "./flutterwaveService.js";
import { createVirtualAccount as createPaymentPointVirtualAccount } from "./paymentpointService.js";

const DEFAULT_VA_PROVIDER_CONFIG = { primary: "paymentpoint", fallbackEnabled: true };

/**
 * Reads the admin-controlled virtual account provider switch (Setting doc,
 * key 'virtualAccountProvider' -- managed from the admin dashboard's
 * "Virtual Account Gateway" page). Defaults to PaymentPoint-primary with
 * Flutterwave fallback if no setting has been saved yet.
 */
export const getVirtualAccountProviderConfig = async () => {
    // readyState 1 = connected. Skip the query (rather than let Mongoose
    // buffer/time out) when there's no live DB connection, e.g. in unit
    // tests that exercise this fallback logic without a MongoDB instance.
    if (mongoose.connection.readyState !== 1) return DEFAULT_VA_PROVIDER_CONFIG;
    try {
        const setting = await Setting.findOne({ key: "virtualAccountProvider" });
        if (!setting?.value?.primary) return DEFAULT_VA_PROVIDER_CONFIG;
        return {
            primary: setting.value.primary === "flutterwave" ? "flutterwave" : "paymentpoint",
            fallbackEnabled: setting.value.fallbackEnabled !== false
        };
    } catch (err) {
        console.warn(`[AccountService] Failed to read virtual account provider setting, using default: ${err.message}`);
        return DEFAULT_VA_PROVIDER_CONFIG;
    }
};

const VA_PROVIDERS = {
    paymentpoint: { name: "PaymentPoint", fn: createPaymentPointVirtualAccount },
    flutterwave: { name: "Flutterwave", fn: createFlutterwaveVirtualAccount }
};

/**
 * Calls the admin-selected primary virtual account provider, falling back to
 * the other one on failure (unless fallback has been switched off). Both
 * providers' createVirtualAccount functions already return/normalize to the
 * same { status, data: { account_number, bank_name, order_ref, expiry_date } }
 * shape, so the caller below needs no provider-specific branching.
 */
export const createVirtualAccountWithFallback = async (vaData) => {
    const { primary, fallbackEnabled } = await getVirtualAccountProviderConfig();
    const primaryProvider = VA_PROVIDERS[primary];
    const fallbackProvider = VA_PROVIDERS[primary === "flutterwave" ? "paymentpoint" : "flutterwave"];

    try {
        const primaryResponse = await primaryProvider.fn(vaData);
        if (primaryResponse?.status === "success") {
            console.log(`[AccountService] Virtual account issued via ${primaryProvider.name} (primary) for ${vaData.email}`);
            return primaryResponse;
        }
        console.warn(`[AccountService] ${primaryProvider.name} VA creation failed. Reason: ${primaryResponse?.message}`);
    } catch (err) {
        console.warn(`[AccountService] ${primaryProvider.name} VA creation threw an error: ${err.message}`);
    }

    if (!fallbackEnabled) {
        console.warn(`[AccountService] Fallback is disabled; not attempting ${fallbackProvider.name}.`);
        return { status: "error", message: `${primaryProvider.name} is currently unavailable.` };
    }

    const fallbackResponse = await fallbackProvider.fn(vaData);
    if (fallbackResponse?.status === "success") {
        console.log(`[AccountService] Virtual account issued via ${fallbackProvider.name} (fallback) for ${vaData.email}`);
    }
    return fallbackResponse;
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

