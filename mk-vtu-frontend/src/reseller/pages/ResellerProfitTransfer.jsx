import React, { useState } from 'react';
import { DollarSign, ArrowRight, Wallet } from 'lucide-react';
import API from '../../api';

const ResellerProfitTransfer = ({ stats, refreshStats }) => {
    const [amount, setAmount] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    const handleTransfer = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        try {
            const res = await API.post('/api/reseller/withdraw-profit', { amount, pin });
            setMsg({ type: 'success', text: res.data.message });
            setAmount('');
            setPin('');
            if (refreshStats) refreshStats();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || "Transfer failed" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reseller-container">
            <header className="reseller-header">
                <h1>Profit Withdrawal</h1>
                <p>Transfer your markup earnings to your main wallet balance</p>
            </header>

            {msg && <div className={`alert-box ${msg.type}`}>{msg.text}</div>}

            <div className="reseller-grid-2">
                <div className="reseller-form-card">
                    <div className="wallet-summary">
                        <div className="wallet-item">
                            <span>Profit Balance</span>
                            <h2>₦{(stats?.totalProfit || 0).toLocaleString()}</h2>
                        </div>
                        <div className="wallet-icon-arrow">
                            <ArrowRight size={24} />
                        </div>
                        <div className="wallet-item">
                            <span>Wallet Balance</span>
                            <h2>₦{(stats?.walletBalance || 0).toLocaleString()}</h2>
                        </div>
                    </div>

                    <form onSubmit={handleTransfer} className="mt-4">
                        <div className="form-group">
                            <label>Amount to Transfer (₦)</label>
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Min 100"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Withdrawal PIN</label>
                            <input 
                                type="password" 
                                maxLength="4"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="****"
                                required
                            />
                        </div>
                        <button className="submit-btn" disabled={loading}>
                            {loading ? 'Transferring...' : 'Transfer to Wallet'}
                        </button>
                    </form>
                </div>

                <div className="reseller-form-card info">
                    <h3><DollarSign size={20} /> Profit Rules</h3>
                    <ul className="security-list">
                        <li>Profit is generated from markup on every successful transaction.</li>
                        <li>Transferred funds go to your main wallet and can be used to buy services for customers.</li>
                        <li>Transfers are instant and non-reversible.</li>
                        <li>For direct bank withdrawals, first transfer to your wallet, then use the standard withdrawal tool.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ResellerProfitTransfer;
