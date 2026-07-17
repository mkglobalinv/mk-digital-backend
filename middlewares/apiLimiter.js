import User from '../models/User.js';

/**
 * Subscription Limiter (Refactored for Free API Access)
 * All users get high-capacity API access for free.
 */
export const subscriptionLimiter = async (req, res, next) => {
    if (req.isSandbox) return next(); 

    const user = req.user;
    
    // Developer Friendly: 50,000 requests per day for everyone for free
    const DEFAULT_LIMIT = 50000;
    
    // Future Premium Support (Currently unused but structured)
    const limits = {
        'default': DEFAULT_LIMIT,
        'enterprise': 1000000 
    };

    const limit = limits['default'];

    const now = new Date();
    const lastCall = user.lastApiCall ? new Date(user.lastApiCall) : null;
    
    if (!lastCall || lastCall.getDate() !== now.getDate() || lastCall.getMonth() !== now.getMonth()) {
        user.apiCallCount = 0;
    }

    if (user.apiCallCount >= limit) {
        return res.status(429).json({
            status: 'error',
            message: `API Daily Limit Reached (${limit} requests/day). Contact support for enterprise increase.`
        });
    }

    user.apiCallCount += 1;
    user.lastApiCall = now;
    await user.save();

    next();
};
