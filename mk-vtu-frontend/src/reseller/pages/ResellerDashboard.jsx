import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import { supabase } from '../../supabaseClient';
import { CheckCircle, Globe, Share2, TrendingUp, Users, CreditCard, ShieldCheck, Zap, Settings, Wallet } from 'lucide-react';
import ResellerWelcomeModal from '../components/ResellerWelcomeModal';

import FintechHeader from '../../components/fintech/FintechHeader';
import StatsCard from '../../components/fintech/StatsCard';
import '../../components/fintech/FintechComponents.css';

const ResellerDashboard = ({ user }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loginAlert, setLoginAlert] = useState(() => {
        const alert = sessionStorage.getItem('login_alert');
        if (alert) {
            sessionStorage.removeItem('login_alert');
        }
        return alert;
    });

    const [showWebsiteReady, setShowWebsiteReady] = useState(false);
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (user?.subdomain) {
            const url = `https://${user.subdomain}.9jasub.com`;
            setWebsiteUrl(url);
            if (sessionStorage.getItem('just_activated_subdomain') === 'true') {
                setShowWebsiteReady(true);
                sessionStorage.removeItem('just_activated_subdomain');
            }
        }
    }, [user]);

    const handleCopy = () => {
        navigator.clipboard.writeText(websiteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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

    const handlePayActivation = async () => {
        const confirmText = `Confirm Website Activation\n\nYou are about to activate your Website. A Website Setup & Activation Fee of ,5,000 will be deducted from your balance.\n\nDo you want to continue?`;
        
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

    if (loading) {
        return (
            <div className="fintech-dashboard-wrapper">
                <ResellerWelcomeModal user={user} />
                <div className="fintech-content-area" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-gray)' }}>
                    Loading Business Console...
                </div>
            </div>
        );
    }

    const businessCards = [
        { id: 'todaySales', title: 'Today Earnings', value: `,${(stats?.todaySales || stats?.revenue || 0).toLocaleString()}`, icon: <TrendingUp size={20} color="#f59e0b" />, trend: '+18%', bg: 'rgba(245, 158, 11, 0.1)', trendColor: '#f59e0b' },
        { id: 'users', title: 'Total Customers', value: stats?.totalUsers || 0, icon: <Users size={20} color="#3b82f6" />, trend: '+12%', bg: 'rgba(59, 130, 246, 0.1)' },
        { id: 'tx', title: 'Total Transactions', value: stats?.totalTransactions || 0, icon: <CreditCard size={20} color="#10b981" />, trend: '+5.4%', bg: 'rgba(16, 185, 129, 0.1)' },
        { id: 'status', title: 'Subscription Status', value: user?.resellerTier === 'premium' ? 'Premium Active' : (user?.subdomain ? 'Active' : 'Pending'), icon: <Globe size={20} color={user?.subdomain ? '#10b981' : '#ef4444'} />, trend: 'Online', bg: 'rgba(255, 255, 255, 0.05)', trendColor: user?.subdomain ? '#10b981' : '#ef4444' },
    ];

    const isUserActivated = user?.isResellerActivated === true;
    const daysRemaining = user?.trialEndDate ? Math.max(0, Math.ceil((new Date(user.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
    const isTrialActive = !isUserActivated && daysRemaining > 0;

    return (
        <div className="fintech-dashboard-wrapper">
            <ResellerWelcomeModal user={user} />
            <div className="fintech-glow glow-top-right"></div>
            <div className="fintech-glow glow-bottom-left"></div>

            <div className="fintech-content-area animate-fade-in">
                <FintechHeader user={user} />

                {loginAlert && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                        borderRadius: '16px',
                        background: loginAlert === 'suspicious' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        border: loginAlert === 'suspicious' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                        color: loginAlert === 'suspicious' ? '#ef4444' : '#10b981',
                        marginBottom: '16px', fontSize: '12px', fontWeight: '600'
                    }}>
                        <span>{loginAlert === 'suspicious' ? '⚠️ Suspicious login detected.' : '✅ New login detected successfully.'}</span>
                        <button onClick={() => setLoginAlert(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', fontSize: '16px', cursor: 'pointer' }}>&times;</button>
                    </div>
                )}

                {!isUserActivated && (
                    <div style={{
                        background: isTrialActive ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(21, 21, 21, 0) 100%)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${isTrialActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                        borderRadius: '16px', padding: '16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Zap size={24} color={isTrialActive ? '#3b82f6' : '#ef4444'} />
                            <div>
                                <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-dark)' }}>
                                    {isTrialActive ? `Free Trial: ${daysRemaining} Days Remaining` : 'Trial Expired'}
                                </h4>
                                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-gray)' }}>
                                    {isTrialActive ? 'Activate your website now to ensure uninterrupted service.' : 'Pay the Activation Fee to restore services.'}
                                </p>
                            </div>
                        </div>
                        <button onClick={handlePayActivation} className="fintech-outline-btn" style={{ borderColor: isTrialActive ? '#3b82f6' : '#ef4444', color: isTrialActive ? '#3b82f6' : '#ef4444', padding: '8px' }}>
                            Pay Setup & Activation (,5,000)
                        </button>
                    </div>
                )}

                <div className="section-header">
                    <h3>Business Metrics</h3>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    {businessCards.map(card => (
                        <StatsCard key={card.id} {...card} />
                    ))}
                </div>

                <div className="section-header">
                    <h3>How Do You Earn?</h3>
                </div>
                <div className="fintech-stats-card" style={{ background: 'var(--bg-surface)', padding: '20px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-gray)', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                        Your website allows you to sell digital services such as airtime, data bundles, electricity payments, cable TV subscriptions, and more. When customers place orders through your website, the selling price is determined by your current pricing settings. The difference between your selling price and your service cost becomes your business profit.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <Settings size={14} color="#34d399" />
                                <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Default Pricing</h4>
                            </div>
                            <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-gray)' }}>Standard default prices are configured immediately.</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <Wallet size={14} color="#fbbf24" />
                                <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Profit Margins</h4>
                            </div>
                            <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-gray)' }}>You keep the difference between cost and selling price.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ResellerDashboard;
