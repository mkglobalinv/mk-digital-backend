import React, { useState, useEffect } from 'react';
import { Users, CreditCard, Award, Activity, Share2, RefreshCw, TrendingUp, Clock, CheckCircle, AlertCircle, DollarSign, Infinity } from 'lucide-react';
import API from '../../api';
import './AdminDashboard.css';

const AdminReferrals = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await API.get('/api/admin/referral-analytics');
            setStats(res.data);
        } catch (err) {
            setError('Failed to load referral analytics. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fmt = (n) => Number(n || 0).toLocaleString();
    const fmtNaira = (n) => `₦${fmt(n)}`;

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <div className="spinner" style={{ width: '48px', height: '48px', border: '3px solid var(--border-color)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
    );

    if (error) return (
        <div style={{ padding: '24px', textAlign: 'center', color: '#EF4444', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', margin: '24px' }}>
            <p>{error}</p>
            <button onClick={fetchAnalytics} style={{ marginTop: '12px', padding: '8px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
        </div>
    );

    const conversionRate = stats?.totalReferrals > 0
        ? ((stats.activeReferrals / stats.totalReferrals) * 100).toFixed(1)
        : '0.0';

    return (
        <div className="admin-dashboard-modern">
            {/* Header */}
            <div className="dashboard-hero-modern">
                <div className="hero-left">
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', padding: '10px', borderRadius: '12px', display: 'inline-flex' }}>
                            <Share2 size={28} />
                        </span>
                        Referral Analytics
                    </h1>
                    <p>Platform-wide growth engine — live referral data, reward payouts, and conversion metrics.</p>
                </div>
                <button
                    onClick={fetchAnalytics}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {/* KPI Cards Row 1 */}
            <div className="business-kpis-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '24px' }}>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrap blue"><Users size={20} /></div>
                    </div>
                    <div className="kpi-label">Total Referrals</div>
                    <div className="kpi-value">{fmt(stats?.totalReferrals)}</div>
                    <div className="kpi-subtext">Users referred by a partner or customer</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrap emerald"><CheckCircle size={20} /></div>
                    </div>
                    <div className="kpi-label">Active Referrals</div>
                    <div className="kpi-value" style={{ color: '#10B981' }}>{fmt(stats?.activeReferrals)}</div>
                    <div className="kpi-subtext">Referred users who activated</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}><Clock size={20} /></div>
                    </div>
                    <div className="kpi-label">Pending Referrals</div>
                    <div className="kpi-value" style={{ color: '#F59E0B' }}>{fmt(stats?.pendingReferrals)}</div>
                    <div className="kpi-subtext">Referred users not yet activated</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrap purple"><TrendingUp size={20} /></div>
                    </div>
                    <div className="kpi-label">Conversion Rate</div>
                    <div className="kpi-value" style={{ color: '#8B5CF6' }}>{conversionRate}%</div>
                    <div className="kpi-subtext">Referrals converted to Website Owners</div>
                </div>
            </div>

            {/* KPI Cards Row 2 */}
            <div className="business-kpis-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '24px' }}>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrap emerald"><CreditCard size={20} /></div>
                    </div>
                    <div className="kpi-label">Activation Rewards Paid</div>
                    <div className="kpi-value">{fmtNaira(stats?.totalActivationRewardsPaid)}</div>
                    <div className="kpi-subtext">Referral activation reward payouts</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrap blue"><Infinity size={20} /></div>
                    </div>
                    <div className="kpi-label">Lifetime Commissions</div>
                    <div className="kpi-value">{fmtNaira(stats?.totalLifetimeCommissions)}</div>
                    <div className="kpi-subtext">Ongoing lifetime referral share earnings</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrap purple"><DollarSign size={20} /></div>
                    </div>
                    <div className="kpi-label">Total Rewards Issued</div>
                    <div className="kpi-value">{fmtNaira(stats?.totalRewardsIssued)}</div>
                    <div className="kpi-subtext">All referral + cashback payouts combined</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}><Activity size={20} /></div>
                    </div>
                    <div className="kpi-label">Recent Activations</div>
                    <div className="kpi-value">{fmt(stats?.recentActivations?.length)}</div>
                    <div className="kpi-subtext">Latest referred users who activated</div>
                </div>
            </div>

            {/* Referral Growth Stats (30 days) */}
            {stats?.referralGrowth?.length > 0 && (
                <div className="analytics-widget-card" style={{ marginBottom: '24px' }}>
                    <div className="widget-header">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={18} color="#8B5CF6" /> Referral Growth — Last 30 Days
                        </h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>
                            {stats.referralGrowth.reduce((s, g) => s + g.newReferrals, 0)} total new referrals
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '80px', padding: '8px 0', overflowX: 'auto' }}>
                        {(() => {
                            const max = Math.max(...stats.referralGrowth.map(g => g.newReferrals), 1);
                            return stats.referralGrowth.map((g, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', minWidth: '24px', gap: '4px' }} title={`${g.date}: ${g.newReferrals} referral(s)`}>
                                    <div style={{
                                        width: '100%',
                                        height: `${Math.max(4, (g.newReferrals / max) * 64)}px`,
                                        background: 'linear-gradient(180deg, #8B5CF6, #6D28D9)',
                                        borderRadius: '3px 3px 0 0',
                                        transition: 'height 0.3s ease'
                                    }} />
                                </div>
                            ));
                        })()}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-gray)', marginTop: '4px' }}>
                        <span>{stats.referralGrowth[0]?.date}</span>
                        <span>{stats.referralGrowth[stats.referralGrowth.length - 1]?.date}</span>
                    </div>
                </div>
            )}

            {/* Bottom Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

                {/* Top Referrers */}
                <div className="analytics-widget-card" style={{ minHeight: 'auto' }}>
                    <div className="widget-header">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Award size={18} color="#F59E0B" /> Top Referrers
                        </h3>
                    </div>
                    {stats?.topReferrers?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {stats.topReferrers.map((r, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', background: 'var(--bg-color)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', flexShrink: 0,
                                        background: idx === 0 ? 'rgba(251, 191, 36, 0.15)' : idx === 1 ? 'rgba(156, 163, 175, 0.15)' : 'rgba(180, 100, 60, 0.15)',
                                        color: idx === 0 ? '#F59E0B' : idx === 1 ? '#9CA3AF' : '#CD7F32'
                                    }}>
                                        #{idx + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>{r.name}</p>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-gray)' }}>{r.email}</p>
                                    </div>
                                    <div style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontWeight: '800', fontSize: '13px' }}>
                                        {r.referralCount} referral{r.referralCount !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>
                            <Share2 size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                            <p>No referrals tracked yet.</p>
                        </div>
                    )}
                </div>

                {/* Recent Activations */}
                <div className="analytics-widget-card" style={{ minHeight: 'auto' }}>
                    <div className="widget-header">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={18} color="#3B82F6" /> Recent Activations
                        </h3>
                        <span className="live-status-pill">
                            <span className="live-dot"></span> LIVE
                        </span>
                    </div>
                    {stats?.recentActivations?.length > 0 ? (
                        <div className="live-activity-feed">
                            {stats.recentActivations.map((act, idx) => (
                                <div key={idx} className="activity-item">
                                    <div className={`activity-marker ${act.tier === 'premium' ? 'purple' : 'green'} pulse`}></div>
                                    <div className="activity-content">
                                        <p className="activity-message">
                                            <strong>{act.name}</strong> activated <span style={{ color: act.tier === 'premium' ? '#8B5CF6' : '#10B981', textTransform: 'capitalize' }}>{act.tier || 'basic'}</span>
                                        </p>
                                        <p className="activity-time">
                                            Referred by <strong>{act.referrerName}</strong> &bull; {new Date(act.activatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>
                            <Activity size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                            <p>No recent referral-driven activations.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* Referral Reward Transactions Table */}
            <div className="analytics-widget-card">
                <div className="widget-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CreditCard size={18} color="#10B981" /> Referral Reward Transactions
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>Last 20 transactions</span>
                </div>
                {stats?.rewardTransactions?.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                    <th style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--text-gray)', fontWeight: '600' }}>Recipient</th>
                                    <th style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--text-gray)', fontWeight: '600' }}>Type</th>
                                    <th style={{ textAlign: 'right', padding: '10px 8px', color: 'var(--text-gray)', fontWeight: '600' }}>Amount</th>
                                    <th style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--text-gray)', fontWeight: '600' }}>Reference</th>
                                    <th style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--text-gray)', fontWeight: '600' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.rewardTransactions.map((tx, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-color)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '10px 8px' }}>
                                            <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-dark)' }}>{tx.recipientName}</p>
                                            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-gray)' }}>{tx.recipientEmail}</p>
                                        </td>
                                        <td style={{ padding: '10px 8px' }}>
                                            <span style={{
                                                padding: '3px 10px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                background: tx.type === 'Lifetime Commission' ? 'rgba(139, 92, 246, 0.1)' :
                                                            tx.type === 'Activation Reward' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: tx.type === 'Lifetime Commission' ? '#8B5CF6' :
                                                       tx.type === 'Activation Reward' ? '#10B981' : '#F59E0B'
                                            }}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '700', color: '#10B981' }}>
                                            +₦{Number(tx.amount || 0).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '10px 8px', fontSize: '11px', color: 'var(--text-gray)', fontFamily: 'monospace' }}>
                                            {tx.reference}
                                        </td>
                                        <td style={{ padding: '10px 8px', fontSize: '12px', color: 'var(--text-gray)' }}>
                                            {new Date(tx.date).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>
                        <CreditCard size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                        <p>No referral reward transactions yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminReferrals;
