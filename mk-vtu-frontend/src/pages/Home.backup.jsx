import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Wifi, Smartphone, Zap, PlaySquare, ArrowRight, 
  ArrowDownLeft, ArrowUpRight, Clock, XCircle, CheckCircle, 
  ShieldCheck, User, Users, Lock, ChevronRight, PlusCircle, 
  Sparkles, ShieldAlert, Globe, Sun, Moon, Eye, EyeOff,
  Hash, GraduationCap, History, RefreshCcw, LayoutGrid,
  Phone, FileCheck, Fingerprint, PhoneCall, FileEdit, Headphones
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import './Home.css';
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

  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const [showAllServices, setShowAllServices] = useState(false);

  return (
    <div className="fintech-dashboard-wrapper">
      <MarketingPopup user={user} />
      <BiometricSetupPrompt user={user} />

      <div className="fintech-glow glow-top-right"></div>
      <div className="fintech-glow glow-bottom-left"></div>

      <div className="fintech-content-area animate-fade-in">
        {/* --- 1. Top Navigation --- */}
        <header className="fintech-top-nav">
          <div className="nav-profile-group" onClick={() => navigate('/profile')}>
            <div className="nav-avatar">{getUserInitials()}</div>
            <div className="nav-greeting">
              <span className="greeting-text">{greeting},</span>
              <span className="user-name">{user?.name?.split(' ')[0] || user?.username || 'Member'}</span>
            </div>
          </div>
          <div className="nav-actions">
            <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
              {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button className="icon-btn" onClick={() => navigate('/notifications')}>
              <Bell size={16} />
              {unreadCount > 0 && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
          </div>
        </header>

        {/* Alerts */}
        {user && user.isEmailVerified === false && (
           <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '12px', color: '#ef4444', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Verify email to secure your account.</span>
              <button onClick={() => navigate('/verify-email', { state: { email: user.email } })} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '10px' }}>Verify</button>
           </div>
        )}

        {/* --- 2. Premium Wallet Card --- */}
        <div className="fintech-wallet-card">
          <div className="wallet-header">
            <div className="wallet-label">
              <span>Total Balance</span>
              <button className="eye-btn" onClick={toggleBalancePrivacy}>
                {hideBalance ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {recentlyFundedStatus && (
              <div className="wallet-badge"><CheckCircle size={10} /> Active</div>
            )}
          </div>
          
          <div className="wallet-balance-row">
            <div className={"wallet-balance " + (hideBalance ? "blurred" : "")}>
              {hideBalance ? '₦ ****.**' : `₦${(user?.totalBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            </div>
          </div>

          <div className="wallet-actions">
            <div className="action-item primary" onClick={() => navigate('/wallet')}>
              <div className="action-icon-wrap"><ArrowDownLeft size={18} /></div>
              <span>Fund</span>
            </div>
            <div className="action-item" onClick={() => navigate('/wallet')}>
              <div className="action-icon-wrap"><ArrowUpRight size={18} /></div>
              <span>Transfer</span>
            </div>
            <div className="action-item" onClick={() => {
                const url = `https://${user?.domain || '9jasub.com'}`;
                window.open(url, '_blank');
              }}>
              <div className="action-icon-wrap"><Globe size={18} /></div>
              <span>Web</span>
            </div>
            <div className="action-item" onClick={() => setShowMoreMenu(true)}>
              <div className="action-icon-wrap"><LayoutGrid size={18} /></div>
              <span>More</span>
            </div>
          </div>
        </div>

        {/* --- 3. Quick Services Grid --- */}
        <div className="section-header">
          <h3>Quick Services</h3>
        </div>
        <div className="services-grid animate-fade-in">
          {/* Primary 4 Services */}
          <div className="service-card srv-yellow" onClick={() => handleServiceClick('data')}>
            <div className="service-icon-wrap"><Wifi size={20} /></div>
            <span>Data</span>
          </div>
          <div className="service-card srv-green" onClick={() => handleServiceClick('airtime')}>
            <div className="service-icon-wrap"><Smartphone size={20} /></div>
            <span>Airtime</span>
          </div>
          <div className="service-card srv-red" onClick={() => handleServiceClick('cable')}>
            <div className="service-icon-wrap"><PlaySquare size={20} /></div>
            <span>Cable TV</span>
          </div>
          <div className="service-card srv-orange" onClick={() => handleServiceClick('electricity')}>
            <div className="service-icon-wrap"><Zap size={20} /></div>
            <span>Electric</span>
          </div>

          {/* Hidden Services (Expanded on tap) */}
          {showAllServices && (
            <>
              <div className="service-card srv-pink animate-scale-in" onClick={() => handleServiceClick('epin')}>
                <div className="service-icon-wrap"><Hash size={20} /></div>
                <span>EPins</span>
              </div>
              <div className="service-card srv-blue animate-scale-in" onClick={() => handleServiceClick('education')}>
                <div className="service-icon-wrap"><GraduationCap size={20} /></div>
                <span>Education</span>
              </div>
              <div className="service-card srv-cyan animate-scale-in" onClick={() => navigate('/transactions')}>
                <div className="service-icon-wrap"><History size={20} /></div>
                <span>History</span>
              </div>
              <div className="service-card srv-purple animate-scale-in" onClick={() => navigate('/profile')}>
                <div className="service-icon-wrap"><User size={20} /></div>
                <span>Profile</span>
              </div>
            </>
          )}
        </div>
        
        {/* View More Button */}
        {!showAllServices && (
          <div className="view-more-container" style={{ textAlign: 'center', marginTop: '12px' }}>
            <button 
              onClick={() => setShowAllServices(true)}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                padding: '10px 24px', borderRadius: '16px', color: 'var(--text-dark)', 
                fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px'
              }}
            >
              View More Services <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* --- 4. Slim Promotional Banners --- */}
        <div className="slim-banners-container animate-fade-in" style={{ marginTop: '16px' }}>
          <div className="promo-banner promo-banner-website" onClick={() => navigate('/reseller')}>
            <div className="promo-banner-content">
              <h4>Launch Your Business Website</h4>
              <p>Create your professional website in minutes.</p>
            </div>
            <div className="promo-banner-action">
              <Sparkles size={12} color="#2563EB" /> Launch &rarr;
            </div>
          </div>
          
          <div className="promo-banner promo-banner-referral" onClick={() => navigate('/referrals')}>
            <div className="promo-banner-content">
              <h4>Invite Friends & Earn</h4>
              <p>{referralAnalytics?.totalReferralIncome > 0 ? `Earned: ₦${referralAnalytics.totalReferralIncome.toLocaleString()}` : 'Earn commissions whenever your referrals transact.'}</p>
            </div>
            <div className="promo-banner-action">
              <Users size={12} color="#F4B400" /> Invite &rarr;
            </div>
          </div>
        </div>

        {/* --- 5. Identity Services Grid (CheckMyNINBVN) --- */}
        <div className="section-header">
          <div className="identity-header">
            <ShieldCheck size={16} />
            <h3>Identity & Security</h3>
          </div>
        </div>
        <div className="services-grid animate-fade-in">
          <div className="service-card srv-green" onClick={() => navigate('/identity/nin-verify')}>
            <div className="service-icon-wrap"><ShieldCheck size={20} /></div>
            <span>NIN Verify</span>
          </div>
          <div className="service-card srv-yellow" onClick={() => navigate('/identity/nin-phone')}>
            <div className="service-icon-wrap"><Phone size={20} /></div>
            <span>NIN Phone</span>
          </div>
          <div className="service-card srv-cyan" onClick={() => navigate('/identity/nin-tracking')}>
            <div className="service-icon-wrap"><FileCheck size={20} /></div>
            <span>Tracking ID</span>
          </div>
          <div className="service-card srv-purple" onClick={() => navigate('/identity/nin-demographics')}>
            <div className="service-icon-wrap"><Users size={20} /></div>
            <span>Demographics</span>
          </div>
          <div className="service-card srv-blue" onClick={() => navigate('/identity/bvn-verify')}>
            <div className="service-icon-wrap"><Fingerprint size={20} /></div>
            <span>BVN Verify</span>
          </div>
          <div className="service-card srv-pink" onClick={() => navigate('/identity/bvn-phone')}>
            <div className="service-icon-wrap"><PhoneCall size={20} /></div>
            <span>BVN Phone</span>
          </div>
          <div className="service-card srv-red" onClick={() => navigate('/identity/nin-modification')}>
            <div className="service-icon-wrap"><FileEdit size={20} /></div>
            <span>NIN Modify</span>
          </div>
        </div>

        {/* --- 6. Recent Activity --- */}
        <div className="section-header">
          <h3>Recent Activity</h3>
          <span onClick={() => navigate('/transactions')}>View All</span>
        </div>
        <div className="activity-list animate-fade-in">
          {transactions.length === 0 && !isLoadingTx ? (
             <div className="empty-activity-card">
               <div className="empty-activity-icon">
                  <Clock size={24} />
               </div>
               <h4>No recent transactions yet</h4>
               <p>Your transactions will securely appear here.</p>
               <button className="empty-activity-btn" onClick={() => handleServiceClick('data')}>
                 Start Transacting
               </button>
             </div>
          ) : (
             transactions.slice(0, 5).map(tx => {
               const isCredit = tx.type === 'credit';
               const isFailed = tx.status === 'failed';
               const isPending = tx.status === 'pending';
               
               let iconClass = 'icon-debit';
               let amtClass = 'amt-debit';
               let statusClass = 'status-success';

               if (isCredit) { iconClass = 'icon-credit'; amtClass = 'amt-credit'; }
               if (isFailed) { iconClass = 'icon-failed'; amtClass = 'amt-failed'; statusClass = 'status-failed'; }
               if (isPending) { iconClass = 'icon-pending'; statusClass = 'status-pending'; }

               return (
                 <div key={tx._id} className="activity-item" onClick={() => setSelectedTx(tx)}>
                    <div className="activity-left">
                       <div className={"activity-icon " + iconClass}>
                         {isPending ? <Clock size={16} /> : isFailed ? <XCircle size={16} /> : isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                       </div>
                       <div className="activity-details">
                          <h5>{tx.description}</h5>
                          <p>{new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                       </div>
                    </div>
                    <div className="activity-right">
                       <h5 className={"activity-amt " + amtClass}>
                         {isCredit ? '+' : '-'}₦{tx.amount.toLocaleString()}
                       </h5>
                       <span className={"activity-status " + statusClass}>{tx.status}</span>
                    </div>
                 </div>
               )
             })
          )}
        </div>
      </div>

      {/* --- Modals / Overlays --- */}
      {selectedTx && (
        <div className="modal-overlay animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', background: 'var(--overlay-bg, rgba(0,0,0,0.8))', position: 'fixed', top:0, left:0, right:0, bottom:0, zIndex: 3000 }}>
          <div className="fintech-tx-modal animate-scale-in" style={{ 
              margin: 'auto', 
              width: '90%', maxWidth: '400px',
              background: 'var(--bg-surface)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-dark)'
          }}>
            <div style={{ textAlign: 'center', margin: '0 auto 20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Transaction Receipt</h3>
            </div>
            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '16px', fontSize: '13px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Reference:</span>
                <strong>{selectedTx.reference}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Service:</span>
                <strong>{selectedTx.description}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount:</span>
                <strong style={{ fontSize: '16px', color: 'var(--text-dark)' }}>₦{selectedTx.amount.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <strong style={{ textTransform: 'uppercase', color: selectedTx.status === 'failed' ? '#ef4444' : '#10b981' }}>{selectedTx.status}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ flex: 1.5, padding: '14px', borderRadius: '14px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }} onClick={() => setSelectedTx(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Custom More Bottom Sheet --- */}
      {showMoreMenu && (
        <div className="bottom-sheet-overlay" onClick={() => setShowMoreMenu(false)}>
          <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-drag-handle"></div>
            <div className="bottom-sheet-menu">
               <div className="sheet-menu-item" onClick={() => { setShowMoreMenu(false); navigate('/wallet'); }}>
                 <div className="sheet-menu-icon"><ArrowDownLeft size={18} /></div>
                 <div className="sheet-menu-text">
                   <h4>Fund Wallet</h4>
                   <p>Add money to your account instantly</p>
                 </div>
               </div>
               <div className="sheet-menu-item" onClick={() => { setShowMoreMenu(false); navigate('/wallet'); }}>
                 <div className="sheet-menu-icon"><ArrowUpRight size={18} /></div>
                 <div className="sheet-menu-text">
                   <h4>Transfer & Withdraw</h4>
                   <p>Send money to other users or withdraw</p>
                 </div>
               </div>
               <div className="sheet-menu-item" onClick={() => { setShowMoreMenu(false); navigate('/transactions'); }}>
                 <div className="sheet-menu-icon"><History size={18} /></div>
                 <div className="sheet-menu-text">
                   <h4>Transaction History</h4>
                   <p>View all your past activities</p>
                 </div>
               </div>
               <div className="sheet-menu-item" onClick={() => { setShowMoreMenu(false); navigate('/profile'); }}>
                 <div className="sheet-menu-icon"><User size={18} /></div>
                 <div className="sheet-menu-text">
                   <h4>Settings</h4>
                   <p>Manage your account and security</p>
                 </div>
               </div>
               <div className="sheet-menu-item" onClick={() => { setShowMoreMenu(false); navigate('/support'); }}>
                 <div className="sheet-menu-icon"><Headphones size={18} /></div>
                 <div className="sheet-menu-text">
                   <h4>Help & Support</h4>
                   <p>Contact us for assistance</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default Home;
