import React, { useState, useEffect } from 'react';
import { Layers, Globe, MonitorSmartphone, CheckCircle, Info } from 'lucide-react';
import API from '../../api';
import { useToast } from '../components/ResellerToast';
import './ResellerDashboard.css';

const ResellerPlatforms = ({ user, refreshUser }) => {
    const [platforms, setPlatforms] = useState([]);
    const [enabledIds, setEnabledIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const toast = useToast();

    useEffect(() => {
        // user object should have enabledFuturePlatforms from backend
        if (user && user.enabledFuturePlatforms) {
            // It could be populated objects or just string IDs
            const ids = user.enabledFuturePlatforms.map(p => typeof p === 'object' ? p._id : p);
            setEnabledIds(ids);
        }
        fetchAvailablePlatforms();
    }, [user]);

    const fetchAvailablePlatforms = async () => {
        try {
            // Fetch globally enabled platforms. Will already format BBC Hausa correctly due to backend logic.
            const res = await API.get(`/api/content/future-platforms?resellerId=${user._id}`);
            setPlatforms(res.data);
        } catch (err) {
            setError('Failed to load platforms.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (platformId) => {
        const isEnabled = enabledIds.includes(platformId);
        let newIds;
        if (isEnabled) {
            newIds = enabledIds.filter(id => id !== platformId);
        } else {
            newIds = [...enabledIds, platformId];
        }
        
        // Optimistic UI update
        setEnabledIds(newIds);
        setSaving(true);
        
        try {
            await API.post('/api/reseller/update-platforms', { enabledFuturePlatforms: newIds });
            toast.success("Platform settings updated!");
            if (refreshUser) refreshUser(); // Optional background sync
        } catch (err) {
            // Revert on error
            setEnabledIds(enabledIds);
            toast.error('Failed to update platforms. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="reseller-dashboard">
            <div className="dashboard-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h2><Layers size={24} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Website Addons & Platforms</h2>
                    <p>Enable or disable third-party platforms and integrations on your website.</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '12px', marginBottom: '24px' }}>
                    {error}
                </div>
            )}

            <div className="analytics-widget-card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px' }}>
                
                <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
                    <Info size={20} color="#3B82F6" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>
                        <strong>Note:</strong> When you enable a platform, it will appear as an interactive tab or app inside your customers' dashboards. Changes apply immediately.
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading available platforms...</div>
                ) : platforms.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-gray)' }}>
                        <Layers size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-dark)' }}>No Platforms Available</h3>
                        <p style={{ margin: 0 }}>There are currently no globally enabled integrations.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {platforms.map(p => {
                            const isEnabled = enabledIds.includes(p._id);
                            
                            return (
                                <div key={p._id} style={{ border: `1px solid ${isEnabled ? 'var(--reseller-primary)' : 'var(--border-color)'}`, borderRadius: '16px', padding: '20px', background: isEnabled ? 'rgba(99, 102, 241, 0.03)' : 'var(--bg-color)', transition: 'all 0.2s', position: 'relative' }}>
                                    
                                    {isEnabled && (
                                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--reseller-primary)', color: 'white', borderRadius: '50%', padding: '4px' }}>
                                            <CheckCircle size={18} />
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                        {p.logoUrl ? (
                                            <img src={p.logoUrl} alt={p.displayName} style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', background: '#fff', border: '1px solid var(--border-color)' }} />
                                        ) : (
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-gray)', border: '1px solid var(--border-color)' }}>
                                                <Layers size={24} />
                                            </div>
                                        )}
                                        <div>
                                            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-dark)' }}>{p.displayName}</h4>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                {p.mode === 'internal' ? <MonitorSmartphone size={10} /> : <Globe size={10} />}
                                                {p.mode === 'internal' ? 'In-App' : 'External Link'}
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleToggle(p._id)}
                                        disabled={saving}
                                        style={{ 
                                            width: '100%', 
                                            padding: '10px', 
                                            borderRadius: '8px', 
                                            border: 'none', 
                                            background: isEnabled ? 'rgba(239, 68, 68, 0.1)' : 'var(--reseller-primary)', 
                                            color: isEnabled ? '#EF4444' : '#fff', 
                                            fontWeight: '700', 
                                            cursor: saving ? 'not-allowed' : 'pointer',
                                            opacity: saving ? 0.7 : 1
                                        }}
                                    >
                                        {isEnabled ? 'Disable Platform' : 'Enable Platform'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResellerPlatforms;
