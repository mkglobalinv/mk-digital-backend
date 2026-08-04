import React from 'react';
import { Navigate } from 'react-router-dom';

const PremiumGuard = ({ user, children }) => {
    const isPremium = user?.resellerTier === 'premium' || user?.resellerTier === 'vip' || user?.canOverridePricing;
    
    if (!isPremium) {
        return <Navigate 
            to="/website/premium" 
            state={{ error: "This feature requires an active Website Hosting & Maintenance Fee. Please activate to continue." }} 
            replace 
        />;
    }

    return children;
};

export default PremiumGuard;
