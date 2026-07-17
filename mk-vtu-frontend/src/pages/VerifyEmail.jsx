import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import './Auth.css';
import logo from '../assets/logo.jpg';

const VerifyEmail = ({ setToken, siteInfo }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timer, setTimer] = useState(60); // 60 seconds cooldown for resend

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) {
        setErrorMsg("Email not found. Please try logging in to restart verification.");
        return;
    }
    
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const res = await API.post("/auth/verify-email", { email, otp });
      if (res.data.success) {
        setSuccessMsg("Email verified! Redirecting to dashboard...");
        
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

        // Save token and login user immediately
        const token = res.data.token;
        localStorage.setItem("token", token);
        if (setToken) setToken(token);
        sessionStorage.setItem('justLoggedIn', 'true');
        
        setTimeout(() => navigate('/home'), 1500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await API.post("/auth/resend-email-otp", { email });
      setSuccessMsg('A new OTP has been sent to your email');
      setTimer(60); // Reset timer to 60 seconds
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to send OTP. Please try again');
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-wrapper" style={{ margin: '0 auto 20px', width: '64px' }}>
            <img src={siteInfo?.branding?.logo || siteInfo?.logo || logo} alt="Logo" style={{ width: '100%', borderRadius: '12px' }} />
          </div>
          <h1 className="auth-title">Verify Email</h1>
          <p className="auth-subtitle">We sent a 6-digit code to {email || 'your email'}</p>
        </div>

        {errorMsg && <div className="auth-message">{errorMsg}</div>}
        {successMsg && <div className="auth-message success">{successMsg}</div>}

        <form onSubmit={handleVerify} className="auth-form">
          <div className="auth-input-group">
            <label>Verification Code (OTP)</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                placeholder="000000" 
                className="auth-input"
                style={{textAlign: 'center', letterSpacing: '12px', fontSize: '22.0px', paddingLeft: '16px'}}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
              />
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading || otp.length !== 6}>
            {loading ? <img src={siteInfo?.branding?.logo || siteInfo?.logo || logo} alt="Loading" className="btn-logo-loader" /> : (
              <>Verify OTP <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <div style={{ marginBottom: '16px' }}>
            Didn't receive the code?{' '}
            {timer > 0 ? (
              <span style={{color: '#818cf8'}}>Resend in {timer}s</span>
            ) : (
              <button 
                onClick={handleResend} 
                disabled={resending}
                style={{
                  background: 'none', border: 'none', color: '#818cf8', 
                  cursor: 'pointer', padding: 0, fontSize: '15.4px', 
                  fontWeight: '600'
                }}
              >
                {resending ? 'Resending...' : 'Resend OTP'}
              </button>
            )}
          </div>
          <div style={{cursor: 'pointer', color: '#818cf8', fontSize: '15.4px', fontWeight: '500'}} onClick={() => navigate('/login')}>
            Back to Login
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
