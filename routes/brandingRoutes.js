import express from 'express';
import ResellerUser from '../models/User.js'; // Resellers are usually in the User model with role='reseller_admin' or similar, or maybe site resolution is done differently.
import CustomDomainRequest from '../models/CustomDomainRequest.js';

const router = express.Router();

// Helper to resolve the reseller based on the host header
export const resolveReseller = async (req) => {
    try {
        const host = req.headers.host || '';
        const cleanHost = host.split(':')[0].toLowerCase();
        
        // Exclude platform domains
        const platformDomains = ['localhost', '127.0.0.1', '9jasub.com', 'www.9jasub.com', 'app.9jasub.com', 'mk-subdata.com', 'www.mk-subdata.com'];
        if (platformDomains.includes(cleanHost)) return null;

        // Check if it's a subdomain (e.g., reseller.9jasub.com)
        if (cleanHost.endsWith('.9jasub.com') || cleanHost.endsWith('.mk-subdata.com')) {
            const subdomain = cleanHost.split('.')[0];
            const reseller = await ResellerUser.findOne({ 'resellerUrl': subdomain }).lean();
            if (reseller) return reseller;
        }

        // Check Custom Domain
        const customDomain = await CustomDomainRequest.findOne({ 
            domainName: cleanHost, 
            status: 'Connected Successfully' 
        }).populate('resellerId').lean();
        
        if (customDomain && customDomain.resellerId) {
            return customDomain.resellerId;
        }

        // Fallback: check customDomain directly on User
        const directUser = await ResellerUser.findOne({ customDomain: cleanHost }).lean();
        return directUser;

    } catch (e) {
        console.error("Branding Route Resolution Error:", e);
        return null;
    }
};

// Dynamic Manifest
router.get('/manifest.json', async (req, res) => {
    const reseller = await resolveReseller(req);
    const branding = reseller?.branding || {};
    const appSettings = reseller?.appSettings || {};

    const siteName = branding.siteName || '9JASUB Premium VTU';
    const primaryColor = branding.primaryColor || '#3B82F6';
    const logoUrl = branding.logo || '/logo.png'; // Fallback to platform logo
    const resellerId = reseller?._id ? String(reseller._id) : 'platform';

    const screenshots = (appSettings.generatedAssets?.screenshots && Array.isArray(appSettings.generatedAssets.screenshots) && appSettings.generatedAssets.screenshots.length > 0)
        ? appSettings.generatedAssets.screenshots.map(ss => ({
            "src": ss,
            "sizes": "1080x1920",
            "type": "image/jpeg",
            "form_factor": "narrow"
        }))
        : [];

    const manifest = {
        "id": `/?reseller=${resellerId}`,
        "name": siteName,
        "short_name": siteName,
        "description": `Welcome to ${siteName} - The best platform for VTU and Data services.`,
        "start_url": "/",
        "display": "standalone",
        "display_override": ["standalone", "minimal-ui", "window-controls-overlay"],
        "background_color": "#ffffff",
        "theme_color": primaryColor,
        "categories": ["finance", "business", "utilities"],
        "icons": [
            {
                "src": logoUrl,
                "sizes": "72x72 96x96 128x128 144x144 152x152 192x192 384x384 512x512",
                "type": "image/png",
                "purpose": "any"
            },
            {
                "src": logoUrl,
                "sizes": "72x72 96x96 128x128 144x144 152x152 192x192 384x384 512x512",
                "type": "image/png",
                "purpose": "maskable"
            }
        ],
        "shortcuts": [
            {
                "name": "Buy Data",
                "short_name": "Data",
                "description": "Purchase affordable data",
                "url": "/purchase",
                "icons": [{ "src": logoUrl, "sizes": "192x192", "type": "image/png" }]
            },
            {
                "name": "Fund Wallet",
                "short_name": "Wallet",
                "description": "Fund your account",
                "url": "/wallet",
                "icons": [{ "src": logoUrl, "sizes": "192x192", "type": "image/png" }]
            }
        ]
    };
    
    if (screenshots.length > 0) {
        manifest.screenshots = screenshots;
    }
    
    // Cache for 10 minutes to respect cache protection requirement but allow changes
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.json(manifest);
});

// Dynamic Favicon redirect/stream (we redirect to the actual logo URL if available)
router.get('/favicon.ico', async (req, res, next) => {
    const reseller = await resolveReseller(req);
    if (reseller && reseller.branding && reseller.branding.logo) {
        res.setHeader('Cache-Control', 'public, max-age=600');
        return res.redirect(reseller.branding.logo);
    }
    next(); // Fallback to express.static serving the default favicon
});

router.get('/favicon.svg', async (req, res, next) => {
    const reseller = await resolveReseller(req);
    if (reseller && reseller.branding && reseller.branding.logo) {
        res.setHeader('Cache-Control', 'public, max-age=600');
        return res.redirect(reseller.branding.logo);
    }
    next();
});

// Dynamic Apple Touch Icon
router.get('/apple-touch-icon.png', async (req, res, next) => {
    const reseller = await resolveReseller(req);
    if (reseller && reseller.branding && reseller.branding.logo) {
        res.setHeader('Cache-Control', 'public, max-age=600');
        return res.redirect(reseller.branding.logo);
    }
    next();
});

export default router;
