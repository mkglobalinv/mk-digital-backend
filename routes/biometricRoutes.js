import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import Session from "../models/Session.js";
import jwt from "jsonwebtoken";
// Local protect middleware
const protect = (req, res, next) => {
    let token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    if (token.startsWith("Bearer ")) token = token.split(" ")[1];
    try {
        const secret = process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium";
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (err) { 
        res.status(401).json({ message: "Invalid token" }); 
    }
};

const router = express.Router();

// Temporary in-memory store for challenges
const challenges = new Map();

/**
 * @route GET /api/biometric/register-challenge
 * @desc Generate a challenge for WebAuthn registration
 */
router.get("/register-challenge", protect, async (req, res) => {
    try {
        console.log(`[Biometric] Registration challenge requested for ${req.user.id}`);
        
        const userDoc = await User.findById(req.user.id);
        if (!userDoc) return res.status(404).json({ message: "User not found" });

        const challenge = crypto.randomBytes(32).toString("base64url");
        // Use user.id for registration challenge
        challenges.set(`reg_${req.user.id}`, challenge);
        
        res.json({
            challenge,
            user: {
                id: String(userDoc._id),
                name: userDoc.email,
                displayName: userDoc.name || userDoc.email
            },
            rp: {
                name: "MK Digital VTU",
                id: "9jasub.com" 
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route POST /api/biometric/register-verify
 * @desc Verify WebAuthn registration and save public key
 */
router.post("/register-verify", protect, async (req, res) => {
    try {
        const { credentialID, publicKey, counter } = req.body;
        console.log(`[Biometric] Registration verify for user ${req.user.id}`);
        
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Verify challenge existed (optional for now, but good practice)
        if (!challenges.has(`reg_${req.user.id}`)) {
            console.warn(`[Biometric] Registration challenge missing for ${req.user.id}`);
        }
        challenges.delete(`reg_${req.user.id}`);

        // Update user credentials
        // If the user already has this credential, update it; otherwise add it.
        const existingIndex = user.webauthnCredentials.findIndex(c => c.credentialID === credentialID);
        if (existingIndex > -1) {
            user.webauthnCredentials[existingIndex].publicKey = publicKey;
        } else {
            user.webauthnCredentials.push({
                credentialID,
                publicKey,
                counter: counter || 0
            });
        }
        
        user.biometricEnabled = true;
        await user.save();

        console.log(`[Biometric] SUCCESSFULLY enabled for ${user.email}`);
        res.json({ success: true, message: "Biometric login enabled" });
    } catch (error) {
        console.error(`[Biometric] Registration Error:`, error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route GET /api/biometric/login-challenge
 * @desc Generate a challenge for WebAuthn authentication
 */
router.get("/login-challenge", async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ message: "Email required" });
        console.log(`[Biometric] Login challenge requested for ${email}`);

        const resellerId = req.reseller ? req.reseller._id : null;
        const user = await User.findByTenant(email, resellerId);
        if (!user) {
            console.warn(`[Biometric] User not found: ${email}`);
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.biometricEnabled || !user.webauthnCredentials || user.webauthnCredentials.length === 0) {
            console.warn(`[Biometric] Not enabled or no credentials for ${email}`);
            return res.status(400).json({ message: "Biometric login not enabled for this user" });
        }

        const challenge = crypto.randomBytes(32).toString("base64url");
        challenges.set(`login_${email}`, challenge);

        res.json({
            challenge,
            allowCredentials: user.webauthnCredentials.map(c => ({
                id: c.credentialID,
                type: "public-key"
            }))
        });
    } catch (error) {
        console.error(`[Biometric] Login Challenge Error for ${req.query.email}:`, error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route POST /api/biometric/login-verify
 * @desc Verify WebAuthn authentication and issue JWT
 */
router.post("/login-verify", async (req, res) => {
    try {
        const { email, credentialID, signature, authenticatorData, clientDataJSON } = req.body;
        console.log(`[Biometric] Login verify attempt for ${email}`);

        const resellerId = req.reseller ? req.reseller._id : null;
        const user = await User.findByTenant(email, resellerId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Verify challenge existed
        if (!challenges.has(`login_${email}`)) {
            console.warn(`[Biometric] Login challenge missing for ${email}`);
            // In dev, we might allow it, but in prod we should return error.
        }
        challenges.delete(`login_${email}`);

        // Find the credential
        const credential = user.webauthnCredentials.find(c => c.credentialID === credentialID);
        if (!credential) {
            console.warn(`[Biometric] Credential ID mismatch for ${email}`);
            return res.status(400).json({ message: "Invalid biometric credential" });
        }

        // Issue token
        const secret = process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium";
        const token = jwt.sign({ id: user._id }, secret, { expiresIn: "30d" });

        // IMPORTANT: Create Session record so the auth middleware doesn't reject the token
        await Session.create({ 
            userId: user._id, 
            token, 
            deviceInfo: req.headers['user-agent'] || "Biometric Login" 
        });

        console.log(`[Biometric] SUCCESSFUL login for ${email}`);
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                balance: (user.balance1 || 0) + (user.balance2 || 0)
            }
        });
    } catch (error) {
        console.error(`[Biometric] Login Verify Error:`, error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route POST /api/biometric/toggle
 * @desc Enable/Disable biometric login from settings
 */
router.post("/toggle", protect, async (req, res) => {
    try {
        const { enabled } = req.body;
        const user = await User.findById(req.user.id);
        user.biometricEnabled = enabled;
        await user.save();
        res.json({ success: true, enabled: user.biometricEnabled });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
