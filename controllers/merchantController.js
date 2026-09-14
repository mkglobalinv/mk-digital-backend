import User from "../models/User.js";
import { MERCHANT_MIN_ACTIVATION_AMOUNT } from "../config/merchant.js";

// Merchant program ("Reseller 2"): a self-service, no-website tier layered
// entirely on the existing customer app + Basic Reseller pricing engine
// (see services/pricing/vtuPricing.js and services/walletService.js's
// creditBalance). These two endpoints are the whole surface: becoming a
// merchant just flips `role`, and activation is driven purely by wallet
// funding, not by anything here.

// GET /api/merchant/status
export const getMerchantStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("role merchantActivatedAt balance1");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({
            status: "success",
            isMerchant: user.role === "merchant",
            isActivated: Boolean(user.merchantActivatedAt),
            activatedAt: user.merchantActivatedAt,
            walletBalance: user.balance1 || 0,
            minActivationAmount: MERCHANT_MIN_ACTIVATION_AMOUNT
        });
    } catch (err) {
        console.error("[Merchant Status Error]", err.message);
        res.status(500).json({ message: "Error fetching merchant status" });
    }
};

// POST /api/merchant/activate -- opts an existing, logged-in regular user
// into the merchant role. Free and immediate: it only unlocks the merchant
// screen and the possibility of activation, it does NOT by itself grant
// reseller pricing -- that still requires the qualifying wallet top-up.
export const becomeMerchant = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.role === "merchant") {
            return res.json({ status: "success", message: "You're already a merchant.", isMerchant: true, isActivated: Boolean(user.merchantActivatedAt) });
        }

        if (user.role !== "user") {
            return res.status(400).json({ message: "This account type can't become a merchant." });
        }

        user.role = "merchant";
        await user.save();

        res.json({
            status: "success",
            message: "Merchant account created. Fund your wallet to unlock reseller pricing.",
            isMerchant: true,
            isActivated: false,
            minActivationAmount: MERCHANT_MIN_ACTIVATION_AMOUNT
        });
    } catch (err) {
        console.error("[Become Merchant Error]", err.message);
        res.status(500).json({ message: "Error creating merchant account" });
    }
};
