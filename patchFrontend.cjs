const fs = require('fs');
const path = require('path');
const frontendPath = path.join('c:/Users/userpc/mk-digital-backend/mk-vtu-frontend/src/reseller/pages/ResellerCustomers.jsx');
let code = fs.readFileSync(frontendPath, 'utf8');

// 1. Add icons
code = code.replace(/import {([^}]+)} from 'lucide-react';/, (match, p1) => {
    return \`import {\${p1}, Wallet, Bell, ArrowUpRight, ArrowDownRight, Send } from 'lucide-react';\`;
});

// 2. Add state variables
code = code.replace(
    'const [msg, setMsg] = useState(null);',
    \`const [msg, setMsg] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [walletData, setWalletData] = useState({ action: 'credit', amount: '', reason: '', pin: '' });
    const [notifyData, setNotifyData] = useState({ subject: '', message: '' });
    const [actionMsg, setActionMsg] = useState(null);\`
);

// 3. Add handlers
const handlers = \`
    const handleAdjustWallet = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setActionMsg(null);
        try {
            const res = await API.post(\\\`/api/reseller/users/\\\${selectedUser._id}/adjust-wallet\\\`, walletData);
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
            const res = await API.post(\\\`/api/reseller/users/\\\${selectedUser._id}/notify\\\`, notifyData);
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
\`;

code = code.replace('const filteredUsers = users.filter', handlers + '\n    const filteredUsers = users.filter');

// 4. Update table actions
const actionButtons = \`
                                            <button 
                                                title="Manage Wallet"
                                                onClick={() => { setSelectedUser(user); setShowWalletModal(true); setActionMsg(null); }}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--reseller-primary)' }}
                                            >
                                                <Wallet size={18} />
                                            </button>
                                            <button 
                                                title="Send Notification"
                                                onClick={() => { setSelectedUser(user); setShowNotifyModal(true); setActionMsg(null); }}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--reseller-text-muted)' }}
                                            >
                                                <Bell size={18} />
                                            </button>
\`;

code = code.replace(
    /(<button[^>]*title="View Activity"[^>]*>[\s\S]*?<\/button>)/,
    \`$1\n\${actionButtons}\`
);

// 5. Add Modals
const modals = \`
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
                                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', border: \`1px solid \${walletData.action === 'credit' ? '#10b981' : 'var(--reseller-border)'}\`, borderRadius: '8px', cursor: 'pointer', background: walletData.action === 'credit' ? '#dcfce7' : 'transparent', color: walletData.action === 'credit' ? '#10b981' : 'inherit', fontWeight: 600 }}>
                                    <input type="radio" name="w_action" value="credit" checked={walletData.action === 'credit'} onChange={() => setWalletData({...walletData, action: 'credit'})} style={{ display: 'none' }} />
                                    <ArrowUpRight size={18} /> Credit
                                </label>
                                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', border: \`1px solid \${walletData.action === 'debit' ? '#ef4444' : 'var(--reseller-border)'}\`, borderRadius: '8px', cursor: 'pointer', background: walletData.action === 'debit' ? '#fee2e2' : 'transparent', color: walletData.action === 'debit' ? '#ef4444' : 'inherit', fontWeight: 600 }}>
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
\`;

code = code.replace(/\{showAddModal && \(/, modals + '\n\n        {showAddModal && (');

fs.writeFileSync(frontendPath, code);
console.log("Frontend Patched");
