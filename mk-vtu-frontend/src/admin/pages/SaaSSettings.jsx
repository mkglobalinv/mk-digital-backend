import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    Settings, Shield, Zap, Globe, Smartphone, Bell, 
    BarChart, Lock, Save, AlertCircle, ShieldCheck,
    Check, X, RefreshCw, Layers, Terminal
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import API from '../../api';
import './AdminAppRequests.css'; // Reuse container styles

const SaaSSettings = () => {
    const { showToast, updateToast } = useToast();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await API.get('/api/admin/system-settings');
            const data = res.data;
            if (!data.globalFeatures) data.globalFeatures = {};
            if (!data.premiumPricing) data.premiumPricing = { sixMonths: 0, yearly: 0 };
            setSettings(data);
        } catch (err) {
            showToast('Infrastructure connection failed.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const toastId = await showToast('Saving infrastructure settings...', 'loading');
        try {
            const res = await API.post('/api/admin/system-settings', settings);
            updateToast(toastId, { type: 'success', message: res.data.message || 'Infrastructure settings committed.' });
        } catch (err) {
            updateToast(toastId, { type: 'error', message: err.response?.data?.message || 'Failed to persist settings.' });
        } finally {
            setSaving(false);
        }
    };

    const toggleGlobalFeature = (key) => {
        setSettings({
            ...settings,
            globalFeatures: {
                ...settings.globalFeatures,
                [key]: !settings.globalFeatures[key]
            }
        });
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <RefreshCw className="animate-spin" size={48} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
            <h2 style={{ fontWeight: 700 }}>Loading SaaS Infrastructure...</h2>
        </div>
    );

    if (!settings) return (
        <div className="studio-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
            <h2 style={{ fontWeight: 700 }}>Failed to Load Settings</h2>
            <p style={{ color: 'var(--text-gray)' }}>The system settings could not be loaded. Please ensure the backend is reachable.</p>
            <button className="premium-btn premium-btn-primary" onClick={fetchSettings} style={{ marginTop: '16px' }}>
                <RefreshCw size={18} /> Retry Connection
            </button>
        </div>
    );

    const location = useLocation();
    const isMaintenance = location.pathname.includes('/maintenance');

    return (
        <div className="studio-container animate-fade-in">
            <header className="studio-header">
                <div>
                    <h1>{isMaintenance ? 'System Maintenance' : 'SaaS Config / Platform'}</h1>
                    <p>{isMaintenance ? 'Global availability controls.' : 'Manage global feature flags, subscription tiers, and infrastructure defaults.'}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="premium-btn premium-btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                        {saving ? 'Saving...' : 'Commit Changes'}
                    </button>
                </div>
            </header>

            <div className="card-grid" style={{ gap: '24px' }}>
                
                {/* Global Feature Flags */}
                {!isMaintenance && (
                <div className="premium-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
                            <Zap size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '19.8px', fontWeight: 800, margin: 0 }}>Global Feature Flags</h2>
                            <p style={{ margin: 0, fontSize: '14.3px', color: 'var(--text-gray)' }}>Master overrides for all resellers.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {Object.keys(settings.globalFeatures || {}).map(key => (
                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                                <span style={{ fontWeight: 700, fontSize: '15.4px', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                                <div 
                                    onClick={() => toggleGlobalFeature(key)}
                                    style={{ 
                                        width: '48px', 
                                        height: '24px', 
                                        borderRadius: '12px', 
                                        background: settings.globalFeatures[key] ? 'var(--primary)' : 'var(--text-muted)', 
                                        position: 'relative', 
                                        cursor: 'pointer',
                                        transition: 'var(--transition-base)'
                                    }}
                                >
                                    <div style={{ 
                                        width: '18px', 
                                        height: '18px', 
                                        borderRadius: '50%', 
                                        background: 'var(--bg-card)', 
                                        position: 'absolute', 
                                        top: '3px', 
                                        left: settings.globalFeatures[key] ? '27px' : '3px',
                                        transition: 'var(--transition-base)',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                )}

                {/* Platform Defaults */}
                {!isMaintenance && (
                <div className="premium-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ background: '#D1FAE5', color: '#10B981', padding: '10px', borderRadius: '12px' }}>
                            <Layers size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '19.8px', fontWeight: 800, margin: 0 }}>Platform Defaults</h2>
                            <p style={{ margin: 0, fontSize: '14.3px', color: 'var(--text-gray)' }}>Initial configuration for new nodes.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="input-group">
                            <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Activation Fee (₦)</label>
                            <input 
                                type="number" 
                                className="input-field" 
                                value={settings.activationFee}
                                onChange={e => setSettings({ ...settings, activationFee: Number(e.target.value) })}
                                style={{ height: '48px', fontSize: '17.6px', fontWeight: 700 }}
                            />
                        </div>
                        <div className="input-group">
                            <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Trial Duration (Days)</label>
                            <input 
                                type="number" 
                                className="input-field" 
                                value={settings.trialDays}
                                onChange={e => setSettings({ ...settings, trialDays: Number(e.target.value) })}
                                style={{ height: '48px', fontSize: '17.6px', fontWeight: 700 }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
                            <span style={{ fontWeight: 700, fontSize: '15.4px' }}>Allow Registrations</span>
                            <div 
                                onClick={() => setSettings({ ...settings, allowNewResellers: !settings.allowNewResellers })}
                                style={{ 
                                    width: '48px', 
                                    height: '24px', 
                                    borderRadius: '12px', 
                                    background: settings.allowNewResellers ? 'var(--primary)' : 'var(--text-muted)', 
                                    position: 'relative', 
                                    cursor: 'pointer',
                                    transition: 'var(--transition-base)'
                                }}
                            >
                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--bg-card)', position: 'absolute', top: '3px', left: settings.allowNewResellers ? '27px' : '3px', transition: 'var(--transition-base)' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
                )}

                {/* System Maintenance */}
                <div className="premium-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '10px', borderRadius: '12px' }}>
                            <Lock size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '19.8px', fontWeight: 800, margin: 0 }}>System Maintenance</h2>
                            <p style={{ margin: 0, fontSize: '14.3px', color: 'var(--text-gray)' }}>Global availability controls.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#FEF2F2', borderRadius: 'var(--radius-md)', border: '1px solid #FEE2E2' }}>
                            <span style={{ fontWeight: 800, fontSize: '15.4px', color: '#B91C1C' }}>MAINTENANCE MODE</span>
                            <div 
                                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                style={{ 
                                    width: '48px', 
                                    height: '24px', 
                                    borderRadius: '12px', 
                                    background: settings.maintenanceMode ? '#EF4444' : 'var(--text-muted)', 
                                    position: 'relative', 
                                    cursor: 'pointer',
                                    transition: 'var(--transition-base)'
                                }}
                            >
                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--bg-card)', position: 'absolute', top: '3px', left: settings.maintenanceMode ? '27px' : '3px', transition: 'var(--transition-base)' }}></div>
                            </div>
                        </div>
                        <div className="input-group">
                            <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Target Audience</label>
                            <select 
                                className="input-field"
                                value={settings.maintenanceTarget || 'all'}
                                onChange={e => setSettings({ ...settings, maintenanceTarget: e.target.value })}
                                style={{ height: '48px', fontSize: '15.4px', fontWeight: 700 }}
                            >
                                <option value="all">All Users (Global Emergency Hold)</option>
                                <option value="reseller">Resellers Only</option>
                                <option value="customer">Retail Customers Only</option>
                                <option value="premium_reseller">Premium Resellers Only</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Public Message</label>
                            <textarea 
                                className="input-field" 
                                rows={4}
                                value={settings.maintenanceMessage}
                                onChange={e => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                                style={{ padding: '12px', fontSize: '15.4px' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Premium Pricing */}
                {!isMaintenance && (
                <div className="premium-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ background: '#F5F3FF', color: '#8B5CF6', padding: '10px', borderRadius: '12px' }}>
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '19.8px', fontWeight: 800, margin: 0 }}>Premium Subscription</h2>
                            <p style={{ margin: 0, fontSize: '14.3px', color: 'var(--text-gray)' }}>Revenue model configuration.</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="input-group">
                            <label style={{ display: 'block', fontSize: '12.1px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>6 Months (₦)</label>
                            <input 
                                type="number" 
                                className="input-field" 
                                value={settings.premiumPricing?.sixMonths}
                                onChange={e => setSettings({ ...settings, premiumPricing: { ...settings.premiumPricing, sixMonths: Number(e.target.value) } })}
                                style={{ height: '48px', fontWeight: 700 }}
                            />
                        </div>
                        <div className="input-group">
                            <label style={{ display: 'block', fontSize: '12.1px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>12 Months (₦)</label>
                            <input 
                                type="number" 
                                className="input-field" 
                                value={settings.premiumPricing?.yearly}
                                onChange={e => setSettings({ ...settings, premiumPricing: { ...settings.premiumPricing, yearly: Number(e.target.value) } })}
                                style={{ height: '48px', fontWeight: 700 }}
                            />
                        </div>
                    </div>
                    <div style={{ marginTop: '20px', padding: '12px', background: 'var(--info-light)', borderRadius: '12px', color: '#1E40AF', fontSize: '13.2px', fontWeight: 500 }}>
                        Monthly billing is disabled by system policy to ensure reseller stability.
                    </div>
                </div>
                )}

            </div>
        </div>
    );
};

export default SaaSSettings;
