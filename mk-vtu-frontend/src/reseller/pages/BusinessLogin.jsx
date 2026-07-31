import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, Loader2,
  ShieldCheck, BarChart2, Users, Smartphone,
  Wallet, Building2, ArrowRight, AlertCircle
} from 'lucide-react';
import API from '../../api';
import { isWhiteLabelSite, getSiteName } from '../../utils/whiteLabelHelper';
import { useToast } from '../../context/ToastContext';
import './BusinessConsole.css';

const FEATURES = [
  {
    icon: <BarChart2 size={18} />,
    title: 'Live Website Analytics',
    desc: 'Real-time revenue, profit, and customer metrics'
  },
  {
    icon: <Users size={18} />,
    title: 'Customer Management',
    desc: 'Track, manage and support all your customers'
  },
  {
    icon: <Wallet size={18} />,
    title: 'Profit Wallet',
    desc: 'Monitor earnings and request withdrawals instantly'
  },
  {
    icon: <Smartphone size={18} />,
    title: 'App Builder',
    desc: 'Generate your branded mobile app with one click'
  },
];

const BusinessLogin = ({ setToken, siteInfo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { showToast, updateToast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const toastId = await showToast('Authenticating...', 'loading');

    try {
      const res = await API.post('/api/login', { email: email.toLowerCase(), password, session_type: 'business' });

      if (!res.data.token) {
        const msg = res.data.message || 'Login failed. Please check your credentials.';
        setError(msg);
        updateToast(toastId, { message: msg, type: 'error' });
        setLoading(false);
        return;
      }

      const loggedUser = res.data.user;
      const isReseller = loggedUser && (
        loggedUser.role === 'reseller_admin' ||
        loggedUser.resellerActivationStatus === 'active' ||
        loggedUser.whiteLabelStatus === 'active' ||
        loggedUser.apiLevel === 'reseller'
      );

      // Block non-business accounts
      if (!isReseller) {
        const msg = 'This portal is for Website Admin accounts only. Personal accounts should use the main login page.';
        setError(msg);
        updateToast(toastId, { message: msg, type: 'error' });
        setLoading(false);
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
      localStorage.setItem('hasLoggedInBefore', 'true');
      localStorage.setItem('lastEmail', email.toLowerCase());
      localStorage.setItem('userType', 'business');

      if (setToken) setToken(res.data.token);
      sessionStorage.setItem('justLoggedIn', 'true');

      updateToast(toastId, { message: 'Login Successful! Redirecting...', type: 'success' });
      navigate('/reseller/dashboard');
    } catch (err) {
      if (err.response?.data?.unverified) {
        updateToast(toastId, { message: 'Please verify your email.', type: 'warning' });
        setLoading(false);
        navigate('/verify-email', { state: { email } });
      } else {
        const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
        setError(msg);
        updateToast(toastId, { message: msg, type: 'error' });
        setLoading(false);
      }
    }
  };

  return (
    <div className="bc-page">
      {/* ── Left Branding Panel ── */}
      <div className="bc-brand-panel">
        <div className="bc-logo-row">
          <div className="bc-brand-icon">
            <Building2 size={22} />
          </div>
          <div>
            <div className="bc-brand-name">{getSiteName(siteInfo)}</div>
            <div className="bc-brand-tag">Website Admin</div>
          </div>
        </div>

        <h2 className="bc-panel-headline">
          Your VTU website.<br />
          <span>Your rules.</span>
        </h2>

        <p className="bc-panel-sub">
          Manage your entire VTU platform from one powerful dashboard.
          Built for website owners.
        </p>

        <div className="bc-feature-list">
          {FEATURES.map((f, i) => (
            <div className="bc-feature-item" key={i}>
              <div className="bc-feature-icon">{f.icon}</div>
              <div className="bc-feature-text">
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="bc-form-panel">
        <div className="bc-form-header">
          <div className="bc-console-badge">
            <span className="bc-console-badge-dot" />
            Website Admin Portal
          </div>
          <h1 className="bc-form-title">Welcome back</h1>
          <p className="bc-form-subtitle">
            Sign in to manage your VTU platform and customers.
          </p>
        </div>

        {error && (
          <div className="bc-error-msg" style={{ marginBottom: '16px' }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="bc-form">
          <div className="bc-field">
            <label>Website Admin Email</label>
            <div className="bc-input-wrap">
              <Mail size={16} className="bc-input-icon" />
              <input
                type="email"
                className="bc-input"
                placeholder="owner@yourbrand.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="bc-field">
            <label>Password</label>
            <div className="bc-input-wrap">
              <Lock size={16} className="bc-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="bc-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: '42px' }}
              />
              <span className="bc-pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginTop: '-6px' }}>
            <Link
              to="/forgot-password"
              style={{ fontSize: '12.5px', color: 'var(--bc-primary)', textDecoration: 'none', fontWeight: 600 }}
            >
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="bc-btn-primary" disabled={loading}>
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              : <><span>Access Website Admin</span><ArrowRight size={16} /></>
            }
          </button>
        </form>

        {!isWhiteLabelSite(null) && (
          <>
            <div className="bc-divider-label" style={{ marginTop: '24px' }}>
              New to Website Admin?
            </div>

            <button
              className="bc-btn-ghost"
              onClick={() => navigate('/business/signup')}
            >
              Start Your VTU Website
            </button>
          </>
        )}

        <div className="bc-footer-links" style={{ marginTop: '16px' }}>
          Personal account?{' '}
          <Link to="/login" className="bc-footer-link">
            Use personal login
          </Link>
        </div>

        <div className="bc-security-note">
          <ShieldCheck size={13} style={{ color: 'var(--bc-success)' }} />
          <span>Secure enterprise-grade access</span>
        </div>
      </div>
    </div>
  );
};

export default BusinessLogin;
