import React, { useState, useEffect, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import PremiumGuard from "./components/PremiumGuard";

const ResellerRedirect = () => {
    const location = useLocation();
    return <Navigate to={location.pathname.replace('/reseller', '/website')} replace />;
};
import ForgotPin from "./pages/ForgotPin";
import VerifyEmail from "./pages/VerifyEmail";
import Home from "./pages/Home";
import Marketplace from "./pages/Marketplace";
import AppViewer from "./pages/AppViewer";
import Wallet from "./pages/Wallet";
import AppDownload from "./pages/AppDownload";
import Services from "./pages/Services";
import Support from "./pages/Support";
import Purchase from "./pages/Purchase";
import Profile from "./pages/Profile";
import KYC from "./pages/KYC";
import ContinueSignup from "./pages/ContinueSignup";
import Transactions from "./pages/Transactions";
import Notifications from "./pages/Notifications";
import Onboarding from "./pages/Onboarding";
import OfflineData from "./pages/OfflineData";
import ResellerOnboarding from "./pages/ResellerOnboarding";
import DeveloperApi from "./pages/DeveloperApi";

import IdentityPurchase from "./pages/identity/IdentityPurchase";
import ReferralCenter from "./pages/ReferralCenter";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/fintech/FloatingBottomNav";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { BrandingProvider } from "./context/BrandingContext";
import API from "./api";
import { Loader2, ShieldAlert, Fingerprint, Lock, PlusCircle, Globe, MessageCircle } from "lucide-react";
import { isBiometricAvailable, authenticateBiometric } from "./services/biometricService";
import { dataPlanCache } from "./services/dataPlanCache";
import { isWhiteLabelSite } from './utils/whiteLabelHelper';
import AdminLogin from "./admin/pages/AdminLogin";
import AdminLayout from "./admin/components/AdminLayout";
import BusinessLogin from "./reseller/pages/BusinessLogin";
import ResellerMarketingHome from "./pages/ResellerMarketingHome";
import BusinessSignup from "./reseller/pages/BusinessSignup";
import ResellerLayout from "./reseller/components/ResellerLayout";
import { io } from "socket.io-client";
import AdminErrorBoundary from "./admin/components/AdminErrorBoundary";
import { supabase } from "./supabaseClient";


const lazyWithRetry = (componentImport) =>
  React.lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        return window.location.reload();
      }
      throw error;
    }
  });

const AdminDashboard = lazyWithRetry(() => import("./admin/pages/AdminDashboard"));
const UserManager = lazyWithRetry(() => import("./admin/pages/UserManager"));
const BannerManager = lazyWithRetry(() => import("./admin/pages/BannerManager"));
const ServiceManager = lazyWithRetry(() => import("./admin/pages/ServiceManager"));
const DataCategoryRouteWrapper = lazyWithRetry(() => import("./admin/pages/DataCategoryRouteWrapper"));
const ProfitAnalytics = lazyWithRetry(() => import("./admin/pages/ProfitAnalytics"));
const AdminLogs = lazyWithRetry(() => import("./admin/pages/AdminLogs"));
const NotificationCenter = lazyWithRetry(() => import("./admin/pages/NotificationCenter"));
const ContentManager = lazyWithRetry(() => import("./admin/pages/ContentManager"));
const BlogManager = lazyWithRetry(() => import("./admin/pages/BlogManager"));
const WithdrawalManager = lazyWithRetry(() => import("./admin/pages/WithdrawalManager"));
const AdminTransactions = lazyWithRetry(() => import("./admin/pages/AdminTransactions"));
const KYCManager = lazyWithRetry(() => import("./admin/pages/KYCManager"));
const InternationalAnalytics = lazyWithRetry(() => import("./admin/pages/InternationalAnalytics"));
const AdminSettings = lazyWithRetry(() => import("./admin/pages/AdminSettings"));
const DataPlanPricing = lazyWithRetry(() => import("./admin/pages/DataPlanPricing"));
const PricingRules = lazyWithRetry(() => import("./admin/pages/PricingRules"));
const TierMargins = lazyWithRetry(() => import("./admin/pages/TierMargins"));
const ResellerManager = lazyWithRetry(() => import("./admin/pages/ResellerManager"));
const ResellerWalletManager = lazyWithRetry(() => import("./admin/pages/ResellerWalletManager"));
const CentralPricingManager = lazyWithRetry(() => import("./admin/pages/CentralPricingManager"));
const SaaSSettings = lazyWithRetry(() => import("./admin/pages/SaaSSettings"));
const MonitoringDashboard = lazyWithRetry(() => import("./admin/pages/MonitoringDashboard"));
const OperationsCenter = lazyWithRetry(() => import("./admin/pages/OperationsCenter"));
const AIAssistantControl = lazyWithRetry(() => import("./admin/pages/AIAssistantControl"));
const ReconciliationPanel = lazyWithRetry(() => import("./admin/pages/ReconciliationPanel"));
const AdminAppRequests = lazyWithRetry(() => import("./admin/pages/AdminAppRequests"));
const AdminDomainRequests = lazyWithRetry(() => import("./admin/pages/AdminDomainRequests"));
const PromoCampaignManager = lazyWithRetry(() => import("./admin/pages/PromoCampaignManager"));
const PromotionGridManager = lazyWithRetry(() => import("./admin/pages/PromotionGridManager"));
const UserAudit = lazyWithRetry(() => import("./admin/pages/UserAudit"));
const AdminReferrals = lazyWithRetry(() => import("./admin/pages/AdminReferrals"));
const AdminFuturePlatforms = lazyWithRetry(() => import("./admin/pages/AdminFuturePlatforms"));
import MarketingLayout from './admin/pages/MarketingCenter/MarketingLayout';
import CampaignManager from './admin/pages/MarketingCenter/CampaignManager';
import AnnouncementManager from './admin/pages/MarketingCenter/AnnouncementManager';
import MarketingAnalytics from './admin/pages/MarketingCenter/MarketingAnalytics';



const ResellerDashboard = lazyWithRetry(() => import("./reseller/pages/ResellerDashboard"));
const ResellerCustomers = lazyWithRetry(() => import("./reseller/pages/ResellerCustomers"));
const ResellerPricing = lazyWithRetry(() => import("./reseller/pages/ResellerPricing"));
const ResellerBranding = lazyWithRetry(() => import("./reseller/pages/ResellerBranding"));
const ResellerSecurity = lazyWithRetry(() => import("./reseller/pages/ResellerSecurity"));
const ResellerWallet = lazyWithRetry(() => import("./reseller/pages/ResellerWallet"));
const ResellerSupport = lazyWithRetry(() => import("./reseller/pages/ResellerSupport"));
const ResellerApp = lazyWithRetry(() => import("./reseller/pages/ResellerApp"));
const ResellerPremium = lazyWithRetry(() => import("./reseller/pages/ResellerPremium"));
const ResellerDomain = lazyWithRetry(() => import("./reseller/pages/ResellerDomain"));
const ResellerContent = lazyWithRetry(() => import("./reseller/pages/ResellerContent"));
const ResellerTransactions = lazyWithRetry(() => import("./reseller/pages/ResellerTransactions"));
const ResellerNotificationCenter = lazyWithRetry(() => import("./reseller/pages/ResellerNotificationCenter"));
const ResellerPlatforms = lazyWithRetry(() => import("./reseller/pages/ResellerPlatforms"));
const ResellerEmailCampaign = lazyWithRetry(() => import("./reseller/pages/ResellerEmailCampaign"));

import PremiumLoader from "./components/PremiumLoader";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [adminToken, setAdminToken] = useState(localStorage.getItem("adminToken"));
    const [user, setUser] = useState(null);
  const [siteInfo, setSiteInfo] = useState(null);
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem("adminUser");
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });
  const [superAdminToken, setSuperAdminToken] = useState(localStorage.getItem("superAdminToken"));
  const [superAdminUser, setSuperAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem("superAdminUser");
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });
    const [loadingUser, setLoadingUser] = useState(!!token);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const [systemMaintenance, setSystemMaintenance] = useState({
    maintenanceMode: false,
    maintenanceMessage: "",
    maintenanceTarget: "all"
  });
  const [appSocket, setAppSocket] = useState(null);

  // Tenant Security Guard
  const [checkingTenant, setCheckingTenant] = useState(() => {
    const host = window.location.hostname.toLowerCase();
    const mainDomains = [
        'localhost', 
        '127.0.0.1',
        '9jasub.com', 
        'www.9jasub.com', 
        'app.9jasub.com',
        'mk-subdata.com', 
        'www.mk-subdata.com'
    ];
    return !mainDomains.includes(host);
  });
  const [tenantInvalid, setTenantInvalid] = useState(false);

  // Inactivity / Auto Session Timeout State
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const isExcludedPath = (pathname) => {
    const normalized = pathname.toLowerCase();
    const exclusions = [
      '/wallet',
      '/purchase',
      '/kyc',
      '/verify-email',
      '/login',
      '/signup',
      '/forgot-password',
      '/forgot-pin',
      '/onboarding',
      '/reseller/onboarding',
      '/reseller/wallet',
      '/reseller/purchase',
      '/admin/kyc'
    ];
    return exclusions.some(path => normalized.startsWith(path));
  };
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchSiteInfo();
    const handlePrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); window.deferredPrompt = e; };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Global custom event listener for manual wallet refresh triggers
    const handleWalletRefresh = () => fetchUserInfo();
    window.addEventListener('wallet:refresh', handleWalletRefresh);

    const handleSlow = (e) => setIsSlowNetwork(e.detail.slow);
    window.addEventListener('slow-network', handleSlow);

    // Initialize real-time Socket engine for premium instant push notifications
    const socketUrl = import.meta.env.VITE_API_URL || '';
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true
    });
    
    setAppSocket(socket);

    socket.on("maintenance:update", (data) => {
      console.log("[WebSocket] Received maintenance:update event:", data);
      setSystemMaintenance(data);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('slow-network', handleSlow);
      window.removeEventListener('wallet:refresh', handleWalletRefresh);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (appSocket && siteInfo?._id) {
      appSocket.emit('subscribe:reseller_customer', siteInfo._id);

      const handleBrandingSync = (data) => {
        console.log("[WebSocket] Received branding sync:", data);
        setSiteInfo(prev => ({ ...prev, branding: data.branding }));
        applyBranding({ branding: data.branding });
        window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: "Theme updated in real-time!", type: "info" } }));
      };

      const handlePricingSync = () => {
        console.log("[WebSocket] Received pricing sync");
        dataPlanCache.clear();
        window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: "New pricing applied in real-time!", type: "info" } }));
      };

      appSocket.on('branding:sync', handleBrandingSync);
      appSocket.on('pricing:sync', handlePricingSync);

      return () => {
        appSocket.off('branding:sync', handleBrandingSync);
        appSocket.off('pricing:sync', handlePricingSync);
      };
    }
  }, [appSocket, siteInfo?._id]);

  useEffect(() => {
    if (appSocket && user?._id) {
      appSocket.emit('subscribe:user', user._id);

      const handleWalletSync = (data) => {
        console.log("[WebSocket] Received wallet sync:", data);
        const payload = typeof data.balance === 'object' ? data.balance : { balance: data.balance };
        
        setUser(prev => {
          if (!prev) return prev;
          const updated = { ...prev };
          if (payload.balance !== undefined) {
            updated.balance1 = payload.balance;
            updated.totalBalance = (payload.balance || 0) + (prev.balance2 || 0);
          }
          if (payload.earningsBalance !== undefined) {
            updated.earningsBalance = payload.earningsBalance;
            updated.profitBalance = payload.earningsBalance;
          }
          return updated;
        });

        window.dispatchEvent(new CustomEvent('wallet:refresh'));

        const toastMsg = payload.message || (payload.balance !== undefined 
          ? `Wallet Synced: ₦${payload.balance.toLocaleString()}` 
          : `Profit Wallet updated!`);

        window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: toastMsg, type: "success" } }));
      };

      const handleWalletFunded = (data) => {
        console.log("[WebSocket] Received wallet funded:", data);
        window.dispatchEvent(new CustomEvent('wallet:funded', { detail: data }));
        handleWalletSync({ balance: data.balance });
      };

      appSocket.on('wallet:sync', handleWalletSync);
      appSocket.on('wallet:funded', handleWalletFunded);

      return () => {
        appSocket.off('wallet:sync', handleWalletSync);
        appSocket.off('wallet:funded', handleWalletFunded);
      };
    }
  }, [appSocket, user?._id]);

  // --- SUPABASE REALTIME SUBSCRIPTIONS ---
  useEffect(() => {
    if (!token || !user) return;

    // SECURE RLS INJECTION: Pass the custom backend JWT to Supabase Realtime
    // This allows Supabase Postgres RLS policies to decode the token and enforce auth rules.
    supabase.realtime.setAuth(token);

    console.log("[Supabase] Initializing Realtime Subscriptions...");
    const channels = supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user._id}` },
        (payload) => {
          console.log('[Supabase] New notification!', payload);
          window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: payload.new.title, type: "info" } }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wallet_ledger', filter: `user_id=eq.${user._id}` },
        (payload) => {
          console.log('[Supabase] Wallet ledger update!', payload);
          fetchUserInfo(); // Refresh balances
          window.dispatchEvent(new CustomEvent('wallet:refresh'));
          window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: `Wallet ${payload.new.type}: ₦${payload.new.amount}`, type: "success" } }));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reseller_branding' },
        (payload) => {
          console.log('[Supabase] Branding update!', payload);
          fetchSiteInfo(); // Refresh branding configuration
          window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: "Platform theme updated via Supabase Realtime!", type: "info" } }));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feature_flags', filter: `user_id=eq.${user._id}` },
        (payload) => {
          console.log('[Supabase] Feature flags update!', payload);
          fetchUserInfo(); // Refresh user configuration
          window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: "Feature access updated!", type: "info" } }));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pricing_tiers' },
        (payload) => {
          console.log('[Supabase] Global pricing update!', payload);
          dataPlanCache.clear();
          window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: "Pricing tiers updated!", type: "info" } }));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reseller_custom_prices', filter: `reseller_id=eq.${user._id}` },
        (payload) => {
          console.log('[Supabase] Custom pricing update!', payload);
          dataPlanCache.clear();
        }
      )
      .subscribe((status) => {
        console.log("[Supabase] Subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channels);
    };
  }, [token, user]);
  // ----------------------------------------

  const fetchSiteInfo = async () => {
    try {
      const res = await API.get('/api/site-info');
      if (res.data.status === 'success') {
        if (res.data.reseller) {
          setSiteInfo(res.data.reseller);
          applyBranding(res.data.reseller);
        }
        if (res.data.systemMaintenance) {
          setSystemMaintenance(res.data.systemMaintenance);
        }
        setTenantInvalid(false);
      }
    } catch (err) { 
      console.error("Branding fetch failed", err); 
      if (err.response && err.response.status === 404) {
        setTenantInvalid(true);
      }
    } finally {
      setCheckingTenant(false);
    }
  };

  const applyBranding = (reseller) => {
    const branding = reseller.branding;
    if (branding) {
      if (branding.primaryColor) {
        const pColor = branding.primaryColor;
        document.documentElement.style.setProperty('--primary', pColor);
        document.documentElement.style.setProperty('--primary-light', pColor.startsWith('#') ? pColor + '22' : 'rgba(59, 130, 246, 0.15)');
        
        // Update Theme Color Meta Tag
        let themeMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeMeta) {
            themeMeta = document.createElement('meta');
            themeMeta.name = "theme-color";
            document.head.appendChild(themeMeta);
        }
        themeMeta.content = pColor;
      }
      if (branding.backgroundColor) {
        document.documentElement.style.setProperty('--bg-color', branding.backgroundColor);
      }
      if (branding.balanceCardColor) {
        document.documentElement.style.setProperty('--balance-card-bg', branding.balanceCardColor);
      }
      if (branding.secondaryColor) {
        document.documentElement.style.setProperty('--secondary', branding.secondaryColor);
      }
      if (branding.siteName) {
        document.title = branding.siteName;
        
        // Update OG Title
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
            ogTitle = document.createElement('meta');
            ogTitle.setAttribute('property', 'og:title');
            document.head.appendChild(ogTitle);
        }
        ogTitle.content = branding.siteName;
      }
      
      if (branding.logo) {
          // Update Favicon (for SPA immediate update, though backend intercepts initial load)
          let icon = document.querySelector('link[rel="icon"]');
          if (!icon) {
              icon = document.createElement('link');
              icon.rel = "icon";
              document.head.appendChild(icon);
          }
          icon.href = branding.logo;

          // Update OG Image
          let ogImage = document.querySelector('meta[property="og:image"]');
          if (!ogImage) {
              ogImage = document.createElement('meta');
              ogImage.setAttribute('property', 'og:image');
              document.head.appendChild(ogImage);
          }
          ogImage.content = branding.logo;
      }
    }
  };

  const fetchUserInfo = () => {
    if (token) {
      API.get(`/api/user/me?_t=${Date.now()}`)
        .then(res => { 
            setUser(res.data); 
            if (res.data && res.data.emergencyId) {
                localStorage.setItem('emergencyId', res.data.emergencyId);
            }
            
            // Pre-fetch Reseller Dashboard stats for instant load
            if (res.data.role === 'reseller_admin') {
                API.get('/api/reseller/stats').then(st => {
                    localStorage.setItem(`reseller_stats_${res.data._id}`, JSON.stringify(st.data));
                }).catch(() => {});
            }
        })
        .catch(err => { if (err.response?.status === 401) logout(); })
        .finally(() => { setLoadingUser(false); });
    } else {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    if (token) {
      setLoadingUser(true);
      dataPlanCache.preload();
      fetchUserInfo();
    } else {
      setLoadingUser(false);
    }

    const checkLock = async () => {
      const biometricEnabled = localStorage.getItem('biometricEnabled') === 'true';
      const alreadyUnlocked = sessionStorage.getItem('appUnlocked') === 'true';
      if (token && biometricEnabled && !alreadyUnlocked) {
        const supported = await isBiometricAvailable();
        if (supported && localStorage.getItem('lastEmail')) {
          setIsAppLocked(true);
          setTimeout(() => { handleAppUnlock(); }, 500);
        }
      }
    };
    checkLock();
  }, [token]);

  const handleAppUnlock = async () => {
    const email = localStorage.getItem('lastEmail');
    if (!email) { setIsAppLocked(false); return; }
    setBiometricLoading(true);
    try {
      const challengeRes = await API.get(`/api/biometric/login-challenge?email=${email}`);
      await authenticateBiometric(challengeRes.data);
      sessionStorage.setItem('appUnlocked', 'true');
      setIsAppLocked(false);
    } catch (err) { console.error("App unlock failed"); }
    finally { setBiometricLoading(false); }
  };

  const isAdminMode = location.pathname.startsWith('/admin') || location.pathname.startsWith('/super-admin') || location.pathname.startsWith('/reseller') || location.pathname.startsWith('/website');

  // Inactivity / Auto Session Timeout Effect
  useEffect(() => {
    const isLoggedIn = !!token || !!adminToken;
    const isExcluded = isExcludedPath(location.pathname);

    if (!isLoggedIn || isExcluded) {
      setIsWarningOpen(false);
      return;
    }

    let idleTimeout;

    const resetIdleTimer = () => {
      if (isWarningOpen) return;
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        setIsWarningOpen(true);
        setCountdown(30);
      }, 270000); // 4 minutes 30 seconds
    };

    const events = ['mousemove', 'click', 'keydown', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, resetIdleTimer));

    // Initialize timer
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimeout);
      events.forEach(evt => window.removeEventListener(evt, resetIdleTimer));
    };
  }, [token, adminToken, location.pathname, isWarningOpen]);

  // Warning Countdown Tick Effect
  useEffect(() => {
    if (!isWarningOpen) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsWarningOpen(false);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isWarningOpen]);

  const logout = () => {
    const isAdmin = !!adminToken;
    const isSuperAdmin = !!superAdminToken;
    const biometricEnabled = localStorage.getItem('biometricEnabled');
    const lastEmail = localStorage.getItem('lastEmail');
    const hasLoggedInBefore = localStorage.getItem('hasLoggedInBefore');
    const seenOnboarding = localStorage.getItem('seenOnboarding');
    const userType = localStorage.getItem('userType');
    const isResellerLogout = (user && (user.role === 'reseller_admin' || user.apiLevel === 'reseller')) || userType === 'business';
    
    localStorage.clear();
    sessionStorage.clear();
    
    if (biometricEnabled) localStorage.setItem('biometricEnabled', biometricEnabled);
    if (lastEmail) localStorage.setItem('lastEmail', lastEmail);
    if (hasLoggedInBefore) localStorage.setItem('hasLoggedInBefore', hasLoggedInBefore);
    if (seenOnboarding) localStorage.setItem('seenOnboarding', seenOnboarding);

    setToken(null);
    setAdminToken(null);
    setSuperAdminToken(null);
    setUser(null);
    setAdminUser(null);
    setSuperAdminUser(null);

    if (isSuperAdmin) {
      navigate('/super-admin/login');
    } else if (isAdmin) {
      navigate('/admin/login');
    } else if (isResellerLogout) {
      navigate('/reseller/login');
    } else {
      navigate('/login');
    }
  };

  const isResellerUser = user && (user.role === 'reseller_admin' || user.resellerActivationStatus === 'active' || user.whiteLabelStatus === 'active' || user.apiLevel === 'reseller');

  const isMaintenanceBlocked = (() => {
    if (!systemMaintenance || !systemMaintenance.maintenanceMode) {
      return false;
    }

    const isAdminPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/super-admin');

    if (adminToken || superAdminToken || adminUser?.role === 'admin' || superAdminUser?.role === 'superadmin' || isAdminPath) {
      return false;
    }

    const target = systemMaintenance.maintenanceTarget || 'all';
    if (target === 'all') {
      return true;
    }

    if (user) {
      if (user.role === 'admin') {
        return false;
      }
      if (target === 'reseller' && isResellerUser) {
        return true;
      }
      if (target === 'customer' && user.role === 'user') {
        return true;
      }
      if (target === 'premium_reseller' && isResellerUser && user.resellerTier === 'premium') {
        return true;
      }
    }

    return false;
  })();
  if (tenantInvalid) {
    return (
      <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '50px', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <h1 style={{ color: '#ef4444', fontSize: '32px', fontWeight: '800', margin: '0 0 16px' }}>Website Not Found</h1>
            <p style={{ color: '#64748b', fontSize: '18px', lineHeight: '1.6', margin: '0 0 8px' }}>This website does not exist.</p>
            <p style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.6', margin: 0 }}>Please check the website address.</p>
        </div>
      </div>
    );
  }

  if (checkingTenant) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <Loader2 className="animate-spin" size={40} color="#3b82f6" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <BrandingProvider siteInfo={siteInfo}>
        <PWAInstallPrompt 
            deferredPrompt={deferredPrompt} 
            setDeferredPrompt={setDeferredPrompt} 
            hasBottomNav={Boolean(token && !loadingUser && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/reseller') && !location.pathname.startsWith('/website'))}
        />
        {isWarningOpen && (
          <div className="inactivity-warning-overlay animate-fade-in" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)', zIndex: 35000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '24px', textAlign: 'center',
            backdropFilter: 'blur(16px)'
          }}>
            <div style={{
              background: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '40px 30px',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              width: '100%',
              maxWidth: '400px',
              backdropFilter: 'blur(20px)',
              color: '#ffffff',
              fontFamily: 'Inter, sans-serif'
            }}>
              <div className="warning-icon-wrapper" style={{
                width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 20px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(239, 68, 68, 0.15) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <ShieldAlert size={36} className="animate-pulse" />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '12px', color: '#ffffff' }}>
                Session Expiring
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '24px', lineHeight: '1.5' }}>
                Your session will expire soon due to inactivity.
              </p>
              
              {/* Countdown display */}
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#fbbf24',
                background: 'rgba(245, 158, 11, 0.1)',
                padding: '10px 16px',
                borderRadius: '12px',
                display: 'inline-block',
                marginBottom: '32px',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                Auto-logging out in <strong style={{ fontSize: '16px' }}>{countdown}</strong> seconds
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={() => {
                    setIsWarningOpen(false);
                    setCountdown(30);
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s'
                  }}
                >
                  Stay Logged In
                </button>
                
                <button 
                  onClick={() => {
                    setIsWarningOpen(false);
                    logout();
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    background: 'transparent',
                    color: '#ef4444',
                    fontWeight: '600',
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Logout Now
                </button>
              </div>
            </div>
          </div>
        )}
        <div className={`app-shell ${isAdminMode ? 'admin-mode' : ''}`} style={{ display: 'flex', minHeight: '100vh', width: '100%', overflow: 'visible' }}>
          {token && !loadingUser && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/reseller') && !location.pathname.startsWith('/website') && <Sidebar user={user} logout={logout} siteInfo={siteInfo} />}
          
          <div className="app-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100%', position: 'relative' }}>
            {loadingUser && token ? (
                <PremiumLoader siteInfo={siteInfo} />
            ) : isAppLocked ? (
              <div className="app-lock-screen animate-fade-in" style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'var(--bg-color)', zIndex: 20000,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '24px', textAlign: 'center',
                backdropFilter: 'blur(20px)'
              }}>
                <div style={{ background: 'var(--bg-card)', padding: '40px 30px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', width: '100%', maxWidth: '380px' }}>
                  <div className="lock-icon-wrapper" style={{
                    width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 20px',
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.1) 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--primary)', border: '1px solid rgba(59,130,246,0.2)'
                  }}>
                    <Lock size={36} />
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-dark)' }}>App Locked</h2>
                  <p style={{ color: 'var(--text-gray)', fontSize: '15px', marginBottom: '32px', lineHeight: '1.5' }}>
                    Welcome back.<br/>Verify your identity to continue.
                  </p>
                  
                  <button onClick={handleAppUnlock} disabled={biometricLoading} style={{
                    width: '100%', padding: '16px', borderRadius: '16px', border: 'none', 
                    background: 'var(--primary-gradient)', color: '#fff', fontWeight: 'bold', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    fontSize: '16px', boxShadow: '0 10px 25px -5px var(--primary-glow)',
                    cursor: 'pointer', transition: 'all 0.3s'
                  }}>
                    {biometricLoading ? <Loader2 className="animate-spin" /> : <Fingerprint size={22} />} 
                    Unlock with Biometrics
                  </button>
                  
                  <button onClick={() => {
                    const pin = prompt("Enter your 4-digit Transaction PIN to unlock:");
                    if (pin && pin.length === 4) {
                       API.post('/api/auth/verify-pin', { pin }, { headers: { Authorization: token } })
                         .then(res => { if(res.data.success) { sessionStorage.setItem('appUnlocked', 'true'); setIsAppLocked(false); } else alert("Invalid PIN"); })
                         .catch(err => alert("Error verifying PIN"));
                    }
                  }} style={{
                    width: '100%', marginTop: '16px', padding: '16px', borderRadius: '16px', 
                    border: '1px solid var(--border-color)', background: 'transparent', 
                    color: 'var(--text-dark)', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
                  }}>
                    Use PIN
                  </button>

                  <button onClick={logout} style={{ 
                    marginTop: '24px', background: 'none', border: 'none', color: '#EF4444', 
                    fontWeight: '600', fontSize: '14px', cursor: 'pointer', padding: '8px'
                  }}>
                    Log Out
                  </button>
                </div>
              </div>
            ) : isMaintenanceBlocked ? (
              <div className="maintenance-screen" style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', zIndex: 20000,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '24px', textAlign: 'center', color: '#f8fafc', fontFamily: 'Inter, sans-serif'
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 80%)',
                  pointerEvents: 'none'
                }}></div>
                <div style={{
                  width: '96px', height: '96px', borderRadius: '24px',
                  background: 'rgba(99, 102, 241, 0.12)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: '32px',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  boxShadow: '0 8px 32px 0 rgba(99, 102, 241, 0.2)',
                  color: '#6366f1'
                }}>
                  <ShieldAlert size={48} />
                </div>
                <h2 style={{ fontSize: '28.6px', fontWeight: 850, letterSpacing: '-0.5px', marginBottom: '16px', color: '#ffffff' }}>System Optimization In Progress</h2>
                <div className="badge badge-warning" style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#fbbf24', padding: '6px 16px', borderRadius: '30px', fontSize: '13.2px', fontWeight: 700, marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%' }}></div>
                  Platform Temporary Intermission
                </div>
                <div style={{ maxWidth: '480px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '16px', backdropFilter: 'blur(8px)', marginBottom: '40px', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)' }}>
                  <p style={{ color: '#cbd5e1', fontSize: '16.5px', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                    {systemMaintenance.maintenanceMessage && !systemMaintenance.maintenanceMessage.toLowerCase().includes("we are back now")
                      ? systemMaintenance.maintenanceMessage 
                      : "system is currently under maintenance"}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', zIndex: 10 }}>
                  <a href={'https://wa.me/' + (siteInfo?.branding?.whatsappNumber || '2349041050812')} target="_blank" rel="noopener noreferrer" style={{
                    padding: '14px 28px', borderRadius: '12px', background: '#25D366', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)', fontSize: '14.3px'
                  }}>
                    <MessageCircle size={18} /> Message Support
                  </a>
                  {siteInfo?.branding?.contactEmail && (
                    <a href={'mailto:' + siteInfo.branding.contactEmail} style={{
                      padding: '14px 28px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#f8fafc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', fontSize: '14.3px'
                    }}>
                      <Globe size={18} /> Email Help Desk
                    </a>
                  )}
                </div>
                {token && (
                  <button onClick={logout} style={{ marginTop: '32px', background: 'none', border: 'none', color: '#EF4444', fontWeight: '600', fontSize: '14.3px', cursor: 'pointer', zIndex: 10 }}>Log Out</button>
                )}
                <div style={{ marginTop: '48px', fontSize: '12.1px', color: '#64748b', fontWeight: 500 }}>
                  © {new Date().getFullYear()} {siteInfo?.branding?.siteName || (isWhiteLabelSite(siteInfo) ? 'VTU Portal' : '9JASUB')} Systems. All rights reserved.
                </div>
              </div>
            ) : (
              <Routes>
                <Route path="/admin/login" element={adminToken ? <Navigate to="/admin/dashboard" /> : <AdminLogin setAdminToken={setAdminToken} setAdminUser={setAdminUser} />} />
                <Route path="/reseller/login" element={token ? <Navigate to="/reseller" replace /> : <BusinessLogin setToken={setToken} siteInfo={siteInfo} />} />
                <Route path="/business/login" element={token ? <Navigate to="/reseller" replace /> : <BusinessLogin setToken={setToken} siteInfo={siteInfo} />} />
                <Route path="/business/signup" element={isWhiteLabelSite(siteInfo) ? <Navigate to="/login" replace /> : (token ? <Navigate to="/reseller" replace /> : <BusinessSignup setToken={setToken} siteInfo={siteInfo} />)} />
                
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/login" element={<Login setToken={setToken} siteInfo={siteInfo} />} />
                <Route path="/signup" element={<Signup setToken={setToken} siteInfo={siteInfo} />} />
                <Route path="/register" element={<Signup setToken={setToken} siteInfo={siteInfo} />} />
                <Route path="/forgot-password" element={<ForgotPassword siteInfo={siteInfo} />} />
                <Route path="/forgot-pin" element={<ForgotPin siteInfo={siteInfo} />} />
                <Route path="/verify-email" element={<VerifyEmail setToken={setToken} siteInfo={siteInfo} />} />
                <Route path="/continue-signup" element={<ContinueSignup siteInfo={siteInfo} />} />
                <Route path="/reseller/onboarding" element={isWhiteLabelSite(siteInfo) ? <Navigate to="/home" replace /> : (token ? (siteInfo ? <Navigate to="/home" /> : <ResellerOnboarding user={user} refreshUser={fetchUserInfo} siteInfo={siteInfo} />) : <Navigate to="/login" />)} />
                <Route path="/app" element={<AppDownload />} />

                <Route path="/home" element={token ? (isResellerUser ? <Navigate to="/reseller/dashboard" replace /> : <Home token={token} user={user} refreshUser={fetchUserInfo} siteInfo={siteInfo} />) : <Navigate to="/login" />} />
                <Route path="/marketplace" element={token ? <Marketplace user={user} siteInfo={siteInfo} /> : <Navigate to="/login" />} />
                <Route path="/app-viewer/:platformId" element={token ? <AppViewer user={user} siteInfo={siteInfo} /> : <Navigate to="/login" />} />
                <Route path="/wallet" element={token ? <Wallet token={token} user={user} refreshUser={fetchUserInfo} /> : <Navigate to="/login" />} />
                <Route path="/services" element={token ? (isResellerUser ? <Navigate to="/reseller/dashboard" replace /> : <Services token={token} user={user} />) : <Navigate to="/login" />} />
                <Route path="/purchase" element={token ? (isResellerUser ? <Navigate to="/reseller/purchase" replace /> : <Purchase token={token} user={user} refreshUser={fetchUserInfo} siteInfo={siteInfo} />) : <Navigate to="/login" />} />
                <Route path="/offline-data" element={token ? <OfflineData user={user} /> : <Navigate to="/login" />} />
                <Route path="/profile" element={token ? (isResellerUser ? <Navigate to="/reseller/dashboard" replace /> : <Profile logout={logout} user={user} refreshUser={fetchUserInfo} siteInfo={siteInfo} />) : <Navigate to="/login" />} />
                <Route path="/support" element={token ? (isResellerUser ? <Navigate to="/reseller/support" replace /> : <Support token={token} user={user} siteInfo={siteInfo} />) : <Navigate to="/login" />} />
                <Route path="/kyc" element={token ? (isResellerUser ? <Navigate to="/reseller/dashboard" replace /> : <KYC user={user} refreshUser={fetchUserInfo} />) : <Navigate to="/login" />} />
                <Route path="/developer" element={token ? <DeveloperApi user={user} /> : <Navigate to="/login" />} />
                <Route path="/transactions" element={token ? (isResellerUser ? <Navigate to="/reseller/transactions" replace /> : <Transactions token={token} />) : <Navigate to="/login" />} />

                <Route path="/identity/:serviceId" element={token ? <IdentityPurchase user={user} /> : <Navigate to="/login" />} />
                <Route path="/notifications" element={token ? (isResellerUser ? <Navigate to="/reseller/notifications" replace /> : <Notifications token={token} />) : <Navigate to="/login" />} />
                <Route path="/referrals" element={token ? (isResellerUser ? <Navigate to="/reseller/dashboard" replace /> : <ReferralCenter user={user} siteInfo={siteInfo} />) : <Navigate to="/login" />} />
                

                <Route path="/reseller/*" element={<ResellerRedirect />} />
                <Route path="/website/*" element={
                  token && isResellerUser ? (
                    <ResellerLayout user={user} logout={logout} siteInfo={siteInfo}>
                      <Suspense fallback={<PremiumLoader siteInfo={siteInfo} />}>
                        <Routes>
                          <Route path="/" element={<Navigate to="/website/dashboard" />} />
                          <Route path="/dashboard" element={<ResellerDashboard user={user} />} />
                          <Route path="/customers" element={<ResellerCustomers />} />
                          <Route path="/pricing" element={<ResellerPricing />} />
                          <Route path="/purchase" element={<Purchase token={token} user={user} refreshUser={fetchUserInfo} siteInfo={siteInfo} />} />
                          <Route path="/content" element={<PremiumGuard user={user}><ResellerContent user={user} refreshUser={fetchUserInfo} siteInfo={siteInfo} /></PremiumGuard>} />
                          <Route path="/domain" element={<PremiumGuard user={user}><ResellerDomain user={user} refreshUser={fetchUserInfo} /></PremiumGuard>} />
                          <Route path="/email-campaigns" element={<PremiumGuard user={user}><ResellerEmailCampaign user={user} /></PremiumGuard>} />
                          <Route path="/branding" element={<PremiumGuard user={user}><ResellerBranding user={user} refreshUser={fetchUserInfo} refreshBranding={fetchSiteInfo} /></PremiumGuard>} />
                          <Route path="/wallet" element={<ResellerWallet user={user} />} />
                          <Route path="/security" element={<ResellerSecurity />} />
                          <Route path="/support" element={<ResellerSupport />} />
                          <Route path="/mobile-app" element={<PremiumGuard user={user}><ResellerApp user={user} refreshUser={fetchUserInfo} /></PremiumGuard>} />
                          <Route path="/premium" element={<ResellerPremium user={user} refreshUser={fetchUserInfo} />} />
                          <Route path="/transactions" element={<ResellerTransactions user={user} />} />
                          <Route path="/referrals" element={<ReferralCenter user={user} siteInfo={siteInfo} />} />
                          <Route path="/notifications" element={<ResellerNotificationCenter user={user} />} />
                          <Route path="/analytics" element={<div className="reseller-container"><h1>Business Analytics</h1><p>Detailed performance charts coming soon.</p></div>} />
                          <Route path="/settings" element={<div className="reseller-container"><h1>Website Settings</h1><p>Advanced configuration options coming soon.</p></div>} />
                          <Route path="/domain" element={<PremiumGuard user={user}><ResellerDomain user={user} refreshUser={fetchUserInfo} /></PremiumGuard>} />
                          <Route path="/platforms" element={<ResellerPlatforms user={user} refreshUser={fetchUserInfo} />} />
                          <Route path="*" element={<Navigate to="/website/dashboard" />} />
                        </Routes>
                      </Suspense>
                    </ResellerLayout>
                  ) : <Navigate to="/login" />
                } />

                         <Route path="/admin/*" element={
                  adminToken ? (
                    <AdminLayout admin={adminUser} logout={() => { localStorage.removeItem('adminToken'); setAdminToken(null); }}>
                      <Suspense fallback={<PremiumLoader siteInfo={siteInfo} />}>
                          <AdminErrorBoundary>
                            <Routes>
                          <Route path="dashboard" element={<AdminDashboard token={adminToken} />} />
                          <Route path="users/retail" element={<UserManager token={adminToken} type="retail" />} />
                          <Route path="users/reseller-customers" element={<UserManager token={adminToken} type="reseller-customers" />} />
                          <Route path="users/developers" element={<UserManager token={adminToken} type="developers" />} />
                          <Route path="resellers" element={<ResellerManager token={adminToken} />} />
                          <Route path="resellers/wallets" element={<ResellerWalletManager token={adminToken} />} />
                          <Route path="pricing/retail" element={<CentralPricingManager tier="retail" />} />
                          <Route path="pricing/vip" element={<CentralPricingManager tier="vip" />} />
                          <Route path="pricing/basic" element={<CentralPricingManager tier="basic" />} />
                          <Route path="transactions" element={<AdminTransactions token={adminToken} />} />
                          <Route path="audit/user/:userId" element={<UserAudit token={adminToken} />} />
                          <Route path="services" element={<ServiceManager token={adminToken} />} />
                          <Route path="data-categories" element={<DataCategoryRouteWrapper token={adminToken} />} />
                          <Route path="data-pricing" element={<DataPlanPricing token={adminToken} />} />
                          <Route path="pricing-rules" element={<PricingRules token={adminToken} />} />
                          <Route path="tier-margins" element={<TierMargins />} />
                          <Route path="profit" element={<ProfitAnalytics token={adminToken} />} />
                          <Route path="referrals" element={<AdminReferrals />} />
                          <Route path="future-platforms" element={<AdminFuturePlatforms />} />
                          <Route path="kyc" element={<KYCManager token={adminToken} />} />
                          <Route path="withdrawals" element={<WithdrawalManager token={adminToken} />} />
                          <Route path="content" element={<ContentManager token={adminToken} />} />
                          <Route path="blog" element={<BlogManager token={adminToken} />} />
                          <Route path="notifications" element={<NotificationCenter token={adminToken} />} />
                          <Route path="international" element={<InternationalAnalytics token={adminToken} />} />
                          <Route path="saas-settings" element={<SaaSSettings />} />
                          <Route path="settings" element={<AdminSettings token={adminToken} />} />
                          <Route path="logs" element={<AdminLogs token={adminToken} />} />
                          <Route path="reconciliation" element={<ReconciliationPanel />} />
                          <Route path="monitoring" element={<MonitoringDashboard />} />
                          <Route path="operations" element={<OperationsCenter />} />
                          <Route path="app-requests" element={<AdminAppRequests />} />
                          <Route path="domain-requests" element={<AdminDomainRequests />} />
                          
                          {/* Super Admin Exact Feature Routes */}
                          <Route path="deployment" element={<AdminAppRequests />} />
                          <Route path="snapshots" element={<OperationsCenter />} />
                          <Route path="rollback" element={<OperationsCenter />} />
                          <Route path="system-health" element={<MonitoringDashboard />} />
                          <Route path="infrastructure" element={<OperationsCenter />} />
                          <Route path="audit-logs" element={<AdminLogs token={adminToken} />} />
                          <Route path="maintenance" element={<SaaSSettings />} />
                          <Route path="ai-assistant" element={<AIAssistantControl />} />
                          <Route path="provider-monitoring" element={<MonitoringDashboard />} />
                          <Route path="master-settings" element={<AdminSettings token={adminToken} />} />
                          <Route path="marketing" element={<MarketingLayout />}>
                            <Route path="campaigns" element={<CampaignManager />} />
                            <Route path="announcements" element={<AnnouncementManager />} />
                            <Route path="analytics" element={<MarketingAnalytics />} />
                            <Route path="settings" element={<div style={{padding:'24px', textAlign:'center', color:'#64748b'}}>Marketing Settings configuration coming soon in V2.</div>} />
                          </Route>
                            </Routes>
                          </AdminErrorBoundary>
                      </Suspense>
                    </AdminLayout>
                  ) : <Navigate to="/admin/login" />
                } />

                <Route path="/" element={
                  token 
                    ? <Navigate to="/home" /> 
                    : (isWhiteLabelSite(siteInfo) 
                        ? <ResellerMarketingHome siteInfo={siteInfo} /> 
                        : (localStorage.getItem("seenOnboarding") === "true" ? <Navigate to="/login" /> : <Navigate to="/onboarding" />)
                      )
                } />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            )}

            {token && !loadingUser && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/reseller') && !location.pathname.startsWith('/website') && (
              <>
                <div className="branding-footer" style={{ textAlign: 'center', padding: '4px 8px 60px', fontSize: '8.5px', letterSpacing: '0.1px', opacity: 0.6, color: '#888', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
                  <span>© {siteInfo?.branding?.siteName || (isWhiteLabelSite(siteInfo) ? 'VTU Portal' : '9JASUB')} {!isWhiteLabelSite(siteInfo) && ' Powered by MK GLOBAL INVESTMENT LTD.'}</span>
                </div>
              </>
            )}

            {isOffline && (
              <div className="offline-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 30000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <ShieldAlert size={64} color="#EF4444" />
                <h2 style={{ marginTop: '20px' }}>Connection Lost</h2>
              </div>
            )}

            {isSlowNetwork && !isOffline && (
              <div className="slow-network-banner" style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(245, 158, 11, 0.85)', color: 'white', padding: '6px 12px', borderRadius: '20px', zIndex: 30001, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)', fontSize: '11.5px', fontWeight: '700', animation: 'statusPulse 2s infinite ease-out' }}>
                <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%', boxShadow: '0 0 6px rgba(255,255,255,0.8)' }}></div>
                Network Unstable
              </div>
            )}

            {token && !['/login', '/signup', '/onboarding', '/forgot-password', '/forgot-pin'].includes(location.pathname) && (
              <a 
                href={'https://wa.me/' + (siteInfo?.branding?.whatsappNumber || '2349041050812')} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="floating-whatsapp"
                style={{
                    position: 'fixed', right: '16px', bottom: '76px',
                    background: '#25D366', color: 'white', width: '42px', height: '42px', 
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)', zIndex: 999, transition: 'all 0.3s ease'
                }}
              >
                 <MessageCircle size={22} />
              </a>
            )}
          </div>
        </div>
        {token && !loadingUser && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/reseller') && !location.pathname.startsWith('/website') && (
          <BottomNav />
        )}
        </BrandingProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
