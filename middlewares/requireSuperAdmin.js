import { OWNER_EMAIL } from "./requireOwner.js";

// Global system credentials: super admin accounts and the platform owner only.
// Must run after adminAuth (which also admits admin and reseller_admin roles).
export const requireSuperAdmin = (req, res, next) => {
    const user = req.user;
    const allowed = user && !user.isSuspended && (user.role === "superadmin" || user.email === OWNER_EMAIL);
    if (allowed) return next();
    console.warn(`[Security] Denied system settings access to ${user?.email || "unknown"} (${user?.role || "no role"}) for ${req.originalUrl}`);
    return res.status(403).json({ message: "Access denied. Super Admin privileges required." });
};
