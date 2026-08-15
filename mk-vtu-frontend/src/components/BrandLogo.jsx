import React from 'react';
import logoDefault from '../assets/9jasub.jpg';
import { isWhiteLabelSite } from '../utils/whiteLabelHelper';

const BrandLogo = ({ siteInfo, className = "header-logo-img", style = {} }) => {
  const logo = siteInfo?.branding?.logo || siteInfo?.logo;
  const siteName = siteInfo?.branding?.siteName || siteInfo?.name || "P";
  
  // If we have a custom logo, show it
  if (logo) {
    return (
      <img 
        src={logo} 
        alt={siteName} 
        className={className} 
        style={style} 
      />
    );
  }

  const isBusinessContext = typeof window !== 'undefined' && (
    localStorage.getItem('userType') === 'business' || 
    window.location.pathname.startsWith('/business') || 
    window.location.pathname.startsWith('/reseller') || 
    window.location.pathname.startsWith('/website')
  );

  // If no logo but we are in a white-label site, or a business admin context
  if (siteInfo || isWhiteLabelSite(siteInfo) || isBusinessContext) {
    const initial = siteInfo && siteInfo.name ? siteName.charAt(0).toUpperCase() : (isBusinessContext ? 'W' : 'V');
    return (
      <div 
        className={`${className} generic-3d-logo`} 
        style={{ 
          ...style,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'linear-gradient(135deg, var(--primary, #3b82f6) 0%, var(--secondary, #10b981) 100%)',
          color: 'white',
          fontWeight: '800',
          fontSize: '22.0px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
          transform: 'perspective(500px) rotateY(-10deg) rotateX(10deg)',
          borderRadius: '12px',
          width: style.width || '38px',
          height: style.height || '38px'
        }}
      >
        {initial}
      </div>
    );
  }

  // Fallback to 9JASUB if it's explicitly the main platform
  return (
    <img 
      src={logoDefault} 
      alt="9JASUB" 
      className={className} 
      style={style} 
    />
  );
};

export default BrandLogo;
