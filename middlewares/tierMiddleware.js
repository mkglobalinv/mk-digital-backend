export const restrictToPremium = (req, res, next) => {
    if (req.user.role !== 'reseller_admin' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Reseller access required." });
    }

    if (req.user.role === 'admin') return next();

    if (req.user.resellerTier !== 'premium') {
        return res.status(403).json({ 
            message: "Premium Feature Required", 
            upgradeRequired: true,
            tier: req.user.resellerTier
        });
    }

    next();
};

export const restrictToBasicOrPremium = (req, res, next) => {
    if (req.user.role !== 'reseller_admin' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Reseller access required." });
    }
    next();
};
