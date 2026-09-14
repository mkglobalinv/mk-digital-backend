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
            // A reseller_admin/admin can still get a merchant identity, just not by
            // converting THIS logged-in account -- see registerMerchant below, which
            // creates a separate one under the same email instead.
            return res.status(400).json({ message: "This account already has a role. To get a separate Merchant account under the same email, sign out and use the \"Become a Merchant\" sign-up form instead." });
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
// someone who isn't already logged in. Always operates on the main platform
// (tenantOwnerId: null), same as reseller registration -- the merchant
// program isn't offered inside any white-label tenant site.
//
// Three cases for an email that's already registered (see models/User.js's
// {email, tenantOwnerId, role} index and findByTenant):
//   1. Already has a merchant account -- just a repeat/duplicate sign-up
//      attempt; verify the password and tell them, don't make a third one.
//   2. A plain retail 'user' account -- upgraded IN PLACE (same single
//      identity, same as registerResellerWithPayment's reseller upgrade
//      pattern), requires the correct existing password.
//   3. Any other role (reseller_admin/admin/superadmin) -- that account's
//      role can't be overwritten without destroying what it already is, so
//      this creates a SEPARATE, independent merchant identity under the
//      same email instead. /api/login's sessionType then disambiguates
//      which of the two to sign into.
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
        const existingDocs = await User.find({ email: normalizedEmail, tenantOwnerId: null });

        const existingMerchant = existingDocs.find(u => u.role === "merchant");
        if (existingMerchant) {
            const isMatch = await bcrypt.compare(password, existingMerchant.password);
            if (!isMatch) {
                return res.status(400).json({ message: "You already have a merchant account with this email. Enter your correct password to sign in." });
            }
            return res.status(200).json({ status: "success", message: "You already have a merchant account. Signing you in.", userId: existingMerchant._id });
        }

        const existingPlainUser = existingDocs.find(u => u.role === "user");
        if (existingPlainUser) {
            const isMatch = await bcrypt.compare(password, existingPlainUser.password);
            if (!isMatch) {
                return res.status(400).json({ message: "This email is already registered. Enter your correct account password to become a merchant." });
            }
            existingPlainUser.role = "merchant";
            existingPlainUser.name = name || existingPlainUser.name;
            existingPlainUser.phone = phone || existingPlainUser.phone;
            if (!existingPlainUser.transactionPin) existingPlainUser.transactionPin = await bcrypt.hash(transactionPin, 10);
            await existingPlainUser.save();
            return res.status(200).json({ status: "success", message: "Merchant account activated.", userId: existingPlainUser._id });
        }

        // No existing 'merchant' or 'user' doc for this email -- either the
        // email is brand new, or it belongs only to a reseller_admin/admin/
        // superadmin account. Either way, create a fresh, independent
        // merchant identity (own password/PIN, unrelated to any other
        // account on this email).
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
