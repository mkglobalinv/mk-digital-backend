import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    Send, Users, User, Bell, CheckCircle, 
    AlertCircle, Globe, Layout, 
    RefreshCw, Info
} from 'lucide-react';
import API from '../../api';
import './NotificationCenter.css';

const NotificationCenter = () => {
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        target: 'all', // 'all', 'specific', 'multiple', 'resellers', 'reseller-customers'
        userId: '',
        type: 'info'
    });
    const [loading, setLoading] = useState(false);
    const [sentCount, setSentCount] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');
    const location = useLocation();

    useEffect(() => {
        if (location.state?.userId) {
            setFormData(prev => ({
                ...prev,
                target: 'specific',
                userId: location.state.userId
            }));
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            await API.post('/api/admin/notifications', formData);
            setShowSuccess(true);
            setFormData({ title: '', message: '', target: 'all', userId: '', type: 'info' });
            setSentCount(prev => prev + 1);
            setTimeout(() => setShowSuccess(false), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to dispatch notification cluster.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="notif-container">
            <header className="studio-header">
                <div>
                    <h1>Broadcast Center <span style={{ color: 'var(--primary)', opacity: 0.5 }}>/</span> Communications</h1>
                    <p>Dispatch real-time alerts and targeted messages across the ecosystem.</p>
                </div>
                <div className="premium-glass" style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.3px', fontWeight: 600 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }}></div>
                    Gateway Active
                </div>
            </header>

            <div className="notif-grid">
                <div className="broadcast-card">
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="badge badge-danger" style={{ width: '100%', padding: '12px', marginBottom: '24px', borderRadius: '12px' }}>
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '16px' }}>Target Audience Segment</label>
                            <div className="target-selector-modern">
                                {[
                                    { id: 'all', label: 'All Users', icon: <Users size={20} /> },
                                    { id: 'specific', label: 'Single User', icon: <User size={20} /> },
                                    { id: 'resellers', label: 'Partners', icon: <Globe size={20} /> },
                                    { id: 'reseller-customers', label: 'Sub-Users', icon: <Layout size={20} /> }
                                ].map(opt => (
                                    <div 
                                        key={opt.id} 
                                        className={`target-option ${formData.target === opt.id ? 'active' : ''}`}
                                        onClick={() => setFormData({...formData, target: opt.id})}
                                    >
                                        <div className="target-icon">{opt.icon}</div>
                                        <span className="target-label">{opt.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Alert Type</label>
                                <select 
                                    className="input-field" 
                                    style={{ height: '48px' }}
                                    value={formData.type} 
                                    onChange={e => setFormData({...formData, type: e.target.value})}
                                >
                                    <option value="info">System Info (Blue)</option>
                                    <option value="success">Success Event (Green)</option>
                                    <option value="warning">Important Alert (Amber)</option>
                                    <option value="danger">Critical Breach (Red)</option>
                                </select>
                            </div>
                            {(formData.target === 'specific' || formData.target === 'reseller-customers') && (
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                        {formData.target === 'reseller-customers' ? 'Reseller (Owner) ID' : 'Target User ID'}
                                    </label>
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        style={{ height: '48px' }}
                                        placeholder="Enter unique identifier..."
                                        value={formData.userId}
                                        onChange={e => setFormData({...formData, userId: e.target.value})}
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        <div className="input-group" style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Broadcast Headline</label>
                            <input 
                                type="text" 
                                className="input-field" 
                                style={{ height: '48px' }}
                                placeholder="e.g. Scheduled Maintenance Notice"
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                required
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Message Payload</label>
                            <textarea 
                                className="input-field" 
                                rows={6}
                                placeholder="Describe the event or provide instructions..."
                                value={formData.message}
                                onChange={e => setFormData({...formData, message: e.target.value})}
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            className={`premium-btn premium-btn-primary ${showSuccess ? 'badge-success' : ''}`}
                            style={{ width: '100%', height: '56px', fontSize: '17.6px' }}
                            disabled={loading || showSuccess}
                        >
                            {loading ? <RefreshCw className="animate-spin" size={20} /> : 
                             showSuccess ? <><CheckCircle size={20} /> Broadcast Dispatched!</> : 
                             <><Send size={20} /> Fire Broadcast</>}
                        </button>
                    </form>
                </div>

                <div className="notif-sidebar">
                    <div className="notif-sidebar-card">
                        <div className="notif-illustration">
                            <Bell size={48} />
                        </div>
                        <h3>Real-time Alerts</h3>
                        <p>Notifications are pushed instantly to mobile applications and web dashboards via secure socket tunnels.</p>
                        <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-color)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13.2px', fontWeight: 800, color: 'var(--text-light)' }}>ACTIVE SESSION</span>
                            <span style={{ fontSize: '15.4px', fontWeight: 800, color: 'var(--primary)' }}>{sentCount} Dispatched</span>
                        </div>
                    </div>

                    <div className="premium-card" style={{ marginTop: '24px', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-gray)' }}>
                            <Info size={18} />
                            <span style={{ fontSize: '14.3px', fontWeight: 600 }}>Guidelines</span>
                        </div>
                        <ul style={{ margin: '16px 0 0', padding: '0 0 0 16px', fontSize: '14.3px', color: 'var(--text-gray)', lineHeight: '1.8' }}>
                            <li>Be concise with headlines.</li>
                            <li>Use <strong>Warning</strong> for service outages.</li>
                            <li>Targeting <strong>Sub-Users</strong> requires a Reseller ID.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;
