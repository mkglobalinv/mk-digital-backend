import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  Globe,
  CheckCircle,
  ArrowUpRight,
  Wallet,
  Zap,
  Copy,
  Send,
  Share2,
  PlusCircle,
  Wifi,
  Smartphone,
  Tv,
  GraduationCap,
  Settings
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import { supabase } from '../../supabaseClient';
import ResellerBusinessProfile from '../components/ResellerBusinessProfile';
import ResellerWelcomeModal from '../components/ResellerWelcomeModal.jsx';
import './ResellerDashboard.css';

const ResellerDashboard = ({ user }) => {
    const navigate = useNavigate();

    const [loginAlert, setLoginAlert] = useState(() => {
        const alert = sessionStorage.getItem('login_alert');
        if (alert) sessionStorage.removeItem('login_alert');
        return alert;
    });
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [showShareMore, setShowShareMore] = useState(false);
    const [settingUpSubdomain, setSettingUpSubdomain] = useState(false);

    const [showWebsiteReady, setShowWebsiteReady] = useState(() => {
        return document.cookie.includes('showWelcome=true');
    });

    useEffect(() => {
        if (showWebsiteReady) {
            const domain = window.location.hostname.includes('9jasub.com') ? '; domain=.9jasub.com' : '';
            document.cookie = `showWelcome=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${domain}`;
        }
    }, [showWebsiteReady]);

    const closeWebsiteReady = () => {
        setShowWebsiteReady(false);
    };

    const getResellerWebsiteUrl = () => {
        if (user?.customDomain) {
            return user.customDomain.startsWith('http') ? user.customDomain : `https://${user.customDomain}`;
        }
        if (!user?.subdomain) return null;
        return `https://${user.subdomain}.9jasub.com`;
    };

    const websiteUrl = getResellerWebsiteUrl();
    const shareText = `Buy cheap data, airtime and pay bills easily on my VTU website:\n${websiteUrl || ''}`;

    const handleCopy = () => {
        if (!websiteUrl) return;
        navigator.clipboard.writeText(websiteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClaimSubdomain = async () => {
        const base = (user?.branding?.siteName || user?.name || 'store')
            .toLowerCase().replace(/[^a-z0-9]/g, '');
        setSettingUpSubdomain(true);
        try {
            const res = await API.post('/api/reseller/claim-subdomain', { baseName: base || 'store' });
            if (res.data?.subdomain) {
                alert(`Your store URL is now: https://${res.data.subdomain}.9jasub.com\n\nRefreshing dashboard...`);
                window.location.reload();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to claim subdomain. Please contact support.');
        } finally {
            setSettingUpSubdomain(false);
        }
    };

    const shareOnWhatsApp = () => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
    };

    const shareOnTelegram = () => {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(websiteUrl || '')}&text=${encodeURIComponent('Buy cheap data, airtime and pay bills on my VTU store!')}`, '_blank');
    };

    const shareOnFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(websiteUrl || '')}`, '_blank');
    };

    const shareNative = () => {
        if (navigator.share) {
            navigator.share({
                title: user?.branding?.siteName || 'My VTU Website',
                text: 'Buy cheap data, airtime and pay bills easily on my VTU website!',
                url: websiteUrl || ''
            }).catch(() => {});
        }
    };

    useEffect(() => {
        if (!user?._id) return;
        fetchStats();

        const walletChannel = supabase.channel(`dashboard-wallet-${user._id}`)
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${user._id}` },
                (payload) => {
                    setStats(prev => prev ? { ...prev, walletBalance: payload.new.earnings_balance } : prev);
                }
            )
            .subscribe();

        const handleWalletRefresh = () => fetchStats();
        window.addEventListener('wallet:refresh', handleWalletRefresh);

        return () => {
            supabase.removeChannel(walletChannel);
            window.removeEventListener('wallet:refresh', handleWalletRefresh);
        };
    }, [user?._id]);

    const fetchStats = async () => {
        try {
            const res = await API.get('/api/reseller/stats');
            setStats(res.data);
        } catch (err) {
            console.error('Failed to fetch reseller stats', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
        <div className="reseller-dashboard">
            <ResellerWelcomeModal user={user} />
            
            <div className="res-dash-header">Loading Website Admin Console...</div>
            </div>
        );
    }

    const businessCards = [
        { id: 'todaySales', title: 'Today Earnings', value: `₦${(stats?.todaySales || stats?.revenue || 0).toLocaleString()}`, icon: <TrendingUp size={24} color="#f59e0b" />, trend: '+18%', bg: '#fffbeb' },
        { id: 'users', title: 'Total Customers', value: stats?.totalUsers || 0, icon: <Users size={24} color="#6366f1" />, trend: '+12%', bg: '#eff6ff' },
        { id: 'tx', title: 'Total Transactions', value: stats?.totalTransactions || 0, icon: <CreditCard size={24} color="#10b981" />, trend: '+5.4%', bg: '#ecfdf5' },
        { id: 'status', title: 'Subscription Status', value: user?.resellerTier === 'premium' ? 'Premium Active' : (user?.subdomain ? 'Active' : 'Pending'), icon: <Globe size={24} color={user?.subdomain ? '#10b981' : '#ef4444'} />, trend: 'Online', bg: '#f8fafc' },
    ];

    const onboardingSteps = [
        { id: 1, label: 'Brand Name', done: !!user?.branding?.siteName },
        { id: 2, label: 'Logo Upload', done: !!user?.branding?.logo },
        { id: 3, label: 'Subdomain', done: !!user?.subdomain },
        { id: 4, label: 'Pricing Rules', done: stats?.pricingSet || false },
        { id: 5, label: 'First Customer', done: (stats?.totalUsers || 0) > 0 },
        { id: 6, label: 'Custom Domain', done: !!user?.customDomain },
    ];

    const completedSteps = onboardingSteps.filter(s => s.done).length;
    const progressPct = Math.round((completedSteps / onboardingSteps.length) * 100);

    const daysRemaining = user?.trialEndDate ? Math.max(0, Math.ceil((new Date(user.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
    const isUserActivated = user?.isResellerActivated === true;
    const isTrialActive = !isUserActivated && daysRemaining > 0;
    const isTrialExpired = !isUserActivated && daysRemaining <= 0;

    const handlePayActivation = async () => {
        const confirmText = `Confirm Website Activation\n\nYou are about to activate your Website. A Website Setup & Activation Fee of ₦5,000 will be deducted from your balance.\n\nDo you want to continue?`;
        
        if (window.confirm(confirmText)) {
            try {
                const res = await API.post('/api/reseller/pay-activation');
                alert(res.data.message);
                window.location.reload();
            } catch (err) {
                alert(err.response?.data?.message || 'Activation failed. Ensure you have enough balance.');
            }
        }
    };

    const daysUntilPremiumExpiry = user?.subscriptionExpiresAt
        ? Math.max(0, Math.ceil((new Date(user.subscriptionExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
        : 0;

    if (showWebsiteReady) {
        return (
            <div className="website-ready-overlay animate-scale-in" style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100000,
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
            }}>
                <div style={{
                    background: '#fff', borderRadius: '24px', padding: '40px', maxWidth: '500px', width: '100%',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', textAlign: 'center'
                }}>
                    <div style={{ 
                        width: '80px', height: '80px', background: '#ecfdf5', borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' 
                    }}>
                        <CheckCircle size={40} color="#10b981" />
                    </div>
                    <h1 style={{ fontSize: '28px', color: '#0f172a', margin: '0 0 16px', fontWeight: '800' }}>
                        🎉 Your website is ready!
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.5', margin: '0 0 32px' }}>
                        Your VTU platform <strong>{user?.branding?.siteName}</strong> is live. You can now start sharing your link and making sales.
                    </p>

                    <div style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px',
                        padding: '16px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px'
                    }}>
                        <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Website URL</div>
                            <div style={{ fontSize: '15px', color: '#3b82f6', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {websiteUrl}
                            </div>
                        </div>
                        <button onClick={handleCopy} style={{
                            width: '40px', height: '40px', borderRadius: '10px', border: '1px solid #e2e8f0',
                            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#64748b', transition: 'all 0.2s'
                        }} title="Copy Link">
                            {copied ? <CheckCircle size={20} color="#10b981" /> : <Copy size={20} />}
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                        <button onClick={() => window.open(websiteUrl, '_blank')} style={{
                            padding: '14px', borderRadius: '12px', border: 'none', background: 'rgba(59,130,246,0.1)',
                            color: '#3b82f6', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
                        }}>
                            <Globe size={18} /> Preview Website
                        </button>
                        <button onClick={shareOnWhatsApp} style={{
                            padding: '14px', borderRadius: '12px', border: 'none', background: 'rgba(16,185,129,0.1)',
                            color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
                        }}>
                            <Share2 size={18} /> Share Link
                        </button>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button onClick={handlePayActivation} style={{
                            padding: '16px', borderRadius: '12px', border: 'none', background: '#3b82f6',
                            color: '#fff', fontWeight: '800', fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
                        }}>
                            Website Setup & Activation Fee
                        </button>
                        <button onClick={closeWebsiteReady} style={{
                            padding: '16px', borderRadius: '12px', border: 'none', background: 'transparent',
                            color: '#64748b', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s'
                        }}>
                            Continue Trial
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="reseller-dashboard-view">
            <ResellerWelcomeModal user={user} />

            {/* Login Alert Banner */}
            {loginAlert && (
                <div className={`login-alert-banner ${loginAlert === 'suspicious' ? 'suspicious' : 'success'}`} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                    borderRadius: '16px',
                    background: loginAlert === 'suspicious' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    border: loginAlert === 'suspicious' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                    color: loginAlert === 'suspicious' ? '#ef4444' : '#10b981',
                    margin: '8px 0 16px 0', fontSize: '14px', fontWeight: '600',
                    backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'relative'
                }}>
                    <span>{loginAlert === 'suspicious' ? '⚠️' : '🟢'}</span>
                    <span>{loginAlert === 'suspicious' ? 'Suspicious login detected.' : 'New login detected successfully.'}</span>
                    <button onClick={() => setLoginAlert(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', fontSize: '16px', cursor: 'pointer', padding: '0 4px' }}>
                        &times;
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="dashboard-section-header">
                <div className="header-top-row">
                    <div>
                        <h1>Website Overview</h1>
                        <p>
                            Welcome back, <strong>{user?.name}</strong>. Here's what's happening with your platform today.
                        </p>
                    </div>
                    {user?.isResellerActivated === false ? (
                        <div className="badge-starter" style={{ background: '#fef3c7', color: '#b45309' }}>Free Website Trial</div>
                    ) : user?.resellerTier === 'premium' ? (
                        <div className="badge-premium">
                            <ShieldCheck size={14} style={{ marginRight: '6px' }} />
                            Hosted Website
                        </div>
                    ) : user?.resellerTier === 'vip' ? (
                        <div className="badge-premium" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' }}>
                            <ShieldCheck size={14} style={{ marginRight: '6px' }} />
                            VIP Website
                        </div>
                    ) : (
                        <div className="badge-starter">Website Setup & Activation</div>
                    )}
                </div>
            </div>

            {/* Trial / Activation Banner */}
            {!isUserActivated && (
                <div className={`trial-banner ${isTrialActive ? 'active' : 'expired'}`}>
                    <div className="banner-icon-box">
                        <Zap size={32} color={isTrialActive ? '#3b82f6' : '#ef4444'} />
                    </div>
                    <div className="banner-text">
                        <h3>{isTrialActive ? `Free Trial: ${daysRemaining} Days Remaining` : 'Trial Expired'}</h3>
                        <p>{isTrialActive ? 'Activate your website now to ensure uninterrupted service after the trial ends.' : 'Your website is currently in a grace period/suspended. Pay the Website Setup & Activation Fee to restore services.'}</p>
                    </div>
                    <button className="banner-btn" onClick={handlePayActivation}>Pay Setup & Activation (₦5,000)</button>
                </div>
            )}

            {/* Premium Status Banner */}
            {user?.resellerTier === 'premium' && (
                <div className="premium-banner">
                    <div className="banner-main">
                        <div className="banner-icon-box small">
                            <ShieldCheck size={24} color="#8b5cf6" />
                        </div>
                        <div className="banner-text">
                            <h4>Website Hosting & Maintenance Fee Active</h4>
                            <p>Expires in <strong>{daysUntilPremiumExpiry} days</strong> ({new Date(user.subscriptionExpiresAt).toLocaleDateString()})</p>
                        </div>
                    </div>
                    <button className="banner-btn secondary" onClick={() => navigate('/reseller/premium')}>Extend Subscription</button>
                </div>
            )}

            {/* Wallet Panel */}
            <div className="reseller-wallet-control-panel">
                <div className="wallet-panel-title">
                    <TrendingUp size={20} color="var(--reseller-primary)" />
                    <span>Website Accounts &amp; Settlement</span>
                </div>
                <div className="wallet-panel-grid">
                    <div className="wallet-subcard main-wallet">
                        <div className="wallet-subcard-header">
                            <div className="wallet-label-group">
                                <span className="wallet-tag">Operating Balance</span>
                                <h4 className="wallet-subcard-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>Main Wallet</h4>
                            </div>
                            <div className="wallet-icon-box main"><Wallet size={20} /></div>
                        </div>
                        <div className="wallet-balance-row">
                            <span className="currency-symbol">₦</span>
                            <span className="balance-value">{(user?.totalBalance ?? stats?.walletBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="wallet-actions">
                            <button className="wallet-action-btn fund" onClick={() => navigate('/reseller/wallet', { state: { tab: 'fund' } })}>
                                <PlusCircle size={16} /><span>Fund Wallet</span>
                            </button>
                        </div>
                    </div>
                    <div className="wallet-subcard profit-wallet">
                        <div className="wallet-subcard-header">
                            <div className="wallet-label-group">
                                <span className="wallet-tag commission">Withdrawable Profit</span>
                                <h4 className="wallet-subcard-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>Profit Wallet</h4>
                            </div>
                            <div className="wallet-icon-box profit"><TrendingUp size={20} /></div>
                        </div>
                        <div className="wallet-balance-row">
                            <span className="currency-symbol">₦</span>
                            <span className="balance-value">{(user?.profitBalance ?? user?.earningsBalance ?? stats?.totalProfit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="wallet-actions">
                            <button className="wallet-action-btn withdraw" onClick={() => navigate('/reseller/wallet', { state: { tab: 'bank' } })}>
                                <ArrowUpRight size={16} /><span>Withdraw Profit</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Services */}
            <div className="dashboard-main-grid" style={{ display: 'block', marginBottom: '24px' }}>
                <div className="business-card">
                    <div className="card-title-bar">
                        <h3>Quick Services</h3>
                    </div>
                    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', background: '#f8fafc' }}>
                        <div onClick={() => navigate('/reseller/purchase', { state: { defaultTab: 'data' } })} className="quick-action-card">
                            <div className="quick-action-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)' }}><Wifi size={26} color="#3b82f6" /></div>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Buy Data</h4>
                        </div>
                        <div onClick={() => navigate('/reseller/purchase', { state: { defaultTab: 'airtime' } })} className="quick-action-card">
                            <div className="quick-action-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)' }}><Smartphone size={26} color="#10b981" /></div>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Airtime</h4>
                        </div>
                        <div onClick={() => navigate('/reseller/purchase', { state: { defaultTab: 'electricity' } })} className="quick-action-card">
                            <div className="quick-action-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)' }}><Zap size={26} color="#f59e0b" /></div>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Electricity</h4>
                        </div>
                        <div onClick={() => navigate('/reseller/purchase', { state: { defaultTab: 'cable' } })} className="quick-action-card">
                            <div className="quick-action-icon-box" style={{ background: 'rgba(139, 92, 246, 0.1)' }}><Tv size={26} color="#8b5cf6" /></div>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Cable TV</h4>
                        </div>
                        <div onClick={() => navigate('/reseller/purchase', { state: { defaultTab: 'education' } })} className="quick-action-card">
                            <div className="quick-action-icon-box" style={{ background: 'rgba(236, 72, 153, 0.1)' }}><GraduationCap size={26} color="#ec4899" /></div>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Exam Pins</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="business-stats-grid">
                {businessCards.map(card => (
                    <div key={card.id} className="business-stat-card">
                        <div className="stat-card-header">
                            <div className="stat-icon-box" style={{ background: card.bg }}>{card.icon}</div>
                            <div className={`stat-trend ${card.trend.includes('+') ? 'up' : ''}`}>
                                {card.trend.includes('+') && <ArrowUpRight size={14} />}
                                {card.trend}
                            </div>
                        </div>
                        <div className="stat-card-body">
                            <h3>{card.title}</h3>
                            <h2>{card.value}</h2>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Website Actions */}
            <div className="dashboard-main-grid" style={{ display: 'block', marginBottom: '24px' }}>
                <div className="business-card">
                    <div className="card-title-bar">
                        <h3>Quick Website Actions</h3>
                    </div>
                    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc' }}>
                        <div onClick={() => navigate('/reseller/wallet')} className="quick-action-card">
                            <div className="quick-action-icon-box" style={{ background: 'rgba(99, 102, 241, 0.1)' }}><Wallet size={26} color="var(--reseller-primary)" /></div>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Fund Wallet</h4>
                        </div>
                        <div onClick={() => navigate('/reseller/settings')} className="quick-action-card">
                            <div className="quick-action-icon-box" style={{ background: 'rgba(71, 85, 105, 0.1)' }}><Settings size={26} color="#475569" /></div>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Website Settings</h4>
                        </div>
                        <div onClick={() => navigate('/reseller/wallet')} className="quick-action-card">
                            <div className="quick-action-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)' }}><Send size={26} color="#10b981" /></div>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Transfer Funds</h4>
                        </div>
                        <div onClick={() => navigate('/reseller/customers')} className="quick-action-card">
                            <div className="quick-action-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)' }}><Users size={26} color="#3b82f6" /></div>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Manage Customers</h4>
                        </div>
                        <div onClick={() => navigate('/reseller/premium')} className="quick-action-card" style={{ background: 'linear-gradient(135deg, #4f46e5, #9333ea)', border: 'none' }}>
                            <div className="quick-action-icon-box" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}><ShieldCheck size={26} color="#ffffff" /></div>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Upgrade to VIP</h4>
                        </div>
                        <div onClick={() => navigate('/reseller/transactions')} className="quick-action-card">
                            <div className="quick-action-icon-box" style={{ background: 'rgba(139, 92, 246, 0.1)' }}><TrendingUp size={26} color="#8b5cf6" /></div>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>View Reports</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* How Do You Earn Info Card */}
            <div className="dashboard-main-grid" style={{ display: 'block', marginBottom: '24px' }}>
                    <div className="business-card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }}></div>
                        <div className="card-title-bar" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                💡 How Do You Earn?
                            </h3>
                        </div>
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                                Your website allows you to sell digital services such as airtime, data bundles, electricity payments, cable TV subscriptions, and more.
                                When customers place orders through your website, the selling price is determined by your current pricing settings.
                            </p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', position: 'relative', zIndex: 1 }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <div style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '6px', borderRadius: '8px' }}><Settings size={18} /></div>
                                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Default Pricing</h4>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>With the Standard Setup, default prices are already configured so you can start selling immediately.</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <div style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', padding: '6px', borderRadius: '8px' }}><TrendingUp size={18} /></div>
                                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Advanced Control</h4>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>After paying the Website Hosting & Maintenance Fee, you can customize your own selling prices and build your own pricing strategy.</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <div style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', padding: '6px', borderRadius: '8px' }}><Wallet size={18} /></div>
                                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Business Profit</h4>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>The difference between your selling price and your service cost becomes your business profit.</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <div style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa', padding: '6px', borderRadius: '8px' }}><Users size={18} /></div>
                                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Your Goal</h4>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>Your goal is to attract customers, provide reliable service, and grow your business over time.</p>
                                </div>
                            </div>
                            
                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '16px', borderRadius: '12px', marginTop: '8px', position: 'relative', zIndex: 1 }}>
                                <p style={{ margin: 0, fontSize: '14px', color: '#fcd34d', lineHeight: '1.5', fontWeight: 500 }}>
                                    <strong style={{ color: '#fbbf24' }}>Important Notice:</strong> Your earnings depend on the prices you choose, the services you sell, and the number of customers using your website. {user?.branding?.siteName || 'The platform'} does not guarantee a fixed income or profit.
                                </p>
                            </div>
                        </div>
                </div>
            </div>

            {/* Growth Analytics Chart */}
            <div className="dashboard-main-grid">
                <div className="business-card">
                    <div className="card-title-bar">
                        <h3>Growth Analytics</h3>
                        <select style={{ border: 'none', background: 'none', fontSize: '14.3px', fontWeight: 600, color: 'var(--reseller-primary)' }}>
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <div style={{ height: '300px', padding: '20px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.daily || []}>
                                <defs>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--reseller-primary)" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="var(--reseller-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="profit" stroke="var(--reseller-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Onboarding Progress Tracker */}
            {progressPct < 100 && (
                <div className="onboarding-tracker">
                    <div className="tracker-header">
                        <h3>Complete Your Brand Setup</h3>
                        <span className="progress-pct">{progressPct}% Completed</span>
                    </div>
                    <div className="tracker-steps">
                        {onboardingSteps.map(step => (
                            <div key={step.id} className={`tracker-step ${step.done ? 'done' : ''}`}>
                                {step.done
                                    ? <CheckCircle size={16} className="check-icon" />
                                    : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #cbd5e1' }}></div>
                                }
                                <span>{step.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* My Website / Store URL Section */}
            <div className="business-card" style={{ marginBottom: '24px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: websiteUrl ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: websiteUrl ? '#10b981' : '#f59e0b', flexShrink: 0
                    }}>
                        {websiteUrl ? <CheckCircle size={20} /> : <Globe size={20} />}
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: websiteUrl ? '#10b981' : '#f59e0b' }}>
                            {websiteUrl ? '✓ Active Store URL' : '⚠ Store URL Not Yet Assigned'}
                        </h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--reseller-text-muted)', lineHeight: '1.4' }}>
                            {websiteUrl
                                ? 'Your customer storefront is live. Share this link to start getting sales.'
                                : 'Your store URL has not been set up yet. Click below to activate your storefront instantly.'}
                        </p>
                    </div>
                </div>

                {!websiteUrl ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ marginBottom: '16px', padding: '16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px' }}>
                            <p style={{ margin: 0, fontSize: '14px', color: '#92400e', fontWeight: 600 }}>
                                Every reseller gets a free storefront URL. Click below to claim yours instantly.
                            </p>
                        </div>
                        <button
                            onClick={handleClaimSubdomain}
                            disabled={settingUpSubdomain}
                            style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                gap: '10px', background: 'var(--reseller-primary)', color: 'white',
                                border: 'none', padding: '14px 28px', borderRadius: '12px',
                                fontSize: '15px', fontWeight: 800, cursor: 'pointer',
                                opacity: settingUpSubdomain ? 0.7 : 1, transition: 'all 0.2s'
                            }}
                        >
                            <Zap size={18} />
                            {settingUpSubdomain ? 'Activating...' : 'Activate My Store URL Now'}
                        </button>
                    </div>
                ) : (
                    <div>
                        {/* URL Display Bar */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: '#f8fafc', border: '1px solid var(--reseller-border)',
                            borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', gap: '12px'
                        }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '14.5px', color: 'var(--reseller-primary)', fontWeight: 700, wordBreak: 'break-all', flex: 1 }}>
                                {websiteUrl}
                            </span>
                            <button onClick={handleCopy} title="Copy Link" style={{ background: 'white', border: '1px solid var(--reseller-border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--reseller-text-muted)', transition: 'all 0.2s', flexShrink: 0 }}>
                                {copied ? <CheckCircle size={16} color="var(--reseller-success)" /> : <Copy size={16} />}
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button onClick={handleCopy} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'white', border: '1px solid var(--reseller-border)', color: 'var(--reseller-text-dark)', padding: '10px 18px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', flex: '1 1 auto' }}>
                                <Copy size={16} /><span>Copy URL</span>
                            </button>
                            <button onClick={() => window.open(websiteUrl, '_blank')} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'white', border: '1px solid var(--reseller-border)', color: 'var(--reseller-primary)', padding: '10px 18px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', flex: '1 1 auto' }}>
                                <Globe size={16} /><span>Open Store</span>
                            </button>
                            {(localStorage.getItem('superAdminToken') || user?.role === 'superadmin' || localStorage.getItem('adminToken')) && (
                                <button
                                    onClick={() => {
                                        const newSub = prompt('Enter new subdomain for this reseller:');
                                        if (newSub) {
                                            API.post('/api/admin/resellers/regenerate-url', { resellerId: user._id, newSubdomain: newSub })
                                                .then(r => { alert('URL Updated: ' + r.data.subdomain); window.location.reload(); })
                                                .catch(err => alert('Error: ' + (err.response?.data?.message || err.message)));
                                        }
                                    }}
                                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#ef4444', border: 'none', color: 'white', padding: '10px 18px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', flex: '1 1 auto' }}
                                >
                                    <Zap size={16} /><span>Regenerate URL</span>
                                </button>
                            )}
                            <button onClick={shareOnWhatsApp} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25D366', border: 'none', color: 'white', padding: '10px 18px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(37, 211, 102, 0.2)', flex: '1 1 auto' }}>
                                <Send size={16} /><span>Share on WhatsApp</span>
                            </button>
                            <button onClick={() => setShowShareMore(!showShareMore)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.08)', border: 'none', color: 'var(--reseller-primary)', padding: '10px 18px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', flex: '1 1 auto' }}>
                                <Share2 size={16} /><span>Share More</span>
                            </button>
                        </div>

                        {/* Share More Panel */}
                        {showShareMore && (
                            <div style={{ marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--reseller-border)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <button onClick={shareOnTelegram} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#0088cc', border: 'none', color: 'white', padding: '8px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', flex: '1 1 auto' }}>
                                    Telegram
                                </button>
                                <button onClick={shareOnFacebook} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#3b5998', border: 'none', color: 'white', padding: '8px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', flex: '1 1 auto' }}>
                                    Facebook
                                </button>
                                {navigator.share && (
                                    <button onClick={shareNative} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--reseller-primary)', border: 'none', color: 'white', padding: '8px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', flex: '1 1 auto' }}>
                                        System Share
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Website Profile */}
            <ResellerBusinessProfile user={user} />

            {/* Copy Toast */}
            {copied && (
                <div className="copy-success-toast">
                    <CheckCircle size={16} />
                    <span>Website link copied!</span>
                </div>
            )}
        </div>
    );
};

export default ResellerDashboard;
