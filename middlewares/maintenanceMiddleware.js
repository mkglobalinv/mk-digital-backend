import jwt from "jsonwebtoken";
import User from "../models/User.js";
import SystemSetting from "../models/SystemSetting.js";

export const maintenanceMiddleware = async (req, res, next) => {
    // Skip verification for admin-only paths to ensure admins can always manage settings and logins
    if (req.path.startsWith("/api/admin") || req.path.startsWith("/admin")) {
        return next();
    }

    try {
        const settings = await SystemSetting.findOne();
        if (!settings || !settings.maintenanceMode) {
            return next();
        }

        const target = settings.maintenanceTarget || 'all';
        const rawMessage = settings.maintenanceMessage || "";
        const message = (rawMessage && !rawMessage.toLowerCase().includes("we are back now")) 
            ? rawMessage 
            : "system is currently under maintenance";

        // Determine if request is from an admin (admins always bypass maintenance)
        let isAdmin = false;
        let userRole = null;
        let resellerTier = null;

        let token = req.headers.authorization;
        if (token) {
            if (token.startsWith("Bearer ") || token.startsWith("Token ")) {
                token = token.split(" ")[1];
            }
            try {
                const secret = process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium";
                const verified = jwt.verify(token, secret);
                const user = await User.findById(verified.id);
                if (user) {
                    userRole = user.role;
                    resellerTier = user.resellerTier;
                    if (user.role === 'admin') {
                        isAdmin = true;
                    }
                }
            } catch (e) {
                // Token parse failed
            }
        }

        if (isAdmin) {
            return next();
        }

        // Apply targeted rules
        let shouldBlock = false;
        if (target === 'all') {
            shouldBlock = true;
        } else if (target === 'reseller' && userRole === 'reseller_admin') {
            shouldBlock = true;
        } else if (target === 'customer' && userRole === 'user') {
            shouldBlock = true;
        } else if (target === 'premium_reseller' && userRole === 'reseller_admin' && resellerTier === 'premium') {
            shouldBlock = true;
        }

        if (shouldBlock) {
            return res.status(503).json({
                maintenanceMode: true,
                message,
                target
            });
        }

        next();
    } catch (err) {
        next();
    }
};
