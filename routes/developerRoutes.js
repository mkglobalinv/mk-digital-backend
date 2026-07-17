import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// Utility to generate secure random keys
const generateKey = (prefix) => {
    return `${prefix}_${crypto.randomBytes(24).toString('hex')}`;
};

// GET API Configuration (Keys, Webhook, IPs, Stats)
router.get("/config", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("apiKey testApiKey webhookUrl ipWhitelist apiCallCount lastApiCall");
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Mask the live API key for security unless requested otherwise (usually frontend handles this by keeping it hidden)
        const maskedLiveKey = user.apiKey ? `${user.apiKey.substring(0, 10)}********************` : null;
        const maskedTestKey = user.testApiKey ? `${user.testApiKey.substring(0, 13)}********************` : null;

        res.json({
            success: true,
            data: {
                liveApiKey: maskedLiveKey,
                hasLiveKey: !!user.apiKey,
                testApiKey: maskedTestKey,
                hasTestKey: !!user.testApiKey,
                webhookUrl: user.webhookUrl,
                ipWhitelist: user.ipWhitelist || [],
                stats: {
                    apiCallCount: user.apiCallCount || 0,
                    lastApiCall: user.lastApiCall || null
                }
            }
        });
    } catch (error) {
        console.error("[Developer API] Error fetching config:", error);
        res.status(500).json({ success: false, message: "Server error fetching developer config" });
    }
});

// POST Generate/Regenerate Keys
router.post("/keys/generate", auth, async (req, res) => {
    try {
        const { type } = req.body; // 'live' or 'test'
        
        if (!type || !['live', 'test'].includes(type)) {
            return res.status(400).json({ success: false, message: "Invalid key type requested" });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let newKey = "";
        
        // Note: For extreme security, secret keys should be hashed in DB, 
        // but for a VTU system, if the system requires matching plaintext headers, 
        // storing them directly is common. In this iteration we use the existing schema.
        
        if (type === 'live') {
            newKey = generateKey('sk_live');
            user.apiKey = newKey;
        } else {
            newKey = generateKey('sk_test');
            user.testApiKey = newKey;
        }

        await user.save();

        res.json({
            success: true,
            message: `${type.toUpperCase()} API Key generated successfully. Please copy it now, it won't be shown again in full.`,
            data: {
                key: newKey,
                type
            }
        });

    } catch (error) {
        console.error("[Developer API] Error generating key:", error);
        res.status(500).json({ success: false, message: "Server error generating API key" });
    }
});

// POST Update Webhook URL
router.post("/webhook", auth, async (req, res) => {
    try {
        const { webhookUrl } = req.body;
        
        if (webhookUrl !== "" && !webhookUrl.startsWith("http://") && !webhookUrl.startsWith("https://")) {
            return res.status(400).json({ success: false, message: "Invalid Webhook URL format" });
        }

        const user = await User.findById(req.user._id);
        user.webhookUrl = webhookUrl;
        await user.save();

        res.json({ success: true, message: "Webhook URL updated successfully", data: { webhookUrl: user.webhookUrl } });
    } catch (error) {
        console.error("[Developer API] Error updating webhook:", error);
        res.status(500).json({ success: false, message: "Server error updating webhook" });
    }
});

// POST Update IP Whitelist
router.post("/ip-whitelist", auth, async (req, res) => {
    try {
        const { ips } = req.body; // Array of IPs
        
        if (!Array.isArray(ips)) {
            return res.status(400).json({ success: false, message: "Invalid IP whitelist format. Must be an array." });
        }

        const user = await User.findById(req.user._id);
        user.ipWhitelist = ips;
        await user.save();

        res.json({ success: true, message: "IP Whitelist updated successfully", data: { ipWhitelist: user.ipWhitelist } });
    } catch (error) {
        console.error("[Developer API] Error updating IP whitelist:", error);
        res.status(500).json({ success: false, message: "Server error updating IP whitelist" });
    }
});

export default router;
