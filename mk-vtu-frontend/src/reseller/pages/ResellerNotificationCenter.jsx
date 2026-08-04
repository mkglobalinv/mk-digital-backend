import React, { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle2, XCircle, Users, Bell, Mail, Smartphone } from 'lucide-react';
import API from '../../api';
import './ResellerNotificationCenter.css';
import { Link } from 'react-router-dom';

const ResellerNotificationCenter = ({ user }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [form, setForm] = useState({
        title: '',
        message: '',
        notificationType: 'Announcement',
        recipientType: 'all',
        deliveryChannels: ['in-app']
    });
    const [msg, setMsg] = useState({ type: '', text: '' });

    const isPremium = user?.resellerTier === 'premium';

    useEffect(() => {
        if (isPremium) {
            fetchHistory();
        }
    }, [isPremium]);

    const fetchHistory = async () => {
        try {
            const res = await API.get('/api/reseller/notifications/history');
            setHistory(res.data);
        } catch (err) {
            console.error("Failed to fetch notification history", err);
        } finally {
            setFetching(false);
        }
    };

    const handleChannelToggle = (channel) => {
        setForm(prev => {
            const channels = prev.deliveryChannels.includes(channel)
                ? prev.deliveryChannels.filter(c => c !== channel)
                : [...prev.deliveryChannels, channel];
            return { ...prev, deliveryChannels: channels };
        });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });
        
        if (!form.title || !form.message || !form.recipientType) {
            return setMsg({ type: 'error', text: 'All fields are required.' });
        }
        if (form.deliveryChannels.length === 0) {
            return setMsg({ type: 'error', text: 'Select at least one delivery channel.' });
        }

        setLoading(true);
        try {
            await API.post('/api/reseller/notifications/send', form);
            setMsg({ type: 'success', text: 'Notification cluster dispatched successfully.' });
            setForm({ 
                title: '', 
                message: '', 
                notificationType: 'Announcement', 
                recipientType: 'all', 
                deliveryChannels: ['in-app'] 
            });
            fetchHistory();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to dispatch notification.' });
        } finally {
            setLoading(false);
        }
    };

    if (!isPremium) {
        return (
            <div className="notif-center-page">
                <div className="notif-upgrade-banner">
                    <Clock size={48} style={{ color: '#f59e0b', margin: '0 auto 16px' }} />
                    <h3>Advanced Feature Locked</h3>
                    <p>Pay the Website Hosting & Maintenance Fee to unlock the Notification Center.</p>
                    <Link to="/website/premium" className="notif-upgrade-btn">Activate Website Hosting & Maintenance</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="notif-center-page">
            <div className="notif-header">
                <h2>Advanced Notification Center</h2>
                <p>Dispatch real-time in-app alerts and targeted emails to your customers.</p>
            </div>

            {msg.text && (
                <div className={`notif-alert ${msg.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                    {msg.text}
                </div>
            )}

            <div className="notif-card">
                <form onSubmit={handleSend}>
                    <div className="notif-form-grid">
                        <div className="notif-form-group">
                            <label>Notification Title</label>
                            <input 
                                type="text" 
                                className="notif-input" 
                                placeholder="e.g. Scheduled Maintenance Notice"
                                value={form.title}
                                onChange={(e) => setForm({...form, title: e.target.value})}
                                required
                            />
                        </div>
                        <div className="notif-form-group">
                            <label>Notification Type</label>
                            <select 
                                className="notif-select"
                                value={form.notificationType}
                                onChange={(e) => setForm({...form, notificationType: e.target.value})}
                            >
                                <option value="Announcement">Announcement</option>
                                <option value="Promotion">Promotion</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Information">Information</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="notif-form-group">
                        <label>Message Content</label>
                        <textarea 
                            className="notif-textarea" 
                            rows={4}
                            placeholder="Write your message content here..."
                            value={form.message}
                            onChange={(e) => setForm({...form, message: e.target.value})}
                            required
                        />
                    </div>

                    <div className="notif-form-grid">
                        <div className="notif-form-group">
                            <label>Target Audience</label>
                            <select 
                                className="notif-select"
                                value={form.recipientType}
                                onChange={(e) => setForm({...form, recipientType: e.target.value})}
                            >
                                <option value="all">All My Customers</option>
                                <option value="active">Active Customers Only</option>
                            </select>
                        </div>
                        
                        <div className="notif-form-group">
                            <label>Delivery Channels</label>
                            <div className="notif-channels">
                                <div 
                                    className={`channel-toggle ${form.deliveryChannels.includes('in-app') ? 'active' : ''}`}
                                    onClick={() => handleChannelToggle('in-app')}
                                >
                                    <Smartphone size={18} /> In-App
                                </div>
                                <div 
                                    className={`channel-toggle ${form.deliveryChannels.includes('email') ? 'active' : ''}`}
                                    onClick={() => handleChannelToggle('email')}
                                >
                                    <Mail size={18} /> Email
                                </div>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="notif-submit-btn" disabled={loading}>
                        {loading ? 'Dispatching...' : <><Send size={18} style={{ marginRight: '8px' }} /> Dispatch Notification</>}
                    </button>
                </form>
            </div>

            <div className="notif-history">
                <h3>Notification History</h3>
                <div className="notif-card">
                    {fetching ? (
                        <p>Loading history...</p>
                    ) : history.length === 0 ? (
                        <p>No notifications have been sent yet.</p>
                    ) : (
                        <div className="notif-table-wrapper">
                            <table className="notif-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Title</th>
                                        <th>Type</th>
                                        <th>Audience</th>
                                        <th>Channel</th>
                                        <th>Success</th>
                                        <th>Failed</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(c => (
                                        <tr key={c._id + c.channel}>
                                            <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                                            <td>{c.title}</td>
                                            <td>{c.type}</td>
                                            <td style={{ textTransform: 'capitalize' }}>{c.audience}</td>
                                            <td>
                                                <span className={`channel-badge ${c.channel === 'Email' ? 'channel-email' : 'channel-inapp'}`}>
                                                    {c.channel === 'Email' ? <Mail size={12} /> : <Smartphone size={12} />} {c.channel}
                                                </span>
                                            </td>
                                            <td style={{ color: '#10b981', fontWeight: 'bold' }}>{c.successCount}</td>
                                            <td style={{ color: '#ef4444', fontWeight: 'bold' }}>{c.failedCount}</td>
                                            <td><span className={`status-badge status-${c.status}`}>{c.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResellerNotificationCenter;
