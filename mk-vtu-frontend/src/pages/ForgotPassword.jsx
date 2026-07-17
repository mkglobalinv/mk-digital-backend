import React, { useState, useEffect } from 'react';
import { Mail, Lock, KeyRound, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import './Auth.css';
import logo from '../assets/logo.jpg';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Timer states for Resend and Expiration
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(600); // 10 minutes in seconds
  
  const navigate = useNavigate();

  // Expiration countdown
  useEffect(() => {
    let interval;
    if (step === 2) {
      interval = setInterval(() => {
        setOtpExpiry(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setErrorMsg("Your OTP has expired. Please request a new one.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  // Resend countdown
  useEffect(() => {
    let interval;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const requestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await API.post('/auth/request-otp', { email });
      setSuccessMsg(res.data.message || 'OTP sent to your email.');
      setStep(2);
      setResendTimer(60);
      setCanResend(false);
      setOtpExpiry(600);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Unable to send OTP. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await API.post('/auth/request-otp', { email, isResend: true });
      setSuccessMsg(res.data.message || 'OTP sent to your email.');
      setResendTimer(60);
      setCanResend(false);
      setOtpExpiry(600);
    } catch (err) {
      if (err.response?.status === 429) {
        const wait = err.response.data.waitSecs || 60;
        setResendTimer(wait);
        setCanResend(false);
        setErrorMsg(err.response.data.message || `Please wait ${wait} seconds before requesting another OTP.`);
      } else {
        setErrorMsg(err.response?.data?.message || 'Unable to send OTP. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await API.post('/auth/verify-otp', { email, otp });
      setResetToken(res.data.resetToken);
      setSuccessMsg('OTP verified. Set your new password.');
      setStep(3);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await API.post('/auth/reset-password', { email, resetToken, password });
      
      // STRICT SESSION ISOLATION
      const biometricEnabled = localStorage.getItem('biometricEnabled');
      const lastEmail = localStorage.getItem('lastEmail');
      const seenOnboarding = localStorage.getItem('seenOnboarding');
      
      localStorage.clear();
      sessionStorage.clear();
      
      if (biometricEnabled) localStorage.setItem('biometricEnabled', biometricEnabled);
      if (lastEmail) localStorage.setItem('lastEmail', lastEmail);
      if (seenOnboarding) localStorage.setItem('seenOnboarding', seenOnboarding);

      setSuccessMsg('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">
            {step === 1 && "Enter your email to receive an OTP"}
            {step === 2 && "Enter the 6-digit OTP sent to your email"}
            {step === 3 && "Create a new strong password"}
          </p>
        </div>

        {errorMsg && <div className="auth-message">{errorMsg}</div>}
        {successMsg && <div className="auth-message success">{successMsg}</div>}

        {step === 1 && (
          <form onSubmit={requestOTP} className="auth-form">
            <div className="auth-input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="auth-input-icon" />
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Sending OTP...</span>
                </>
              ) : (
                <>Send OTP <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={verifyOTP} className="auth-form">
            <div className="auth-input-group">
              <label>Enter OTP</label>
              <div className="input-wrapper">
                <KeyRound size={18} className="auth-input-icon" />
                <input 
                  type="text" 
                  placeholder="6-digit code" 
                  className="auth-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginTop: '4px', color: 'var(--text-muted)' }}>
              <span>
                OTP expires in: <strong style={{ color: '#fbbf24' }}>{Math.floor(otpExpiry / 60)}m {otpExpiry % 60}s</strong>
              </span>
              <span>
                {canResend ? (
                  <button type="button" onClick={handleResendOTP} style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: 600, cursor: 'pointer', padding: 0, outline: 'none' }}>
                    Resend OTP
                  </button>
                ) : (
                  <span>Resend in {resendTimer}s</span>
                )}
              </span>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Verifying...</span>
                </>
              ) : (
                <>Verify OTP <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={updatePassword} className="auth-form">
            <div className="auth-input-group">
              <label>New Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="New strong password" 
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ paddingRight: '44px' }}
                />
                <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
            </div>

            <div className="auth-input-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Confirm password" 
                  className="auth-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ paddingRight: '44px' }}
                />
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Resetting Password...</span>
                </>
              ) : (
                <>Reset Password <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        )}

        <div className="auth-footer" style={{ marginTop: '20px' }}>
          <Link to="/login" className="auth-link" style={{ marginLeft: 0 }}>&larr; Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
