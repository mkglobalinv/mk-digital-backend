import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Filter, Activity, DollarSign, Calendar } from 'lucide-react';
import API from '../../api';
import './ProfitAnalytics.css';
import './ResellerManager.css'; // For table styles

const ProfitAnalytics = () => {
  const [stats, setStats] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfitData();
  }, []);

  const fetchProfitData = async () => {
    try {
      const [statsRes, txRes] = await Promise.all([
        API.get('/api/admin/stats/profit'),
        API.get('/api/admin/transactions?limit=20')
      ]);
      setStats(statsRes.data || []);
      setTransactions(txRes.data || []);
    } catch (err) {
      console.error("Failed to fetch profit data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="profit-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Activity className="animate-spin" size={48} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
        <h2 style={{ fontWeight: 700 }}>Computing Platform Yields...</h2>
    </div>
  );

  return (
    <div className="profit-container animate-fade-in">
      <header className="profit-header-row">
        <div>
          <h1>Profit Intelligence</h1>
          <p style={{ color: 'var(--text-gray)', marginTop: '4px' }}>Deep analysis of service margins and platform net yield.</p>
        </div>
        <div className="premium-glass" style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.3px', fontWeight: 600 }}>
            <Calendar size={14} />
            Rolling 30 Days
        </div>
      </header>

      <div className="profit-grid">
        {stats.map((s, idx) => (
          <div key={idx} className="profit-card">
            <div className="profit-label">{s._id || 'General'} Yield</div>
            <div className="profit-value">₦{s.totalProfit?.toLocaleString()}</div>
            <div className="profit-meta">
                <span>{s.count} Managed Sales</span>
                <span className="margin-badge">
                    <TrendingUp size={12} inline /> Active
                </span>
            </div>
          </div>
        ))}
        {stats.length === 0 && (
            <div className="profit-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                <DollarSign size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <h3>No profit data recorded for this period.</h3>
            </div>
        )}
      </div>

      <div className="premium-table-wrapper">
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0 }}>Granular Profit Breakdown</h3>
        </div>
        <table className="premium-table">
          <thead>
            <tr>
              <th>Service Details</th>
              <th>Partner / User</th>
              <th>Cost Base</th>
              <th>Sale Price</th>
              <th>Net Profit</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx._id}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ color: 'var(--text-dark)' }}>{tx.network} {tx.dataType || 'Airtime'}</strong>
                    <span style={{ fontSize: '13.2px', color: 'var(--text-gray)' }}>{new Date(tx.createdAt).toLocaleString()}</span>
                  </div>
                </td>
                <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{tx.userId?.name || 'Retail User'}</span>
                        <span style={{ fontSize: '13.2px', color: 'var(--text-gray)' }}>{tx.userId?.email}</span>
                    </div>
                </td>
                <td>₦{tx.cost_price?.toLocaleString() || '0.00'}</td>
                <td>₦{tx.selling_price?.toLocaleString() || '0.00'}</td>
                <td><strong style={{ color: '#10B981' }}>+₦{tx.profit?.toLocaleString() || '0.00'}</strong></td>
                <td>
                  <span className="margin-badge">
                    {tx.selling_price ? ((tx.profit / tx.selling_price) * 100).toFixed(1) : 0}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitAnalytics;
