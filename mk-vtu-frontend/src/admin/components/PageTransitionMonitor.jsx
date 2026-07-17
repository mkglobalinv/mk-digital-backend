import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

const PATH_NAMES = {
    '/admin/dashboard': 'Admin Dashboard',
    '/admin/users/retail': 'Retail User Manager',
    '/admin/users/reseller-customers': 'Customer Manager',
    '/admin/users/developers': 'Developer Manager',
    '/admin/resellers': 'Reseller Accounts',
    '/admin/resellers/wallets': 'Reseller Wallets',
    '/admin/domain-requests': 'Domain Requests',
    '/admin/pricing/retail': 'Retail Pricing',
    '/admin/pricing/vip': 'VIP Pricing',
    '/admin/pricing/basic': 'Basic Pricing',
    '/admin/transactions': 'System Transactions',
    '/admin/services': 'Service Control',
    '/admin/data-categories': 'Data Categories',
    '/admin/data-pricing': 'Data Cost Setup',
    '/admin/tier-margins': 'Reseller Margins',
    '/admin/profit': 'Profit Analytics',
    '/admin/kyc': 'KYC Verification',
    '/admin/withdrawals': 'Wallet Withdrawals',
    '/admin/content': 'Content Manager',
    '/admin/blog': 'Blog Engine',
    '/admin/notifications': 'Notification Center',
    '/admin/international': 'International Topup',
    '/admin/saas-settings': 'SaaS Settings',
    '/admin/deployment': 'Deployment Center',
    '/admin/snapshots': 'Snapshots',
    '/admin/rollback': 'Rollback Matrix',
    '/admin/system-health': 'System Health',
    '/admin/infrastructure': 'Infrastructure',
    '/admin/audit-logs': 'Audit Logs',
    '/admin/maintenance': 'Maintenance Mode',
    '/admin/ai-assistant': 'AI Assistant Control',
    '/admin/provider-monitoring': 'Provider Monitoring',
    '/admin/master-settings': 'Master Admin Settings'
};

const PageTransitionMonitor = () => {
    const location = useLocation();
    const { showToast, updateToast } = useToast();
    const activeToastId = useRef(null);

    useEffect(() => {
        // Skip base path
        if (location.pathname === '/admin' || location.pathname === '/admin/') return;

        const moduleName = PATH_NAMES[location.pathname] || 'Module';
        
        // Use a slight delay to avoid jitter on instant loads, but since we lazy load it's fine
        const startLoading = async () => {
            activeToastId.current = await showToast(`Loading ${moduleName}...`, 'loading');
        };

        startLoading();

        // Simulate the resolve of Suspense or component mount via a microtask delay
        const finishLoading = setTimeout(() => {
            if (activeToastId.current) {
                updateToast(activeToastId.current, {
                    type: 'success',
                    message: `${moduleName} loaded successfully.`,
                    duration: 3000
                });
                activeToastId.current = null;
            }
        }, 600); // 600ms grace period to let Suspense fallback clear and chunk download

        return () => clearTimeout(finishLoading);
    }, [location.pathname, showToast, updateToast]);

    return null;
};

export default PageTransitionMonitor;
