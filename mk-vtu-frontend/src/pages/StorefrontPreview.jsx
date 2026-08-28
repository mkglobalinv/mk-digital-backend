import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ResellerMarketingHome from './ResellerMarketingHome';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

/**
 * StorefrontPreview — public, unauthenticated route used only by the main
 * marketing site's "See Your Website" demo (embedded via iframe).
 *
 * Renders the real ResellerMarketingHome component — the same component
 * every live reseller storefront uses — fed a temporary, in-memory
 * branding object built from URL query params. No database read/write,
 * no tenant resolution, no reseller account is created or touched.
 */
const StorefrontPreview = () => {
    const [searchParams] = useSearchParams();
    const brand = (searchParams.get('brand') || 'ABC Data').slice(0, 40) || 'ABC Data';
    const color = searchParams.get('color') || '';

    const previewSiteInfo = {
        branding: {
            siteName: brand,
            primaryColor: HEX_COLOR.test(color) ? color : '#10b981',
            logo: null,
            contactEmail: null
        }
    };

    return <ResellerMarketingHome siteInfo={previewSiteInfo} previewMode />;
};

export default StorefrontPreview;
