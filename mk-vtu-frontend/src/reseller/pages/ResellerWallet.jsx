import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wallet, ArrowRightLeft, DollarSign, History, Shield, ArrowUpRight, TrendingUp } from 'lucide-react';
import API from '../../api';

const ResellerWallet = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [amount, setAmount] = useState('');
    const [pin, setPin] = useState('');
    
    // Bank withdrawal state
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'wallet'); // 'wallet' or 'bank' or 'fund'
    const [withdrawHistory, setWithdrawHistory] = useState([]);

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location.state]);

    useEffect(() => {
        fetchStats();
        fetchHistory();

        const handleWalletRefresh = () => {
            fetchStats();
            fetchHistory();
        };
        window.addEventListener('wallet:refresh', handleWalletRefresh);

        return () => {
            window.removeEventListener('wallet:refresh', handleWalletRefresh);
        };
    }, []);

    const fetchStats = async () => {
        try {
            const res = await API.get('/api/reseller/stats');
            setStats(res.data);
        } catch (err) { console.error("Stats failed"); }
    };

    const fetchHistory = async () => {
        try {
            const res = await API.get('/api/reseller/profit-history');
            setHistory(res.data);
            const wRes = await API.get('/api/reseller/withdrawals');
            if (wRes.data.status === 'success') {
                setWithdrawHistory(wRes.data.data);
            }
        } catch (err) { console.error("History failed"); }
    };

    const handleTransferWallet = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        try {
            const res = await API.post('/api/reseller/withdraw-profit', { amount, pin });
            setMsg({ type: 'success', text: res.data.message });
            setAmount('');
            setPin('');
            fetchStats();
            fetchHistory();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || "Transfer failed" });
        } finally {
            setLoading(false);
        }
    };

    const handleBankWithdraw = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        try {
            const res = await API.post('/api/reseller/withdraw-bank', { amount, bankName, accountNumber, accountName, pin });
            setMsg({ type: 'success', text: res.data.message });
            setAmount('');
            setBankName('');
            setAccountNumber('');
            setAccountName('');
            setPin('');
            fetchStats();
            fetchHistory();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || "Withdrawal failed" });
        } finally {
            setLoading(false);
        }
    };

    // Flutterwave checkout replaced: Reusing Retail Wallet funding component.

    return (
        <div className="reseller-view-content">
            <div className="dashboard-section-header">
                <h1>Wallet & Profit</h1>
                <p>Manage your website earnings and transfer profits.</p>
            </div>

            <div className="business-stats-grid">
                <div className="business-stat-card" style={{ borderLeft: '4px solid var(--reseller-primary)' }}>
                    <div className="stat-card-header">
                        <div className="stat-icon-box" style={{ background: '#eff6ff' }}>
                            <TrendingUp size={24} color="var(--reseller-primary)" />
                        </div>
                    </div>
                    <div className="stat-card-body">
                        <h3 style={{ fontSize: '14px' }}>Profit Wallet</h3>
                        <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Withdrawable Profit</p>
                        <h2 style={{ marginTop: '8px' }}>₦{(stats?.totalProfit || 0).toLocaleString()}</h2>
                    </div>
                </div>

                <div className="business-stat-card" style={{ borderLeft: '4px solid var(--reseller-success)' }}>
                    <div className="stat-card-header">
                        <div className="stat-icon-box" style={{ background: '#ecfdf5' }}>
                            <Wallet size={24} color="var(--reseller-success)" />
                        </div>
                    </div>
                    <div className="stat-card-body">
                        <h3 style={{ fontSize: '14px' }}>Main Wallet</h3>
                        <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Operating Balance</p>
                        <h2 style={{ marginTop: '8px' }}>₦{(stats?.walletBalance || 0).toLocaleString()}</h2>
                    </div>
                </div>
            </div>

            <div className="dashboard-main-grid">
                {/* Withdrawal Form */}
                <div className="business-card">
                    <div className="card-title-bar" style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={() => navigate('/wallet')}
                            style={{ background: 'none', border: 'none', padding: '10px 16px', fontSize: '15px', fontWeight: 500, color: 'var(--reseller-text-muted)', cursor: 'pointer', borderBottom: '2px solid transparent' }}
                        >
                            Fund Wallet
                        </button>
                        <button 
                            onClick={() => { setActiveTab('wallet'); setMsg(null); }}
                            style={{ background: 'none', border: 'none', padding: '10px 16px', fontSize: '15px', fontWeight: activeTab === 'wallet' ? 700 : 500, color: activeTab === 'wallet' ? 'var(--reseller-primary)' : 'var(--reseller-text-muted)', cursor: 'pointer', borderBottom: activeTab === 'wallet' ? '2px solid var(--reseller-primary)' : '2px solid transparent' }}
                        >
                            Transfer to Wallet
                        </button>
                        <button 
                            onClick={() => { setActiveTab('bank'); setMsg(null); }}
                            style={{ background: 'none', border: 'none', padding: '10px 16px', fontSize: '15px', fontWeight: activeTab === 'bank' ? 700 : 500, color: activeTab === 'bank' ? 'var(--reseller-primary)' : 'var(--reseller-text-muted)', cursor: 'pointer', borderBottom: activeTab === 'bank' ? '2px solid var(--reseller-primary)' : '2px solid transparent' }}
                        >
                            Withdraw to Bank
                        </button>
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



                        {activeTab === 'wallet' && (
                            <form onSubmit={handleTransferWallet}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 700, color: 'var(--reseller-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Amount to Transfer (₦)</label>
                                    <input 
                                        type="number" 
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--reseller-border)', fontSize: '15.4px' }}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 700, color: 'var(--reseller-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Security PIN</label>
                                    <input 
                                        type="password" 
                                        maxLength="4"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        placeholder="****"
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--reseller-border)', fontSize: '15.4px', letterSpacing: '4px' }}
                                        required
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    style={{ 
                                        width: '100%', padding: '14px', borderRadius: '12px', border: 'none', 
                                        background: 'var(--reseller-primary)', color: 'white', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        cursor: 'pointer', transition: 'opacity 0.2s'
                                    }}
                                >
                                    {loading ? 'Processing...' : <><ArrowRightLeft size={18} /> Transfer to Main Wallet</>}
                                </button>
                                
                                <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', gap: '10px', color: 'var(--reseller-text-muted)' }}>
                                        <Shield size={16} />
                                        <p style={{ margin: 0, fontSize: '13.2px', lineHeight: '1.5' }}>
                                            Profit is instantly transferred to your main wallet. From there, you can use it for services.
                                        </p>
                                    </div>
                                </div>
                            </form>
                        )}

                        {activeTab === 'bank' && (
                            <form onSubmit={handleBankWithdraw}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 700, color: 'var(--reseller-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Amount to Withdraw (₦)</label>
                                    <input 
                                        type="number" 
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--reseller-border)', fontSize: '15.4px' }}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 700, color: 'var(--reseller-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Bank Name</label>
                                    <input 
                                        type="text" 
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        placeholder="e.g. Access Bank"
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--reseller-border)', fontSize: '15.4px' }}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 700, color: 'var(--reseller-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Account Number</label>
                                    <input 
                                        type="text" 
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        placeholder="10 digits"
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--reseller-border)', fontSize: '15.4px' }}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 700, color: 'var(--reseller-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Account Name</label>
                                    <input 
                                        type="text" 
                                        value={accountName}
                                        onChange={(e) => setAccountName(e.target.value)}
                                        placeholder="Name on account"
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--reseller-border)', fontSize: '15.4px' }}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 700, color: 'var(--reseller-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Security PIN</label>
                                    <input 
                                        type="password" 
                                        maxLength="4"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        placeholder="****"
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--reseller-border)', fontSize: '15.4px', letterSpacing: '4px' }}
                                        required
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    style={{ 
                                        width: '100%', padding: '14px', borderRadius: '12px', border: 'none', 
                                        background: 'var(--reseller-primary)', color: 'white', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        cursor: 'pointer', transition: 'opacity 0.2s'
                                    }}
                                >
                                    {loading ? 'Processing...' : <><DollarSign size={18} /> Request Bank Withdrawal</>}
                                </button>
                                
                                <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', gap: '10px', color: 'var(--reseller-text-muted)' }}>
                                        <Shield size={16} />
                                        <p style={{ margin: 0, fontSize: '13.2px', lineHeight: '1.5' }}>
                                            Bank withdrawals are manually reviewed and processed within 24-48 hours.
                                        </p>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* History */}
                <div className="business-card">
                    <div className="card-title-bar">
                        <h3>Recent {activeTab === 'wallet' ? 'Settlements' : 'Bank Withdrawals'}</h3>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {activeTab === 'wallet' ? (
                            history.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--reseller-text-muted)' }}>
                                    <History size={32} style={{ opacity: 0.2, marginBottom: '10px' }} />
                                    <p style={{ fontSize: '14.3px' }}>No settlement history found</p>
                                </div>
                            ) : (
                                history.map((item, i) => (
                                    <div key={i} style={{ padding: '16px 24px', borderBottom: '1px solid var(--reseller-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <ArrowUpRight size={16} />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '14.3px', fontWeight: 700 }}>Settlement to Wallet</h4>
                                                <p style={{ margin: 0, fontSize: '12.1px', color: 'var(--reseller-text-muted)' }}>{new Date(item.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <h4 style={{ margin: 0, fontSize: '15.4px', fontWeight: 800, color: '#10b981' }}>+₦{item.amount.toLocaleString()}</h4>
                                            <p style={{ margin: 0, fontSize: '11.0px', fontWeight: 700, color: 'var(--reseller-text-muted)' }}>SUCCESS</p>
                                        </div>
                                    </div>
                                ))
                            )
                        ) : (
                            withdrawHistory.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--reseller-text-muted)' }}>
                                    <History size={32} style={{ opacity: 0.2, marginBottom: '10px' }} />
                                    <p style={{ fontSize: '14.3px' }}>No bank withdrawal history found</p>
                                </div>
                            ) : (
                                withdrawHistory.map((item, i) => (
                                    <div key={i} style={{ padding: '16px 24px', borderBottom: '1px solid var(--reseller-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: item.status === 'success' || item.status === 'approved' ? '#ecfdf5' : item.status === 'pending' ? '#fffbeb' : '#fef2f2', color: item.status === 'success' || item.status === 'approved' ? '#10b981' : item.status === 'pending' ? '#f59e0b' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <DollarSign size={16} />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '14.3px', fontWeight: 700 }}>{item.bankName}</h4>
                                                <p style={{ margin: 0, fontSize: '12.1px', color: 'var(--reseller-text-muted)' }}>{item.accountNumber} • {new Date(item.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <h4 style={{ margin: 0, fontSize: '15.4px', fontWeight: 800, color: '#ef4444' }}>-₦{item.amount.toLocaleString()}</h4>
                                            <p style={{ margin: 0, fontSize: '11.0px', fontWeight: 700, color: item.status === 'success' || item.status === 'approved' ? '#10b981' : item.status === 'pending' ? '#f59e0b' : '#ef4444' }}>{item.status.toUpperCase()}</p>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResellerWallet;
