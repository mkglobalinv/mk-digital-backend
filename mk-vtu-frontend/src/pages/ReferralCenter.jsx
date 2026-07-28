import React, { useState, useEffect } from 'react';
import { Share2, Copy, Users, RefreshCw, Trophy, ArrowLeft, CheckCircle2, TrendingUp, Gift, Wallet, ArrowUpRight, Clock, Info, X, UserPlus, Briefcase, ShoppingCart, Infinity } from 'lucide-react';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import './ReferralCenter.css';

const ReferralCenter = ({ user, siteInfo }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [referralLink, setReferralLink] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [history, setHistory] = useState([]);
    const [copied, setCopied] = useState(false);
    const [showHowToEarn, setShowHowToEarn] = useState(false);
    const isResellerScope = window.location.pathname.startsWith('/reseller');

    useEffect(() => {
        const fetchReferralData = async () => {
            try {
                const [linkRes, analyticsRes, historyRes] = await Promise.all([
                    API.get('/user/referral-link'),
                    API.get('/api/user/referral-analytics'),
                    API.get('/user/referrals')
                ]);

                if (linkRes.data.status === 'success') {
                    setReferralLink(linkRes.data.data.referralUrl);
                    setReferralCode(linkRes.data.data.referralCode);
                }
                if (analyticsRes.data.status === 'success') {
                    setAnalytics(analyticsRes.data.data);
                }
                if (historyRes.data.status === 'success') {
                    setHistory(historyRes.data.data);
                }
            } catch (err) {
                window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: "Failed to load referral data", type: "error" } }));
            } finally {
                setLoading(false);
            }
        };
        fetchReferralData();
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: "Referral Link Copied!", type: "success" } }));
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Join me on ${siteInfo?.branding?.siteName || '9JASUB'}`,
                    text: `Sign up using my referral code ${referralCode} and let's earn rewards together!`,
                    url: referralLink,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            handleCopy();
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <RefreshCw className="animate-spin" size={36} />
                <p className="loading-text">Loading Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="referral-container">
            {/* Header */}
            <div className="referral-header">
                <button onClick={() => navigate(isResellerScope ? '/reseller/dashboard' : '/home')} className="back-btn">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="header-title">Referral Center</h1>
            </div>

            <div className="referral-content">
                
                {/* Referral Wallet Card */}
                <div className="glass-card wallet-card">
                    <div className="wallet-card-bg-glow"></div>
                    <div className="wallet-header">
                        <Wallet size={18} />
                        <span>Referral Wallet Balance</span>
                    </div>
                    <div className="wallet-balances">
                        <div className="balance-group">
                            <p className="balance-label">Withdrawable Earnings</p>
                            <p className="balance-amount">₦{((user?.earningsBalance || 0)).toLocaleString()}</p>
                        </div>
                        <div className="balance-group" style={{ display: 'none' }}>
                            <p className="balance-label">Current Available Earnings</p>
                            <p className="balance-amount small">₦{((user?.earningsBalance || 0)).toLocaleString()}</p>
                        </div>
                        <button onClick={() => navigate(isResellerScope ? '/reseller/wallet' : '/wallet')} className="withdraw-btn">
                            Withdraw
                        </button>
                    </div>
                </div>

                {/* Dashboard Summary Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon-wrapper icon-blue">
                            <Users size={20} />
                        </div>
                        <p className="stat-label">Total Referrals</p>
                        <p className="stat-value">{analytics?.totalReferrals || 0}</p>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-icon-wrapper icon-green">
                            <CheckCircle2 size={20} />
                        </div>
                        <p className="stat-label">Active Referrals</p>
                        <p className="stat-value">{analytics?.activatedReferrals || 0}</p>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-icon-wrapper icon-yellow">
                            <Gift size={20} />
                        </div>
                        <p className="stat-label">Activation Rewards</p>
                        <p className="stat-value">₦{(analytics?.activationRewardsEarned || 0).toLocaleString()}</p>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-icon-wrapper icon-purple">
                            <TrendingUp size={20} />
                        </div>
                        <p className="stat-label">Commission Earnings</p>
                        <p className="stat-value">₦{(analytics?.lifetimeReferralEarnings || 0).toLocaleString()}</p>
                    </div>

                    <div className="stat-card" style={{ borderColor: '#3B82F6', background: 'linear-gradient(145deg, #1E3A8A, #0F172A)' }}>
                        <div className="stat-icon-wrapper icon-blue" style={{ background: '#3B82F6', color: '#FFF' }}>
                            <ArrowUpRight size={20} />
                        </div>
                        <p className="stat-label" style={{ color: '#BFDBFE' }}>Total Earnings</p>
                        <p className="stat-value">₦{(analytics?.totalReferralIncome || 0).toLocaleString()}</p>
                    </div>
                </div>

                {/* Referral Link Card */}
                <div className="glass-card link-card">
                    <div className="link-header">
                        <div className="link-title-group">
                            <Trophy size={20} color="#FACC15" />
                            <h2 className="link-title">Your Referral Link</h2>
                        </div>
                        {referralCode && (
                            <span className="link-badge">Referral Code: {referralCode}</span>
                        )}
                    </div>
                    <p className="link-desc">Share this link and earn rewards whenever your friends join and transact.</p>
                    
                    <div className="link-input-wrapper">
                        <input type="text" className="link-input" readOnly value={referralLink} />
                    </div>
                    
                    <div className="link-actions">
                        <button onClick={handleCopy} className={`action-btn btn-copy ${copied ? 'copied' : ''}`}>
                            {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                            {copied ? 'Copied' : 'Copy Link'}
                        </button>
                        <button onClick={handleShare} className="action-btn btn-share">
                            <Share2 size={18} />
                            Share Link
                        </button>
                    </div>
                </div>

                {/* How to Earn Banner Button */}
                <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'linear-gradient(145deg, #1E293B, #0F172A)' }} onClick={() => setShowHowToEarn(true)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="step-icon-wrapper" style={{ margin: 0, width: '40px', height: '40px', background: 'rgba(234, 179, 8, 0.1)', color: '#FACC15' }}>
                            <Info size={20} />
                        </div>
                        <div>
                            <h3 className="step-title" style={{ fontSize: '1rem' }}>Learn How To Earn</h3>
                            <p className="step-desc" style={{ marginTop: '2px' }}>Understand the referral process and commission structure.</p>
                        </div>
                    </div>
                    <ArrowUpRight size={20} color="#64748B" />
                </div>

                {/* Referral History */}
                <div>
                    <h3 className="section-title">Referral History</h3>
                    <div className="history-container">
                        {history.length > 0 ? (
                            <>
                                <div className="history-header">
                                    <span className="col-title">Name</span>
                                    <span className="col-title">Date Joined</span>
                                    <span className="col-title">Status</span>
                                    <span className="col-title right">Reward</span>
                                </div>
                                <div className="history-list">
                                    {history.map((ref) => (
                                        <div key={ref.id} className="history-item">
                                            <div className="user-info">
                                                <div className="user-avatar">
                                                    {(ref.name || 'U')[0].toUpperCase()}
                                                </div>
                                                <p className="user-name">{ref.name || 'Anonymous User'}</p>
                                            </div>
                                            
                                            <div className="date-info">
                                                <Clock size={12} className="desktop-hidden" style={{ display: 'none' }} />
                                                {new Date(ref.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>

                                            <div>
                                                <span className={`status-badge ${ref.activationStatus === 'Activated' ? 'status-active' : 'status-pending'}`}>
                                                    {ref.activationStatus === 'Website Owner Activation' || ref.activationStatus === 'Activated' ? 'Activated' : 'Pending'}
                                                </span>
                                            </div>
                                            
                                            <div className="reward-info right">
                                                <span className={ref.rewardStatus === 'Pending' ? 'reward-pending' : 'reward-earned'}>
                                                    {ref.rewardStatus === 'Pending' ? 'Pending' : `₦${ref.rewardStatus}`}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <Users size={32} />
                                </div>
                                <h4 className="empty-title">No referrals yet</h4>
                                <p className="empty-desc">
                                    Share your referral link to start earning rewards and commissions.
                                </p>
                                <button onClick={handleShare} className="action-btn btn-share" style={{ padding: '12px 24px', width: 'auto' }}>
                                    <Share2 size={18} /> Share Referral Link
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* How To Earn Modal */}
            {showHowToEarn && (
                <div className="referral-modal-overlay animate-fade-in" onClick={() => setShowHowToEarn(false)}>
                    <div className="referral-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="referral-modal-header">
                            <h2 className="link-title" style={{ fontSize: '1.25rem' }}>How Referral Earnings Work</h2>
                            <button className="back-btn" onClick={() => setShowHowToEarn(false)} style={{ width: '32px', height: '32px' }}>
                                <X size={16} />
                            </button>
                        </div>
                        
                        <div className="referral-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="info-block intro-block">
                                <h4 style={{ color: '#E2E8F0', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><Info size={18} color="#3B82F6" /> HOW TO EARN WITH 9JASUB</h4>
                                <p>There are two ways to earn through the 9JASUB Referral Program.</p>
                            </div>
                            
                            <div className="info-block premium-block" style={{ borderLeft: '4px solid #FACC15' }}>
                                <h4 style={{ color: '#FACC15', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Briefcase size={18} /> REFER WEBSITE OWNERS</h4>
                                <p>Know someone who wants to start their own VTU business? Share your referral link with them. When they:</p>
                                <ul style={{ marginLeft: '24px', marginBottom: '12px', marginTop: '8px', color: '#E2E8F0', listStyleType: 'disc' }}>
                                    <li>Register through your referral link</li>
                                    <li>Purchase and activate their Website Owner Plan</li>
                                </ul>
                                <p>You instantly earn:</p>
                                <div style={{ background: 'rgba(250, 204, 21, 0.1)', padding: '12px', borderRadius: '8px', marginTop: '8px', display: 'inline-block' }}>
                                    <strong style={{ fontSize: '1.2rem', color: '#FACC15' }}>₦2,000 Referral Reward</strong>
                                </div>
                                <p style={{ marginTop: '8px', fontSize: '0.85rem', opacity: 0.8 }}>This reward is paid once for every successful Website Owner you refer.</p>
                            </div>
                            
                            <div className="info-block premium-block" style={{ borderLeft: '4px solid #4ADE80' }}>
                                <h4 style={{ color: '#4ADE80', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18} /> REFER RETAIL CUSTOMERS</h4>
                                <p>Invite friends, family, and customers to use 9JASUB for:</p>
                                <ul style={{ marginLeft: '24px', marginBottom: '12px', marginTop: '8px', color: '#E2E8F0', listStyleType: 'disc', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                    <li>Data Bundles</li>
                                    <li>Airtime</li>
                                    <li>Cable TV</li>
                                    <li>Electricity Bills</li>
                                    <li>Exam Pins</li>
                                    <li style={{ gridColumn: '1 / -1' }}>Other eligible services</li>
                                </ul>
                                <p>Whenever your referred retail customers make eligible purchases, you earn:</p>
                                <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '12px', borderRadius: '8px', marginTop: '8px', display: 'inline-block' }}>
                                    <strong style={{ fontSize: '1.2rem', color: '#4ADE80' }}>15% of 9JASUB Platform Profit</strong>
                                </div>
                                <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>The more active customers you refer, the more commissions you can earn over time.</p>
                            </div>
                            
                            <div className="info-block intro-block">
                                <h4 style={{ color: '#C084FC', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><Infinity size={18} /> LIFETIME COMMISSION</h4>
                                <p>Your commissions do not stop after registration. As long as your referred retail customers continue using 9JASUB, you continue earning commissions from their eligible transactions. There is no limit to how many customers you can refer.</p>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="mobile-stack-grid">
                                <div className="info-block example-block" style={{ background: 'rgba(250, 204, 21, 0.05)', border: '1px solid rgba(250, 204, 21, 0.2)' }}>
                                    <h5 style={{ color: '#FACC15', margin: '0 0 8px 0', fontSize: '0.85rem' }}>EXAMPLE 1 – WEBSITE OWNER</h5>
                                    <p style={{ fontSize: '0.85rem' }}>You refer:<br/><strong>5 Website Owners</strong></p>
                                    <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>5 × ₦2,000<br/><strong style={{ color: '#FACC15', fontSize: '1rem' }}>= ₦10,000 Instant Rewards</strong></p>
                                </div>
                                <div className="info-block example-block" style={{ background: 'rgba(74, 222, 128, 0.05)', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
                                    <h5 style={{ color: '#4ADE80', margin: '0 0 8px 0', fontSize: '0.85rem' }}>EXAMPLE 2 – RETAIL CUSTOMER</h5>
                                    <p style={{ fontSize: '0.85rem' }}>You refer:<br/><strong>50 Retail Customers</strong></p>
                                    <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Whenever they continue buying Data, Airtime, Cable TV, Electricity, and other eligible services, you continue earning commissions from their activity.</p>
                                </div>
                            </div>
                            
                            <div className="info-block intro-block">
                                <h4 style={{ color: '#38BDF8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><Wallet size={18} /> WHERE DO MY EARNINGS GO?</h4>
                                <p>All referral rewards and commissions are automatically credited to your Referral Wallet. You can monitor your earnings directly from the Referral Center dashboard.</p>
                            </div>
                            
                            <div className="info-block warning-block" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                <h4 style={{ color: '#EF4444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><Info size={18} /> IMPORTANT</h4>
                                <p style={{ color: '#FCA5A5', fontWeight: 'bold', marginBottom: '8px' }}>You do NOT earn 15% of the customer's payment amount.</p>
                                <p style={{ marginBottom: '8px' }}>You earn 15% of 9JASUB's platform profit on eligible retail transactions.</p>
                                <p style={{ fontSize: '0.85rem', opacity: 0.9 }}><strong>Example:</strong> If a customer buys ₦10,000 Data, your commission is NOT ₦1,500. Your commission is calculated from 9JASUB's profit on that transaction.</p>
                            </div>
                            
                            <div className="info-block summary-block" style={{ background: '#0F172A', padding: '16px', borderRadius: '12px', border: '1px dashed #334155' }}>
                                <h4 style={{ color: '#E2E8F0', margin: '0 0 12px 0', textAlign: 'center', letterSpacing: '1px' }}>SUMMARY</h4>
                                <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.9rem' }}>
                                    <span style={{ color: '#94A3B8' }}>Website Owner Referral</span>
                                    <strong style={{ color: '#FACC15' }}>→ Earn ₦2,000 Instant Reward</strong>
                                </div>
                                <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '0.9rem' }}>
                                    <span style={{ color: '#94A3B8' }}>Retail Customer Referral</span>
                                    <strong style={{ color: '#4ADE80' }}>→ Earn 15% Lifetime Commission</strong>
                                </div>
                                <p style={{ textAlign: 'center', color: '#60A5FA', fontWeight: 'bold', margin: 0 }}>The more people you refer, the more you earn.</p>
                            </div>
                        </div>
                        
                        <div className="referral-modal-footer" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="info-block rules-block" style={{ padding: '16px', background: '#1E293B', border: '1px solid #334155', borderRadius: '12px' }}>
                                <h4 style={{ color: '#E2E8F0', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={18} color="#3B82F6" /> REFERRAL RULES</h4>
                                <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#94A3B8' }}>
                                    <li style={{ display: 'flex', gap: '8px' }}><strong style={{ color: '#4ADE80' }}>✅</strong> <span>Refer a Website Owner → Earn ₦2,000 Instant Reward</span></li>
                                    <li style={{ display: 'flex', gap: '8px' }}><strong style={{ color: '#4ADE80' }}>✅</strong> <span>Refer Retail Customers → Earn 15% Lifetime Commission on Eligible Transactions</span></li>
                                    <li style={{ display: 'flex', gap: '8px' }}><strong style={{ color: '#4ADE80' }}>✅</strong> <span>Unlimited Referrals</span></li>
                                    <li style={{ display: 'flex', gap: '8px' }}><strong style={{ color: '#4ADE80' }}>✅</strong> <span>Unlimited Earnings Potential</span></li>
                                    <li style={{ display: 'flex', gap: '8px' }}><strong style={{ color: '#4ADE80' }}>✅</strong> <span>Rewards and Commissions are automatically credited to your Referral Wallet</span></li>
                                    <li style={{ display: 'flex', gap: '8px' }}><strong style={{ color: '#4ADE80' }}>✅</strong> <span>Track all earnings inside the Referral Center Dashboard</span></li>
                                </ul>
                            </div>
                            <button className="action-btn btn-share" style={{ width: '100%' }} onClick={() => setShowHowToEarn(false)}>
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReferralCenter;
