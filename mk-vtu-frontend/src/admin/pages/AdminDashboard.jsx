import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  ArrowUpRight,
  ShieldCheck,
  Globe,
  Bell,
  RefreshCw,
  Zap,
  LayoutDashboard, 
  Layout,
  Smartphone, 
  ChevronRight,
  Monitor,
  Laptop,
  Database,
  CloudLightning,
  AlertCircle
} from 'lucide-react';
import { io } from 'socket.io-client';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import API from '../../api';
import { useToast } from '../../context/ToastContext';
import './AdminDashboard.css';

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#06B6D4'];

const AdminDashboard = () => {
  const [loginAlert, setLoginAlert] = useState(() => {
    const alert = sessionStorage.getItem('login_alert');
    if (alert) {
      sessionStorage.removeItem('login_alert');
    }
    return alert;
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7D');
  const [audienceTab, setAudienceTab] = useState('locations'); // 'locations' or 'devices'
  const [activities, setActivities] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const token = (localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'));
    if (!token) {
      navigate(window.location.pathname.startsWith('/super-admin') ? '/super-admin/login' : '/admin/login');
      return;
    }
    fetchStats(timeframe);
  }, [timeframe]);

  // WebSocket Live Activity Listener
  useEffect(() => {
    const token = (localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'));
    if (!token) return;

    const envSocketUrl = import.meta.env.VITE_API_URL || 'http://localhost:8800';
    const isLocalDevelopment = import.meta.env.DEV && envSocketUrl.includes('localhost');
    const socketUrl = isLocalDevelopment ? "" : envSocketUrl;

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to Live Activity channel');
      socket.emit('subscribe:activity');
    });

    socket.on('activity:new', (newAct) => {
      setActivities(prev => {
        // Prepend new activity and maintain a maximum limit of 20 items
        const updated = [newAct, ...prev];
        if (updated.length > 20) updated.pop();
        return updated;
      });
      showToast(newAct.message, "info");
    });

    // Listen for global manual wallet refetch triggers
    const handleWalletRefresh = () => fetchStats(timeframe);
    window.addEventListener('wallet:refresh', handleWalletRefresh);

    return () => {
      socket.close();
      window.removeEventListener('wallet:refresh', handleWalletRefresh);
    };
  }, [timeframe]);

  const fetchStats = (range) => {
    setLoading(true);
    API.get(`/api/admin/stats?timeframe=${range}`)
      .then(res => {
        setStats(res.data);
        setLastUpdated(new Date());
        setLoading(false);
      })
      .catch(err => {
        console.error("Dashboard Stats Fetch Error:", err);
        setLoading(false);
        
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('adminToken');
          showToast("Session expired. Please log in again.", "error");
          navigate(window.location.pathname.startsWith('/super-admin') ? '/super-admin/login' : '/admin/login');
        } else {
          showToast("Failed to fetch ecosystem telemetry", "error");
        }
      });
  };

  const handleTimeframeChange = (newRange) => {
    setTimeframe(newRange);
  };

  const isInitialLoad = loading && !stats;

  const safeStats = stats || {
    totalUsers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    totalProfit: 0,
    pendingWL: 0,
    totalResellers: 0,
    totalResellerCustomers: 0,
    business: {
      totalOnlineUsers: 0,
      activeResellers: 0,
      activeCustomers: 0,
      newRegistrations: 0,
      totalRevenue: 0,
      totalTransactions: 0,
      premiumUpgrades: 0,
      walletFundingVolume: 0
    },
    trends: [],
    audience: {
      topCountries: [],
      topStates: [],
      deviceTypes: [],
      browserUsage: []
    },
    telemetry: {
      system: { cpu: 0, memory: 0, uptime: '0 hours', osNode: 'N/A' },
      storage: { uploadsFolderSize: '0 MB', totalBuilds: 0, manifestsCount: 0 },
      queue: { active: 0, queued: 0, concurrencyLimit: 3 },
      backup: { lastStatus: 'N/A', lastSize: '0 MB' },
      database: { connected: false, status: 'Checking...' },
      healthScore: 0,
      latency: 0,
      errorRate: 0
    }
  };

  const business = safeStats.business || {
    totalOnlineUsers: 0,
    activeResellers: 0,
    activeCustomers: 0,
    newRegistrations: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    premiumUpgrades: 0,
    walletFundingVolume: 0
  };

  const telemetry = safeStats.telemetry || {
    system: { cpu: 0, memory: 0, uptime: '0 hours', osNode: 'N/A' },
    storage: { uploadsFolderSize: '0 MB', totalBuilds: 0, manifestsCount: 0 },
    queue: { active: 0, queued: 0, concurrencyLimit: 3 },
    backup: { lastStatus: 'N/A', lastSize: '0 MB' },
    database: { connected: false, status: 'Checking...' },
    healthScore: 0,
    latency: 0,
    errorRate: 0
  };

  // 1. Business KPI Cards
  const kpiCards = [
    { name: 'Online Users', value: business.totalOnlineUsers, icon: <Users size={18} />, color: 'blue', sub: 'Active in 15m' },
    { name: 'Active Resellers', value: business.activeResellers, icon: <Globe size={18} />, color: 'purple', sub: 'Total brand tenants' },
    { name: 'Sub-Customers', value: business.activeCustomers, icon: <ShieldCheck size={18} />, color: 'indigo', sub: 'Referred end-users' },
    { name: 'New Registrations', value: business.newRegistrations, icon: <TrendingUp size={18} />, color: 'cyan', sub: 'Ecosystem growth' },
    { name: 'Timeframe Inflow', value: `₦${(business.totalRevenue || 0).toLocaleString()}`, icon: <DollarSign size={18} />, color: 'emerald', sub: 'SaaS Gross Revenue' },
    { name: 'Transactions Conducted', value: business.totalTransactions, icon: <Activity size={18} />, color: 'amber', sub: 'Volume processed' },
    { name: 'Premium Upgrades', value: business.premiumUpgrades, icon: <Zap size={18} />, color: 'pink', sub: 'Tier promotions' },
    { name: 'Wallet Funding Vol', value: `₦${(business.walletFundingVolume || 0).toLocaleString()}`, icon: <TrendingUp size={18} />, color: 'rose', sub: 'Deposits completed' }
  ];

  // 2. Format Audience Locations
  const audience = safeStats.audience || { topCountries: [], topStates: [], deviceTypes: [], browserUsage: [] };

  // 3. Health Score styling properties
  const healthScore = telemetry.healthScore || 95;
  let healthColorClass = 'green';
  let strokeColor = '#10B981';
  let healthLabel = 'Operational';

  if (healthScore < 60) {
    healthColorClass = 'red';
    strokeColor = '#EF4444';
    healthLabel = 'System Degradation';
  } else if (healthScore < 85) {
    healthColorClass = 'yellow';
    strokeColor = '#D97706';
    healthLabel = 'Performance Warning';
  }

  // Circular gauge path maths
  const radius = 60;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  // Telemetry status logic
  const getLatencyStatus = (val) => {
    if (val < 300) return { text: 'Excellent', class: 'success', ping: true };
    if (val <= 800) return { text: 'Good', class: 'success', ping: true };
    if (val <= 1500) return { text: 'Warning', class: 'warning', ping: false };
    return { text: 'Critical', class: 'error', ping: false };
  };

  const getFailureRateStatus = (val) => {
    if (val <= 5) return { text: 'Healthy', class: 'success' };
    if (val <= 15) return { text: 'Warning', class: 'warning' };
    return { text: 'Critical', class: 'error' };
  };

  const getMemoryStatus = (val) => {
    if (val < 70) return { text: 'Healthy', class: 'success' };
    if (val <= 85) return { text: 'Warning', class: 'warning' };
    return { text: 'High Usage', class: 'error' };
  };

  const actualLatency = telemetry.latency !== undefined ? telemetry.latency : 0;
  const latencyStatus = getLatencyStatus(actualLatency);
  
  const actualErrorRate = telemetry.errorRate !== undefined ? telemetry.errorRate : 0;
  const errorRateStatus = getFailureRateStatus(actualErrorRate);
  
  const actualMemory = telemetry.system?.memory !== undefined ? telemetry.system.memory : 0;
  const memoryStatus = getMemoryStatus(actualMemory);

  const actualCpu = telemetry.system?.cpu !== undefined ? telemetry.system.cpu : 0;

  return (
    <div className={`admin-dashboard-modern animate-fade-in ${isInitialLoad ? 'dashboard-skeleton' : ''}`}>
      {isInitialLoad && (
        <div className="loading-toast" style={{
          position: 'fixed', bottom: '24px', right: '24px', background: 'var(--bg-card)', 
          padding: '16px 24px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1000, border: '1px solid var(--border-color)',
          color: 'var(--text-dark)'
        }}>
          <RefreshCw className="animate-spin" size={20} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 600, fontSize: '14px' }}>Synchronizing Telemetry...</span>
        </div>
      )}
      {loginAlert && (
        <div className={`login-alert-banner ${loginAlert === 'suspicious' ? 'suspicious' : 'success'}`} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          borderRadius: '16px',
          background: loginAlert === 'suspicious' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          border: loginAlert === 'suspicious' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
          color: loginAlert === 'suspicious' ? '#ef4444' : '#10b981',
          margin: '0 0 20px 0',
          fontSize: '14px',
          fontWeight: '600',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          position: 'relative'
        }}>
          <span>{loginAlert === 'suspicious' ? '⚠️' : '🟢'}</span>
          <span>
            {loginAlert === 'suspicious' 
              ? 'Suspicious login detected.' 
              : 'New login detected successfully.'}
          </span>
          <button 
            onClick={() => setLoginAlert(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'inherit',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '0 4px'
            }}
          >
            &times;
          </button>
        </div>
      )}
      
      {/* Hero Section */}
      <div className="dashboard-hero-modern">
        <div className="hero-left">
          <div className="date-pill" style={{ display: 'inline-block', padding: '4px 12px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '20px', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {lastUpdated && <span style={{ marginLeft: '8px', color: 'var(--text-gray)' }}>• Last Fetched: {lastUpdated.toLocaleTimeString()}</span>}
          </div>
          <h1>Ecosystem Intelligence</h1>
          <p>Real-time SaaS dashboard and operational telemetry logs.</p>
        </div>
        
        {/* Dynamic timeframe select system */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="timeframe-pill-container">
            {['Live', '24H', '7D', '30D', '12M'].map((range) => (
              <button 
                key={range}
                className={`timeframe-btn ${timeframe === range ? 'active' : ''}`}
                onClick={() => handleTimeframeChange(range)}
              >
                {range}
              </button>
            ))}
          </div>

          <button className="premium-btn premium-btn-secondary" onClick={() => fetchStats(timeframe)} disabled={loading} style={{ height: '38px', padding: '0 16px' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} style={{ marginRight: '8px' }} />
            Sync
          </button>
        </div>
      </div>

      {/* TOP ROW: Key Business KPIs */}
      <div className="business-kpis-grid">
        {kpiCards.map((card, idx) => (
          <div key={idx} className="kpi-card">
            <div className="kpi-header">
              <div className={`kpi-icon-wrap ${card.color}`}>{card.icon}</div>
              <span className="kpi-trend up">Live</span>
            </div>
            <div className="kpi-label">{card.name}</div>
            <h2 className="kpi-value">{card.value}</h2>
            <div className="kpi-subtext">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* QUICK OPERATIONS DOCK */}
      <div className="premium-card" style={{ padding: '16px 24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} style={{ color: 'var(--primary)' }} />
          <strong style={{ fontSize: '14.5px', color: 'var(--text-dark)' }}>Command Actions:</strong>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: 'Partners', icon: <Globe size={15} />, path: '/admin/resellers' },
            { label: 'Build Studio', icon: <Smartphone size={15} />, path: '/admin/app-requests' },
            { label: 'Platform Settings', icon: <Zap size={15} />, path: '/admin/settings' },
            { label: 'System Logs', icon: <ChevronRight size={15} />, path: '/admin/logs' }
          ].map((op, i) => (
            <button key={i} className="premium-btn premium-btn-secondary" onClick={() => navigate(op.path)} style={{ padding: '6px 12px', fontSize: '13px' }}>
              {op.icon}
              <span style={{ marginLeft: '6px' }}>{op.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MIDDLE ROW: Charts & Live Activity Feed */}
      <div className="middle-analytics-grid">
        
        {/* Widget 1: Revenue vs Funding flow trend */}
        <div className="analytics-widget-card">
          <div className="widget-header">
            <div>
              <h3>Ecosystem Financial Streams</h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-gray)' }}>Revenue inflows compared to deposits</p>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>Aggregated Trend</span>
          </div>

          <div style={{ width: '100%', height: '300px', flexGrow: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safeStats.trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorFunding" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-light)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-light)" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-dark)' }} 
                  formatter={(value) => [`₦${Number(value).toLocaleString()}`]}
                />
                <Area type="monotone" dataKey="revenue" name="Gross Inflow" stroke="#8B5CF6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="funding" name="Deposits" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFunding)" />
                <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Widget 2: Audience insights */}
        <div className="analytics-widget-card">
          <div className="widget-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <h3>Audience Demographics</h3>
              <div className="timeframe-pill-container" style={{ padding: '2px' }}>
                <button className={`timeframe-btn ${audienceTab === 'locations' ? 'active' : ''}`} onClick={() => setAudienceTab('locations')} style={{ padding: '4px 8px', fontSize: '11px' }}>Locations</button>
                <button className={`timeframe-btn ${audienceTab === 'devices' ? 'active' : ''}`} onClick={() => setAudienceTab('devices')} style={{ padding: '4px 8px', fontSize: '11px' }}>Devices</button>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-gray)' }}>Lightweight IP lookups (aggregated only)</p>
          </div>

          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            {audienceTab === 'locations' ? (
              <div className="location-list">
                {audience.topStates && audience.topStates.length > 0 ? (
                  audience.topStates.map((state, idx) => (
                    <div key={idx} className="location-row">
                      <div className="location-info">
                        <span>{state.name} ({audience.topCountries[idx]?.name || 'NG'})</span>
                        <span>{state.percentage}%</span>
                      </div>
                      <div className="location-bar-bg">
                        <div className="location-bar-fill" style={{ width: `${state.percentage}%`, background: COLORS[idx % COLORS.length] }}></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-light)', fontSize: '13px' }}>No location logins captured.</div>
                )}
              </div>
            ) : (
              <div style={{ width: '100%', height: '220px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={audience.deviceTypes || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(audience.deviceTypes || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Custom device type descriptions legend */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '12px', fontSize: '12px', fontWeight: 600 }}>
                  {(audience.deviceTypes || []).map((entry, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[idx % COLORS.length] }}></div>
                      <span>{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Widget 3: Live System Event logs */}
        <div className="analytics-widget-card">
          <div className="widget-header">
            <div>
              <h3>Real-time Activities</h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-gray)' }}>Ecosystem transactions feed</p>
            </div>
            <div className="live-status-pill">
              <div className="live-dot"></div>
              <span>Live Feed</span>
            </div>
          </div>

          <div className="live-activity-feed">
            {activities && activities.length > 0 ? (
              activities.map((act, i) => {
                let markerClass = 'blue';
                if (act.type === 'wallet_funded') markerClass = 'green';
                if (act.type === 'premium_upgrade') markerClass = 'purple';
                if (act.type === 'build_completed') markerClass = 'pink';
                if (act.type === 'build_failed') markerClass = 'red';

                return (
                  <div key={i} className="activity-item">
                    <div className={`activity-marker pulse ${markerClass}`}></div>
                    <div className="activity-content">
                      <div className="activity-message">{act.message}</div>
                      <div className="activity-time">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-light)' }}>
                <CloudLightning size={32} style={{ marginBottom: '8px', color: 'var(--text-light)' }} />
                <span style={{ fontSize: '13px' }}>Awaiting new live activities...</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* BOTTOM ROW: Infrastructure performance & platform health */}
      <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
         <Database size={18} style={{ color: 'var(--primary)' }} />
         Infrastructure Telemetry & Platform Node
      </h3>

      <div className="bottom-telemetry-grid">
        
        {/* Platform Health Score Gauge */}
        <div className="health-gauge-card">
          <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-gray)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Node Health Score</h4>
          
          <div className="circular-gauge-container">
            <svg className="gauge-svg" width="140" height="140" viewBox="0 0 140 140">
              <circle 
                cx="70" 
                cy="70" 
                r={radius} 
                fill="transparent" 
                stroke="var(--border-color)" 
                strokeWidth={strokeWidth} 
              />
              <circle 
                cx="70" 
                cy="70" 
                r={radius} 
                fill="transparent" 
                stroke={strokeColor} 
                strokeWidth={strokeWidth} 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="gauge-value-display">
              <span className="gauge-num">{healthScore}</span>
              <span className="gauge-pct">/ 100</span>
            </div>
          </div>
          
          <span className={`health-status-badge ${healthColorClass}`}>
            {healthLabel}
          </span>
          <p style={{ fontSize: '12.5px', color: 'var(--text-gray)', textAlign: 'center', margin: '12px 0 0 0', lineHeight: 1.4 }}>
            Aggregating latency index, CPU loads, compilation rates and active WebSocket threads.
          </p>
        </div>

        {/* Telemetry Vignette Grid */}
        <div className="telemetry-node-grid">
          
          <div className="telemetry-card">
            <div className="telemetry-header">
              <span>Node Latency</span>
              <Activity size={14} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="telemetry-val">{actualLatency}ms</div>
            <div className={`telemetry-status-indicator ${latencyStatus.class}`}>
              <div className={`status-dot ${latencyStatus.ping ? 'ping' : ''}`}></div>
              <span>{latencyStatus.text}</span>
            </div>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-header">
              <span>Failure Rate</span>
              <AlertCircle size={14} style={{ color: '#EF4444' }} />
            </div>
            <div className="telemetry-val">{actualErrorRate}%</div>
            <div className={`telemetry-status-indicator ${errorRateStatus.class}`}>
              <div className="status-dot"></div>
              <span>{errorRateStatus.text}</span>
            </div>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-header">
              <span>Node Load (CPU)</span>
              <TrendingUp size={14} />
            </div>
            <div className="telemetry-val">{actualCpu}%</div>
            <div className="telemetry-status-indicator success">
              <div className="status-dot"></div>
              <span>Normal Threads</span>
            </div>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-header">
              <span>Memory Usage</span>
              <Laptop size={14} />
            </div>
            <div className="telemetry-val">{actualMemory}%</div>
            <div className={`telemetry-status-indicator ${memoryStatus.class}`}>
              <div className="status-dot"></div>
              <span>{memoryStatus.text}</span>
            </div>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-header">
              <span>MongoDB Atlas</span>
              <Database size={14} style={{ color: '#10B981' }} />
            </div>
            <div className="telemetry-val">{telemetry.database?.status || 'N/A'}</div>
            <div className="telemetry-status-indicator success">
              <div className="status-dot"></div>
              <span>Active Pool</span>
            </div>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-header">
              <span>Ecosystem Backup</span>
              <ShieldCheck size={14} style={{ color: '#10B981' }} />
            </div>
            <div className="telemetry-val">{telemetry.backup?.lastSize || '0 MB'}</div>
            <div className="telemetry-status-indicator success">
              <div className="status-dot"></div>
              <span>Success Logs</span>
            </div>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-header">
              <span>Build Concurrency</span>
              <Monitor size={14} />
            </div>
            <div className="telemetry-val">{telemetry.queue?.active || 0} / {telemetry.queue?.concurrencyLimit || 3}</div>
            <div className="telemetry-status-indicator success">
              <div className="status-dot"></div>
              <span>Studio Idle</span>
            </div>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-header">
              <span>Uploads Folder</span>
              <Globe size={14} />
            </div>
            <div className="telemetry-val">{telemetry.storage?.uploadsFolderSize || '0 MB'}</div>
            <div className="telemetry-status-indicator success">
              <div className="status-dot"></div>
              <span>Disk Clean</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
