/**
 * White-Label Compliance Helper
 * Utilities to ensure reseller websites remain completely isolated from platform marketing.
 */

/**
 * Returns true if the current site is a reseller (white-label) site.
 * Used to hide platform-specific features like website creation, platform referrals, etc.
 */
export const isWhiteLabelSite = (siteInfo) => {
    if (siteInfo) return true;
    
    // Synchronous fallback to prevent UI flashes during initial load
    if (typeof window !== 'undefined') {
        const host = window.location.host;
        const mainDomains = [
            'localhost:5173', 'localhost:5000', 
            '127.0.0.1:5173', '127.0.0.1:5000',
            'localhost:3000', '127.0.0.1:3000',
            '9jasub.com', 'www.9jasub.com', 'app.9jasub.com',
            'mk-subdata.com', 'www.mk-subdata.com'
        ];
        return !mainDomains.includes(host);
    }
    return false;
};

/**
 * Returns true if the current site is the main 9JASUB platform.
 * Used to conditionally render "Become a Reseller", "Free Trial", and other platform-only marketing.
 */
export const isPlatformSite = (siteInfo) => {
    return !isWhiteLabelSite(siteInfo);
};

/**
 * Returns the correct site name based on context.
 * Useful for replacing hardcoded "9JASUB" strings.
 */
export const getSiteName = (siteInfo) => {
    return siteInfo?.branding?.siteName || siteInfo?.name || '9JASUB';
};

/**
 * Returns the appropriate contact email.
 */
export const getSiteSupportEmail = (siteInfo) => {
    return siteInfo?.branding?.contactEmail || 'support@9jasub.com';
};
