export const OWNER_EMAIL = 'unuktar1@gmail.com';

export const requireOwner = (req, res, next) => {
    if (req.user && req.user.email === OWNER_EMAIL) {
        return next();
    }
    console.warn(`[Security] Denied owner-only access to ${req.user?.email} for route ${req.originalUrl}`);
    return res.status(403).json({ message: "Access Denied: Owner Privileges Required." });
};
