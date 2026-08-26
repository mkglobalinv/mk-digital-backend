import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, Users, Activity, Globe } from 'lucide-react';
import API from '../../api';
import './AdminDashboard.css';

const fmt = (n) => Number(n || 0).toLocaleString();
const fmtNaira = (n) => `₦${fmt(n)}`;

const timeAgo = (dateStr) => {
    if (!dateStr) return 'No recent activity';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

const StatusBadge = ({ status, reason }) => {
    const isActive = status === 'Active';
    return (
        <span
            title={reason}
            style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.15)',
                color: isActive ? '#10B981' : '#64748b'
            }}
        >
            {status}
        </span>
    );
};

const ResellerAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await API.get('/api/admin/reseller-analytics');
            setData(res.data);
        } catch (err) {
            setError(err.response?.status === 403
                ? 'Access denied. This dashboard is restricted to the platform owner.'
                : 'Failed to load reseller analytics. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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

    const resellers = data?.resellers || [];
    const totals = resellers.reduce((acc, r) => ({
        customers: acc.customers + r.customers.total,
        txMonth: acc.txMonth + r.transactions.month,
        volumeMonth: acc.volumeMonth + r.volume.month,
        active: acc.active + (r.status === 'Active' ? 1 : 0)
    }), { customers: 0, txMonth: 0, volumeMonth: 0, active: 0 });

    return (
        <div className="admin-dashboard-modern">
            <div className="dashboard-hero-modern">
                <div className="hero-left">
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', padding: '10px', borderRadius: '12px', display: 'inline-flex' }}>
                            <BarChart3 size={28} />
                        </span>
                        Reseller Analytics
                    </h1>
                    <p>Per-reseller customer, transaction, and account-status overview — built from existing records, no live monitoring involved.</p>
                </div>
                <button
                    onClick={fetchAnalytics}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            <div className="business-kpis-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '24px' }}>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrap blue"><Globe size={20} /></div>
                    </div>
                    <div className="kpi-label">Total Resellers</div>
                    <div className="kpi-value">{fmt(resellers.length)}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrap emerald"><Activity size={20} /></div>
                    </div>
                    <div className="kpi-label">Active</div>
                    <div className="kpi-value" style={{ color: '#10B981' }}>{fmt(totals.active)}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrap purple"><Users size={20} /></div>
                    </div>
                    <div className="kpi-label">Total Customers (all resellers)</div>
                    <div className="kpi-value" style={{ color: '#8B5CF6' }}>{fmt(totals.customers)}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}><BarChart3 size={20} /></div>
                    </div>
                    <div className="kpi-label">Transaction Volume (this month)</div>
                    <div className="kpi-value" style={{ color: '#F59E0B' }}>{fmtNaira(totals.volumeMonth)}</div>
                </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-gray)', margin: '0 0 12px' }}>
                "Active"/"Inactive" reflects each reseller's account status. Recent-activity figures cover the last {data?.activityWindowDays || 30} days — this is not a live uptime check.
            </p>

            <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '1000px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '12px 16px' }}>Reseller</th>
                            <th style={{ padding: '12px 16px' }}>Domain</th>
                            <th style={{ padding: '12px 16px' }}>Status</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Customers (Total)</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Today</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>This Week</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>This Month</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Tx Today</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Tx Month</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Volume (Month)</th>
                            <th style={{ padding: '12px 16px' }}>Last Activity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {resellers.map(r => (
                            <tr key={r.resellerId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{r.businessName}</td>
                                <td style={{ padding: '12px 16px', color: 'var(--text-gray)' }}>{r.domain || '—'}</td>
                                <td style={{ padding: '12px 16px' }}><StatusBadge status={r.status} reason={r.statusReason} /></td>
                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>{fmt(r.customers.total)}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>{fmt(r.customers.today)}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>{fmt(r.customers.week)}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>{fmt(r.customers.month)}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>{fmt(r.transactions.today)}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>{fmt(r.transactions.month)}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>{fmtNaira(r.volume.month)}</td>
                                <td style={{ padding: '12px 16px', color: 'var(--text-gray)' }}>{timeAgo(r.lastActivity)}</td>
                            </tr>
                        ))}
                        {resellers.length === 0 && (
                            <tr>
                                <td colSpan={11} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-gray)' }}>No resellers found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ResellerAnalytics;
