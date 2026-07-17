import React from 'react';
import logoDefault from '../assets/9jasub.jpg';

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

  // If no logo but we are in a white-label site, show a 3D Initial Icon
  if (siteInfo) {
    const initial = siteName.charAt(0).toUpperCase();
    return (
      <div 
        className={`${className} generic-3d-logo`} 
        style={{ 
          ...style,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          color: 'white',
          fontWeight: '800',
          fontSize: '22.0px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          boxShadow: '0 10px 20px -5px var(--primary-light), inset 0 2px 4px rgba(255,255,255,0.3)',
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

  // Default Fallback for main site
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
