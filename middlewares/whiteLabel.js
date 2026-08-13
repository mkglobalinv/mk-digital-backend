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
    const xForwardedHost = req.headers['x-forwarded-host'];
    const xForwardedProto = req.headers['x-forwarded-proto'];
    const rawHost = xForwardedHost ? xForwardedHost.split(',')[0].trim() : (req.headers.host || '');
    const host = rawHost.split(':')[0].toLowerCase();
    const cleanHost = host.replace(/^www\./, '');
    
    // 1. Identify System Main Domains and Preview Domains
    const envMarketingDomains = process.env.MARKETING_DOMAINS 
        ? process.env.MARKETING_DOMAINS.split(',').map(d => d.trim().toLowerCase()) 
        : ['9jasub.com', 'www.9jasub.com', 'app.9jasub.com'];
        
    const mainDomains = [
        'localhost', 
        '127.0.0.1',
        'mk-subdata.com',
        'www.mk-subdata.com',
        ...envMarketingDomains
    ];

    const previewSuffix = process.env.PREVIEW_DOMAIN_SUFFIX || '.up.railway.app';
    const isPreview = host.endsWith(previewSuffix) || cleanHost.endsWith(previewSuffix);

    const isMainDomain = mainDomains.includes(host) || mainDomains.includes(cleanHost) || isPreview;

    console.log(`[WhiteLabel Diagnostic] req.headers.host: "${req.headers.host}" | x-forwarded-host: "${xForwardedHost}" | x-forwarded-proto: "${xForwardedProto}" | rawHost: "${rawHost}" | host: "${host}" | cleanHost: "${cleanHost}" | isMainDomain: ${isMainDomain}`);

    try {
        let reseller = null;

        if (!isMainDomain) {
            const cacheKey = cleanHost;
            const cached = resellerCache.get(cacheKey);
            
            if (cached && (Date.now() - cached.cachedAt < cached.ttl)) {
                reseller = cached.reseller;
                console.log(`[WhiteLabel] Domain ${host} (cleanHost: ${cleanHost}) resolved from cache. Reseller: ${reseller ? reseller.subdomain : 'NONE'}`);
            } else {
                console.log(`[WhiteLabel] Domain ${host} (cleanHost: ${cleanHost}) is not a main domain. Checking for reseller...`);
                const sub = cleanHost.split('.')[0];
                reseller = await User.findOne({
                    $or: [
                        { customDomain: cleanHost },
                        { customDomain: host },
                        { subdomain: sub },
                        { admin_subdomain: sub }
                    ]
                });
                
                console.log(`[WhiteLabel Diagnostic] Reseller Lookup Result for ${host} / ${cleanHost}: ${reseller ? `FOUND (id: ${reseller._id}, subdomain: ${reseller.subdomain}, customDomain: ${reseller.customDomain}, status: ${reseller.whiteLabelStatus})` : 'NOT FOUND'}`);

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
                const isCustomDomainMatch = reseller.customDomain === cleanHost || reseller.customDomain === host;
                const hasCustomDomainPermission = reseller.features?.custom_domain || isCustomDomainMatch || reseller.resellerTier === 'premium' || reseller.resellerTier === 'vip' || reseller.role === 'admin' || reseller.role === 'superadmin';

                if (isCustomDomainMatch && !hasCustomDomainPermission) {
                    console.log(`[WhiteLabel] Domain ${host} blocked by Custom Domain feature restriction.`);
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
                console.log(`[WhiteLabel] Found active reseller: ${reseller.subdomain} for host ${host} (cleanHost: ${cleanHost})`);
            } else {
                console.log(`[WhiteLabel] Critical: Tenant not found for host ${host} (cleanHost: ${cleanHost}). Rejecting request.`);
                
                const apiRoutes = ['/api', '/auth', '/user', '/buy-', '/webhook', '/reseller-assets', '/socket.io'];
                if (apiRoutes.some(route => req.path.startsWith(route)) || req.xhr || req.headers.accept?.includes('application/json')) {
                    return res.status(404).json({ status: "error", message: "Tenant website not found or inactive." });
                }

                return res.status(404).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tenant Not Found | 9JASUB</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; margin: 0; padding: 0; display: flex; flex-direction: column; min-height: 100vh; align-items: center; justify-content: center; }
        .container { max-width: 500px; width: 90%; background: white; padding: 48px 40px; border-radius: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); text-align: center; border-top: 6px solid #3b82f6; }
        .icon { width: 80px; height: 80px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .icon svg { width: 40px; height: 40px; color: #3b82f6; }
        h1 { color: #0f172a; font-size: 28px; font-weight: 800; margin: 0 0 12px; letter-spacing: -0.025em; }
        p { color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 24px; }
        .btn { display: inline-flex; align-items: center; justify-content: center; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; transition: background 0.2s; }
        .btn:hover { background: #2563eb; }
        .footer { margin-top: 32px; font-size: 13px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 10h.01M15 10h.01M9.5 15h5" />
            </svg>
        </div>
        <h1>Website Not Found</h1>
        <p>The requested tenant portal could not be found. Please verify the web address or contact the platform administrator.</p>
        <a href="https://9jasub.com" class="btn">Go to 9JASUB Home</a>
        <div class="footer">&copy; ${new Date().getFullYear()} 9JASUB Infrastructure</div>
    </div>
</body>
</html>
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
                    siteName: reseller.branding?.siteName || reseller.onboardingData?.brandName || reseller.onboardingData?.businessName || reseller.name,
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
                serviceControl: reseller.serviceControl,
                activatedManualServices: reseller.activatedManualServices || []
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
