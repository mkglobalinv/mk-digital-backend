import React from 'react';
import './PremiumLoader.css';
import BrandLogo from './BrandLogo';

const PremiumLoader = ({ siteInfo, message = "Processing..." }) => {
  const isBusinessContext = typeof window !== 'undefined' && (
    localStorage.getItem('userType') === 'business' || 
    window.location.pathname.startsWith('/business') || 
    window.location.pathname.startsWith('/reseller') || 
    window.location.pathname.startsWith('/website')
  );

  const displayMessage = message === "Processing..." && isBusinessContext 
    ? "Loading Workspace..." 
    : message;

  return (
    <div className="premium-loader-overlay">
      <div className="premium-loader-content">
        <div className="loader-logo-container">
          <BrandLogo siteInfo={siteInfo} className="loader-logo" />
        </div>
        <div className="loader-message">{displayMessage}</div>
      </div>
    </div>
  );
};

export default PremiumLoader;
