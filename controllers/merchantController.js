import bcrypt from "bcrypt";
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

// POST /api/merchant/register -- public, unauthenticated entry point for
// someone who isn't already logged in. Mirrors registerResellerWithPayment's
// create-or-upgrade-by-password pattern (routes/... -> controllers/
// resellerController.js) but far simpler: no business name, no subdomain,
// no white-label paraphernalia -- just enough to log in and land on
// /merchant/onboarding to fund their wallet. Always operates on the main
// platform (tenantOwnerId: null), same as reseller registration -- the
// merchant program isn't offered inside any white-label tenant site.
export const registerMerchant = async (req, res) => {
    try {
        const { name, email, phone, password, transactionPin } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email and password are required." });
        }
        if (!transactionPin || !/^\d{4}$/.test(transactionPin)) {
            return res.status(400).json({ message: "A 4-digit transaction PIN is required." });
        }

        const normalizedEmail = email.toLowerCase();
        const existing = await User.findOne({ email: normalizedEmail, tenantOwnerId: null });

        if (existing) {
            if (existing.role !== "user") {
                return res.status(400).json({ message: "An account with this email already exists." });
            }
            const isMatch = await bcrypt.compare(password, existing.password);
            if (!isMatch) {
                return res.status(400).json({ message: "This email is already registered. Enter your correct account password to become a merchant." });
            }
            existing.role = "merchant";
            existing.name = name || existing.name;
            existing.phone = phone || existing.phone;
            if (!existing.transactionPin) existing.transactionPin = await bcrypt.hash(transactionPin, 10);
            await existing.save();
            return res.status(200).json({ status: "success", message: "Merchant account activated.", userId: existing._id });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedPin = await bcrypt.hash(transactionPin, 10);
        const user = new User({
            name,
            email: normalizedEmail,
            phone,
            password: hashedPassword,
            transactionPin: hashedPin,
            role: "merchant",
            isEmailVerified: true, // Same convention as reseller signup -- see registerResellerWithPayment
            isSignupComplete: true
        });
        await user.save();

        res.status(201).json({ status: "success", message: "Merchant account created.", userId: user._id });
    } catch (err) {
        console.error("[Merchant Register Error]", err.message);
        res.status(500).json({ message: "Failed to create merchant account: " + err.message });
    }
};
