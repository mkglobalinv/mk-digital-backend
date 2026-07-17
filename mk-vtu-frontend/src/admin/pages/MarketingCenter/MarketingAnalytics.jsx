import React, { useState, useEffect } from 'react';
import { BarChart2, Eye, MousePointerClick, Activity } from 'lucide-react';
import API from '../../../api';

const MarketingAnalytics = () => {
  const [stats, setStats] = useState({ campaignViews: 0, campaignClicks: 0, announcementViews: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    API.get('/api/marketing/admin/analytics', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div style={{ padding: '20px' }}>Loading analytics...</div>;

  const totalInteractions = stats.campaignViews + stats.campaignClicks + stats.announcementViews;
  const ctr = stats.campaignViews > 0 ? ((stats.campaignClicks / stats.campaignViews) * 100).toFixed(1) : 0;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: 'var(--text-dark)' }}>Marketing Analytics</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Overview of your marketing performance across all modules.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginBottom: '12px' }}>
            <Activity size={18} /> <span style={{ fontSize: '13px', fontWeight: '600' }}>Total Interactions</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>{totalInteractions.toLocaleString()}</div>
        </div>

        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', marginBottom: '12px' }}>
            <Eye size={18} /> <span style={{ fontSize: '13px', fontWeight: '600' }}>Campaign Views</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#14532d' }}>{stats.campaignViews.toLocaleString()}</div>
        </div>

        <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', marginBottom: '12px' }}>
            <MousePointerClick size={18} /> <span style={{ fontSize: '13px', fontWeight: '600' }}>Campaign Clicks</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e3a8a' }}>{stats.campaignClicks.toLocaleString()}</div>
        </div>

        <div style={{ background: '#fffbeb', padding: '20px', borderRadius: '12px', border: '1px solid #fde68a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', marginBottom: '12px' }}>
            <BarChart2 size={18} /> <span style={{ fontSize: '13px', fontWeight: '600' }}>Average CTR</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#92400e' }}>{ctr}%</div>
        </div>

      </div>

      <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '10px', textAlign: 'center', color: '#64748b' }}>
        <BarChart2 size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
        <h3>Advanced Analytics Coming Soon</h3>
        <p>Detailed charts, geographic data, and conversion tracking will be available in V2.</p>
      </div>

    </div>
  );
};

export default MarketingAnalytics;
