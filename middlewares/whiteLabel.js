import User from '../models/User.js';

// In-memory cache for reseller domain lookups
const resellerCache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute TTL
const NEGATIVE_CACHE_TTL = 10 * 1000; // 10 seconds negative TTL for non-reseller domains

export const clearResellerCache = () => {
    resellerCache.clear();
    console.log("[MemoryProtection] Reseller subdomain cache cleared.");
};

export const whiteLabelMiddleware = async (req, res, next) => {
    const rawHost = req.headers['x-forwarded-host'] || req.headers.host || '';
    const host = rawHost.split(':')[0].toLowerCase();
    
    // 1. Identify System Main Domains
    const mainDomains = [
        'localhost', 
        '127.0.0.1',
        '9jasub.com', 
        'www.9jasub.com', 
        'app.9jasub.com',
        'mk-subdata.com',
        'www.mk-subdata.com'
    ];
    const isMainDomain = mainDomains.includes(host);

    try {
        let reseller = null;

        if (!isMainDomain) {
            const cacheKey = host;
            const cached = resellerCache.get(cacheKey);
            
            if (cached && (Date.now() - cached.cachedAt < cached.ttl)) {
                reseller = cached.reseller;
                console.log(`[WhiteLabel] Domain ${host} resolved from cache.`);
            } else {
                console.log(`[WhiteLabel] Domain ${host} is not a main domain. Checking for reseller...`);
                const sub = host.split('.')[0];
                reseller = await User.findOne({
                    $or: [
                        { subdomain: sub },
                        { customDomain: host },
                        { admin_subdomain: sub }
                    ]
                });
                
                // Cache the result
                resellerCache.set(cacheKey, {
                    reseller,
                    cachedAt: Date.now(),
                    ttl: reseller ? CACHE_TTL : NEGATIVE_CACHE_TTL
                });
            }
            
            if (reseller) {
                const blockedStatuses = ['suspended', 'disabled', 'under_review'];
                if (blockedStatuses.includes(reseller.whiteLabelStatus)) {
                    return res.status(403).send(`
                        <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; justify-content: center;">
                            <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
                                <h1 style="color: #ef4444; font-size: 32px; font-weight: 800; margin-bottom: 16px;">Website Inactive</h1>
                                <p style="color: #64748b; font-size: 18px; line-height: 1.6;">This platform is temporarily inactive. Please contact the site administrator or support for assistance.</p>
                                ${reseller.isGracePeriod ? `<p style="color: #3b82f6; font-weight: bold;">Action Required: Reseller activation fee pending.</p>` : ''}
                                <div style="margin-top: 32px; font-size: 14px; color: #94a3b8;">&copy; ${new Date().getFullYear()} 9JASUB Infrastructure</div>
                            </div>
                        </div>
                    `);
                }

                // Feature Restriction: Custom Domain
                if (reseller.customDomain === host && !reseller.features?.custom_domain) {
                    return res.status(403).send(`
                        <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; justify-content: center;">
                            <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
                                <h1 style="color: #f59e0b; font-size: 32px; font-weight: 800; margin-bottom: 16px;">Upgrade Required</h1>
                                <p style="color: #64748b; font-size: 18px; line-height: 1.6;">Custom domain access is a Premium feature. Please upgrade your subscription to continue using this domain.</p>
                                <div style="margin-top: 32px; font-size: 14px; color: #94a3b8;">&copy; ${new Date().getFullYear()} 9JASUB Infrastructure</div>
                            </div>
                        </div>
                    `);
                }
                req.isResellerDomain = true;
                console.log(`[WhiteLabel] Found active reseller: ${reseller.subdomain} for host ${host}`);
            } else {
                console.log(`[WhiteLabel] Critical: Tenant not found for host ${host}. Rejecting request.`);
                
                if (req.path.startsWith('/api')) {
                    return res.status(404).json({ message: "Website not found." });
                }

                return res.status(404).send(`
                    <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; justify-content: center;">
                        <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
                            <h1 style="color: #ef4444; font-size: 32px; font-weight: 800; margin-bottom: 16px;">Website Not Found</h1>
                            <p style="color: #64748b; font-size: 18px; line-height: 1.6;">This reseller website does not exist.</p>
                            <p style="color: #64748b; font-size: 16px; line-height: 1.6;">Please check the website address or contact the website owner.</p>
                        </div>
                    </div>
                `);
            }
        } else {
            req.isMainDomain = true;
            console.log(`[WhiteLabel] Domain ${host} is a main domain. Tenant: Main.`);
        }

        if (reseller) {
            req.reseller = {
                _id: reseller._id,
                name: reseller.name,
                subdomain: reseller.subdomain,
                customDomain: reseller.customDomain,
                resellerTier: reseller.resellerTier,
                branding: {
                    siteName: reseller.branding?.siteName || reseller.name,
                    logo: reseller.branding?.logo,
                    favicon: reseller.branding?.favicon,
                    primaryColor: reseller.branding?.primaryColor || '#3b82f6',
                    secondaryColor: reseller.branding?.secondaryColor || '#10b981',
                    backgroundColor: reseller.branding?.backgroundColor || '#f8fafc',
                    balanceCardColor: reseller.branding?.balanceCardColor || '#1e293b',
                    contactEmail: reseller.branding?.contactEmail,
                    whatsappNumber: reseller.branding?.whatsappNumber,
                    telegramLink: reseller.branding?.telegramLink,
                    footerText: reseller.branding?.footerText
                },
                maintenanceMode: reseller.maintenanceMode,
                serviceControl: reseller.serviceControl
            };
        }

        // Global Tenant Tracker for Logs
        const tenantTag = req.reseller ? `RESELLER:${req.reseller.subdomain}` : 'MAIN_PLATFORM';
        req.tenantId = req.reseller?._id || 'main';
        console.log(`[QA-Monitor] REQUEST: ${req.method} ${req.path} | TENANT: ${tenantTag}`);

        next();
    } catch (err) {
        console.error("WhiteLabel Middleware Error:", err);
        // CRITICAL FIX: Do not call next() on DB error, this leaks requests to the main platform!
        return res.status(500).json({ message: "Internal server error during routing. Please try again later." });
    }
};

export const restrictToMainDomain = (req, res, next) => {
    if (req.reseller) {
        return res.status(403).json({ 
            message: "This feature is restricted to the main 9JASUB platform." 
        });
    }
    next();
};
