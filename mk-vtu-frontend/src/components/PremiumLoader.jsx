import React from 'react';
import './PremiumLoader.css';
import logoDefault from '../assets/9jasub.jpg';

const PremiumLoader = ({ siteInfo, message = "Processing..." }) => {
  const displayLogo = siteInfo?.branding?.logo || siteInfo?.logo || logoDefault;

  return (
    <div className="premium-loader-overlay">
      <div className="premium-loader-content">
        <div className="loader-logo-container">
          <img 
            src={displayLogo} 
            alt="Logo" 
            className="loader-logo" 
            fetchPriority="high" 
            loading="eager" 
            decoding="async"
          />
        </div>
        <div className="loader-message">{message}</div>
      </div>
    </div>
  );
};

export default PremiumLoader;
