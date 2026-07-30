import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Wifi, Smartphone, Zap, PlaySquare, ArrowRight, 
  ArrowDownLeft, ArrowUpRight, Clock, XCircle, CheckCircle, 
  ShieldCheck, User, Users, Lock, ChevronRight, PlusCircle, 
  Sparkles, ShieldAlert, Globe, Sun, Moon, Eye, EyeOff,
  Hash, GraduationCap, History 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import './Home.css';
import { getCleanStatus, getCleanStatusText } from '../utils/statusMapper';
import BrandLogo from '../components/BrandLogo';
import { useTheme } from '../context/ThemeContext';
import { isActiveReseller, isPremiumReseller, checkBannerVisibility } from '../utils/bannerHelper';
import { io } from 'socket.io-client';
import MarketingPopup from '../components/marketing/MarketingPopup';
import BiometricSetupPrompt from '../components/BiometricSetupPrompt';
import CampaignGrid from '../components/marketing/CampaignGrid';
import AnnouncementBanner from '../components/marketing/AnnouncementBanner';
import FuturePlatformViewer from '../components/FuturePlatformViewer';

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
  const [balanceAnimation, setBalanceAnimation] = useState(null);
  const [externalModal, setExternalModal] = useState({ show: false, url: '' });
  const [showResellerPromo, setShowResellerPromo] = useState(false);
  const [promoClosedManually, setPromoClosedManually] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const { isLightMode, toggleTheme } = useTheme();

  // Login alert state
  const [loginAlert, setLoginAlert] = useState(() => {
    const alert = sessionStorage.getItem('login_alert');
    if (alert) {
      sessionStorage.removeItem('login_alert');
    }
    return alert;
  });

  // Balance privacy state
  const [hideBalance, setHideBalance] = useState(() => {
    return sessionStorage.getItem('hideBalance') === 'true';
  });

  const getServiceStatus = (service) => {
    const match = serviceStatuses.find(s => 
      service.matchNames.some(name => s.serviceName.toLowerCase().includes(name))
    );

    if (match) {
      return {
        color: match.severityColor || 'green',
        message: match.statusMessage,
        serviceName: match.serviceName
      };
    }

    return {
      color: 'green',
      message: `${service.label} Active`,
      serviceName: service.label
    };
  };

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

  const toggleBalancePrivacy = () => {
    setHideBalance(prev => {
      const newVal = !prev;
      sessionStorage.setItem('hideBalance', String(newVal));
      return newVal;
    });
  };

  // Initial Data Fetch
  useEffect(() => {
    API.get('/api/content?activeOnly=true')
      .then(res => {
         const data = res.data;
         if (data && Array.isArray(data)) {
           setBanners(data.filter(c => c.type === 'banner'));
           const marquees = data.filter(c => c.type === 'marquee');
           const resellerMarquee = marquees.find(c => c.ownerType === 'reseller');
           const adminMarquee = marquees.find(c => c.ownerType === 'admin');
           setMarquee(resellerMarquee || adminMarquee || null);
         }
      })
      .catch(err => console.error("Content fetch error:", err));

    API.get('/api/announcements')
      .then(res => {
         if (res.data && Array.isArray(res.data)) setAnnouncements(res.data);
      })
      .catch(err => console.warn("Announcements fetch failed:", err));

    API.get('/api/service-status/active')
      .then(res => {
         if (res.data && res.data.data) setServiceStatuses(res.data.data);
      })
      .catch(err => console.error("Service status fetch failed:", err));

    API.get('/api/content/future-platforms')
      .then(res => {
         // The API returns the array directly in res.data, not inside res.data.data
         const allPlatforms = Array.isArray(res.data) ? res.data : (res.data?.data || []);
         if (allPlatforms.length > 0) {
             let enabledPlatforms = [];
             if (siteInfo?.reseller) {
                 // Reseller site: only show platforms the reseller explicitly enabled
                 const enabledIds = siteInfo.reseller.enabledFuturePlatforms || [];
                 enabledPlatforms = allPlatforms.filter(p => enabledIds.includes(p._id));
             } else {
                 // Main site (MK Digital): show all globally active platforms
                 // The backend already filters allPlatforms by 'status: true'
                 enabledPlatforms = allPlatforms;
             }
             
             setFuturePlatforms(enabledPlatforms);
         }
      })
      .catch(err => console.error("Future platforms fetch failed:", err));

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

       if (isActiveReseller(user) || user?.role === 'admin') {
         API.get('/api/analytics/realtime', { headers: { Authorization: token } })
           .then(res => {
              if (res.data) setAnalytics(res.data);
           }).catch(() => {});
       }

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
    }
  }, [token]);

  // Removed scroll listener to keep header fixed at full size

  // WebSocket Live Service Status Updates
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || '';

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to Live Service Status channel');
    });

    socket.on('service-status:update', (updatedStatus) => {
      setServiceStatuses(prev => {
        const exists = prev.some(s => s._id === updatedStatus._id);
        if (exists) {
          if (!updatedStatus.isActive) {
            return prev.filter(s => s._id !== updatedStatus._id);
          }
          return prev.map(s => s._id === updatedStatus._id ? updatedStatus : s);
        } else {
          if (updatedStatus.isActive) {
            const newList = [updatedStatus, ...prev];
            return newList.sort((a, b) => a.serviceName.localeCompare(b.serviceName));
          }
          return prev;
        }
      });
    });

    return () => {
      socket.close();
    };
  }, []);

  // DATA FETCHING LOGIC
  const fetchDashboardData = () => {
    if (token) {
      API.get('/api/transactions', { headers: { Authorization: token } })
        .then(res => {
          if (res.data && Array.isArray(res.data)) setTransactions(res.data);
        }).catch(() => {});
        
      if (isActiveReseller(user) || user?.role === 'admin') {
        API.get('/api/analytics/realtime', { headers: { Authorization: token } })
          .then(res => {
            if (res.data) setAnalytics(res.data);
          }).catch(() => {});
      }

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
    }
  };

  // AUTO REFRESH SYSTEM
  useEffect(() => {
    const autoRefresh = setInterval(() => {
      API.get('/api/content?activeOnly=true')
        .then(res => {
          const data = res.data;
          if (data && Array.isArray(data)) {
            setBanners(data.filter(c => c.type === 'banner'));
            const marquees = data.filter(c => c.type === 'marquee');
            const resellerMarquee = marquees.find(c => c.ownerType === 'reseller');
            const adminMarquee = marquees.find(c => c.ownerType === 'admin');
            setMarquee(resellerMarquee || adminMarquee || null);
          }
        }).catch(() => {});

      API.get('/api/announcements')
        .then(res => {
          if (res.data && Array.isArray(res.data)) setAnnouncements(res.data);
        }).catch(() => {});

      API.get('/api/service-status/active')
        .then(res => {
          if (res.data && res.data.data) setServiceStatuses(res.data.data);
        }).catch(() => {});

      fetchDashboardData();
    }, 15000);

    return () => clearInterval(autoRefresh);
  }, [token]);

  // LIVE WALLET EVENT LISTENERS
  useEffect(() => {
    const handleWalletRefresh = () => fetchDashboardData();
    const handleWalletFunded = (e) => {
      fetchDashboardData();
      if (e.detail && e.detail.amount) {
        setBalanceAnimation({ amount: e.detail.amount, type: 'credit' });
        setTimeout(() => setBalanceAnimation(null), 3000);
      }
    };
    
    window.addEventListener('wallet:refresh', handleWalletRefresh);
    window.addEventListener('wallet:funded', handleWalletFunded);
    return () => {
      window.removeEventListener('wallet:refresh', handleWalletRefresh);
      window.removeEventListener('wallet:funded', handleWalletFunded);
    };
  }, [token, user]);

  // Reseller Trial Promotability
  useEffect(() => {
    if (!siteInfo && !isActiveReseller(user) && !promoClosedManually) {
      const showTimer = setTimeout(() => {
        setShowResellerPromo(true);
      }, 2000);
      return () => clearTimeout(showTimer);
    } else {
      setShowResellerPromo(false);
    }
  }, [siteInfo, user, promoClosedManually]);

  const visibleBanners = banners.filter(banner => checkBannerVisibility(banner, user));
  
  // Banner Slider Logic
  useEffect(() => {
    if (visibleBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % visibleBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [visibleBanners.length]);

  const handleLinkClick = (item) => {
    const url = typeof item === 'string' ? item : item.link;
    const type = typeof item === 'object' ? item.link_type : null;
    
    if (!url) return;
    
    const unsafeProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (unsafeProtocols.some(proto => url.toLowerCase().startsWith(proto))) return;

    const isExplicitExternal = type === 'external';
    const isAutoExternal = url.startsWith('http://') || url.startsWith('https://') || (url.includes('.') && !url.startsWith('/'));
    
    if (isExplicitExternal || isAutoExternal) {
      const finalUrl = (url.startsWith('http') || url.startsWith('/')) ? url : 'https://' + url;
      setExternalModal({ show: true, url: finalUrl });
    } else {
      navigate(url.startsWith('/') ? url : '/' + url);
    }
  };

  const confirmExternalNavigation = () => {
    window.open(externalModal.url, '_blank', 'noopener,noreferrer');
    setExternalModal({ show: false, url: '' });
  };

  const handleServiceClick = (id) => {
    navigate('/purchase', { state: { defaultTab: id } });
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

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

  return (
    <div className={`fintech-app-wrapper ${isLightMode ? 'fintech-light-mode' : ''}`} style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: '60px', boxSizing: 'border-box' }}>
      <MarketingPopup user={user} />
      <BiometricSetupPrompt user={user} />
      <div className="fintech-app-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
        
        {/* --- FIXED TOP BANNER ZONE --- */}
        <div className="fintech-fixed-dashboard-zone" style={{ flexShrink: 0, padding: '0 16px', zIndex: 10 }}>
          <AnnouncementBanner />
          {user && user.isEmailVerified === false && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '12px 16px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              margin: '8px 0',
              fontSize: '14px',
              fontWeight: '500',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold' }}>
                <span>⚠️</span>
                <span>Email not verified</span>
              </div>
              <div style={{ marginBottom: '12px' }}>Verify your email to secure your account.</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => navigate('/verify-email', { state: { email: user.email } })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Verify Email
                </button>
                <button 
                  onClick={async (e) => {
                    const btn = e.target;
                    btn.disabled = true;
                    btn.innerText = 'Sending...';
                    try {
                      const { data } = await API.post('/auth/resend-email-otp', { email: user.email });
                      alert(data.message || 'OTP Resent!');
                    } catch (err) {
                      alert(err.response?.data?.message || 'Network error');
                    }
                    btn.innerText = 'Resend OTP';
                    btn.disabled = false;
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}
          {loginAlert && (
            <div className={`login-alert-banner ${loginAlert === 'suspicious' ? 'suspicious' : 'success'}`} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '16px',
              background: loginAlert === 'suspicious' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: loginAlert === 'suspicious' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
              color: loginAlert === 'suspicious' ? '#ef4444' : '#10b981',
              margin: '8px 0',
              fontSize: '14px',
              fontWeight: '600',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              position: 'relative'
            }}>
              <span>{loginAlert === 'suspicious' ? '⚠️' : '🟢'}</span>
              <span>
                {loginAlert === 'suspicious' 
                  ? 'Suspicious login detected.' 
                  : 'New login detected successfully.'}
              </span>
              <button 
                onClick={() => setLoginAlert(null)}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '0 4px'
                }}
              >
                &times;
              </button>
            </div>
          )}
          {/* 1. Header Area with Branding Customization */}
          <header className="fintech-header">
            <div className="fintech-brand" onClick={() => navigate('/')}>
              <div className="fintech-logo-wrap">
                <BrandLogo siteInfo={siteInfo} />
              </div>
              <span className="fintech-brand-name">
                {siteInfo?.branding?.siteName || "9JASUB"}
              </span>
            </div>
            <div className="fintech-header-actions">
              <div className="fintech-action-btn" onClick={toggleTheme} title="Toggle Day/Night Mode" style={{ cursor: 'pointer' }}>
                {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
              </div>
              <div className="fintech-action-btn" onClick={() => navigate('/notifications')} style={{ cursor: 'pointer', position: 'relative' }}>
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="fintech-badge-dot" style={{ 
                    position: 'absolute', 
                    top: '-4px', 
                    right: '-4px', 
                    background: '#ef4444', 
                    color: 'white', 
                    fontSize: '11.0px', 
                    fontWeight: 'bold', 
                    minWidth: '16px', 
                    height: '16px', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '0 4px',
                    border: '2px solid var(--card-bg)'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
            </div>
          </header>

          {/* Greeting block */}
          <div className="fintech-greeting">
            <h3>{greeting}, {user?.name?.split(' ')[0] || user?.username || 'Member'} 👋</h3>
            <p>Welcome back to your wallet</p>
          </div>

          {/* 2. Wallet Balance Card (Styled Exactly like Homepage Preview System) */}
          <div className="fintech-balance-card">
            <div className="fintech-balance-label">
              <span>Total Balance</span>
              <div 
                className="fintech-privacy-toggle" 
                onClick={toggleBalancePrivacy} 
                style={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  fontSize: '10.5px',
                  fontWeight: '700',
                  color: '#ffffff'
                }}
              >
                {hideBalance ? <EyeOff size={12} /> : <Eye size={12} />}
                <span>{hideBalance ? 'Show' : 'Hide'}</span>
              </div>
            </div>
            <h4 className={`fintech-balance-amount ${hideBalance ? 'balance-blurred' : ''}`} style={{ position: 'relative' }}>
              {hideBalance 
                ? "₦ ••••.••" 
                : `₦${(user?.totalBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              
              {balanceAnimation && (
                <span style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '10px',
                  color: balanceAnimation.type === 'credit' ? '#10b981' : '#ef4444',
                  fontSize: '16px',
                  fontWeight: '900',
                  animation: 'floatUp 2.5s ease-out forwards',
                  pointerEvents: 'none',
                  textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                  +{balanceAnimation.amount.toLocaleString()}
                </span>
              )}
            </h4>
            <div className="fintech-balance-actions">
              <div className="fintech-card-btn" onClick={() => navigate('/wallet')}>
                <div className="plus-circle-icon">+</div>
                <span>Fund</span>
              </div>
              <div className="fintech-card-btn" onClick={() => navigate('/wallet')}>
                <ArrowUpRight size={16} />
                <span>Transfer</span>
              </div>
            </div>
          </div>

          {/* Onboarding Balance Empty Alert */}
          {(user?.totalBalance || 0) === 0 && (
            <div className="fintech-empty-balance-helper animate-fade-in" onClick={() => navigate('/wallet')} style={{ cursor: 'pointer' }}>
              <Sparkles size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span>Fund your wallet to begin transacting instantly</span>
              <ArrowRight size={12} style={{ marginLeft: 'auto', flexShrink: 0 }} />
            </div>
          )}

          {/* Professional Live Service Status Scroller */}
          <div className="fintech-status-scroll-container">
            {/* System Online / Transaction count Pill */}
            <div className="status-pill green">
              <span className="status-dot"></span>
              <span>{successfulTodayCount > 0 ? `${successfulTodayCount} successful tx today` : 'System Online'}</span>
            </div>

            {/* Wallet Funding Status Indicator */}
            {recentlyFundedStatus && (
              <div className="status-pill blue">
                <span className="status-dot"></span>
                <span>Funded Recently</span>
              </div>
            )}

            {CORE_STATUS_SERVICES.map(service => {
              const status = getServiceStatus(service);
              return (
                <div 
                  key={service.key} 
                  className={`status-pill ${status.color}`}
                  title={`${status.serviceName}: ${status.message}`}
                >
                  <span className="status-dot"></span>
                  <span>{status.message}</span>
                </div>
              );
            })}
          </div>

          {/* 3. Notification Area (Marquee / Live Announcements) */}
          {marquee && (
            <div className="fintech-ticker-box animate-fade-in" onClick={() => marquee.link && handleLinkClick(marquee)} style={{ cursor: marquee.link ? 'pointer' : 'default', marginTop: '4px', marginBottom: '8px' }}>
              <Sparkles size={16} className="fintech-ticker-icon" />
              <div className="fintech-ticker-content">
                <span>{marquee.title}{marquee.message ? `: ${marquee.message}` : ''}</span>
              </div>
            </div>
          )}
        </div>

        {/* Core Dashboard Responsive Content Structure (Remaining scrollable workspace) */}
        <div className="fintech-dashboard-grid" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 12px 8px', display: 'flex', flexDirection: 'column' }}>
          
          {/* LEFT / PRIMARY DESKTOP COLUMN */}
          <div className="fintech-main-grid-col" style={{ minHeight: 0 }}>

            {/* 4. Quick Services Grid */}
            <div className="fintech-section-header">
              <span>Quick Services</span>
            </div>
            <div className="fintech-services-grid">
              
              {/* Buy Data */}
              <div className="fintech-service-card srv-yellow" onClick={() => handleServiceClick('data')}>
                <Wifi size={18} />
                <span className="service-label">Buy Data</span>
              </div>

              {/* Airtime */}
              <div className="fintech-service-card srv-green" onClick={() => handleServiceClick('airtime')}>
                <Smartphone size={18} />
                <span className="service-label">Airtime</span>
              </div>

              {/* Cable TV */}
              <div className="fintech-service-card srv-red" onClick={() => handleServiceClick('cable')}>
                <PlaySquare size={18} />
                <span className="service-label">Cable TV</span>
              </div>

              {/* Electricity */}
              <div className="fintech-service-card srv-orange" onClick={() => handleServiceClick('electricity')}>
                <Zap size={18} />
                <span className="service-label">Electricity</span>
              </div>

              {/* Airtime PIN */}
              <div className="fintech-service-card srv-pink" onClick={() => handleServiceClick('epin')}>
                <Hash size={18} />
                <span className="service-label">Airtime PIN</span>
              </div>

              {/* Education */}
              <div className="fintech-service-card srv-blue" onClick={() => handleServiceClick('education')}>
                <GraduationCap size={18} />
                <span className="service-label">Education</span>
              </div>

              {/* Transactions */}
              <div className="fintech-service-card srv-purple" onClick={() => navigate('/transactions')}>
                <History size={18} />
                <span className="service-label">History</span>
              </div>

              {/* Website */}
              <div className="fintech-service-card srv-mint" onClick={() => {
                const url = `https://${user?.domain || '9jasub.com'}`;
                window.open(url, '_blank');
              }}>
                <Globe size={18} />
                <span className="service-label">Website</span>
              </div>
            </div>

            {/* 5. Apps & Services Grid */}
            {(futurePlatforms && futurePlatforms.length > 0) && (
              <>
                <div className="fintech-section-header" style={{ marginTop: '24px' }}>
                  <span>Apps & Services</span>
                  <span className="fintech-section-action" onClick={() => navigate('/marketplace')}>View All Apps &rarr;</span>
                </div>
                <div className="fintech-services-grid animate-fade-in">
                  {futurePlatforms.slice(0, 4).map(platform => (
                      <div key={platform._id} className="fintech-service-card srv-blue" onClick={() => {
                          console.log({ name: platform.displayName, logoUrl: platform.logoUrl, targetUrl: platform.targetUrl, platformType: platform.platformType });
                          if (platform.targetUrl) {
                              if (platform.platformType === 'external') {
                                  window.open(platform.targetUrl, '_blank');
                              } else {
                                  navigate('/app-viewer/' + platform._id);
                              }
                          }
                      }} 
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          padding: 0,
                          overflow: 'hidden',
                          height: 'auto',
                          aspectRatio: '1 / 1',
                          justifyContent: 'flex-start',
                          alignItems: 'center',
                          gap: 0,
                          minWidth: 0
                        }}>
                          {platform.logoUrl ? (
                              <img src={platform.logoUrl} alt={platform.displayName} 
                                style={{ 
                                  width: '100%', 
                                  height: '60%', 
                                  objectFit: 'cover', 
                                  borderRadius: '12px 12px 0 0',
                                  display: 'block'
                                }} />
                          ) : (
                              <div style={{ width: '100%', height: '60%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px 12px 0 0' }}>
                                  <Zap size={24} color="#38bdf8" />
                              </div>
                          )}
                          <div style={{ 
                            flex: 1,
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            padding: '0 4px',
                            width: '100%',
                            minWidth: 0,
                            boxSizing: 'border-box'
                          }}>
                              <div style={{ 
                                fontSize: '11px', 
                                fontWeight: '600', 
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                width: '100%', 
                                textAlign: 'center',
                                color: 'var(--app-text-main)',
                                lineHeight: '1.2'
                              }}>{platform.displayName}</div>
                              <div style={{ 
                                fontSize: '9px', 
                                color: 'var(--text-muted)', 
                                marginTop: '2px',
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                width: '100%', 
                                textAlign: 'center',
                                lineHeight: '1.2'
                              }}>{platform.name}</div>
                          </div>
                      </div>
                  ))}
                </div>
              </>
            )}

            {/* Referral Dashboard Widget */}
            <div className="fintech-promo-card animate-fade-in" style={{ position: 'relative', overflow: 'hidden', padding: '16px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary, #8B5CF6) 100%)', color: 'white', marginBottom: '24px', cursor: 'pointer', borderRadius: '16px', boxShadow: '0 8px 24px -8px var(--primary-glow)' }} onClick={() => navigate('/referrals')}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full blur-xl -mr-8 -mt-8 pointer-events-none"></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '15px' }}>
                  <Users size={18} />
                  <span>Referral Center</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backdropFilter: 'blur(4px)' }}>
                  Open &rarr;
                </div>
              </div>
              <p style={{ fontSize: '12px', opacity: 0.9, marginBottom: '16px', position: 'relative', zIndex: 1 }}>Invite friends and earn up to ₦2,000 per activation!</p>
              
              <div style={{ display: 'flex', gap: '8px', position: 'relative', zIndex: 1 }}>
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Invited</div>
                  <div style={{ fontSize: '16px', fontWeight: '900' }}>{referralAnalytics?.totalReferrals || 0}</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Total Earned</div>
                  <div style={{ fontSize: '16px', fontWeight: '900' }}>₦{(referralAnalytics?.totalReferralIncome || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* 6. Business Console */}
            {isActiveReseller(user) && (
              <div className="fintech-promo-card premium-glass animate-fade-in" style={{ position: 'relative', overflow: 'hidden', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div className="fintech-promo-tag" style={{ margin: 0, color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
                    <ShieldCheck size={12} />
                    <span>BUSINESS CONSOLE</span>
                  </div>
                  {isPremiumReseller(user) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                      <Zap size={10} /> PREMIUM
                    </div>
                  )}
                </div>
                <h4 style={{ fontSize: '18px', marginBottom: '6px' }}>Manage Your VTU Business</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Manage prices, customers, sales and grow your VTU business.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: 'var(--bg-color)', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Customers</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-dark)' }}>{user?.resellerMetrics?.customers || 0}</div>
                  </div>
                  <div style={{ background: 'var(--bg-color)', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sales Today</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-dark)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.3px' }}>
                      {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(analytics?.volumeToday !== undefined ? analytics.volumeToday : (user?.resellerMetrics?.salesToday || 0))}
                    </div>
                  </div>
                </div>

                <div className="reseller-action-row">
                  <button onClick={(e) => { e.stopPropagation(); navigate('/reseller'); }} className="premium-btn reseller-btn-primary">
                    Open Console
                  </button>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    const url = `https://${user?.domain || '9jasub.com'}`;
                    navigator.clipboard.writeText(url);
                    alert("Website link copied!");
                  }} className="premium-btn reseller-btn-outline">
                    Copy Link
                  </button>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    const url = `https://${user?.domain || '9jasub.com'}`;
                    window.open(`https://wa.me/?text=Buy cheap data and airtime on my website! Visit: ${url}`, '_blank');
                  }} className="premium-btn reseller-btn-whatsapp">
                    WhatsApp
                  </button>
                </div>
              </div>
            )}

            {showResellerPromo && (
              <div className="fintech-promo-card vip-reseller-banner animate-fade-in" onClick={() => navigate('/reseller/onboarding')}>
                <div className="vip-banner-overlay"></div>
                <div 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setShowResellerPromo(false); 
                    setPromoClosedManually(true); 
                  }}
                  className="vip-close-btn"
                >
                  <XCircle size={18} />
                </div>
                <div className="fintech-promo-tag vip-tag" style={{ marginBottom: '6px' }}>
                  <Zap size={11} />
                  <span>WEBSITE OWNER</span>
                </div>
                <h4 className="vip-title" style={{ fontSize: '16px', marginBottom: '4px' }}>
                  Own Your VTU Website & App
                </h4>
                <p className="vip-desc" style={{ fontSize: '13px', marginBottom: '12px' }}>
                  Launch your branded VTU website in just 5 minutes. Start free today.
                </p>
                <div className="premium-btn vip-action-btn" style={{ justifyContent: 'center', padding: '10px' }}>
                  <span>Launch My Website</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            )}


            {/* 7. Live Analytics Section */}
            {(isActiveReseller(user) || user?.role === 'admin') && (
              <>
                <div className="fintech-section-header">
                  <span>Platform Analytics</span>
                </div>
                <div className="fintech-services-grid animate-fade-in" style={{ marginBottom: '24px' }}>
                   <div className="fintech-service-card analytics-card">
                     <div className="analytics-label">Total Customers</div>
                     <div className="analytics-value">{analytics?.totalCustomers !== undefined ? analytics.totalCustomers : (user?.analytics?.totalCustomers || '...')}</div>
                   </div>
                   <div className="fintech-service-card analytics-card">
                     <div className="analytics-label">Tx Today</div>
                     <div className="analytics-value" style={{ color: '#10b981' }}>{analytics?.successfulTodayCount !== undefined ? analytics.successfulTodayCount : (successfulTodayCount || '...')}</div>
                   </div>
                   <div className="fintech-service-card analytics-card">
                     <div className="analytics-label">API Health</div>
                     <div className="analytics-value" style={{ color: '#3b82f6' }}>{analytics?.apiHealth !== undefined ? `${analytics.apiHealth}%` : '...'}</div>
                   </div>
                   <div className="fintech-service-card analytics-card">
                     <div className="analytics-label">Active Online</div>
                     <div className="analytics-value" style={{ color: '#f59e0b' }}>{analytics?.activeOnline !== undefined ? analytics.activeOnline : '...'}</div>
                   </div>
                </div>
              </>
            )}

          </div>

          {/* RIGHT / SECONDARY DESKTOP COLUMN */}
          <div className="fintech-side-grid-col">
            
            {/* 6. Campaign Grid (Moved to below Services per user priority) */}
            <CampaignGrid user={user} />

            {/* 5. Transaction History Feed */}
            <div className="fintech-section-header">
              <span>Recent Activity</span>
              <span className="fintech-section-action" onClick={() => navigate('/transactions')}>History</span>
            </div>
            <div className="fintech-activity-list animate-fade-in">
              {isLoadingTx ? (
                <>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="fintech-activity-item skeleton-row">
                      <div className="fintech-activity-left">
                        <div className="skeleton-icon shimmer"></div>
                        <div className="fintech-tx-details">
                          <div className="skeleton-text shimmer" style={{ width: '120px', marginBottom: '6px' }}></div>
                          <div className="skeleton-text shimmer" style={{ width: '80px' }}></div>
                        </div>
                      </div>
                      <div className="fintech-tx-right">
                        <div className="skeleton-text shimmer" style={{ width: '60px' }}></div>
                      </div>
                    </div>
                  ))}
                </>
              ) : transactions.length === 0 ? (
                <div className="fintech-empty-activity-card animate-fade-in">
                  <div className="empty-activity-icon-wrap">
                    <Clock size={24} />
                  </div>
                  <h5 className="empty-activity-title">No recent activity</h5>
                  <p className="empty-activity-desc">Your transactions will securely appear here.</p>
                  <button className="empty-activity-btn" onClick={() => handleServiceClick('data')}>
                    Start Transacting
                  </button>
                </div>
              ) : (
                transactions.slice(0, 3).map((tx) => {
                  const isCredit = tx.type === 'credit';
                  const isFailed = tx.status === 'failed';
                  const isPending = tx.status === 'pending';
                  
                  let iconWrapClass = 'tx-icon-debit';
                  let amtClass = 'tx-amt-debit';
                  if (isCredit) { iconWrapClass = 'tx-icon-credit'; amtClass = 'tx-amt-credit'; }
                  if (isFailed) { iconWrapClass = 'tx-icon-failed'; amtClass = 'tx-amt-failed'; }
                  if (isPending) { iconWrapClass = 'tx-icon-pending'; }

                  return (
                    <div 
                      key={tx._id} 
                      className="fintech-activity-item modern-activity-item"
                      onClick={() => setSelectedTx(tx)}
                    >
                      <div className="fintech-activity-left">
                        <div className={`fintech-tx-icon modern-tx-icon ${iconWrapClass}`}>
                          {isPending ? <Clock size={14} /> : (isFailed ? <XCircle size={14} /> : (isCredit ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />))}
                        </div>
                        <div className="fintech-tx-details">
                          <h5 className="modern-tx-title">{tx.description}</h5>
                          <p className="modern-tx-meta">
                            {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(tx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                      </div>
                      <div className="fintech-tx-right">
                        <h5 className={`modern-tx-amt ${amtClass}`}>
                          {isCredit ? '+' : '-'}{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(tx.amount)}
                        </h5>
                        <div className={`fintech-tx-status tx-status-${getCleanStatus(tx.status)}`}>
                          {getCleanStatusText(getCleanStatus(tx.status))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 6. Profile Section Card */}
            <div className="fintech-section-header">
              <span>My Profile Section</span>
            </div>
            <div className="fintech-profile-card animate-fade-in" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
              <div className="fintech-profile-info">
                <div className="fintech-avatar">
                  {getUserInitials()}
                </div>
                <div className="fintech-user-meta">
                  <h4>{user?.name || 'Customer Account'}</h4>
                  <p>{user?.email || 'Authenticated User'}</p>
                </div>
              </div>
              <div className="fintech-profile-links">
                <div className="fintech-icon-link" title="Account Settings">
                  <User size={16} />
                </div>
                <div className="fintech-icon-link" title="Security / Pin">
                  <Lock size={16} />
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Overlays / Modals */}
        {selectedTx && (
          <div className="modal-overlay animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)' }}>
            <div className="fintech-tx-modal animate-scale-in" style={{ 
                margin: 'auto', 
                marginBottom: '100px', /* Safe bottom space above navigation */
                width: '90%', maxWidth: '400px',
                background: 'var(--bg-card)',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Transaction Receipt</h3>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '16px', fontSize: '14.3px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ opacity: 0.6 }}>Reference:</span>
                  <strong style={{ fontSize: '12px', background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: '6px' }}>{selectedTx.reference}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ opacity: 0.6 }}>Service:</span>
                  <strong>{selectedTx.description}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ opacity: 0.6 }}>Amount:</span>
                  <strong style={{ fontSize: '16px' }}>₦{selectedTx.amount.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.6 }}>Status:</span>
                  <strong style={{ textTransform: 'uppercase', color: selectedTx.status === 'failed' ? '#ef4444' : '#10b981' }}>{selectedTx.status}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => {
                  navigator.clipboard.writeText(`Receipt Reference: ${selectedTx.reference}`);
                  alert("Copied to clipboard");
                }}>Copy Ref</button>
                <button style={{ flex: 1.5, padding: '14px', borderRadius: '14px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }} onClick={() => setSelectedTx(null)}>Done</button>
              </div>
            </div>
          </div>
        )}

        {externalModal.show && (
          <div className="modal-overlay">
            <div className="fintech-tx-modal animate-fade-in" style={{ margin: 'auto', borderRadius: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <ShieldAlert size={40} color="#f59e0b" style={{ margin: '0 auto' }} />
              </div>
              <h3 style={{ fontSize: '17.6px', marginBottom: '8px' }}>External Navigation</h3>
              <p style={{ fontSize: '13.2px', opacity: 0.7, textAlign: 'center', marginBottom: '20px' }}>
                You are leaving the secured app environment to open an external domain.
              </p>
              <div className="fintech-modal-grid">
                <button className="fintech-modal-btn" onClick={() => setExternalModal({ show: false, url: '' })}>Stay</button>
                <button className="fintech-modal-btn primary" onClick={confirmExternalNavigation}>Open Link</button>
              </div>
            </div>
          </div>
        )}

      </div>
      {selectedPlatform && (
        <FuturePlatformViewer platform={selectedPlatform} onClose={() => setSelectedPlatform(null)} />
      )}
    </div>
  );
};

export default Home;
