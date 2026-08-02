import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';
import API from '../../api';
import './AdminLogin.css';
import { useBranding } from '../../context/BrandingContext';
import { isWhiteLabelSite } from '../../utils/whiteLabelHelper';

const AdminLogin = ({ setAdminToken, setAdminUser }) => {
  const siteInfo = useBranding();
  const siteName = siteInfo?.branding?.siteName || '9JASUB';
  const isWhiteLabel = siteInfo && isWhiteLabelSite(siteInfo);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [partialToken, setPartialToken] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // SECURITY REQUIREMENT: Clear ALL stale sessions before admin login
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
  }, []);

  const handleStep1 = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/api/admin/login', { email, password });
      setPartialToken(res.data.partialToken);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/api/admin/login/verify-otp', { partialToken, otp });
      if (res.data.token) {
        // Logged in directly (no security questions set yet)
        completeLogin(res.data);
      } else {
        setPartialToken(res.data.partialToken);
        setSecurityQuestion(res.data.question);
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/api/admin/login/verify-security', { partialToken, answer: securityAnswer });
      completeLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Security answer incorrect');
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = (data) => {
    // STRICT SESSION ISOLATION: Clear everything but UX fields
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

    setAdminToken(data.token);
    if (setAdminUser) setAdminUser(data.user);
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('adminUser', JSON.stringify(data.user));
    if (data.loginAlertStatus) {
      sessionStorage.setItem('login_alert', data.loginAlertStatus);
    }
    
    if (data.securitySetupRequired) {
        navigate('/admin/settings', { state: { setupRequired: true } });
    } else {
        navigate('/admin/dashboard');
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-card">
        <div className="login-header">
           <div className="shield-icon">
              <ShieldCheck size={40} />
           </div>
           <h2>{step === 1 ? `${siteName} Admin Portal` : step === 2 ? 'Identity Verification' : 'Security Clearance'}</h2>
           <p>
            {step === 1 && 'Operations Administration'}
            {step === 2 && 'Enter the 6-digit code sent to your email'}
            {step === 3 && 'Answer your pre-configured security question'}
           </p>
        </div>

        {error && <div className="login-error">{error}</div>}

        {step === 1 && (
            <form onSubmit={handleStep1} className="login-form">
                <div className="input-group">
                    <Mail className="input-icon" size={20} />
                    <input 
                        type="email" 
                        placeholder="Admin Email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <Lock className="input-icon" size={20} />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? 'Authenticating...' : (
                    <>
                        <span>Continue</span>
                        <ArrowRight size={20} />
                    </>
                    )}
                </button>
            </form>
        )}

        {step === 2 && (
            <form onSubmit={handleStep2} className="login-form">
                <div className="input-group">
                    <Lock className="input-icon" size={20} />
                    <input 
                        type="text" 
                        placeholder="6-Digit OTP" 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        required
                    />
                </div>
                <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? 'Verifying...' : (
                    <>
                        <span>Verify OTP</span>
                        <ArrowRight size={20} />
                    </>
                    )}
                </button>
                <button type="button" className="text-btn" onClick={() => setStep(1)}>Back to Login</button>
            </form>
        )}

        {step === 3 && (
            <form onSubmit={handleStep3} className="login-form">
                <div className="security-question-label">
                    <strong>Question:</strong> {securityQuestion}
                </div>
                <div className="input-group">
                    <ShieldCheck className="input-icon" size={20} />
                    <input 
                        type="text" 
                        placeholder="Your Answer" 
                        value={securityAnswer}
                        onChange={(e) => setSecurityAnswer(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? 'Clearing...' : (
                    <>
                        <span>Verify Identity</span>
                        <ArrowRight size={20} />
                    </>
                    )}
                </button>
                <button type="button" className="text-btn" onClick={() => setStep(1)}>Back to Login</button>
            </form>
        )}

        <div className="login-footer">
          <p>© {siteName} {(!siteInfo || !isWhiteLabel) && 'Powered by MK GLOBAL INVESTMENT LTD.'}</p>
          <p>Bank-Level Security Active 🔒</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
