import React, { useState, useEffect } from 'react';
import ResellerSidebar from './ResellerSidebar';
import ResellerHeader from './ResellerHeader';
import { ToastProvider } from './ResellerToast';
import '../pages/ResellerDashboard.css';

const ResellerLayout = ({ children, user, logout, siteInfo }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Apply global brand colors
    useEffect(() => {
        if (user?.branding?.primaryColor) {
            document.documentElement.style.setProperty('--reseller-primary', user.branding.primaryColor);
            document.documentElement.style.setProperty('--reseller-secondary', user.branding.secondaryColor || '#4f46e5');
        } else {
            // Default fallback
            document.documentElement.style.setProperty('--reseller-primary', '#6366f1');
            document.documentElement.style.setProperty('--reseller-secondary', '#4f46e5');
        }
    }, [user?.branding?.primaryColor, user?.branding?.secondaryColor]);

    return (
        <ToastProvider>
            <div className="reseller-layout">
                <ResellerSidebar 
                    user={user} 
                    logout={logout} 
                    isOpen={sidebarOpen} 
                    onClose={() => setSidebarOpen(false)} 
                />
                
                {sidebarOpen && (
                    <div className="res-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
                )}

                <main className="reseller-main">
                    <ResellerHeader 
                        user={user} 
                        siteInfo={siteInfo} 
                        onToggleSidebar={() => setSidebarOpen(true)} 
                    />
                    <div className="reseller-dashboard-content">
                        {children}
                    </div>
                </main>
            </div>
        </ToastProvider>
    );
};

export default ResellerLayout;
