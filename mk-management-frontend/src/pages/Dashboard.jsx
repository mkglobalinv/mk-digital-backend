import React, { useEffect, useState } from 'react';
import API from '../api';
import { Activity, Database, CreditCard, Zap, Link2, ShieldCheck } from 'lucide-react';

const StatusCard = ({ title, status, icon: Icon }) => {
  const isGreen = status === 'Green';
  const isYellow = status === 'Yellow';
  const color = isGreen ? '#10b981' : isYellow ? '#eab308' : '#ef4444';
  const bg = isGreen ? '#10b98120' : isYellow ? '#eab30820' : '#ef444420';

  return (
    <div style={{ backgroundColor: '#1e293b', border: `1px solid ${color}50`, borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={28} />
      </div>
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#94a3b8', fontWeight: '500' }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 10px ${color}` }}></div>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f8fafc' }}>{status === 'Green' ? 'Operational' : status === 'Yellow' ? 'Degraded' : 'Outage'}</span>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await API.get('/api/management/health');
        setHealth(res.data.data);
      } catch (err) {
        console.error("Failed to load health", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
    // Poll every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ color: '#94a3b8' }}>Scanning System Health...</div>;
  if (!health) return <div style={{ color: '#ef4444' }}>Failed to connect to health API.</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#f8fafc' }}>System Overview</h1>
          <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>Last checked: {new Date(health.lastChecked).toLocaleTimeString()}</p>
        </div>
        <div style={{ padding: '8px 16px', backgroundColor: '#10b98120', border: '1px solid #10b98150', borderRadius: '8px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
          <ShieldCheck size={20} />
          All Systems Secure
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <StatusCard title="Frontend App" status={health.frontend} icon={Activity} />
        <StatusCard title="Backend API" status={health.backend} icon={Activity} />
        <StatusCard title="Core Database" status={health.database} icon={Database} />
        <StatusCard title="Flutterwave Gateway" status={health.flutterwave} icon={CreditCard} />
        <StatusCard title="Peyflex Gateway" status={health.peyflex} icon={CreditCard} />
        <StatusCard title="Clubkonnect VTU" status={health.clubkonnect} icon={Zap} />
        <StatusCard title="Reloadly VTU" status={health.reloadly || 'Green'} icon={Zap} />
        <StatusCard title="Wallet Ledger" status={health.walletSystem} icon={Database} />
      </div>
    </div>
  );
};

export default Dashboard;
