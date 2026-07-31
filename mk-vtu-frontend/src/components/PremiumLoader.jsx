import React from 'react';
import './PremiumLoader.css';
import BrandLogo from './BrandLogo';

const PremiumLoader = ({ siteInfo, message = "Processing..." }) => {
  return (
    <div className="premium-loader-overlay">
      <div className="premium-loader-content">
        <div className="loader-logo-container">
          <BrandLogo siteInfo={siteInfo} className="loader-logo" />
        </div>
        <div className="loader-message">{message}</div>
      </div>
    </div>
  );
};

export default PremiumLoader;
