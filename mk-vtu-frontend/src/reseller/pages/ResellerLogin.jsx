import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, ShieldCheck, Globe, ChevronLeft } from 'lucide-react';
import API from '../../api';
import './Reseller.css';

const ResellerLogin = ({ setToken }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await API.post('/auth/login', { email, password });
            
            // Check if user is a reseller
            const userRes = await API.get('/user/me', {
                headers: { Authorization: `Bearer ${res.data.token}` }
            });

            if (userRes.data.role !== 'reseller_admin' && userRes.data.role !== 'admin') {
                setError('Access Denied: Reseller Admin account required.');
                return;
            }

            // STRICT SESSION ISOLATION
            const biometricEnabled = localStorage.getItem('biometricEnabled');
            const lastEmail = localStorage.getItem('lastEmail');
            const hasLoggedInBefore = localStorage.getItem('hasLoggedInBefore');
            const seenOnboarding = localStorage.getItem('seenOnboarding');
            
            localStorage.clear();
            sessionStorage.clear();
            
            if (biometricEnabled) localStorage.setItem('biometricEnabled', biometricEnabled);
            if (lastEmail) localStorage.setItem('lastEmail', lastEmail);
            if (hasLoggedInBefore) localStorage.setItem('hasLoggedInBefore', hasLoggedInBefore);
            if (seenOnboarding) localStorage.setItem('seenOnboarding', seenOnboarding);

            localStorage.setItem('token', res.data.token);
            if (setToken) setToken(res.data.token);
            navigate('/reseller');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reseller-login-page">
            <div className="reseller-login-card animate-scale-in">
                <button className="back-to-site" onClick={() => navigate('/')}>
                    <ChevronLeft size={16} /> Back to Site
                </button>
                
                <div className="reseller-login-header">
                    <div className="reseller-icon-box">
                        <Globe size={32} />
                    </div>
                    <h1>Website Portal</h1>
                    <p>Manage your White-Label enterprise</p>
                </div>

                {error && <div className="reseller-error-msg">{error}</div>}

                <form onSubmit={handleLogin} className="reseller-login-form">
                    <div className="reseller-input-group">
                        <label>Email Address</label>
                        <div className="reseller-input-wrapper">
                            <Mail size={18} />
                            <input 
                                type="email" 
                                placeholder="reseller@example.com" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </div>
                    </div>

                    <div className="reseller-input-group">
                        <label>Password</label>
                        <div className="reseller-input-wrapper">
                            <Lock size={18} />
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                            />
                        </div>
                    </div>

                    <button type="submit" className="reseller-login-btn" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <span>Login to Dashboard</span>}
                    </button>
                </form>

                <div className="reseller-login-footer">
                    <ShieldCheck size={14} />
                    <span>Secure Website Access</span>
                </div>
            </div>
        </div>
    );
};

export default ResellerLogin;
