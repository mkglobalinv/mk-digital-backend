import User from "../models/User.js";
import { createVirtualAccount as createFlutterwaveVirtualAccount } from "./flutterwaveService.js";
import { createVirtualAccount as createPaymentPointVirtualAccount } from "./paymentpointService.js";

/**
 * PaymentPoint is the PRIMARY virtual account provider; Flutterwave is the
 * automatic fallback whenever PaymentPoint is unavailable or returns a
 * failure. Flutterwave's own createVirtualAccount function, request shape,
 * and behavior are untouched — this only decides which one gets called.
 * paymentpointService normalizes its response to Flutterwave's existing
 * { status, data: { account_number, bank_name, order_ref, expiry_date } }
 * shape, so the caller below needs no provider-specific branching.
 */
export const createVirtualAccountWithFallback = async (vaData) => {
    try {
        const ppResponse = await createPaymentPointVirtualAccount(vaData);
        if (ppResponse?.status === "success") {
            console.log(`[AccountService] Virtual account issued via PaymentPoint (primary) for ${vaData.email}`);
            return ppResponse;
        }
        console.warn(`[AccountService] PaymentPoint VA creation failed, falling back to Flutterwave. Reason: ${ppResponse?.message}`);
    } catch (err) {
        console.warn(`[AccountService] PaymentPoint VA creation threw an error, falling back to Flutterwave: ${err.message}`);
    }

    const flwResponse = await createFlutterwaveVirtualAccount(vaData);
    if (flwResponse?.status === "success") {
        console.log(`[AccountService] Virtual account issued via Flutterwave (fallback) for ${vaData.email}`);
    }
    return flwResponse;
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

