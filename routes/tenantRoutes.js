import express from "express";
import User from "../models/User.js";
import { auth, restrictToBusinessSession } from "../middlewares/auth.js";

const router = express.Router();

// GET /api/tenant/branding
// Public route for login page to fetch dynamic branding
router.get("/branding", async (req, res) => {
    try {
        const { subdomain } = req.query;
        if (!subdomain) {
            return res.status(400).json({ message: "Subdomain is required" });
        }

        const tenant = await User.findOne({
            $or: [
                { subdomain: subdomain },
                { customDomain: subdomain },
                { admin_subdomain: subdomain }
            ]
        }).select('branding name admin_logo_url theme_color_primary theme_color_secondary admin_subdomain subdomain');

        if (!tenant) {
            return res.status(404).json({ message: "Tenant not found" });
        }

        res.json({
            status: 'success',
            branding: {
                siteName: tenant.branding?.siteName || tenant.name,
                logo: tenant.admin_logo_url || tenant.branding?.logo,
                primaryColor: tenant.theme_color_primary || tenant.branding?.primaryColor || '#0f172a',
                secondaryColor: tenant.theme_color_secondary || tenant.branding?.secondaryColor || '#38bdf8',
                adminSubdomain: tenant.admin_subdomain,
                subdomain: tenant.subdomain
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching branding: " + err.message });
    }
});

// PUT /api/tenant/branding
// Protected route for owners to update admin portal branding
router.put("/branding", auth, restrictToBusinessSession, async (req, res) => {
    try {
        const { admin_logo_url, theme_color_primary, theme_color_secondary, admin_subdomain } = req.body;
        
        // Ensure the user is a reseller
        if (req.user.role !== 'reseller_admin') {
            return res.status(403).json({ message: "Only Website Owners can update tenant branding." });
        }

        const tenant = await User.findById(req.user.id);
        if (!tenant) {
            return res.status(404).json({ message: "Tenant not found" });
        }

        // Validate hex colors
        const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
        if (theme_color_primary && !hexRegex.test(theme_color_primary)) {
            return res.status(400).json({ message: "Invalid primary color format. Must be hex." });
        }
        if (theme_color_secondary && !hexRegex.test(theme_color_secondary)) {
            return res.status(400).json({ message: "Invalid secondary color format. Must be hex." });
        }

        // Subdomain uniqueness check
        if (admin_subdomain && admin_subdomain !== tenant.admin_subdomain) {
            const existing = await User.findOne({ admin_subdomain });
            if (existing) {
                return res.status(400).json({ message: "Admin subdomain already in use." });
            }
            tenant.admin_subdomain = admin_subdomain;
        }

        if (admin_logo_url !== undefined) tenant.admin_logo_url = admin_logo_url;
        if (theme_color_primary !== undefined) tenant.theme_color_primary = theme_color_primary;
        if (theme_color_secondary !== undefined) tenant.theme_color_secondary = theme_color_secondary;

        await tenant.save();

        res.json({
            status: 'success',
            message: "Branding updated successfully",
            branding: {
                admin_logo_url: tenant.admin_logo_url,
                theme_color_primary: tenant.theme_color_primary,
                theme_color_secondary: tenant.theme_color_secondary,
                admin_subdomain: tenant.admin_subdomain
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Error updating branding: " + err.message });
    }
});

export default router;
