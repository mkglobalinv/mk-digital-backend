import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, CheckCircle2, Wallet2, ChevronRight } from 'lucide-react';
import API from '../api';
import '../components/fintech/FintechComponents.css';
import BiometricSetupPrompt from '../components/BiometricSetupPrompt';

import FintechHeader from '../components/fintech/FintechHeader';
import PremiumWalletCard from '../components/fintech/PremiumWalletCard';
import QuickServicesGrid from '../components/fintech/QuickServicesGrid';
import IdentityServicesGrid from '../components/fintech/IdentityServicesGrid';
import PromoBanners from '../components/fintech/PromoBanners';
import TransactionHistory from '../components/fintech/TransactionHistory';
import BottomSheet from '../components/fintech/BottomSheet';
import AnnouncementBanner from '../components/marketing/AnnouncementBanner';

// Distinct landing page for the Merchant program: same underlying purchase
// features every customer uses (QuickServicesGrid, wallet, transactions --
// see Home.jsx), framed with merchant-specific status up top instead of the
// generic KYC pill, so a merchant immediately sees their activation state
// and Basic Reseller pricing badge rather than a plain retail dashboard.
const MerchantDashboard = ({ token, user, refreshUser, siteInfo, logout }) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTx, setIsLoadingTx] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [referralAnalytics, setReferralAnalytics] = useState(null);
  const [merchantStatus, setMerchantStatus] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const [greeting] = useState(() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning ☀️";
    if (hr < 17) return "Good Afternoon 🌤️";
    return "Good Evening 🌙";
  });

  useEffect(() => {
    const fetchDashboardData = () => {
      if (!token) return;
      setIsLoadingTx(true);
      API.get('/api/transactions', { headers: { Authorization: token } })
        .then(res => { if (Array.isArray(res.data)) setTransactions(res.data); })
        .finally(() => setIsLoadingTx(false));

      API.get('/api/notifications/unread-count', { headers: { Authorization: token } })
        .then(res => { if (res.data) setUnreadCount(res.data.count); })
        .catch(() => {});

      API.get('/api/user/referral-analytics', { headers: { Authorization: token } })
        .then(res => { if (res.data?.status === 'success') setReferralAnalytics(res.data.data); })
        .catch(() => {});

      API.get('/api/merchant/status')
        .then(res => setMerchantStatus(res.data))
        .catch(() => {});

      if (typeof refreshUser === 'function') refreshUser();
    };

    fetchDashboardData();

    const handleWalletEvent = () => fetchDashboardData();
    window.addEventListener('wallet:refresh', handleWalletEvent);
    window.addEventListener('wallet:funded', handleWalletEvent);
    return () => {
      window.removeEventListener('wallet:refresh', handleWalletEvent);
      window.removeEventListener('wallet:funded', handleWalletEvent);
    };
  }, [token, refreshUser]);

  const getRecentlyFundedStatus = () => transactions.some(tx =>
    tx.type === 'credit' && tx.status === 'success' &&
    (Date.now() - new Date(tx.createdAt).getTime()) < 24 * 60 * 60 * 1000
  );
  const recentlyFundedStatus = getRecentlyFundedStatus();

  const isActivated = Boolean(merchantStatus?.isActivated);
  const minAmount = merchantStatus?.minActivationAmount || 2000;

  return (
    <div className="fintech-dashboard-wrapper">
      <BiometricSetupPrompt user={user} />

      <div className="fintech-glow glow-top-right"></div>
      <div className="fintech-glow glow-bottom-left"></div>

      <div className="fintech-content-area animate-fade-in">
        <FintechHeader user={user} greeting={greeting} unreadCount={unreadCount} isMerchant />

        <AnnouncementBanner />

        {user && user.isEmailVerified === false && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '12px', color: '#ef4444', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span>Verify email to secure your account.</span>
            <button onClick={() => navigate('/verify-email', { state: { email: user.email } })} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '10px' }}>Verify</button>
          </div>
        )}

        {/* Merchant status card -- the one thing that makes this a distinct
            dashboard rather than a copy of Home: activation state and the
            Basic Reseller pricing badge, front and center. */}
        <div
          onClick={() => navigate('/merchant/onboarding')}
          role="button"
          tabIndex={0}
          style={{
            background: isActivated ? 'var(--success-light)' : 'var(--primary-light)',
            border: `1px solid ${isActivated ? 'var(--success)' : 'var(--primary)'}`,
            borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'
          }}
        >
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
            background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isActivated ? 'var(--success)' : 'var(--primary)'
          }}>
            {isActivated ? <CheckCircle2 size={22} /> : <Store size={22} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '14px', color: isActivated ? 'var(--success)' : 'var(--primary)' }}>
              {isActivated ? 'Merchant Pricing Active' : 'Merchant Account'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>
              {isActivated
                ? 'Every purchase uses Basic Reseller pricing'
                : `Fund ₦${minAmount.toLocaleString()}+ to unlock Basic Reseller pricing`}
            </div>
          </div>
          {!isActivated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
              <Wallet2 size={14} />
              <span>Fund</span>
            </div>
          )}
          <ChevronRight size={16} color="var(--text-gray)" style={{ flexShrink: 0 }} />
        </div>

        <PremiumWalletCard
          user={user}
          recentlyFundedStatus={recentlyFundedStatus}
          setShowMoreMenu={setShowMoreMenu}
          isMerchant
        />

        <div className="services-card">
          <QuickServicesGrid isMerchant />
          <div className="services-divider" />
          <IdentityServicesGrid isMerchant />
        </div>

        <PromoBanners user={user} referralAnalytics={referralAnalytics} siteInfo={siteInfo} isMerchant />

        <TransactionHistory transactions={transactions} isLoading={isLoadingTx} isMerchant />
      </div>

      <BottomSheet show={showMoreMenu} onClose={() => setShowMoreMenu(false)} user={user} logout={logout} isMerchant />
    </div>
  );
};

export default MerchantDashboard;
