import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Key, 
  Globe, 
  BarChart3, 
  Copy, 
  RefreshCw, 
  Shield, 
  ChevronLeft,
  ExternalLink,
  Code2,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Activity,
  Lock,
  Wallet,
  Settings,
  Palette,
  Cloud,
  Check
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
import API from '../api';
import './Developer.css';

const Developer = ({ user, refreshUser }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('analytics');
    const [isSandbox, setIsSandbox] = useState(false);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ summary: {}, daily: [] });
    const [apiLogs, setApiLogs] = useState([]);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [showSecret, setShowSecret] = useState(false);
    
    // API State
    const [apiKey, setApiKey] = useState(user?.apiKey || '');
    const [apiSecret, setApiSecret] = useState(user?.apiSecret || '');
    const [testApiKey, setTestApiKey] = useState(user?.testApiKey || '');
    const [testApiSecret, setTestApiSecret] = useState(user?.testApiSecret || '');
    const [webhookUrl, setWebhookUrl] = useState(user?.webhookUrl || '');
    const [ipWhitelist, setIpWhitelist] = useState(user?.ipWhitelist?.join(', ') || '');

    const [subdomainAvailable, setSubdomainAvailable] = useState(null);

    useEffect(() => {
        fetchAnalytics();
        fetchLogs();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await API.get('/api/v1/analytics');
            if (res.data.status === 'success') setStats(res.data.data);
        } catch (err) { console.error('Analytics fetch failed'); }
    };

    const fetchLogs = async () => {
        try {
            const res = await API.get('/api/v1/history');
            if (res.data.status === 'success') setApiLogs(res.data.data);
        } catch (err) { console.error('Logs fetch failed'); }
    };



    const generateKeys = async (type = 'live') => {
        const confirmMsg = type === 'live' 
            ? "Regenerating LIVE keys will break your current integration. Continue?"
            : "Regenerate TEST keys?";
        if (!window.confirm(confirmMsg)) return;
        
        setLoading(true);
        try {
            const endpoint = type === 'live' ? '/api/user/generate-api-keys' : '/api/user/generate-test-keys';
            const res = await API.post(endpoint);
            if (res.data.status === 'success') {
                if (type === 'live') {
                    setApiKey(res.data.apiKey);
                    setApiSecret(res.data.apiSecret);
                } else {
                    setTestApiKey(res.data.testApiKey);
                    setTestApiSecret(res.data.testApiSecret);
                }
                setMsg({ type: 'success', text: `${type.toUpperCase()} keys generated successfully` });
                refreshUser();
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to generate keys' });
        } finally { setLoading(false); }
    };

    const updateApiSettings = async () => {
        setLoading(true);
        try {
            const ips = ipWhitelist.split(',').map(ip => ip.trim()).filter(ip => ip);
            await API.post('/api/user/update-api-settings', { webhookUrl, ipWhitelist: ips });
            setMsg({ type: 'success', text: 'Settings updated successfully' });
            refreshUser();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to update settings' });
        } finally { setLoading(false); }
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        alert(`${label} copied!`);
    };

    return (
        <div className="page-container developer-page premium-theme">
            <div className="developer-header">
                <button className="back-btn" onClick={() => navigate('/profile')}>
                    <ChevronLeft size={24} />
                </button>
                <h2>Developer Console</h2>
                <div className="api-tier-badge">
                    FREE API ACCESS
                </div>
            </div>

            <div className="developer-content">
                {msg.text && <div className={`dev-alert ${msg.type}`}>{msg.text}</div>}

                {/* Tabs */}
                <div className="dev-tabs">
                    <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
                        <BarChart3 size={18} /> Analytics
                    </button>
                    <button className={`tab-btn ${activeTab === 'keys' ? 'active' : ''}`} onClick={() => setActiveTab('keys')}>
                        <Key size={18} /> API Keys
                    </button>
                    <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                        <Settings size={18} /> Webhooks
                    </button>
                </div>

                {activeTab === 'analytics' && (
                    <div className="animate-fade-up">
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-label">Total Requests</span>
                                <span className="stat-value">{stats.summary.totalRequests || 0}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Success Rate</span>
                                <span className="stat-value">
                                    {stats.summary.totalRequests > 0 
                                        ? Math.round((stats.summary.successCount / stats.summary.totalRequests) * 100) 
                                        : 0}%
                                </span>
                            </div>
                        </div>

                        <div className="dev-card">
                            <div className="card-header">
                                <div className="header-title">
                                    <Activity size={20} />
                                    <span>API Traffic (Last 7 Days)</span>
                                </div>
                            </div>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.daily}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                        <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'keys' && (
                    <div className="animate-fade-up">
                        <div className="dev-card mode-toggle-card">
                            <div className="mode-info">
                                <h3>Sandbox Mode</h3>
                                <p>Test transactions without real charges.</p>
                            </div>
                            <div className={`premium-toggle ${isSandbox ? 'on' : 'off'}`} onClick={() => setIsSandbox(!isSandbox)}>
                                <div className="toggle-thumb"></div>
                            </div>
                        </div>

                        <div className="dev-card">
                            <div className="card-header">
                                <div className="header-title">
                                    <Lock size={20} />
                                    <span>{isSandbox ? 'Test' : 'Live'} Credentials</span>
                                </div>
                                <button className="refresh-keys-btn" onClick={() => generateKeys(isSandbox ? 'test' : 'live')}>
                                    <RefreshCw size={14} className={loading ? 'spin' : ''} />
                                </button>
                            </div>

                            <div className="keys-form">
                                <div className="dev-input-group">
                                    <label>API KEY</label>
                                    <div className="dev-input-wrapper">
                                        <input type="text" readOnly value={isSandbox ? testApiKey : apiKey} />
                                        <button onClick={() => copyToClipboard(isSandbox ? testApiKey : apiKey, 'API Key')}><Copy size={18} /></button>
                                    </div>
                                </div>
                                <div className="dev-input-group">
                                    <label>API SECRET</label>
                                    <div className="dev-input-wrapper">
                                        <input type={showSecret ? "text" : "password"} readOnly value={isSandbox ? testApiSecret : apiSecret} />
                                        <button onClick={() => setShowSecret(!showSecret)}>{showSecret ? 'Hide' : 'Show'}</button>
                                        <button onClick={() => copyToClipboard(isSandbox ? testApiSecret : apiSecret, 'API Secret')}><Copy size={18} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}



                {activeTab === 'settings' && (
                    <div className="animate-fade-up">
                        <div className="dev-card">
                            <div className="card-header">
                                <div className="header-title">
                                    <Globe size={20} />
                                    <span>Network & Callbacks</span>
                                </div>
                            </div>
                            <div className="dev-form">
                                <div className="dev-input-group">
                                    <label>Webhook URL</label>
                                    <input type="url" className="modal-input" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://..." />
                                </div>
                                <div className="dev-input-group">
                                    <label>IP Whitelist</label>
                                    <input type="text" className="modal-input" value={ipWhitelist} onChange={e => setIpWhitelist(e.target.value)} placeholder="0.0.0.0, 1.1.1.1" />
                                </div>
                                <button className="dev-save-btn" onClick={updateApiSettings} disabled={loading}>Save Settings</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Documentation Link */}
                <div className="docs-promo-card animate-fade-up" onClick={() => window.open('/docs', '_blank')}>
                    <div className="docs-icon"><Code2 size={24} /></div>
                    <div className="docs-text">
                        <h3>API Documentation</h3>
                        <p>Our API is 100% Free for all developers.</p>
                    </div>
                    <ExternalLink size={18} />
                </div>
            </div>
        </div>
    );
};

export default Developer;
