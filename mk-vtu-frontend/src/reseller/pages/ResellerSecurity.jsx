import React, { useState } from 'react';
import { Shield, Lock, Fingerprint, AlertCircle } from 'lucide-react';
import API from '../../api';

const ResellerSecurity = () => {
    const [pin, setPin] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    const handleSetPin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        try {
            const res = await API.post('/api/reseller/security/pin', { pin, password });
            setMsg({ type: 'success', text: res.data.message });
            setPin('');
            setPassword('');
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || "Failed to set PIN" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reseller-container">
            <header className="reseller-header">
                <h1>Security Settings</h1>
                <p>Protect your website account and set withdrawal permissions</p>
            </header>

            {msg && <div className={`alert-box ${msg.type}`}>{msg.text}</div>}

            <div className="reseller-grid-2">
                <div className="reseller-form-card">
                    <h3><Lock size={20} /> Set Withdrawal PIN</h3>
                    <p className="form-help">This PIN is required whenever you want to move profits to your wallet or withdraw funds.</p>
                    
                    <form onSubmit={handleSetPin}>
                        <div className="form-group">
                            <label>New 4-Digit PIN</label>
                            <input 
                                type="password" 
                                maxLength="4"
                                placeholder="****"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Account Password (to confirm)</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button className="submit-btn" disabled={loading}>
                            {loading ? 'Processing...' : 'Set Withdrawal PIN'}
                        </button>
                    </form>
                </div>

                <div className="reseller-form-card info">
                    <h3><Shield size={20} /> Account Protection</h3>
                    <ul className="security-list">
                        <li>
                            <div className="security-item">
                                <strong>Login Alerts</strong>
                                <p>You will receive an email for every new login to your website dashboard.</p>
                                <span className="badge success">Active</span>
                            </div>
                        </li>
                        <li>
                            <div className="security-item">
                                <strong>IP Tracking</strong>
                                <p>We monitor the IP addresses used to access your admin panel.</p>
                                <span className="badge success">Active</span>
                            </div>
                        </li>
                        <li>
                            <div className="security-item">
                                <strong>2FA (Coming Soon)</strong>
                                <p>Enhance security with Google Authenticator or SMS codes.</p>
                                <span className="badge gray">Disabled</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ResellerSecurity;
