import React, { useState, useEffect } from 'react';
import API from '../../api';
import { Search, Filter, MoreVertical, Shield, ShieldOff, UserMinus, Eye, UserPlus, X, Key, User, Mail, Lock, Wallet, Bell, ArrowUpRight, ArrowDownRight, Send } from 'lucide-react';

const ResellerCustomers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', pin: '1234' });
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [walletData, setWalletData] = useState({ action: 'credit', amount: '', reason: '', pin: '' });
    const [notifyData, setNotifyData] = useState({ subject: '', message: '' });
    const [actionMsg, setActionMsg] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await API.get('/api/reseller/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMsg(null);
        try {
            await API.post('/api/reseller/register-user', formData);
            setMsg({ type: 'success', text: 'User registered successfully' });
            setTimeout(() => {
                setShowAddModal(false);
                setFormData({ name: '', email: '', password: '', pin: '1234' });
                setMsg(null);
                fetchUsers();
            }, 1500);
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Registration failed' });
        } finally {
            setSubmitting(false);
        }
    };

    const toggleSuspension = async (userId, currentState) => {
        if (!window.confirm(`Are you sure you want to ${currentState ? 'activate' : 'suspend'} this user?`)) return;
        try {
            await API.post(`/api/reseller/users/${userId}/toggle-suspension`);
            fetchUsers();
        } catch (err) {
            alert("Action failed");
        }
    };

    const handleAdjustWallet = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setActionMsg(null);
        try {
            const res = await API.post(`/api/reseller/users/${selectedUser._id}/adjust-wallet`, walletData);
            setActionMsg({ type: 'success', text: res.data.message });
            setTimeout(() => {
                setShowWalletModal(false);
                setWalletData({ action: 'credit', amount: '', reason: '', pin: '' });
                setActionMsg(null);
                fetchUsers();
            }, 1500);
        } catch (err) {
            setActionMsg({ type: 'error', text: err.response?.data?.message || 'Adjustment failed' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendNotify = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setActionMsg(null);
        try {
            const res = await API.post(`/api/reseller/users/${selectedUser._id}/notify`, notifyData);
            setActionMsg({ type: 'success', text: res.data.message });
            setTimeout(() => {
                setShowNotifyModal(false);
                setNotifyData({ subject: '', message: '' });
                setActionMsg(null);
            }, 1500);
        } catch (err) {
            setActionMsg({ type: 'error', text: err.response?.data?.message || 'Notification failed' });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUsers = users.filter(u => 
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="reseller-view-content">
            <div className="dashboard-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Customer Management</h1>
                    <p>Monitor and manage your business customer base.</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    style={{ 
                        padding: '10px 20px', borderRadius: '10px', border: 'none', 
                        background: 'var(--reseller-primary)', color: 'white', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'
                    }}
                >
                    <UserPlus size={18} /> Register New Customer
                </button>
            </div>

            <div className="business-card">
                <div className="card-title-bar">
                    <div style={{ display: 'flex', gap: '15px', flex: 1 }}>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--reseller-text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Search by name or email..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '8px 12px 8px 35px', borderRadius: '8px', border: '1px solid var(--reseller-border)', fontSize: '14.3px' }}
                            />
                        </div>
                        <button className="tracker-step" style={{ border: 'none', cursor: 'pointer' }}><Filter size={14} /> Filter</button>
                    </div>
                    <span style={{ fontSize: '14.3px', fontWeight: 700, color: 'var(--reseller-text-muted)' }}>{filteredUsers.length} Customers</span>
                </div>

                <div style={{ overflowX: 'auto', padding: '0 8px 8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', textAlign: 'left' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Balance</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joined Date</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--reseller-text-muted)' }}>Loading customers...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--reseller-text-muted)' }}>No customers found.</td></tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user._id} style={{ background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderRadius: '12px', transition: 'all 0.2s', cursor: 'default' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.04)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}>
                                    <td style={{ padding: '16px 24px', borderRadius: '12px 0 0 12px', borderTop: '1px solid rgba(226,232,240,0.4)', borderBottom: '1px solid rgba(226,232,240,0.4)', borderLeft: '1px solid rgba(226,232,240,0.4)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: 'var(--reseller-primary)' }}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#1e293b' }}>{user.name}</div>
                                                <div style={{ fontSize: '13px', color: '#94a3b8' }}>{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px', fontWeight: 700, color: '#1e293b', borderTop: '1px solid rgba(226,232,240,0.4)', borderBottom: '1px solid rgba(226,232,240,0.4)' }}>₦{user.totalBalance?.toLocaleString()}</td>
                                    <td style={{ padding: '16px 24px', borderTop: '1px solid rgba(226,232,240,0.4)', borderBottom: '1px solid rgba(226,232,240,0.4)' }}>
                                        <span style={{ 
                                            padding: '6px 12px', borderRadius: '24px', fontSize: '11.5px', fontWeight: 700,
                                            background: user.isSuspended ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                            color: user.isSuspended ? '#ef4444' : '#10b981',
                                            display: 'inline-flex', alignItems: 'center', gap: '6px'
                                        }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                                            {user.isSuspended ? 'Suspended' : 'Active'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#64748b', borderTop: '1px solid rgba(226,232,240,0.4)', borderBottom: '1px solid rgba(226,232,240,0.4)' }}>
                                        {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td style={{ padding: '16px 24px', borderRadius: '0 12px 12px 0', borderTop: '1px solid rgba(226,232,240,0.4)', borderBottom: '1px solid rgba(226,232,240,0.4)', borderRight: '1px solid rgba(226,232,240,0.4)' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                title={user.isSuspended ? "Activate User" : "Suspend User"}
                                                onClick={() => toggleSuspension(user._id, user.isSuspended)}
                                                style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(241,245,249,0.8)', cursor: 'pointer', color: user.isSuspended ? '#10b981' : '#ef4444', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = user.isSuspended ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(241,245,249,0.8)'}
                                            >
                                                {user.isSuspended ? <Shield size={16} /> : <ShieldOff size={16} />}
                                            </button>
                                            <button 
                                                title="Send Notification"
                                                onClick={() => { setSelectedUser(user); setShowNotifyModal(true); setActionMsg(null); }}
                                                style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(241,245,249,0.8)', cursor: 'pointer', color: '#64748b', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(241,245,249,0.8)'}
                                            >
                                                <Bell size={16} />
                                            </button>
                                            <button 
                                                title="View Activity"
                                                style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(241,245,249,0.8)', cursor: 'pointer', color: '#64748b', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(241,245,249,0.8)'}
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


        {/* Wallet Modal */}
        {showWalletModal && selectedUser && (
            <div className="reseller-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="business-card" style={{ width: '100%', maxWidth: '450px', padding: '0', animation: 'fadeInScale 0.3s ease' }}>
                    <div className="card-title-bar">
                        <h3>Manage Wallet: {selectedUser.name}</h3>
                        <button onClick={() => setShowWalletModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--reseller-text-muted)' }}><X size={20} /></button>
                    </div>
                    <div style={{ padding: '24px' }}>
                        {actionMsg && (
                            <div style={{ 
                                padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14.3px', fontWeight: 600,
                                background: actionMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
                                color: actionMsg.type === 'success' ? '#10b981' : '#ef4444'
                            }}>
                                {actionMsg.text}
                            </div>
                        )}
                        <form onSubmit={handleAdjustWallet}>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', border: `1px solid ${walletData.action === 'credit' ? '#10b981' : 'var(--reseller-border)'}`, borderRadius: '8px', cursor: 'pointer', background: walletData.action === 'credit' ? '#dcfce7' : 'transparent', color: walletData.action === 'credit' ? '#10b981' : 'inherit', fontWeight: 600 }}>
                                    <input type="radio" name="w_action" value="credit" checked={walletData.action === 'credit'} onChange={() => setWalletData({...walletData, action: 'credit'})} style={{ display: 'none' }} />
                                    <ArrowUpRight size={18} /> Credit
                                </label>
                                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', border: `1px solid ${walletData.action === 'debit' ? '#ef4444' : 'var(--reseller-border)'}`, borderRadius: '8px', cursor: 'pointer', background: walletData.action === 'debit' ? '#fee2e2' : 'transparent', color: walletData.action === 'debit' ? '#ef4444' : 'inherit', fontWeight: 600 }}>
                                    <input type="radio" name="w_action" value="debit" checked={walletData.action === 'debit'} onChange={() => setWalletData({...walletData, action: 'debit'})} style={{ display: 'none' }} />
                                    <ArrowDownRight size={18} /> Debit
                                </label>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12.1px', fontWeight: 700, color: 'var(--reseller-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Amount (₦)</label>
                                <input type="number" min="1" value={walletData.amount} onChange={(e) => setWalletData({...walletData, amount: e.target.value})} placeholder="e.g. 5000" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--reseller-border)', fontSize: '15.4px' }} required />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12.1px', fontWeight: 700, color: 'var(--reseller-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Reason / Narration</label>
                                <input type="text" value={walletData.reason} onChange={(e) => setWalletData({...walletData, reason: e.target.value})} placeholder="e.g. Bonus" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--reseller-border)', fontSize: '15.4px' }} required />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '12.1px', fontWeight: 700, color: 'var(--reseller-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Your Withdrawal PIN</label>
                                <input type="password" value={walletData.pin} onChange={(e) => setWalletData({...walletData, pin: e.target.value})} placeholder="••••" maxLength="4" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--reseller-border)', fontSize: '15.4px', letterSpacing: '4px' }} required />
                            </div>
                            <button type="submit" disabled={submitting} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: walletData.action === 'credit' ? '#10b981' : '#ef4444', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}>
                                {submitting ? 'Processing...' : 'Confirm Adjustment'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {/* Notify Modal */}
        {showNotifyModal && selectedUser && (
            <div className="reseller-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="business-card" style={{ width: '100%', maxWidth: '500px', padding: '0', animation: 'fadeInScale 0.3s ease' }}>
                    <div className="card-title-bar">
                        <h3>Message: {selectedUser.name}</h3>
                        <button onClick={() => setShowNotifyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--reseller-text-muted)' }}><X size={20} /></button>
                    </div>
                    <div style={{ padding: '24px' }}>
                        {actionMsg && (
                            <div style={{ 
                                padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14.3px', fontWeight: 600,
                                background: actionMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
                                color: actionMsg.type === 'success' ? '#10b981' : '#ef4444'
                            }}>
                                {actionMsg.text}
                            </div>
                        )}
                        <form onSubmit={handleSendNotify}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12.1px', fontWeight: 700, color: 'var(--reseller-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Subject</label>
                                <input type="text" value={notifyData.subject} onChange={(e) => setNotifyData({...notifyData, subject: e.target.value})} placeholder="Notification Subject" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--reseller-border)', fontSize: '15.4px' }} required />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '12.1px', fontWeight: 700, color: 'var(--reseller-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Message</label>
                                <textarea value={notifyData.message} onChange={(e) => setNotifyData({...notifyData, message: e.target.value})} placeholder="Type your message here..." rows="4" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--reseller-border)', fontSize: '15.4px', resize: 'vertical' }} required />
                            </div>
                            <button type="submit" disabled={submitting} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--reseller-primary)', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}>
                                {submitting ? 'Sending...' : <><Send size={18} /> Send Message</>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {/* Manual Registration Modal */}
        {showAddModal && (
            <div className="reseller-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="business-card" style={{ width: '100%', maxWidth: '500px', padding: '0', animation: 'fadeInScale 0.3s ease' }}>
                    <div className="card-title-bar">
                        <h3>Register New Customer</h3>
                        <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--reseller-text-muted)' }}><X size={20} /></button>
                    </div>
                    <div style={{ padding: '24px' }}>
                        {msg && (
                            <div style={{ 
                                padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14.3px', fontWeight: 600,
                                background: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
                                color: msg.type === 'success' ? '#10b981' : '#ef4444'
                            }}>
                                {msg.text}
                            </div>
                        )}
                        <form onSubmit={handleRegister}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12.1px', fontWeight: 700, color: 'var(--reseller-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Full Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--reseller-text-muted)' }} />
                                    <input 
                                        type="text" 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        placeholder="Customer Name"
                                        style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid var(--reseller-border)', fontSize: '15.4px' }}
                                        required
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12.1px', fontWeight: 700, color: 'var(--reseller-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--reseller-text-muted)' }} />
                                    <input 
                                        type="email" 
                                        value={formData.email} 
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        placeholder="customer@email.com"
                                        style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid var(--reseller-border)', fontSize: '15.4px' }}
                                        required
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12.1px', fontWeight: 700, color: 'var(--reseller-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Initial Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--reseller-text-muted)' }} />
                                        <input 
                                            type="password" 
                                            value={formData.password} 
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            placeholder="••••••••"
                                            style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid var(--reseller-border)', fontSize: '15.4px' }}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12.1px', fontWeight: 700, color: 'var(--reseller-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Default PIN</label>
                                    <div style={{ position: 'relative' }}>
                                        <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--reseller-text-muted)' }} />
                                        <input 
                                            type="text" 
                                            maxLength="4"
                                            value={formData.pin} 
                                            onChange={(e) => setFormData({...formData, pin: e.target.value})}
                                            style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid var(--reseller-border)', fontSize: '15.4px', letterSpacing: '4px' }}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={submitting}
                                style={{ 
                                    width: '100%', padding: '14px', borderRadius: '12px', border: 'none', 
                                    background: 'var(--reseller-primary)', color: 'white', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    cursor: 'pointer'
                                }}
                            >
                                {submitting ? 'Registering...' : <><UserPlus size={18} /> Complete Registration</>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
};

export default ResellerCustomers;
