import User from '../models/User.js';
import Notification from '../models/Notification.js';

export const startResellerMaintenanceWorker = () => {
    console.log("Reseller Maintenance Worker Started 🛠️");
    
    // Run every hour
    setInterval(async () => {
        try {
            const now = new Date();

            // 1. Handle Free Trial Expirations
            const expiredTrials = await User.find({
                role: 'reseller_admin',
                isResellerActivated: false,
                trialEndDate: { $lt: now },
                whiteLabelStatus: 'active'
            });

            for (const user of expiredTrials) {
                user.whiteLabelStatus = 'suspended';
                user.isGracePeriod = true;
                user.gracePeriodEndDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48h grace
                await user.save();
                
                await Notification.create({
                    userId: user._id,
                    title: 'Trial Expired',
                    message: 'Your 7-day free trial has expired. Please pay the ₦5,000 activation fee to keep your website active.',
                    type: 'system'
                });
            }

            // 2. Handle Premium Expirations (Downgrade to Starter)
            const expiredPremium = await User.find({
                role: 'reseller_admin',
                resellerLevel: 'premium',
                subscriptionExpiresAt: { $lt: now }
            });

            for (const user of expiredPremium) {
                user.resellerLevel = 'starter';
                user.premiumSubscriptionType = 'none';
                // Disable premium-only features
                user.features = {
                    ...user.features,
                    custom_domain: false,
                    apk_generation: false,
                    premium_branding: false,
                    premium_analytics: false,
                    dedicated_support: false
                };
                await user.save();

                await Notification.create({
                    userId: user._id,
                    title: 'Premium Subscription Expired',
                    message: 'Your Premium subscription has expired. You have been automatically downgraded to the Starter plan. Your business and customers remain active.',
                    type: 'system'
                });
            }

            // 3. Subscription Reminders (30, 7, 1 days)
            const warningPeriods = [
                { days: 30, message: 'Your Premium subscription expires in 30 days. Renew now for uninterrupted access to custom domains and APK tools.' },
                { days: 7, message: 'Warning: Your Premium subscription expires in 7 days. Your custom domain may pause if not renewed.' },
                { days: 1, message: 'CRITICAL: Your Premium subscription expires tomorrow! Renew now to keep your premium features active.' }
            ];

            for (const period of warningPeriods) {
                const targetDate = new Date(now.getTime() + period.days * 24 * 60 * 60 * 1000);
                const startOfDay = new Date(targetDate.setHours(0,0,0,0));
                const endOfDay = new Date(targetDate.setHours(23,59,59,999));

                const usersToWarn = await User.find({
                    role: 'reseller_admin',
                    resellerLevel: 'premium',
                    subscriptionExpiresAt: { $gte: startOfDay, $lte: endOfDay },
                    // Avoid duplicate notices for the same period
                    $or: [
                        { lastExpiryNoticeSent: { $lt: new Date(now.getTime() - 23 * 60 * 60 * 1000) } },
                        { lastExpiryNoticeSent: { $exists: false } }
                    ]
                });

                for (const user of usersToWarn) {
                    await Notification.create({
                        userId: user._id,
                        title: 'Subscription Renewal Notice',
                        message: period.message,
                        type: 'system'
                    });
                    user.lastExpiryNoticeSent = now;
                    await user.save();
                }
            }

        } catch (err) {
            console.error("Reseller Maintenance Worker Error:", err);
        }
    }, 60 * 60 * 1000); // Hourly check
};
