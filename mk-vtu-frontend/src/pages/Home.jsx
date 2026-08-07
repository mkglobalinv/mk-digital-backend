import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import '../components/fintech/FintechComponents.css';
import { getCleanStatus, getCleanStatusText } from '../utils/statusMapper';
import BrandLogo from '../components/BrandLogo';
import { useTheme } from '../context/ThemeContext';
import { getSiteName, isWhiteLabelSite } from '../utils/whiteLabelHelper';
import { isActiveReseller, isPremiumReseller, checkBannerVisibility } from '../utils/bannerHelper';
import { io } from 'socket.io-client';
import MarketingPopup from '../components/marketing/MarketingPopup';
import BiometricSetupPrompt from '../components/BiometricSetupPrompt';
import CampaignGrid from '../components/marketing/CampaignGrid';
import AnnouncementBanner from '../components/marketing/AnnouncementBanner';
import FuturePlatformViewer from '../components/FuturePlatformViewer';

import FintechHeader from '../components/fintech/FintechHeader';
import PremiumWalletCard from '../components/fintech/PremiumWalletCard';
import QuickServicesGrid from '../components/fintech/QuickServicesGrid';
import IdentityServicesGrid from '../components/fintech/IdentityServicesGrid';
import PromoBanners from '../components/fintech/PromoBanners';
import TransactionHistory from '../components/fintech/TransactionHistory';
import BottomSheet from '../components/fintech/BottomSheet';

const CORE_STATUS_SERVICES = [
  { key: 'mtn', label: 'MTN', matchNames: ['mtn'] },
  { key: 'airtel', label: 'Airtel', matchNames: ['airtel'] },
  { key: 'glo', label: 'GLO', matchNames: ['glo'] },
  { key: '9mobile', label: '9mobile', matchNames: ['9mobile'] },
  { key: 'airtime', label: 'Airtime', matchNames: ['airtime'] },
  { key: 'electricity', label: 'Electricity', matchNames: ['electricity', 'utility'] },
  { key: 'cable', label: 'Cable', matchNames: ['cable', 'dstv', 'gotv'] },
  { key: 'exam', label: 'Exam Pins', matchNames: ['exam', 'pin', 'waec', 'neco', 'jamb'] },
  { key: 'wallet_transfer', label: 'Wallet/Transfer systems', matchNames: ['wallet', 'transfer', 'funding'] }
];

const Home = ({ token, user, refreshUser, siteInfo }) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [banners, setBanners] = useState([]);
  const [marquee, setMarquee] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [serviceStatuses, setServiceStatuses] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [referralAnalytics, setReferralAnalytics] = useState(null);
  const [futurePlatforms, setFuturePlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [isLoadingTx, setIsLoadingTx] = useState(true);
  
  const [showResellerPromo, setShowResellerPromo] = useState(false);
  const [promoClosedManually, setPromoClosedManually] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Dynamic time-based greeting system
  const [greeting, setGreeting] = useState(() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning ☀️";
    if (hr < 17) return "Good Afternoon 🌤️";
    return "Good Evening 🌙";
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const hr = new Date().getHours();
      let current = "Good Evening 🌙";
      if (hr < 12) current = "Good Morning ☀️";
      else if (hr < 17) current = "Good Afternoon 🌤️";
      setGreeting(current);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initial Data Fetch & WebSocket Live Updates
  useEffect(() => {
    const fetchDashboardData = () => {
      if (token) {
         setIsLoadingTx(true);
         API.get('/api/transactions', { headers: { Authorization: token } })
           .then(res => {
              if (res.data && Array.isArray(res.data)) setTransactions(res.data);
              setIsLoadingTx(false);
           }).catch(err => {
              console.error(err);
              setIsLoadingTx(false);
           });

         API.get('/api/notifications/unread-count', { headers: { Authorization: token } })
           .then(res => {
              if (res.data) setUnreadCount(res.data.count);
           }).catch(() => {});

         API.get('/api/user/referral-analytics', { headers: { Authorization: token } })
           .then(res => {
              if (res.data && res.data.status === 'success') {
                  setReferralAnalytics(res.data.data);
              }
           }).catch(() => {});
           
         // If a refresh is triggered via WebSocket, fetch latest user balance
         if (refreshUser && typeof refreshUser === 'function') {
            refreshUser();
         }
      }
    };

    fetchDashboardData();

    // Listen to real-time wallet sync events from the global App socket
    const handleWalletEvent = () => fetchDashboardData();
    window.addEventListener('wallet:refresh', handleWalletEvent);
    window.addEventListener('wallet:funded', handleWalletEvent);

    return () => {
      window.removeEventListener('wallet:refresh', handleWalletEvent);
      window.removeEventListener('wallet:funded', handleWalletEvent);
    };
  }, [token, refreshUser]);

  // Dynamic Mini Activity Summary metrics helper
  const getMiniSummaryMetrics = () => {
    const today = new Date().toDateString();
    const successfulTodayCount = transactions.filter(tx => 
      tx.status === 'success' && new Date(tx.createdAt).toDateString() === today
    ).length;

    const recentlyFundedStatus = transactions.some(tx => 
      tx.type === 'credit' && tx.status === 'success' && 
      (Date.now() - new Date(tx.createdAt).getTime()) < 24 * 60 * 60 * 1000
    );

    return { successfulTodayCount, recentlyFundedStatus };
  };
  const { successfulTodayCount, recentlyFundedStatus } = getMiniSummaryMetrics();

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);

  return (
    <div className="fintech-dashboard-wrapper">
      <MarketingPopup user={user} />
      <BiometricSetupPrompt user={user} />

      <div className="fintech-glow glow-top-right"></div>
      <div className="fintech-glow glow-bottom-left"></div>

      <div className="fintech-content-area animate-fade-in">
        <FintechHeader user={user} greeting={greeting} unreadCount={unreadCount} />

        {user && user.isEmailVerified === false && (
           <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '12px', color: '#ef4444', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span>Verify email to secure your account.</span>
              <button onClick={() => navigate('/verify-email', { state: { email: user.email } })} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '10px' }}>Verify</button>
           </div>
        )}

        <PremiumWalletCard 
          user={user} 
          recentlyFundedStatus={recentlyFundedStatus} 
          setShowMoreMenu={setShowMoreMenu} 
        />

        <QuickServicesGrid 
          showAllServices={showAllServices} 
          setShowAllServices={setShowAllServices} 
        />

        <PromoBanners 
          user={user}
          referralAnalytics={referralAnalytics} 
          siteInfo={siteInfo} 
        />

        <IdentityServicesGrid />

        <TransactionHistory 
          transactions={transactions} 
          isLoading={isLoadingTx} 
        />
      </div>

      <BottomSheet 
        show={showMoreMenu} 
        onClose={() => setShowMoreMenu(false)} 
        user={user} 
      />
    </div>
  );
};

export default Home;
