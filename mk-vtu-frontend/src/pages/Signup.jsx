import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Users } from 'lucide-react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import API from '../api';
import logoDefault from '../assets/9jasub.jpg';
import PremiumLoader from '../components/PremiumLoader';
import './Auth.css';
import BrandLogo from '../components/BrandLogo';

const Signup = ({ setToken, siteInfo }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [transactionPin, setTransactionPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialReferralCode = searchParams.get('ref') || '';
  const [referralCodeInput, setReferralCodeInput] = useState(initialReferralCode);

  const getPasswordStrength = (pwd) => {
    if (!pwd) return -1;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ['Poor', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#ff4d4d', '#ffa64d', '#ffff4d', '#99ff33', '#00ff00'];

  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number (0-9)', met: /[0-9]/.test(password) },
    { label: 'One special character (@$!%*?)', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    if (transactionPin.length !== 4) {
      setErrorMsg("Transaction PIN must be 4 digits");
      return;
    }

    if (strength < 3) {
      setErrorMsg("Please create a stronger password (at least 'Good')");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    
    try {
      const payload = { name, email: email.toLowerCase(), password, transactionPin };
      if (referralCodeInput) {
          payload.referralCode = referralCodeInput;
      }
      const regRes = await API.post("/register", payload);
      
      if (regRes.data.message) {
         try {
           const loginRes = await API.post('/login', { email: email.toLowerCase(), password, session_type: 'retail' });
           if (loginRes.data.token) {
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
             
             localStorage.setItem('token', loginRes.data.token);
             localStorage.setItem('hasLoggedInBefore', 'true');
             localStorage.setItem('lastEmail', email);
             localStorage.setItem('userType', 'retail');
             if (setToken) setToken(loginRes.data.token);
             sessionStorage.setItem('justLoggedIn', 'true');
             
             navigate('/home');
             return;
           }
         } catch (e) {
             console.error("Auto-login failed:", e);
         }
         navigate('/login');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {loading && <PremiumLoader message="CREATING YOUR ACCOUNT..." />}
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-wrapper">
            <BrandLogo siteInfo={siteInfo} className="auth-logo-img" />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join {siteInfo?.branding?.siteName || siteInfo?.name || '9JASUB'} for premium VTU services</p>
        </div>

        {errorMsg && <div className="auth-message">{errorMsg}</div>}

        <form onSubmit={handleSignup} className="auth-form">
          <div className="auth-input-group">
            <label>Full Name</label>
            <div className="input-wrapper">
              <User size={18} className="auth-input-icon" />
              <input 
                type="text" 
                placeholder="e.g. John Doe" 
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input 
                type="email" 
                placeholder="e.g. john@example.com" 
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Create a strong password" 
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '44px' }}
              />
              <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>

            {password && (
              <div className="strength-meter" style={{ marginTop: '8px' }}>
                <div className="strength-bar-container" style={{ marginBottom: '4px' }}>
                  <div className="strength-bar" style={{ 
                    width: `${(strength + 1) * 20}%`, 
                    background: strengthColors[strength] 
                  }} />
                </div>

                <div className="strength-label" style={{ color: strengthColors[strength], fontSize: '11.0px' }}>
                  {strengthLabels[strength]}
                </div>

                <ul className="req-list" style={{ marginTop: '4px' }}>
                  {requirements.map((req, idx) => (
                    <li key={idx} className={`req-item ${req.met ? 'met' : ''}`} style={{ fontSize: '11.0px' }}>
                      <div className="req-dot" />
                      {req.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="auth-input-group">
            <label>Confirm Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Confirm your password" 
                className="auth-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ paddingRight: '44px' }}
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label>Transaction PIN</label>
            <div className="input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input 
                type="password" 
                placeholder="4-digit PIN" 
                className="auth-input"
                value={transactionPin}
                onChange={(e) => setTransactionPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                maxLength={4}
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label>Referral Code (Optional)</label>
            <div className="input-wrapper">
              <Users size={18} className="auth-input-icon" />
              <input 
                type="text" 
                placeholder="Enter referral code if you have one" 
                className="auth-input"
                value={referralCodeInput}
                onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase().trim())}
              />
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <img src={logoDefault} alt="Loading" className="btn-logo-loader" /> : (
              <>Create Account <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?  
          <Link to="/login" className="auth-link">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
