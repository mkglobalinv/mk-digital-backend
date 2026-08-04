import React, { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle2, XCircle, Users } from 'lucide-react';
import API from '../../api';
import './ResellerEmailCampaign.css';
import { Link } from 'react-router-dom';

const ResellerEmailCampaign = ({ user }) => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [form, setForm] = useState({ subject: '', message: '', recipientType: 'all' });
    const [msg, setMsg] = useState({ type: '', text: '' });

    const isPremium = user?.resellerTier === 'premium';

    useEffect(() => {
        if (isPremium) {
            fetchCampaigns();
        }
    }, [isPremium]);

    const fetchCampaigns = async () => {
        try {
            const res = await API.get('/api/reseller/email-campaigns');
            setCampaigns(res.data);
        } catch (err) {
            console.error("Failed to fetch campaigns", err);
        } finally {
            setFetching(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });
        
        if (!form.subject || !form.message || !form.recipientType) {
            return setMsg({ type: 'error', text: 'All fields are required.' });
        }

        setLoading(true);
        try {
            await API.post('/api/reseller/email-campaign', form);
            setMsg({ type: 'success', text: 'Campaign queued successfully.' });
            setForm({ subject: '', message: '', recipientType: 'all' });
            fetchCampaigns();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to queue campaign.' });
        } finally {
            setLoading(false);
        }
    };

    if (!isPremium) {
        return (
            <div className="email-campaign-page">
                <div className="upgrade-banner">
                    <Clock size={48} style={{ color: '#f59e0b', margin: '0 auto 16px' }} />
                    <h3>Advanced Feature Locked</h3>
                    <p>Pay the Website Hosting & Maintenance Fee to unlock Email Push Notifications.</p>
                    <Link to="/website/premium" className="upgrade-btn">Activate Website Hosting & Maintenance</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="email-campaign-page">
            <div className="campaign-header">
                <h2>Advanced Email Campaign</h2>
                <p>Send isolated push notifications to your own customers.</p>
            </div>

            {msg.text && (
                <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '8px', background: msg.type === 'error' ? '#fee2e2' : '#dcfce3', color: msg.type === 'error' ? '#b91c1c' : '#166534' }}>
                    {msg.text}
                </div>
            )}

            <div className="campaign-card">
                <form onSubmit={handleSend}>
                    <div className="campaign-form-group">
                        <label>Subject</label>
                        <input 
                            type="text" 
                            className="campaign-input" 
                            placeholder="Enter email subject"
                            value={form.subject}
                            onChange={(e) => setForm({...form, subject: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div className="campaign-form-group">
                        <label>Message (HTML Supported)</label>
                        <textarea 
                            className="campaign-textarea" 
                            placeholder="Write your email content here..."
                            value={form.message}
                            onChange={(e) => setForm({...form, message: e.target.value})}
                            required
                        />
                    </div>

                    <div className="campaign-form-group">
                        <label>Recipients</label>
                        <select 
                            className="campaign-select"
                            value={form.recipientType}
                            onChange={(e) => setForm({...form, recipientType: e.target.value})}
                        >
                            <option value="all">All My Customers</option>
                            <option value="active">Active Customers Only</option>
                        </select>
                    </div>

                    <button type="submit" className="campaign-submit-btn" disabled={loading}>
                        {loading ? 'Queuing Campaign...' : <><Send size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} /> Send Campaign</>}
                    </button>
                </form>
            </div>

            <div className="campaign-history">
                <h3>Campaign History</h3>
                <div className="campaign-card">
                    {fetching ? (
                        <p>Loading history...</p>
                    ) : campaigns.length === 0 ? (
                        <p>No campaigns found.</p>
                    ) : (
                        <div className="history-table-wrapper">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Subject</th>
                                        <th>Type</th>
                                        <th>Recipients</th>
                                        <th>Success</th>
                                        <th>Failed</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.map(c => (
                                        <tr key={c._id}>
                                            <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                                            <td>{c.subject}</td>
                                            <td style={{ textTransform: 'capitalize' }}>{c.recipientType}</td>
                                            <td>{c.recipientCount}</td>
                                            <td style={{ color: '#166534' }}>{c.successCount}</td>
                                            <td style={{ color: '#b91c1c' }}>{c.failedCount}</td>
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

export default ResellerEmailCampaign;
