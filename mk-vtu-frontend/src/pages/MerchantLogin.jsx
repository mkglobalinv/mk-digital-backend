import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, Store, AlertCircle, ArrowRight } from 'lucide-react';
import API from '../api';

// Dedicated, clearly-labeled sign-in for the Merchant program, mirroring
// BusinessLogin.jsx's pattern for resellers -- so a merchant always has an
// unambiguous place to log in, distinct both from the generic retail /login
// and from /business/login. Merchants still authenticate through the exact
// same /api/login used everywhere else (session_type: 'retail', which
// findByTenant now resolves to the merchant account even when a
// reseller_admin/admin sibling shares the same email -- see models/User.js).
const MerchantLogin = ({ setToken }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await API.post('/api/login', { email: email.toLowerCase(), password, session_type: 'merchant' });

      if (!res.data.token) {
        setError(res.data.message || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      navigate('/merchant/dashboard');
    } catch (err) {
      if (err.response?.data?.unverified) {
        setLoading(false);
        navigate('/verify-email', { state: { email } });
      } else {
        setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        setLoading(false);
      }
    }
  };

  const inputWrapStyle = { position: 'relative', marginBottom: '14px' };
  const inputStyle = {
    width: '100%', height: '48px', padding: '0 42px 0 42px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-dark)', fontSize: '15px'
  };
  const iconStyle = { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-gray)' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)', borderRadius: 'var(--radius-lg)', padding: '28px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Store size={26} />
          </div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>Merchant Login</h2>
          <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: 'var(--text-gray)' }}>
            Sign in to your Merchant account
          </p>
        </div>

        {error && (
          <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', padding: '12px', fontSize: '13px', marginBottom: '14px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={inputWrapStyle}>
            <Mail size={18} style={iconStyle} />
            <input style={inputStyle} type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div style={inputWrapStyle}>
            <Lock size={18} style={iconStyle} />
            <input
              style={inputStyle}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-gray)', cursor: 'pointer' }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </span>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '16px' }}>
            <Link to="/forgot-password" style={{ fontSize: '12.5px', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', height: '50px', borderRadius: 'var(--radius-md)', fontSize: '16px', fontWeight: 700,
              border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-gray)', marginTop: '18px' }}>
          Not a merchant yet? <a href="/merchant/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Become a Merchant</a>
        </p>
      </div>
    </div>
  );
};

export default MerchantLogin;
