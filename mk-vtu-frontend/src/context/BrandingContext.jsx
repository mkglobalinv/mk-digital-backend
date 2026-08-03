import React, { createContext, useContext } from 'react';

const BrandingContext = createContext(null);

export const BrandingProvider = ({ siteInfo, children }) => {
    return (
        <BrandingContext.Provider value={siteInfo}>
            {children}
        </BrandingContext.Provider>
    );
};

export const useBranding = () => {
    return useContext(BrandingContext) || {};
};
