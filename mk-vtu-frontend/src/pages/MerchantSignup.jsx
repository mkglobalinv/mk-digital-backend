import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Store, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
import API from '../api';

// Public, unauthenticated entry point into the Merchant program ("Reseller
// 2") -- reachable from Login.jsx's and the marketing site's CTAs. Creates
// (or, for an existing plain 'user' account with a matching password,
// upgrades) an account with role: 'merchant', logs them straight in, then
// hands off to MerchantOnboarding.jsx to fund their wallet.
const MerchantSignup = ({ setToken }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', transactionPin: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const update = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  // After a signup submission, wait briefly on a visible message before
  // handing off -- otherwise the near-instant auto-login + navigate makes
  // "you already have an account, signing you in" indistinguishable from a
  // fresh signup, which is exactly what was reported as confusing.
  const finishAndGo = (message) => new Promise((resolve) => {
    setNotice(message);
    setTimeout(resolve, 1400);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setNotice('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in your name, email and password.');
      return;
    }
    if (!/^\d{4}$/.test(formData.transactionPin)) {
      setError('Transaction PIN must be exactly 4 digits.');
      return;
    }

    setLoading(true);
    try {
      const registerRes = await API.post('/api/merchant/register', {
        name: formData.name,
        email: formData.email.toLowerCase(),
        phone: formData.phone,
        password: formData.password,
        transactionPin: formData.transactionPin
      });

      if (registerRes.data.alreadyExisted) {
        await finishAndGo('You already have a Merchant account with this email. Signing you in...');
      }

      const loginRes = await API.post('/api/login', { email: formData.email, password: formData.password });
      if (loginRes.data.token) {
        localStorage.setItem('token', loginRes.data.token);
        setToken(loginRes.data.token);
        navigate('/merchant/onboarding');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create your merchant account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputWrapStyle = { position: 'relative', marginBottom: '14px' };
  const inputStyle = {
    width: '100%', height: '48px', padding: '0 14px 0 42px', borderRadius: 'var(--radius-md)',
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
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>Become a Merchant</h2>
          <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: 'var(--text-gray)' }}>
            Buy at Basic Reseller prices. No website, no setup fee.
          </p>
        </div>

        {notice && (
          <div style={{ background: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-md)', padding: '12px', fontSize: '13px', marginBottom: '14px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{notice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={inputWrapStyle}>
            <User size={18} style={iconStyle} />
            <input style={inputStyle} type="text" placeholder="Full Name" value={formData.name} onChange={update('name')} required />
          </div>
          <div style={inputWrapStyle}>
            <Mail size={18} style={iconStyle} />
            <input style={inputStyle} type="email" placeholder="Email Address" value={formData.email} onChange={update('email')} required />
          </div>
          <div style={inputWrapStyle}>
            <Phone size={18} style={iconStyle} />
            <input style={inputStyle} type="tel" placeholder="Phone Number" value={formData.phone} onChange={update('phone')} />
          </div>
          <div style={inputWrapStyle}>
            <Lock size={18} style={iconStyle} />
            <input style={inputStyle} type="password" placeholder="Password" value={formData.password} onChange={update('password')} required />
          </div>
          <div style={inputWrapStyle}>
            <KeyRound size={18} style={iconStyle} />
            <input
              style={{ ...inputStyle, letterSpacing: '4px' }}
              type="password"
              inputMode="numeric"
              placeholder="4-Digit Transaction PIN"
              maxLength={4}
              value={formData.transactionPin}
              onChange={(e) => setFormData({ ...formData, transactionPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              required
            />
          </div>

          {error && (
            <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', padding: '12px', fontSize: '13px', marginBottom: '14px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', height: '50px', borderRadius: 'var(--radius-md)', fontSize: '16px', fontWeight: 700,
              border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            <span>{notice ? 'Signing you in...' : (loading ? 'Creating account...' : 'Create Merchant Account')}</span>
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-gray)', marginTop: '18px' }}>
          Already a merchant? <a href="/merchant/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</a>
        </p>
      </div>
    </div>
  );
};

export default MerchantSignup;
