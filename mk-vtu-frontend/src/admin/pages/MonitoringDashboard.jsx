import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import axios from 'axios';
import { 
  Activity, 
  ShieldAlert, 
  Zap, 
  AlertTriangle, 
  Clock, 
  Server,
  RefreshCw,
  Search,
  Lock,
  ChevronRight,
  TrendingUp,
  Database,
  Save,
  FileText,
  CheckCircle,
  HardDrive
} from 'lucide-react';
import { io } from 'socket.io-client';
import './MonitoringDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const getProviderStatus = (prov) => {
    if (prov.apiStatus === 'disconnected' || prov.apiStatus === 'offline') {
        return { color: 'offline', text: 'DISCONNECTED', dot: '⚫' };
    }
    if (prov.isUnderMaintenance || prov.apiStatus === 'critical' || (prov.failureCount && prov.failureCount >= 3)) {
        return { color: 'critical', text: 'CRITICAL', dot: '🔴' };
    }
    if (prov.apiStatus === 'warning' || prov.balance < prov.warningThreshold) {
        return { color: 'low', text: 'WARNING', dot: '🟡' };
    }
    return { color: 'healthy', text: 'HEALTHY', dot: '🟢' };
};

const MonitoringDashboard = () => {
    const { showToast, updateToast } = useToast();
    const [stats, setStats] = useState(null);
    const [telemetry, setTelemetry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [providers, setProviders] = useState([]);
    const [providerEdits, setProviderEdits] = useState({});
    const [savingProviderId, setSavingProviderId] = useState(null);
    const [statsError, setStatsError] = useState(null);
    const [telemetryError, setTelemetryError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchStats = async () => {
        try {
            setRefreshing(true);
            setStatsError(null);
            const token = (localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'));
            const res = await axios.get(`${API_URL}/api/admin/monitoring-stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                setStats(res.data.data);
            }

            // Fetch providers status
            const provRes = await axios.get(`${API_URL}/api/admin/providers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (provRes.data.status === 'success') {
                setProviders(provRes.data.data);
                const edits = {};
                provRes.data.data.forEach(p => {
                    edits[p._id] = {
                        warningThreshold: p.warningThreshold,
                        criticalThreshold: p.criticalThreshold,
                        pauseThreshold: p.pauseThreshold,
                        manualDisabled: p.manualDisabled,
                        priority: p.priority || (p.providerName === 'peyflex' ? 1 : 2)
                    };
                });
                setProviderEdits(edits);
            }

            setLastUpdated(new Date());
            setLoading(false);
            setRefreshing(false);
        } catch (err) {
            console.error("Error fetching monitoring stats:", err);
            setStatsError(err.response?.data?.message || err.message || "Failed to load monitoring stats");
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchTelemetry = async (refresh = false) => {
        try {
            setTelemetryError(null);
            const token = (localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'));
            const res = await axios.get(`${API_URL}/api/admin/telemetry${refresh ? '?refresh=true' : ''}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTelemetry(res.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Error fetching telemetry:", err);
            setTelemetryError(err.response?.data?.message || err.message || "Failed to load telemetry");
        }
    };

    const handleForceRefresh = async () => {
        const toastId = await showToast('Force refreshing telemetry...', 'loading');
        try {
            await Promise.all([fetchStats(), fetchTelemetry(true)]);
            updateToast(toastId, { type: 'success', message: 'Telemetry force refreshed.', duration: 2000 });
        } catch (err) {
            updateToast(toastId, { type: 'error', message: 'Refresh failed.' });
        }
    };

    const handleUpdateProvider = async (id) => {
        const toastId = await showToast('Saving provider settings...', 'loading');
        try {
            setSavingProviderId(id);
            const token = (localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'));
            const editData = providerEdits[id];
            
            const res = await axios.put(`${API_URL}/api/admin/providers/${id}`, editData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data.status === 'success') {
                setProviders(prev => prev.map(p => p._id === id ? res.data.provider : p));
                updateToast(toastId, { type: 'success', message: 'Provider settings updated successfully!' });
            }
            setSavingProviderId(null);
        } catch (err) {
            console.error("Error updating provider:", err);
            updateToast(toastId, { type: 'error', message: 'Failed to update provider settings.' });
            setSavingProviderId(null);
        }
    };

    const handleEditChange = (id, field, value) => {
        setProviderEdits(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleResetFailures = async (providerName) => {
        const toastId = await showToast(`Resetting failures for ${providerName}...`, 'loading');
        try {
            const token = (localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'));
            await axios.post(`${API_URL}/api/admin/providers/${providerName}/reset-failures`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh providers to reflect the reset
            await fetchStats();
            updateToast(toastId, { type: 'success', message: 'Failure counter reset successfully.' });
        } catch (err) {
            console.error('Failed to reset failure count:', err);
            updateToast(toastId, { type: 'error', message: 'Failed to reset failure counter.' });
        }
    };


    useEffect(() => {
        fetchStats();
        fetchTelemetry(false);

        const adminToken = (localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'));
        const socket = io(API_URL || window.location.origin, {
            path: '/socket.io',
            query: { token: adminToken },
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000
        });

        socket.on('connect', () => {
            console.log("[Socket] Dashboard connected");
            socket.emit('subscribe:telemetry');
        });

        socket.on('telemetry:update', (data) => {
            setTelemetry(prev => {
                if (!prev) return data;
                return {
                    ...prev,
                    telemetry: {
                        ...prev.telemetry,
                        system: {
                            ...prev.telemetry.system,
                            ...data.telemetry.system
                        }
                    }
                };
            });
        });

        const statsInterval = setInterval(fetchStats, 60000);

        return () => {
            clearInterval(statsInterval);
            socket.close();
        };
    }, []);

    if (loading) return <div className="admin-loading">Initializing Monitoring Systems...</div>;

    const txSuccess = stats?.transactions?.find(t => t._id === 'success')?.count || 0;
    const txFailed = stats?.transactions?.find(t => t._id === 'failed')?.count || 0;
    const totalTx = txSuccess + txFailed;
    const successRate = totalTx > 0 ? ((txSuccess / totalTx) * 100).toFixed(1) : '100';

    const location = useLocation();
    const isProviderMonitoring = location.pathname.includes('/provider-monitoring');
    const isSystemHealth = location.pathname.includes('/system-health') || !isProviderMonitoring;

    return (
        <div className="monitoring-dashboard">
            <header className="mon-header">
                <div className="mon-title">
                    <Activity className="pulse-icon" />
                    <h1>{isProviderMonitoring ? 'Provider Monitoring' : 'Ecosystem Health Monitoring'}</h1>
                    <span className={`env-badge ${stats?.systemMode}`}>
                        {stats?.systemMode?.toUpperCase()} MODE
                    </span>
                    {lastUpdated && (
                        <span className="last-updated">
                            Last Updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                </div>
                <button 
                    className={`refresh-btn ${refreshing ? 'spinning' : ''}`} 
                    onClick={handleForceRefresh}
                    disabled={refreshing}
                >
                    <RefreshCw size={18} /> {refreshing ? 'Refreshing...' : 'Force Refresh'}
                </button>
            </header>

            {isSystemHealth && (
                <>
                <div className="mon-stats-grid">
                <div className="mon-stat-card success">
                    <span className="telemetry-badge live">● LIVE DATA</span>
                    <div className="card-icon"><TrendingUp /></div>
                    <div className="card-info">
                        <h3>24h Success Rate</h3>
                        <div className="main-value">
                            {statsError ? (
                                <span className="metric-error" title={statsError}>Error</span>
                            ) : (
                                totalTx > 0 ? `${successRate}%` : '100%'
                            )}
                        </div>
                        <p>
                            {statsError ? (
                                'Stats load failure'
                            ) : (
                                totalTx > 0 ? `${txSuccess} successful / ${txFailed} failed` : 'No transactions in last 24h'
                            )}
                        </p>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${totalTx > 0 ? successRate : 100}%` }}></div>
                    </div>
                </div>

                <div className="mon-stat-card warning">
                    <span className="telemetry-badge live">● LIVE DATA</span>
                    <div className="card-icon"><Zap /></div>
                    <div className="card-info">
                        <h3>Active Trials</h3>
                        <div className="main-value">
                            {statsError ? (
                                <span className="metric-error" title={statsError}>Error</span>
                            ) : (
                                stats?.activeTrials || 0
                            )}
                        </div>
                        <p>Resellers currently in 7-day trial</p>
                    </div>
                </div>

                <div className="mon-stat-card danger">
                    <span className="telemetry-badge live">● LIVE DATA</span>
                    <div className="card-icon"><ShieldAlert /></div>
                    <div className="card-info">
                        <h3>Failed Onboardings</h3>
                        <div className="main-value">
                            {statsError ? (
                                <span className="metric-error" title={statsError}>Error</span>
                            ) : (
                                stats?.failedOnboardings || 0
                            )}
                        </div>
                        <p>Rejected requests in last 24h</p>
                    </div>
                </div>

                {(() => {
                    const buildSuccessRate = telemetry?.telemetry?.analytics?.successRate || '0%';
                    const buildRateRaw = parseFloat(buildSuccessRate);
                    const buildSuccessRateClass = telemetryError ? 'critical' : isNaN(buildRateRaw) ? 'success' : buildRateRaw >= 90 ? 'success' : buildRateRaw >= 70 ? 'warning' : 'critical';
                    const buildSuccessCount = telemetry?.telemetry?.analytics?.completedCount || 0;
                    const buildFailedCount = telemetry?.telemetry?.analytics?.failedCount || 0;

                    return (
                        <div className={`mon-stat-card ${buildSuccessRateClass}`}>
                            <span className="telemetry-badge live">● LIVE DATA</span>
                            <div className="card-icon"><AlertTriangle /></div>
                            <div className="card-info">
                                <h3>Build Success Rate (30d)</h3>
                                <div className="main-value">
                                    {telemetryError ? (
                                        <span className="metric-error" title={telemetryError}>Error</span>
                                    ) : (
                                        buildSuccessRate
                                    )}
                                </div>
                                <p>
                                    {telemetryError ? (
                                        'Telemetry load failure'
                                    ) : (
                                        `${buildSuccessCount} successful / ${buildFailedCount} failed`
                                    )}
                                </p>
                            </div>
                        </div>
                    );
                })()}
            </div>

            <div className="mon-stats-grid">
                {(() => {
                    const backupStatus = telemetry?.telemetry?.backup?.lastStatus || 'No Backup';
                    const isBackupError = telemetryError || backupStatus.toLowerCase().includes('error');
                    const backupCardClass = isBackupError ? 'critical' : (backupStatus === 'success' || backupStatus === 'verified' || backupStatus === 'valid') ? 'success' : 'warning';
                    
                    return (
                        <div className={`mon-stat-card ${backupCardClass}`}>
                            <span className="telemetry-badge live">● LIVE DATA</span>
                            <div className="card-icon"><Save /></div>
                            <div className="card-info">
                                <h3>Disaster Recovery</h3>
                                <p className="main-value">
                                    {telemetryError ? (
                                        <span className="metric-error" title={telemetryError}>Error</span>
                                    ) : (
                                        backupStatus.toUpperCase()
                                    )}
                                </p>
                                <p>Last: {telemetry?.telemetry?.backup?.lastRun ? new Date(telemetry?.telemetry?.backup?.lastRun).toLocaleDateString() : 'Never'}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-light)', marginTop: '4px' }}>
                                    <span>Size: {telemetry?.telemetry?.backup?.lastSize || '0 MB'}</span>
                                    <span>Count: {telemetry?.telemetry?.backup?.count || 0} Backups</span>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                <div className="mon-stat-card success">
                    <span className="telemetry-badge live">● LIVE DATA</span>
                    <div className="card-icon"><HardDrive /></div>
                    <div className="card-info">
                        <h3>Uploads Storage</h3>
                        <p className="main-value">
                            {telemetryError ? (
                                <span className="metric-error" title={telemetryError}>Error</span>
                            ) : (
                                telemetry?.telemetry?.storage?.uploadsFolderSize || '0.00 MB'
                            )}
                        </p>
                        <p>
                            {telemetryError ? (
                                'Storage query failure'
                            ) : (
                                `${telemetry?.telemetry?.storage?.fileCount || 0} Files / ${telemetry?.telemetry?.storage?.artifactCount || 0} Artifacts`
                            )}
                        </p>
                    </div>
                </div>

                <div className="mon-stat-card info">
                    <span className="telemetry-badge live">● LIVE DATA</span>
                    <div className="card-icon"><FileText /></div>
                    <div className="card-info">
                        <h3>Node Health</h3>
                        <p className="main-value">{telemetryError ? 'Error' : 'Online'}</p>
                        <p>Server: {telemetryError ? 'Unknown host' : (telemetry?.telemetry?.system?.osNode || 'Local Host')}</p>
                    </div>
                </div>
            </div>
            </>
            )}

            {/* Provider Balance & Health Section */}
            {isProviderMonitoring && (
            <div className="mon-providers-section" style={{ position: 'relative' }}>
                <span className="telemetry-badge live" style={{ top: '24px', right: '24px' }}>● LIVE DATA</span>
                <div className="section-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <Zap size={22} style={{ color: '#eab308' }} /> Provider Balance & Safety Protection
                    </h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '14.5px', margin: 0 }}>Realtime VTU gateway balance monitor with automated failover guards</p>
                </div>
                
                <div className="providers-grid">
                    {providers.map(prov => {
                        const status = getProviderStatus(prov);
                        const edit = providerEdits[prov._id] || {};
                        const currency = prov.providerName === 'reloadly' ? '$' : '₦';
                        
                        return (
                            <div className="provider-card" key={prov._id}>
                                <div className="provider-card-header">
                                    <h4>{prov.providerName === 'clubkonnect' ? 'ClubKonnect (Value)' : prov.providerName === 'peyflex' ? 'Peyflex (Smart)' : 'Reloadly (Intl)'}</h4>
                                    <span className={`provider-status-badge ${status.color}`}>
                                        {status.dot} {status.text}
                                    </span>
                                </div>
                                
                                <div className="provider-balance-section">
                                    <div className="provider-balance-label">Monitored Balance</div>
                                    <div className="provider-balance-value">
                                        {currency}{prov.balance ? prov.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-light)', marginTop: '8px' }}>
                                        <span>Last Check: {prov.lastUpdated ? new Date(prov.lastUpdated).toLocaleTimeString() : 'Never'}</span>
                                        <span>Latency: {prov.latency !== undefined ? `${prov.latency}ms` : '0ms'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>
                                        {(() => {
                                            const fc = prov.failureCount || 0;
                                            const threshold = 3;
                                            const displayCount = fc >= threshold ? `≥${threshold}` : fc;
                                            const isStale = fc >= threshold;
                                            return (
                                                <span style={{ color: isStale ? '#ef4444' : '#94a3b8' }}>
                                                    Failures: {displayCount} / {threshold}
                                                    {isStale && (
                                                        <button
                                                            title="Reset stale failure counter"
                                                            onClick={() => handleResetFailures(prov.providerName)}
                                                            style={{
                                                                marginLeft: '8px', background: 'none', border: '1px solid #ef444466',
                                                                color: '#ef4444', borderRadius: '6px', padding: '1px 6px',
                                                                fontSize: '10px', cursor: 'pointer', fontWeight: '600'
                                                            }}
                                                        >Reset</button>
                                                    )}
                                                </span>
                                            );
                                        })()}
                                        <span>
                                            {prov.isUnderMaintenance
                                                ? '⚠️ Maintenance'
                                                : status.color === 'offline' || status.color === 'critical'
                                                    ? '✗ Offline'
                                                    : '✓ Connected'
                                            }
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="provider-thresholds-title">Trigger Thresholds & Priority</div>
                                
                                <div className="provider-threshold-row">
                                    <label>Failover Priority (1 = Primary)</label>
                                    <input 
                                        type="number" 
                                        className="provider-threshold-input"
                                        value={edit.priority !== undefined ? edit.priority : (prov.priority || 1)}
                                        onChange={(e) => handleEditChange(prov._id, 'priority', Number(e.target.value))}
                                    />
                                </div>
                                
                                <div className="provider-threshold-row">
                                    <label>Warning (Low Balance)</label>
                                    <input 
                                        type="number" 
                                        className="provider-threshold-input"
                                        value={edit.warningThreshold !== undefined ? edit.warningThreshold : prov.warningThreshold}
                                        onChange={(e) => handleEditChange(prov._id, 'warningThreshold', Number(e.target.value))}
                                    />
                                </div>
                                
                                <div className="provider-threshold-row">
                                    <label>Critical (Wallet Empty)</label>
                                    <input 
                                        type="number" 
                                        className="provider-threshold-input"
                                        value={edit.criticalThreshold !== undefined ? edit.criticalThreshold : prov.criticalThreshold}
                                        onChange={(e) => handleEditChange(prov._id, 'criticalThreshold', Number(e.target.value))}
                                    />
                                </div>
                                
                                <div className="provider-threshold-row">
                                    <label>Pause (Auto Shutoff)</label>
                                    <input 
                                        type="number" 
                                        className="provider-threshold-input"
                                        value={edit.pauseThreshold !== undefined ? edit.pauseThreshold : prov.pauseThreshold}
                                        onChange={(e) => handleEditChange(prov._id, 'pauseThreshold', Number(e.target.value))}
                                    />
                                </div>
                                
                                <div className="provider-card-footer">
                                    <label className="provider-toggle-label">
                                        <input 
                                            type="checkbox" 
                                            className="provider-toggle-input"
                                            checked={!edit.manualDisabled}
                                            onChange={(e) => handleEditChange(prov._id, 'manualDisabled', !e.target.checked)}
                                        />
                                        <span>{edit.manualDisabled ? 'Paused (Disabled)' : 'Active (Enabled)'}</span>
                                    </label>
                                    
                                    <button 
                                        className="provider-save-btn"
                                        onClick={() => handleUpdateProvider(prov._id)}
                                        disabled={savingProviderId === prov._id}
                                    >
                                        <Save size={14} /> {savingProviderId === prov._id ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            )}

            {isSystemHealth && (
            <div className="mon-bottom-grid">
                <div className="mon-logs-section" style={{ position: 'relative' }}>
                    <span className="telemetry-badge live" style={{ top: '24px', right: '24px' }}>● LIVE DATA</span>
                    <div className="section-header">
                        <h3><Lock size={18} /> Recent Administrative Activity</h3>
                        <button className="view-all-link">Full Audit Log <ChevronRight size={14} /></button>
                    </div>
                    <div className="logs-list">
                        {statsError ? (
                            <p className="no-data" style={{ color: '#dc2626' }}>⚠️ {statsError}</p>
                        ) : stats?.recentLogs && stats.recentLogs.length > 0 ? (
                            stats.recentLogs.map((log, i) => (
                                <div className="log-item" key={i}>
                                    <div className="log-time">{new Date(log.createdAt).toLocaleTimeString()}</div>
                                    <div className="log-details">
                                        <span className="log-admin">{log.adminId?.name || 'System'}</span>
                                        <span className="log-action">{log.action}</span>
                                    </div>
                                    <div className="log-ip">{log.ipAddress || '127.0.0.1'}</div>
                                </div>
                            ))
                        ) : (
                            <p className="no-data">No administrative actions recorded in audit logs.</p>
                        )}
                    </div>
                </div>

                <div className="mon-system-status" style={{ position: 'relative' }}>
                    <span className="telemetry-badge live" style={{ top: '24px', right: '24px' }}>● LIVE DATA</span>
                    <h3><Server size={18} /> Real-Time Platform Telemetry</h3>
                    <div className="status-checklist">
                        <div className="status-item ok" style={{ justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Activity size={16} />
                                <span>CPU Usage (Avg)</span>
                            </div>
                            <strong>
                                {telemetryError ? (
                                    <span className="metric-error" title={telemetryError}>Error</span>
                                ) : (
                                    `${telemetry?.telemetry?.system?.cpu !== undefined ? telemetry.telemetry.system.cpu : 0}%`
                                )}
                            </strong>
                        </div>
                        <div className="status-item ok" style={{ justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Database size={16} />
                                <span>Memory Consumption</span>
                            </div>
                            <strong>
                                {telemetryError ? (
                                    <span className="metric-error" title={telemetryError}>Error</span>
                                ) : (
                                    `${telemetry?.telemetry?.system?.memory || 0}% (Node: ${telemetry?.telemetry?.system?.nodeMemory || '0.0 MB'})`
                                )}
                            </strong>
                        </div>
                        <div className="status-item ok" style={{ justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Save size={16} />
                                <span>Artifact Backups</span>
                            </div>
                            <strong>
                                {telemetryError ? (
                                    <span className="metric-error" title={telemetryError}>Error</span>
                                ) : (
                                    (telemetry?.telemetry?.backup?.lastStatus === 'success' || telemetry?.telemetry?.backup?.lastStatus === 'verified' || telemetry?.telemetry?.backup?.lastStatus === 'valid') ? 'Synchronized' : 'Failing / Offline'
                                )}
                            </strong>
                        </div>
                        <div className="status-item info" style={{ justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <RefreshCw size={16} />
                                <span>Build Queue Pool</span>
                            </div>
                            <strong>
                                {telemetryError ? (
                                    <span className="metric-error" title={telemetryError}>Error</span>
                                ) : (
                                    `${telemetry?.telemetry?.queue?.active || 0} / ${telemetry?.telemetry?.queue?.concurrencyLimit || 3}`
                                )}
                            </strong>
                        </div>
                        <div className="status-item ok" style={{ justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShieldAlert size={16} />
                                <span>Database Connectivity</span>
                            </div>
                            <strong>
                                {telemetryError ? (
                                    <span className="metric-error" title={telemetryError}>Error</span>
                                ) : (
                                    telemetry?.telemetry?.database?.status || 'Offline'
                                )}
                            </strong>
                        </div>
                        <div className="status-item info" style={{ justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Clock size={16} />
                                <span>System Uptime</span>
                            </div>
                            <strong>
                                {telemetryError ? (
                                    <span className="metric-error" title={telemetryError}>Error</span>
                                ) : (
                                    telemetry?.telemetry?.system?.uptime || '0 hrs'
                                )}
                            </strong>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
};

export default MonitoringDashboard;
