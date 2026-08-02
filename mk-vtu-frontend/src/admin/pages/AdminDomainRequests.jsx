import React, { useState, useEffect } from 'react';
import { 
    Globe, CheckCircle, AlertTriangle, RefreshCw, Save, 
    User, Server, HelpCircle, MessageCircle, ExternalLink,
    Lock, ShieldCheck, Clock, Mail
} from 'lucide-react';
import API from '../../api';

const AdminDomainRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [editStates, setEditStates] = useState({});

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/admin/domain-requests');
            const data = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.requests || []);
            setRequests(data);

            const initialStates = {};
            data.forEach((r, index) => {
                const key = r._id || index;
                initialStates[key] = {
                    status: r.status || 'Request Submitted',
                    adminNotes: r.adminNotes || '',
                    deploymentUrl: r.deploymentUrl || '',
                    liveUrl: r.liveUrl || '',
                    sslStatus: r.sslStatus || 'Pending',
                    estimatedCompletionTime: r.estimatedCompletionTime || '24-48 Hours',
                    correctionRequired: r.correctionRequired || false,
                    notifyUser: true
                };
            });
            setEditStates(initialStates);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to load domain requests' });
        } finally {
            setLoading(false);
        }
    };

    const handleStateChange = (id, field, value) => {
        setEditStates(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const updateStatus = async (id) => {
        setUpdatingId(id);
        setMsg({ type: '', text: '' });
        try {
            const payload = {
                ...editStates[id]
            };

            await API.put(`/api/admin/domain-requests/${id}`, payload);
            setMsg({ type: 'success', text: 'Domain infrastructure lifecycle updated successfully' });
            await fetchRequests();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Update processing failed' });
        } finally {
            setUpdatingId(null);
        }
    };

    const approveDeployment = async (id) => {
        if (!window.confirm("Are you sure you want to trigger the automated deployment for this domain?")) return;
        setUpdatingId(id);
        setMsg({ type: '', text: '' });
        try {
            const res = await API.post(`/api/admin/domain-requests/${id}/deploy`);
            setMsg({ type: 'success', text: res.data.message || 'Automated deployment triggered successfully!' });
            await fetchRequests();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Deployment processing failed' });
        } finally {
            setUpdatingId(null);
        }
    };

    const openWhatsApp = (req) => {
        const phone = req.whatsappNumber || (req.resellerId?.phone) || '';
        if (!phone) {
            alert("No contact number found for this reseller.");
            return;
        }
        
        const cleanPhone = phone.replace(/\D/g, '');
        const message = `Hello ${req.resellerId?.name || 'Reseller'},\n\nI am contacting you regarding your domain request for *${req.domainName}*.\n\nCurrent Status: *${req.status}*\n\nUpdates: ${editStates[req._id]?.adminNotes || 'We are currently processing your connection.'}`;
        
        window.open(`https://wa.me/${cleanPhone.startsWith('234') ? cleanPhone : '234' + cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const statuses = [
        "Request Submitted", 
        "Pending Review", 
        "Domain Verification", 
        "SSL Activation", 
        "Website Deployment", 
        "Final Testing",
        "Connected Successfully", 
        "Failed / Needs Correction"
    ];

    return (
        <div className="admin-container animate-fade-in" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '30.8px', fontWeight: 900, color: 'var(--text-dark)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Globe size={32} color="#3b82f6" /> Domain Operations Center
                    </h1>
                    <p style={{ fontSize: '15.4px', color: 'var(--text-light)', margin: 0 }}>Managed DNS routing, SSL provisioning, and global website deployment.</p>
                </div>
                
                <button className="admin-btn secondary" onClick={fetchRequests} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px' }}>
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Operations
                </button>
            </div>

            <div className="details-scroll-panel" style={{
                height: 'calc(100vh - 120px)',
                overflowY: 'auto',
                paddingTop: '24px',
                paddingBottom: '24px',
                scrollPaddingTop: '24px',
                scrollBehavior: 'smooth'
            }}>
                {msg.text && (
                    <div className={`admin-alert ${msg.type}`} style={{ marginBottom: '24px', borderRadius: '16px' }}>
                        {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                        <span>{msg.text}</span>
                    </div>
                )}

                {loading ? (
                    <div className="admin-loading" style={{ padding: '100px 0' }}>
                        <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 16px' }} />
                        Loading infrastructure mapping...
                    </div>
                ) : requests.length === 0 ? (
                    <div className="empty-state" style={{ background: 'var(--bg-card)', padding: '80px 20px', borderRadius: '24px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <HelpCircle size={64} color="#cbd5e1" style={{ margin: '0 auto 20px' }} />
                        <h3 style={{ fontSize: '22.0px', fontWeight: 800, color: 'var(--text-gray)', margin: '0 0 8px' }}>No Pending Requests</h3>
                        <p style={{ fontSize: '15.4px', color: 'var(--text-light)', margin: 0 }}>Custom domain submissions will appear here automatically.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '32px' }}>
                        {requests.map((req, index) => {
                            const key = req._id || index;
                            const state = editStates[key] || {};
                            const userDoc = req.resellerId || {};
                            const isConnected = req.status === 'Connected Successfully';

                            return (
                                <div key={key} style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
                                    {isConnected && (
                                        <div style={{ position: 'absolute', top: 0, right: 0, background: '#10b981', color: 'white', padding: '6px 20px', borderBottomLeftRadius: '20px', fontSize: '12.1px', fontWeight: 900, letterSpacing: '0.5px' }}>
                                            LIVE ON NETWORK
                                        </div>
                                    )}
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px', marginBottom: '24px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                <span style={{ fontSize: '11.0px', fontWeight: 900, background: isConnected ? '#d1fae5' : req.status === 'Failed / Needs Correction' ? '#fee2e2' : '#eff6ff', color: isConnected ? '#059669' : req.status === 'Failed / Needs Correction' ? '#dc2626' : '#2563eb', padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase' }}>
                                                    {req.status}
                                                </span>
                                                <span style={{ fontSize: '12.1px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} /> {new Date(req.createdAt).toLocaleString()}
                                                </span>
                                            </div>

                                            <h3 style={{ fontSize: '26.4px', fontWeight: 900, color: 'var(--text-dark)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {req.domainName} 
                                                <a href={`https://${req.domainName}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-light)' }}><ExternalLink size={18} /></a>
                                            </h3>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                                <div style={{ background: 'var(--bg-color)', padding: '12px 16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                                    <span style={{ fontSize: '11.0px', fontWeight: 800, color: 'var(--text-light)', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Store Owner</span>
                                                    <div style={{ fontSize: '14.3px', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <User size={14} /> {userDoc.name || 'Unknown'}
                                                    </div>
                                                    <div style={{ fontSize: '13.2px', color: 'var(--text-light)', marginTop: '2px' }}>{userDoc.email}</div>
                                                </div>

                                                <div style={{ background: 'var(--bg-color)', padding: '12px 16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                                    <span style={{ fontSize: '11.0px', fontWeight: 800, color: 'var(--text-light)', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Infrastructure</span>
                                                    <div style={{ fontSize: '14.3px', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Server size={14} /> {req.domainOption === 'custom_domain' ? 'Custom Root' : 'System Subdomain'}
                                                    </div>
                                                    <div style={{ fontSize: '13.2px', color: 'var(--text-light)', marginTop: '2px' }}>Provider: {req.registrarProvider || 'N/A'}</div>
                                                </div>

                                                <div style={{ background: 'var(--bg-color)', padding: '12px 16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                                    <span style={{ fontSize: '11.0px', fontWeight: 800, color: 'var(--text-light)', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Quick Actions</span>
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                                        <button onClick={() => openWhatsApp(req)} style={{ padding: '6px 12px', background: '#25D366', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12.1px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                            <MessageCircle size={14} /> WhatsApp
                                                        </button>
                                                        {req.contactEmail && (
                                                            <a href={`mailto:${req.contactEmail}`} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12.1px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                                                                <Mail size={14} /> Email
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ background: 'var(--bg-color)', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
                                        {req.metaData?.dnsRecords && req.metaData.dnsRecords.length > 0 && (
                                            <div style={{ marginBottom: '24px', background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '12px', padding: '16px' }}>
                                                <h4 style={{ fontSize: '13.2px', fontWeight: 800, color: '#d97706', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <AlertTriangle size={16} /> Required DNS Configuration
                                                </h4>
                                                <div style={{ overflowX: 'auto' }}>
                                                    <table style={{ width: '100%', fontSize: '13.2px', textAlign: 'left', borderCollapse: 'collapse' }}>
                                                        <thead>
                                                            <tr style={{ color: '#92400e', borderBottom: '1px solid #fcd34d' }}>
                                                                <th style={{ padding: '8px' }}>Type</th>
                                                                <th style={{ padding: '8px' }}>Name</th>
                                                                <th style={{ padding: '8px' }}>Value</th>
                                                                <th style={{ padding: '8px' }}>Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {req.metaData.dnsRecords.map((dns, i) => (
                                                                <tr key={i} style={{ borderBottom: '1px solid #fde68a' }}>
                                                                    <td style={{ padding: '8px', fontWeight: 700 }}>{dns.type}</td>
                                                                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{dns.name}</td>
                                                                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{dns.value}</td>
                                                                    <td style={{ padding: '8px', fontWeight: 700, color: dns.status === 'VERIFIED' ? '#059669' : '#dc2626' }}>{dns.status}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                                            <div>
                                                <label style={{ fontSize: '12.1px', fontWeight: 800, color: 'var(--text-light)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Fulfillment Milestone</label>
                                                <select 
                                                    className="admin-input" 
                                                    value={state.status}
                                                    onChange={(e) => handleStateChange(key, 'status', e.target.value)}
                                                    style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid #cbd5e1' }}
                                                >
                                                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '12.1px', fontWeight: 800, color: 'var(--text-light)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>SSL Security Status</label>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button 
                                                        onClick={() => handleStateChange(key, 'sslStatus', 'Active')}
                                                        style={{ flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid', borderColor: state.sslStatus === 'Active' ? '#10b981' : '#cbd5e1', background: state.sslStatus === 'Active' ? '#ecfdf5' : 'white', color: state.sslStatus === 'Active' ? '#059669' : '#64748b', fontSize: '13.2px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                                    >
                                                        <ShieldCheck size={14} /> Active
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStateChange(key, 'sslStatus', 'Pending')}
                                                        style={{ flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid', borderColor: state.sslStatus === 'Pending' ? '#f59e0b' : '#cbd5e1', background: state.sslStatus === 'Pending' ? '#fffbeb' : 'white', color: state.sslStatus === 'Pending' ? '#d97706' : '#64748b', fontSize: '13.2px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                                    >
                                                        <Lock size={14} /> Pending
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '12.1px', fontWeight: 800, color: 'var(--text-light)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Correction Needed?</label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '40px', background: state.correctionRequired ? '#fef2f2' : 'white', border: '1px solid', borderColor: state.correctionRequired ? '#ef4444' : '#cbd5e1', borderRadius: '12px', padding: '0 12px', cursor: 'pointer', fontSize: '14.3px', color: state.correctionRequired ? '#dc2626' : '#64748b', fontWeight: 700 }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={state.correctionRequired}
                                                        onChange={(e) => handleStateChange(key, 'correctionRequired', e.target.checked)}
                                                    />
                                                    Flag for Reseller Action
                                                </label>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                                            <div>
                                                <label style={{ fontSize: '12.1px', fontWeight: 800, color: 'var(--text-light)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Live Deployment URL</label>
                                                <input 
                                                    type="text" 
                                                    className="admin-input" 
                                                    value={state.liveUrl}
                                                    onChange={(e) => handleStateChange(key, 'liveUrl', e.target.value)}
                                                    placeholder="e.g. store.brand.com"
                                                    style={{ background: 'var(--bg-card)', borderRadius: '12px' }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '12.1px', fontWeight: 800, color: 'var(--text-light)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Internal Deployment Notes (Client Visible)</label>
                                                <input 
                                                    type="text" 
                                                    className="admin-input" 
                                                    value={state.adminNotes}
                                                    onChange={(e) => handleStateChange(key, 'adminNotes', e.target.value)}
                                                    placeholder="e.g. CNAME propagation complete. Finalizing SSL..."
                                                    style={{ background: 'var(--bg-card)', borderRadius: '12px' }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14.3px', color: 'var(--text-gray)', fontWeight: 700 }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={state.notifyUser}
                                                    onChange={(e) => handleStateChange(key, 'notifyUser', e.target.checked)}
                                                />
                                                Send Dashboard Notification
                                            </label>

                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                {req.status !== 'Connected Successfully' && req.status !== 'Website Deployment' && (
                                                    <button 
                                                        className="admin-btn"
                                                        onClick={() => approveDeployment(key)}
                                                        disabled={updatingId === key}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', borderRadius: '14px', fontSize: '14.3px', background: '#10b981', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                                                    >
                                                        {updatingId === key ? <RefreshCw size={16} className="animate-spin" /> : <Server size={16} />}
                                                        Approve Deployment
                                                    </button>
                                                )}
                                                <button 
                                                    className="admin-btn primary" 
                                                    onClick={() => updateStatus(key)}
                                                    disabled={updatingId === key}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 32px', borderRadius: '14px', fontSize: '15.4px' }}
                                                >
                                                    {updatingId === key ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                                                    Update Infrastructure State
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDomainRequests;
