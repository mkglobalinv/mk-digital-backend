import React, { useEffect, useState } from 'react';
import API from '../api';
import { Activity, BarChart3, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div style={{ backgroundColor: '#1e293b', border: `1px solid ${color}50`, borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
    <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: `${color}20`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={28} />
    </div>
    <div>
      <h3 style={{ margin: '0 0 4px', fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>{title}</h3>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f8fafc' }}>{value}</div>
    </div>
  </div>
);

const Monitoring = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulated chart data for V1
  const chartData = [
    { time: '00:00', success: 95, failed: 5 },
    { time: '04:00', success: 88, failed: 12 },
    { time: '08:00', success: 99, failed: 1 },
    { time: '12:00', success: 92, failed: 8 },
    { time: '16:00', success: 97, failed: 3 },
    { time: '20:00', success: 96, failed: 4 },
    { time: '24:00', success: 98, failed: 2 },
  ];

  useEffect(() => {
    const fetchMonitoring = async () => {
      try {
        const res = await API.get('/api/management/monitoring');
        setData(res.data.data);
      } catch (err) {
        console.error("Failed to load monitoring", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMonitoring();
    const interval = setInterval(fetchMonitoring, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ color: '#94a3b8' }}>Loading metrics...</div>;
  if (!data) return <div style={{ color: '#ef4444' }}>Failed to connect to monitoring API.</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BarChart3 size={32} color="#3b82f6" />
            Transaction Monitoring (24h)
          </h1>
          <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>Real-time transaction flow and provider health.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <StatCard title="Total Volume" value={data.totalTransactions24h.toLocaleString()} icon={Activity} color="#3b82f6" />
        <StatCard title="Success Rate" value={`${data.successRate}%`} icon={CheckCircle2} color="#10b981" />
        <StatCard title="Failed Transactions" value={data.failedTransactions.toLocaleString()} icon={AlertCircle} color="#ef4444" />
        <StatCard title="Pending / Processing" value={data.pendingTransactions.toLocaleString()} icon={Clock} color="#eab308" />
      </div>

      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 24px', fontSize: '18px', color: '#f8fafc' }}>24-Hour Network Reliability</h3>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
              <Area type="monotone" dataKey="success" stroke="#10b981" fillOpacity={1} fill="url(#colorSuccess)" name="Success %" />
              <Area type="monotone" dataKey="failed" stroke="#ef4444" fillOpacity={1} fill="url(#colorFailed)" name="Fail %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
