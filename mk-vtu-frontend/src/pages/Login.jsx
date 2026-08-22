import React, { useState, useEffect } from 'react';
import { Mail, Lock, LogIn, Eye, EyeOff, Fingerprint, Building2, UserCircle2, ArrowRight, ShieldCheck, ShieldAlert, Loader2, Globe, Layout, Smartphone } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import './Auth.css'; // Shared premium UI
import '../reseller/pages/BusinessConsole.css'; // Account selector + popup styles
import BrandLogo from '../components/BrandLogo';
import logoDefault from '../assets/9jasub.jpg';
import { isBiometricAvailable, authenticateBiometric, isNativeBiometric } from '../services/biometricService';
import { isWhiteLabelSite } from '../utils/whiteLabelHelper';

const Login = ({ setToken, siteInfo }) => {
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('lastEmail') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [hasLoggedInBefore, setHasLoggedInBefore] = useState(false);
  // Dual entry-point state
  const [accountView, setAccountView] = useState(() => {
    const host = window.location.host;
    const isProd = import.meta.env.PROD;
    const mainDomains = [
      '9jasub.com', 
      'www.9jasub.com', 
      'app.9jasub.com',
      'mk-subdata.com',
      'www.mk-subdata.com'
    ];
    if (!isProd) {
      mainDomains.push('localhost:5173', 'localhost:5000', 'localhost:3000', '127.0.0.1:5173', '127.0.0.1:5000', '127.0.0.1:3000');
    }
    const isMain = mainDomains.includes(host);
    if (!isMain) return 'retail';
    if (localStorage.getItem('hasLoggedInBefore') === 'true') return 'retail';
    return siteInfo ? 'retail' : 'selector';
  });
  const [showBizDetectedPopup, setShowBizDetectedPopup] = useState(false);
  const [bizInfo, setBizInfo] = useState(null);
  const [redirectInfo, setRedirectInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (siteInfo) {
      setAccountView('retail');
    }

  }, [siteInfo, navigate, setToken]);

  useEffect(() => {
    if (localStorage.getItem('hasLoggedInBefore') === 'true') {
      setHasLoggedInBefore(true);
    }
    // Check if biometric is supported on this device
    isBiometricAvailable().then(supported => {
      setBiometricSupported(supported);
      
      // Auto-trigger biometric login if enabled and supported
      const isEnabled = localStorage.getItem('biometricEnabled') === 'true';
      const lastEmail = localStorage.getItem('lastEmail');
      const alreadyTriedThisSession = sessionStorage.getItem('biometricAutoTried') === 'true';

      if (supported && isEnabled && lastEmail && !alreadyTriedThisSession && !isNativeBiometric()) {
        sessionStorage.setItem('biometricAutoTried', 'true');
        setTimeout(() => {
          handleBiometricLogin();
        }, 800); // 800ms delay so user sees the login screen first
      }
    });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      const res = await API.post('/api/login', { email: email.toLowerCase(), password, session_type: 'retail' });
      if (res.data.token) {
        // STRICT SESSION ISOLATION: Destroy any existing state before applying new session
        const lastEmail = localStorage.getItem('lastEmail');
        const hasLoggedInBefore = localStorage.getItem('hasLoggedInBefore');
        const seenOnboarding = localStorage.getItem('seenOnboarding');
        
        localStorage.clear();
        sessionStorage.clear();
        
        // Restore non-sensitive UX settings
        if (res.data.user?.biometricEnabled) localStorage.setItem('biometricEnabled', 'true');
        if (lastEmail) localStorage.setItem('lastEmail', lastEmail);
        if (hasLoggedInBefore) localStorage.setItem('hasLoggedInBefore', hasLoggedInBefore);
        if (seenOnboarding) localStorage.setItem('seenOnboarding', seenOnboarding);
        
        // Apply fresh session
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('hasLoggedInBefore', 'true');
        localStorage.setItem('lastEmail', email);
        localStorage.setItem('userType', 'retail');
        if (setToken) setToken(res.data.token);
        sessionStorage.setItem('justLoggedIn', 'true');
        sessionStorage.setItem('appUnlocked', 'true');
        if (res.data.loginAlertStatus) {
          sessionStorage.setItem('login_alert', res.data.loginAlertStatus);
        }
        
        const loggedUser = res.data.user;
        if (loggedUser && loggedUser.emergencyId) {
          localStorage.setItem('emergencyId', loggedUser.emergencyId);
        }
        const isReseller = loggedUser && (loggedUser.role === 'reseller_admin' || loggedUser.resellerActivationStatus === 'active' || loggedUser.whiteLabelStatus === 'active' || loggedUser.apiLevel === 'reseller');

        if (isReseller) {
          // Business user tried retail login — show popup instead of redirecting silently
          setBizInfo({ siteName: loggedUser.onboardingData?.siteName || "your Website", subdomain: loggedUser.subdomain || loggedUser.admin_subdomain });
          setShowBizDetectedPopup(true);
          setLoading(false);
        } else {
          navigate('/home');
        }
      } else {
        setErrorMsg(res.data.message || 'Login failed. Invalid credentials.');
        setLoading(false);
      }
    } catch (err) {
      if (err.response?.data?.unverified) {
         setLoading(false);
         navigate('/verify-email', { state: { email } });
      } else if (err.response?.data?.redirect) {
         setRedirectInfo(err.response.data);
         setLoading(false);
         setTimeout(() => {
             window.location.href = err.response.data.targetUrl;
         }, 2500); // Wait a bit so the user reads the message
      } else if (err.response?.data?.isBusiness) {
         setBizInfo(err.response?.data);
         setShowBizDetectedPopup(true);
         setLoading(false);
      } else {
         setErrorMsg(err.response?.data?.message || 'Something went wrong, please try again');
         setLoading(false);
      }
    }
  };

  const handleBiometricLogin = async () => {
    const savedEmail = localStorage.getItem('lastEmail');
    if (!savedEmail) {
      setErrorMsg('Please login manually once to enable biometric login.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Native bridge confirms the device user's identity locally but produces no
      // cryptographic assertion, so it can't complete a fresh server login on its own --
      // it can only re-unlock a session this browser already holds a valid token for
      // (same as the app-lock screen in App.jsx). If no token is stored, fall back to
      // asking for the password; the WebAuthn browser path below is unaffected and still
      // performs a full server-verified login.
      if (isNativeBiometric()) {
        const existingToken = localStorage.getItem('token');
        await authenticateBiometric();
        if (existingToken) {
          localStorage.setItem('hasLoggedInBefore', 'true');
          setToken(existingToken);
          sessionStorage.setItem('appUnlocked', 'true');
          navigate('/home');
        } else {
          setErrorMsg('Please log in with your password to continue.');
          setLoading(false);
        }
        return;
      }

      // 1. Get challenge from server
      const challengeRes = await API.get(`/api/biometric/login-challenge?email=${savedEmail}`);

      // 2. Trigger native biometric prompt
      const biometricData = await authenticateBiometric(challengeRes.data);

      // 3. Verify with server
      const loginRes = await API.post('/api/biometric/login-verify', {
        email: savedEmail,
        ...biometricData
      });

      if (loginRes.data.token) {
        localStorage.setItem('token', loginRes.data.token);
        localStorage.setItem('hasLoggedInBefore', 'true');
        setToken(loginRes.data.token);
        sessionStorage.setItem('appUnlocked', 'true');
        navigate('/home');
      } else {
        setErrorMsg('Biometric authentication failed.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Biometric Error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Biometric login failed.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Phase 11 Website Owner Independence Redirect Overlay */}
      {redirectInfo && (
        <div className="business-account-popup-overlay">
          <div className="business-account-popup" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="bap-icon" style={{ background: '#38bdf820', color: '#38bdf8' }}>
              <Building2 size={36} />
            </div>
            <h3>Redirecting...</h3>
            <p className="bap-text">
              {redirectInfo.message}
            </p>
            <div style={{ marginTop: '20px' }}>
               <Loader2 className="animate-spin" size={24} color="#38bdf8" style={{ margin: '0 auto' }} />
            </div>
          </div>
        </div>
      )}

      {/* Website Owner Account Detected Popup */}
      {showBizDetectedPopup && (
        <div className="business-account-popup-overlay" style={{ backdropFilter: 'blur(10px)', background: 'rgba(15, 23, 42, 0.95)' }}>
          <div className="business-account-popup" style={{ maxWidth: '450px', padding: '35px', animation: 'fadeInScale 0.3s ease', border: '1px solid #1e293b' }}>
            <div className="bap-icon" style={{ background: '#3b82f620', color: '#3b82f6', marginBottom: '20px' }}>
              <ShieldCheck size={36} />
            </div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '15px' }}>Website Admin Account Detected</h3>
            <p className="bap-text" style={{ fontSize: '1.05rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '25px' }}>
              This account is currently managing <strong style={{ color: '#fff' }}>{bizInfo?.siteName || "your Website"}</strong>.<br/><br/>
              Please continue through your Website Administration Portal.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
              <button
                className="auth-btn" style={{ background: '#3b82f6', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold' }}
                onClick={() => window.location.href = `https://${bizInfo?.subdomain || 'admin'}.9jasub.com`}
              >
                <Globe size={18} /> Open My Website
              </button>
              <button
                className="auth-btn secondary" style={{ background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold' }}
                onClick={() => window.location.href = `https://admin.${bizInfo?.subdomain || 'app'}.9jasub.com`}
              >
                <Layout size={18} /> Open My Website Admin Portal
              </button>
              <button
                className="auth-btn secondary" style={{ background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold' }}
                onClick={() => window.location.href = 'https://9jasub.com/download/admin-app'}
              >
                <Smartphone size={18} /> Download Website Admin Portal App
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="auth-card premium-fintech-card">
        {/* Background Watermark Logo */}
        <div className="auth-watermark">
          <BrandLogo siteInfo={siteInfo} className="watermark-logo-img" />
        </div>

        <div className="auth-header compact-header">
          <h1 className="auth-title compact-title" style={accountView === 'selector' ? { textTransform: 'uppercase', letterSpacing: '1px', fontSize: '20px' } : {}}>
            {siteInfo 
              ? (hasLoggedInBefore ? 'Welcome Back' : (siteInfo?.branding?.siteName || siteInfo?.name || (isWhiteLabelSite(siteInfo) ? 'VTU Portal' : '9JASUB')))
              : accountView === 'selector'
                ? (isWhiteLabelSite(siteInfo) ? 'WELCOME' : 'WELCOME TO 9JASUB')
                : 'Welcome Back'}
          </h1>
          <p className="auth-subtitle">
            {siteInfo 
              ? (hasLoggedInBefore ? 'Welcome back!' : 'Sign in to your account')
              : accountView === 'selector'
                ? null
                : hasLoggedInBefore
                ? `Welcome back to ${siteInfo?.branding?.siteName || siteInfo?.name || (isWhiteLabelSite(siteInfo) ? 'VTU Portal' : '9JASUB')}.`
                : `Sign in to your ${siteInfo?.branding?.siteName || siteInfo?.name || (isWhiteLabelSite(siteInfo) ? 'VTU Portal' : '9JASUB')} dashboard`}
          </p>
        </div>

        {/* ── Account Type Selector ── */}
        {accountView === 'selector' && (
          <div className="account-type-screen compact-view">
            {/* Offline Data Emergency Option (Temporarily disabled) */}
            {false && (
            <div className="emergency-data-section slim">
              <div className="emergency-content">
                <h4>🚨 Offline Data Purchase</h4>
                <p>Run out of data?<br/>Buy data even when you have no active internet bundle.</p>
              </div>
              <button 
                className="emergency-btn glow-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/offline-data');
                }}
              >
                Offline Data Purchase
              </button>
            </div>
            )}

            <div className="account-type-cards compact">
              {/* Personal Account */}
              <button
                className="account-type-card retail compact"
                onClick={() => setAccountView('retail')}
                id="btn-personal-account"
              >
                <div className="account-type-icon">
                  <UserCircle2 size={18} />
                </div>
                <div className="account-type-card-text">
                  <h3>👤 Personal Account</h3>
                  <p>Buy Data, Airtime, TV & Electricity instantly.</p>
                </div>
              </button>

              {/* Website Admin */}
              <div 
                className="account-type-card business compact" 
                onClick={() => navigate('/business/signup')}
                id="btn-business-console"
              >
                <div className="account-type-icon">
                  <Building2 size={18} />
                </div>
                <div className="account-type-card-text" style={{ paddingRight: 0 }}>
                  <div className="biz-header">
                    <h3>🚀 Own Your VTU Website & App</h3>
                  </div>
                  <p className="biz-desc">Launch your own branded VTU or Data business in minutes.</p>
                  <div className="biz-bullets">
                    <span className="free-trial-text">✓ Free Trial</span>
                    <span>✓ No Coding</span>
                    <span>✓ Ready in 5 Minutes</span>
                  </div>
                  <button className="biz-create-btn glow-btn primary-cta-btn">
                    🚀 Create Website & App
                  </button>
                </div>
              </div>
            </div>

            <div className="trust-badges">
              <span>🔒 Secure Payments</span>
              <span>⚡ Instant Delivery</span>
              <span>🌍 Trusted by Thousands</span>
            </div>
          </div>
        )}

        {/* ── Retail Login Form ── */}
        {accountView === 'retail' && (
          <>
            {errorMsg && <div className="auth-message">{errorMsg}</div>}

            <form onSubmit={handleLogin} className="auth-form">
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
                    autoFocus
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Password</label>
                  <Link to="/forgot-password" style={{ color: '#818cf8', fontSize: '13.2px', textDecoration: 'none' }}>Forgot?</Link>
                </div>
                <div className="input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
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
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <LogIn size={18} />
                  </>
                )}
              </button>
              
              {biometricSupported && hasLoggedInBefore && (
                <button type="button" className="auth-btn device-lock-btn" onClick={handleBiometricLogin}>
                  <span>Device Lock</span> <Fingerprint size={18} />
                </button>
              )}
            </form>

            <div className="auth-footer compact-footer">
              {!siteInfo && (
                <div style={{ marginBottom: '16px' }}>
                  <span
                    className="back-btn-text"
                    onClick={() => setAccountView('selector')}
                  >
                    ← Back to Selection
                  </span>
                </div>
              )}
              <div className="create-account-section">
                <p className="create-account-text">Don't have an account?</p>
                <Link to="/signup" className="pill-btn outline">Create Free Account</Link>
              </div>
            </div>
            
            <div className="quick-access-list">
              {false && (
              <>
              <div className="quick-access-item">
                <div className="quick-access-content">
                  <h4>🚨 Offline Data Purchase</h4>
                  <p>Buy data even without internet access.</p>
                </div>
                <button 
                  type="button"
                  className="quick-access-btn outline-danger"
                  onClick={() => navigate('/offline-data')}
                >
                  Purchase
                </button>
              </div>

              <div className="quick-access-divider"></div>
              </>
              )}

              {!siteInfo && (
                <div className="quick-access-item">
                  <div className="quick-access-content">
                    <h4>🚀 Own Your VTU Website & App</h4>
                    <p>Free Trial • Ready in 5 Minutes</p>
                  </div>
                  <button 
                    type="button"
                    className="quick-access-btn solid-primary"
                    onClick={() => navigate('/business/signup')}
                  >
                    Create
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
