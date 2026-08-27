import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail, Lock, User, Phone, Eye, EyeOff,
  Loader2, ShieldCheck, Building2, ArrowRight,
  AlertCircle, CheckCircle2, Sparkles
} from 'lucide-react';
import API from '../../api';
import './BusinessConsole.css';
import { getSiteName } from '../../utils/whiteLabelHelper';

const getPasswordStrength = (pwd) => {
  if (!pwd) return -1;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

const strengthLabels = ['Poor', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#22c55e'];

const requirements = [
  { label: 'At least 8 characters', test: p => p.length >= 8 },
  { label: 'One uppercase letter', test: p => /[A-Z]/.test(p) },
  { label: 'One number (0-9)', test: p => /[0-9]/.test(p) },
  { label: 'One special character', test: p => /[^A-Za-z0-9]/.test(p) },
];

const BusinessSignup = ({ setToken, siteInfo }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    state: '',
    password: '',
    confirmPassword: '',
    transactionPin: '',
    enabledFuturePlatforms: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentSimulation, setPaymentSimulation] = useState(false);
  const [error, setError] = useState('');
  const [availablePlatforms, setAvailablePlatforms] = useState([]);
  const [successInfo, setSuccessInfo] = useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const res = await API.get('/api/content/future-platforms');
        if (res.data && Array.isArray(res.data)) {
          setAvailablePlatforms(res.data);
          // Auto-enable all platforms by default
          setFormData(prev => ({
            ...prev,
            enabledFuturePlatforms: res.data.map(p => p._id)
          }));
        }
      } catch (err) {
        console.error("Failed to fetch future platforms", err);
      }
    };
    fetchPlatforms();
  }, []);

  const strength = getPasswordStrength(formData.password);

  const update = (field) => (e) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.transactionPin.length !== 4) {
      setError('Transaction PIN must be exactly 4 digits.');
      return;
    }
    if (strength < 3) {
      setError('Please use a stronger password (at least "Good" strength).');
      return;
    }

    if (!formData.businessName) {
      setError('Business Name is required.');
      return;
    }

    setLoading(true);

    try {
      // Simulate Payment Gateway UI
      // (Payment simulation removed to respect Trial workflow)

      const payload = {
        name: formData.name,
        email: formData.email.toLowerCase(),
        phone: formData.phone,
        businessName: formData.businessName,
        state: formData.state,
        password: formData.password,
        enabledFuturePlatforms: formData.enabledFuturePlatforms
      };

      const regRes = await API.post('/api/reseller/register-with-payment', payload);

      if (regRes.data.userId) {
        // Automatically login the user after successful payment and registration
        const loginRes = await API.post('/api/login', {
            email: formData.email,
            password: formData.password,
            session_type: 'business'
        });
        
        if (loginRes.data.token) {
            localStorage.setItem("token", loginRes.data.token);
            // We intentionally DO NOT call setToken() here.
            // Calling setToken() updates App.jsx state, which immediately
            // unmounts this component and redirects to the dashboard,
            // preventing the user from seeing the success banner.
            
            // Show the Activation Success Screen
            const sub = regRes.data.subdomain || regRes.data.admin_subdomain;
            setSuccessInfo({
                adminSubdomain: sub,
                adminUrl: `https://${sub}.9jasub.com/business/login`
            });
            window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: "Website Created Successfully!", type: "success" } }));
        } else {
            navigate('/business/login');
        }
      }
    } catch (err) {
      // The backend intentionally returns HTTP 403 with { redirect: true, targetUrl }
      // after a successful registration when independence_redirect_enabled is set on
      // the newly created reseller. This is NOT a failure — it is the expected post-
      // registration handshake. Detect it here and treat it as success.
      const data = err.response?.data;
      if (data?.redirect === true && data?.targetUrl) {
        // Registration succeeded. Show success state then redirect.
        setSuccessInfo({
          adminSubdomain: data.targetUrl.replace(/^https?:\/\//, '').split('.')[0],
          adminUrl: data.targetUrl
        });
        window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: 'Your business has been created successfully!', type: 'success' } }));
      } else {
        // Genuine unexpected error — show failure message.
        setError(data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
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
          Launch your own<br />
          <span>VTU empire today.</span>
        </h2>

        <p className="bc-panel-sub">
          Join hundreds of entrepreneurs who have built thriving VTU websites on our platform.
          Get started in minutes — no technical skills required.
        </p>

        <div className="bc-feature-list">
          {[
            'Your own branded platform & domain',
            'Custom mobile app (Android/iOS)',
            'Real-time profit tracking',
            'Full customer management system',
            'Reseller pricing control',
            '24/7 platform support',
          ].map((item, i) => (
            <div className="bc-feature-item" key={i}>
              <div className="bc-feature-icon">
                <CheckCircle2 size={17} />
              </div>
              <div className="bc-feature-text">
                <p style={{ color: 'var(--bc-text)', fontSize: '13.5px' }}>{item}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="bc-form-panel" style={{ overflowY: 'auto' }}>
        {successInfo ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 20px' }}>
                {/* Success icon */}
                <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px', fontSize: '36px'
                }}>
                    🎉
                </div>

                <h1 className="bc-form-title" style={{ fontSize: '26px', marginBottom: '8px' }}>Website Created Successfully</h1>
                <p className="bc-form-subtitle" style={{ fontSize: '15px', maxWidth: '380px', margin: '0 auto 32px auto', opacity: 0.8 }}>
                    Your website is ready.
                </p>

                {/* Primary action: APK download */}
                <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <a
                        href="https://bdpcitxadaygterabrqb.supabase.co/storage/v1/object/public/Reseller-app/WebsiteAdminPortal.apk?download="
                        download
                        className="bc-btn-primary"
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px', fontWeight: '700' }}
                    >
                        <span>📱</span> Download Your Website Admin Application
                    </a>

                    <p style={{ fontSize: '13px', color: 'var(--bc-text-dim)', margin: '4px 0 16px', lineHeight: '1.5' }}>
                        Manage your website from your Admin Portal. Download the app and sign in to manage your website.
                    </p>

                    {/* Live website link */}
                    <a
                        href={`https://${successInfo.adminSubdomain}.9jasub.com/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '10px', fontSize: '15px', fontWeight: '700', padding: '14px',
                            borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981'
                        }}
                    >
                        <span>🌐</span> Visit Your Website
                    </a>
                    <p style={{ fontSize: '13px', color: 'var(--bc-text-dim)', margin: '4px 0 16px', lineHeight: '1.5' }}>
                        This is what your customers will see. Preview it anytime at <strong>{successInfo.adminSubdomain}.9jasub.com</strong>.
                    </p>

                    {/* Secondary shortcut */}
                    <a
                        href="https://9jasub.com/website/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                            // Set cookie so dashboard shows a one-time welcome toast
                            const domain = window.location.hostname.includes('9jasub.com') ? '; domain=.9jasub.com' : '';
                            document.cookie = `showWelcome=true${domain}; path=/; max-age=300`;
                        }}
                        style={{
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            color: '#3b82f6',
                            fontSize: '14px',
                            fontWeight: '600',
                            padding: '10px 16px',
                            marginTop: '8px',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderRadius: '8px',
                            transition: 'background-color 0.2s, color 0.2s'
                        }}
                    >
                        Or access your website portal online →
                    </a>
                </div>
            </div>
        ) : (
            <>
                <div className="bc-form-header">
                  <div className="bc-console-badge">
                    <Sparkles size={10} />
                    Start Your Website
                  </div>
                  <h1 className="bc-form-title">Create Website Admin Account</h1>
                  <p className="bc-form-subtitle">
                    Set up your Website Admin access. You'll configure your brand in the next step.
                  </p>
                </div>

        {error && (
          <div className="bc-error-msg" style={{ marginBottom: '16px' }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="bc-form">
          {/* Full Name */}
          <div className="bc-field">
            <label>Full Name (Owner)</label>
            <div className="bc-input-wrap">
              <User size={16} className="bc-input-icon" />
              <input
                type="text"
                className="bc-input"
                placeholder="e.g. Emeka Johnson"
                value={formData.name}
                onChange={update('name')}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Website Admin Email */}
          <div className="bc-field">
            <label>Website Admin Email</label>
            <div className="bc-input-wrap">
              <Mail size={16} className="bc-input-icon" />
              <input
                type="email"
                className="bc-input"
                placeholder="you@yourbrand.com"
                value={formData.email}
                onChange={update('email')}
                required
              />
            </div>
          </div>

          {/* Business Name */}
          <div className="bc-field">
            <label>VTU Business Name</label>
            <div className="bc-input-wrap">
              <Building2 size={16} className="bc-input-icon" />
              <input
                type="text"
                className="bc-input"
                placeholder="e.g. 9JASUB"
                value={formData.businessName}
                onChange={update('businessName')}
                required
              />
            </div>
          </div>

          {/* State */}
          <div className="bc-field">
            <label>Location (State)</label>
            <div className="bc-input-wrap">
              <Building2 size={16} className="bc-input-icon" />
              <input
                type="text"
                className="bc-input"
                placeholder="e.g. Lagos"
                value={formData.state}
                onChange={update('state')}
              />
            </div>
          </div>

          {/* Phone */}
          <div className="bc-field">
            <label>Phone / WhatsApp</label>
            <div className="bc-input-wrap">
              <Phone size={16} className="bc-input-icon" />
              <input
                type="tel"
                className="bc-input"
                placeholder="e.g. 08123456789"
                value={formData.phone}
                onChange={update('phone')}
              />
            </div>
          </div>

          {/* Password */}
          <div className="bc-field">
            <label>Password</label>
            <div className="bc-input-wrap">
              <Lock size={16} className="bc-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="bc-input"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={update('password')}
                required
                style={{ paddingRight: '42px' }}
              />
              <span className="bc-pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </span>
            </div>

            {/* Strength meter */}
            {formData.password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  height: '4px', background: 'rgba(255,255,255,0.08)',
                  borderRadius: '4px', overflow: 'hidden', marginBottom: '6px'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(strength + 1) * 20}%`,
                    background: strengthColors[strength] || '#f87171',
                    borderRadius: '4px',
                    transition: 'all 0.3s ease'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: strengthColors[strength] }}>
                    {strengthLabels[strength]}
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', maxWidth: '200px' }}>
                    {requirements.map((req, i) => (
                      <span key={i} style={{
                        fontSize: '10.5px',
                        color: req.test(formData.password) ? '#34d399' : 'rgba(255,255,255,0.3)',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        <span style={{ fontSize: '9px' }}>
                          {req.test(formData.password) ? '✓' : '○'}
                        </span>
                        {req.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="bc-field">
            <label>Confirm Password</label>
            <div className="bc-input-wrap">
              <Lock size={16} className="bc-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="bc-input"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={update('confirmPassword')}
                required
              />
            </div>
          </div>

          {/* Transaction PIN */}
          <div className="bc-field">
            <label>
              Transaction PIN
              <span style={{ fontSize: '11px', color: 'var(--bc-text-dim)', fontWeight: 400, marginLeft: '8px' }}>
                (4-digit security PIN)
              </span>
            </label>
            <div className="bc-input-wrap">
              <Lock size={16} className="bc-input-icon" />
              <input
                type="password"
                className="bc-input"
                placeholder="• • • •"
                value={formData.transactionPin}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  transactionPin: e.target.value.replace(/\D/g, '').slice(0, 4)
                }))}
                required
                maxLength={4}
                inputMode="numeric"
                style={{ letterSpacing: '4px', fontSize: '18px' }}
              />
            </div>
          </div>

          {/* Future Platforms Selection */}
          {availablePlatforms.length > 0 && (
            <div className="bc-field" style={{ marginTop: '16px' }}>
              <label>Website Add-ons (Optional)</label>
              <p style={{ fontSize: '12px', color: 'var(--bc-text-dim)', marginBottom: '12px' }}>
                Select additional features to include on your website. You can always change this later in your dashboard.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {availablePlatforms.map(platform => (
                  <label key={platform._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <input
                      type="checkbox"
                      checked={formData.enabledFuturePlatforms.includes(platform._id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData(prev => ({
                          ...prev,
                          enabledFuturePlatforms: checked 
                            ? [...prev.enabledFuturePlatforms, platform._id]
                            : prev.enabledFuturePlatforms.filter(id => id !== platform._id)
                        }));
                      }}
                      style={{ width: '18px', height: '18px', accentColor: '#38bdf8' }}
                    />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#fff' }}>{platform.displayName || platform.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--bc-text-dim)' }}>Enable {platform.displayName || platform.name} for your customers</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="bc-btn-primary"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Creating Account...</>
              : <><span>Create My Website</span><ArrowRight size={16} /></>
            }
          </button>
        </form>

        <div className="bc-footer-links" style={{ marginTop: '20px' }}>
          Already have a website admin account?{' '}
          <Link to="/business/login" className="bc-footer-link">Sign in</Link>
        </div>

        <div className="bc-footer-links" style={{ marginTop: '8px' }}>
          Personal account?{' '}
          <Link to="/login" className="bc-footer-link">Use personal login</Link>
        </div>

        <div className="bc-security-note">
          <ShieldCheck size={13} style={{ color: 'var(--bc-success)' }} />
          <span>Your data is encrypted and protected</span>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default BusinessSignup;
