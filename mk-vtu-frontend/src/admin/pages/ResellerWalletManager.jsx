import React, { useState, useEffect } from 'react';
import { 
    Search, CreditCard, ArrowUpRight, ArrowDownRight, 
    History, CheckCircle, XCircle
} from 'lucide-react';
import API from '../../api';
import { useToast } from '../../context/ToastContext';
import './ResellerManager.css';

const ResellerWalletManager = ({ token }) => {
    const [resellers, setResellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReseller, setSelectedReseller] = useState(null);
    
    // Adjust Wallet State
    const [adjustData, setAdjustData] = useState({
        wallet: 'normal',
        type: 'credit',
        amount: '',
        reason: '',
        fundingPassword: ''
    });
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otpData, setOtpData] = useState({ intentToken: '', otp: '' });
    const [adjusting, setAdjusting] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchResellers();
    }, []);

    const fetchResellers = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/admin/resellers');
            const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setResellers(data);
        } catch (err) {
            showToast("Failed to load resellers", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        if (!adjustData.amount || Number(adjustData.amount) <= 0) {
            return showToast("Enter a valid amount", "error");
        }
        if (!adjustData.reason || adjustData.reason.length < 4) {
            return showToast("Reason is required", "error");
        }
        if (!adjustData.fundingPassword) {
            return showToast("Admin funding password is required", "error");
        }

        try {
            setAdjusting(true);
            const res = await API.post(`/api/admin/resellers/${selectedReseller._id}/wallet/initiate`, {
                amount: adjustData.amount,
                type: adjustData.type,
                wallet: adjustData.wallet,
                reason: adjustData.reason,
                fundingPassword: adjustData.fundingPassword
            });
            
            if (res.data?.intentToken) {
                setOtpData({ intentToken: res.data.intentToken, otp: '' });
                setShowOTPModal(true);
                showToast(res.data.message || "OTP Sent to Admin Email", "info");
            }
        } catch (err) {
            showToast(err.response?.data?.message || "Adjustment failed", "error");
        } finally {
            setAdjusting(false);
        }
    };

    const handleConfirmOTP = async (e) => {
        e.preventDefault();
        if (!otpData.otp || otpData.otp.trim().length < 6) return showToast("Please enter the 6-digit OTP.", "warning");
        
        try {
            setAdjusting(true);
            const res = await API.post(`/api/admin/resellers/${selectedReseller._id}/wallet/confirm`, {
                intentToken: otpData.intentToken,
                otp: otpData.otp
            });
            showToast(`Wallet ${adjustData.type === 'credit' ? 'credited' : 'debited'} successfully!`, "success");
            
            // Refresh list to show new balances
            await fetchResellers();
            setAdjustData({ wallet: 'normal', type: 'credit', amount: '', reason: '', fundingPassword: '' });
            setShowOTPModal(false);
            setOtpData({ intentToken: '', otp: '' });
            setSelectedReseller(null); // Go back to list
        } catch (err) {
            showToast(err.response?.data?.message || "OTP Verification failed", "error");
        } finally {
            setAdjusting(false);
        }
    };

    const filteredResellers = resellers.filter(r => 
        (r.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (r.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const isCredit = adjustData.type === 'credit';
    const previewAmount = Number(adjustData.amount) || 0;

    return (
        <div className="reseller-manager-container" style={{ display: 'flex', gap: '24px', height: '100%', flexDirection: selectedReseller ? 'row' : 'column' }}>
            
            {/* Left Col: Reseller Selection List */}
            <div className="premium-table-wrapper" style={{ flex: selectedReseller ? '1' : '1', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800 }}>Reseller Financial Control</h2>
                        <p style={{ margin: 0, color: 'var(--text-gray)', fontSize: '14px' }}>Select a reseller to adjust their wallets</p>
                    </div>
                </div>

                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
                    <div className="search-bar-modern" style={{ maxWidth: '100%' }}>
                        <Search size={18} style={{ color: 'var(--text-gray)' }} />
                        <input 
                            type="text" 
                            placeholder="Search by name or email..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}><div className="loader-spinner"></div></div>
                    ) : filteredResellers.length === 0 ? (
                        <div className="empty-state-modern"><CreditCard size={48} /><p>No resellers found</p></div>
                    ) : (
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>Reseller</th>
                                    <th>Normal Wallet</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredResellers.map(r => (
                                    <tr key={r._id} className={selectedReseller?._id === r._id ? 'selected-row' : ''}>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>{r.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{r.email}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 800, color: 'var(--primary)' }}>₦{(r.balance1 || r.balance || 0).toLocaleString()}</div>
                                        </td>
                                        <td>
                                            <button 
                                                className="premium-btn" 
                                                style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', borderRadius: '8px', border: 'none' }}
                                                onClick={() => setSelectedReseller(r)}
                                            >
                                                Manage Wallets
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Right Col: Wallet Adjustment Form */}
            {selectedReseller && (
                <div className="premium-sidebar" style={{ flex: '1', maxWidth: '500px' }}>
                    <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px' }}>Adjust {selectedReseller.name}</h3>
                            <p style={{ margin: '4px 0 0', color: 'var(--text-gray)', fontSize: '13px' }}>Current Balance: ₦{(selectedReseller.balance1 || selectedReseller.balance || 0).toLocaleString()}</p>
                        </div>
                        <button className="premium-btn-secondary" style={{ padding: '8px', border: 'none' }} onClick={() => setSelectedReseller(null)}>
                            <XCircle size={20} />
                        </button>
                    </div>

                    <div style={{ padding: '24px' }}>
                        <form onSubmit={handleAdjustSubmit}>
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '12px', border: `2px solid ${isCredit ? '#10b981' : 'var(--border-color)'}`, cursor: 'pointer', transition: 'all 0.2s', background: isCredit ? 'rgba(16,185,129,0.05)' : 'transparent' }}>
                                    <input type="radio" name="adjType" value="credit" checked={isCredit} onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value })} style={{ display: 'none' }} />
                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${isCredit ? '#10b981' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {isCredit && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>}
                                    </div>
                                    <ArrowUpRight size={18} color={isCredit ? '#10b981' : '#64748b'} />
                                    <span style={{ fontWeight: 700, color: isCredit ? '#10b981' : 'var(--text-dark)' }}>Credit (Add)</span>
                                </label>
                                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '12px', border: `2px solid ${!isCredit ? '#ef4444' : 'var(--border-color)'}`, cursor: 'pointer', transition: 'all 0.2s', background: !isCredit ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
                                    <input type="radio" name="adjType" value="debit" checked={!isCredit} onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value })} style={{ display: 'none' }} />
                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${!isCredit ? '#ef4444' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {!isCredit && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></div>}
                                    </div>
                                    <ArrowDownRight size={18} color={!isCredit ? '#ef4444' : '#64748b'} />
                                    <span style={{ fontWeight: 700, color: !isCredit ? '#ef4444' : 'var(--text-dark)' }}>Debit (Deduct)</span>
                                </label>
                            </div>

                            <div className="input-group-modern" style={{ marginBottom: '20px' }}>
                                <label>Target Wallet</label>
                                <select 
                                    className="input-field" 
                                    value={adjustData.wallet}
                                    onChange={(e) => setAdjustData({ ...adjustData, wallet: e.target.value })}
                                >
                                    <option value="normal">Main Wallet</option>
                                    <option value="vip">VIP Wallet</option>
                                    <option value="earnings">Earnings Wallet</option>
                                </select>
                            </div>

                            <div className="input-group-modern" style={{ marginBottom: '20px' }}>
                                <label>Amount (₦)</label>
                                <input 
                                    type="number" 
                                    className="input-field" 
                                    placeholder="Enter amount"
                                    value={adjustData.amount}
                                    onChange={(e) => setAdjustData({ ...adjustData, amount: e.target.value })}
                                    min="1"
                                    required
                                />
                            </div>
                            
                            <div className="input-group-modern" style={{ marginBottom: '24px' }}>
                                <label>Reason for Adjustment</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    placeholder="e.g. Refund for failed transaction"
                                    value={adjustData.reason}
                                    onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                                    required
                                    disabled={adjusting}
                                />
                            </div>

                            <div className="input-group-modern" style={{ marginBottom: '24px' }}>
                                <label>Admin Funding Password</label>
                                <input 
                                    type="password" 
                                    className="input-field" 
                                    placeholder="Enter Admin Funding Password"
                                    value={adjustData.fundingPassword}
                                    onChange={(e) => setAdjustData({ ...adjustData, fundingPassword: e.target.value })}
                                    required
                                    disabled={adjusting}
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="premium-btn"
                                style={{ 
                                    width: '100%', padding: '14px',
                                    background: isCredit ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)',
                                    color: '#fff', border: 'none', borderRadius: '12px',
                                    boxShadow: isCredit ? '0 4px 12px rgba(16,185,129,0.3)' : '0 4px 12px rgba(239,68,68,0.3)'
                                }}
                                disabled={adjusting}
                            >
                                {adjusting ? <><div className="btn-spinner" style={{ marginRight: '8px' }}></div>Processing...</> 
                                : `Confirm ${isCredit ? 'Credit' : 'Debit'} ₦${previewAmount > 0 ? previewAmount.toLocaleString() : '...'}`}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* OTP Verification Modal */}
            {showOTPModal && (
                <div className="modal-overlay-modern" onClick={() => !adjusting && setShowOTPModal(false)}>
                    <div className="modal-content-modern animate-scale-in" style={{ maxWidth: '420px', borderRadius: '20px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ background: 'var(--bg-card)', padding: '24px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ background: 'rgba(37, 99, 235, 0.1)', width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle size={32} style={{ color: 'var(--primary)' }} />
                            </div>
                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '18px', color: 'var(--text-dark)' }}>Security Verification</h3>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-gray)' }}>Enter the 6-digit OTP sent to your admin email to confirm this wallet adjustment.</p>
                        </div>
                        <form onSubmit={handleConfirmOTP}>
                            <div style={{ padding: '24px' }}>
                                <input 
                                    type="text" 
                                    className="input-field"
                                    placeholder="Enter 6-digit OTP"
                                    maxLength="6"
                                    required
                                    disabled={adjusting}
                                    value={otpData.otp}
                                    onChange={e => setOtpData({ ...otpData, otp: e.target.value })}
                                    style={{ fontSize: '24px', fontWeight: 800, textAlign: 'center', letterSpacing: '8px', padding: '16px' }}
                                />
                            </div>
                            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'var(--bg-color)' }}>
                                <button type="button" className="premium-btn premium-btn-secondary" disabled={adjusting} onClick={() => setShowOTPModal(false)}>Cancel</button>
                                <button type="submit" className="premium-btn premium-btn-primary" disabled={adjusting || otpData.otp.length < 6}>
                                    {adjusting ? <><div className="btn-spinner" style={{ marginRight: '8px' }}></div>Verifying...</> : 'Confirm Adjustment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResellerWalletManager;
