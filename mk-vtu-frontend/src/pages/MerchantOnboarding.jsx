import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Store, Wallet2, CheckCircle2, Loader2, Wifi, Smartphone, Tv2, Zap } from 'lucide-react';
import API from '../api';

// Merchant program ("Reseller 2"): a self-service, no-website tier -- no
// business branding, no subdomain, no sub-customers to manage. A user just
// opts in here, then funds their own wallet with at least the activation
// minimum to permanently unlock Basic Reseller pricing (services/pricing/
// vtuPricing.js) on the exact same Data/Airtime/Cable/Electricity/Epin/
// Education purchase flow every customer already uses (/purchase, /wallet).
// There is no separate "portal" UI to build beyond this screen -- the rest
// of the app already IS the merchant's portal once their role flips.
const MerchantOnboarding = ({ refreshUser }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');

  const fetchStatus = () => {
    setLoading(true);
    API.get('/api/merchant/status')
      .then(res => setStatus(res.data))
      .catch(() => setError('Could not load merchant status. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleBecomeMerchant = async () => {
    setActivating(true);
    setError('');
    try {
      await API.post('/api/merchant/activate');
      if (typeof refreshUser === 'function') refreshUser();
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create your merchant account. Please try again.');
    } finally {
      setActivating(false);
    }
  };

  const isMerchant = status?.isMerchant;
  const isActivated = status?.isActivated;
  const minAmount = status?.minActivationAmount || 2000;

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--card-shadow)',
    borderRadius: 'var(--radius-lg)'
  };

  const primaryBtnStyle = {
    width: '100%', height: '52px', borderRadius: 'var(--radius-md)', fontSize: '16px', fontWeight: 700,
    border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-dark)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-dark)', cursor: 'pointer' }}>
          <ChevronLeft size={28} />
        </button>
        <h2 style={{ fontSize: '22px', margin: 0 }}>Merchant Account</h2>
      </div>

      <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : (
          <>
            <div style={{ ...cardStyle, padding: '24px', textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px',
                background: isActivated ? 'var(--success-light)' : 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isActivated ? 'var(--success)' : 'var(--primary)'
              }}>
                {isActivated ? <CheckCircle2 size={32} /> : <Store size={32} />}
              </div>

              {!isMerchant && (
                <>
                  <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800 }}>Become a Merchant</h3>
                  <p style={{ margin: '0 0 20px', color: 'var(--text-gray)', fontSize: '14px', lineHeight: 1.6 }}>
                    Buy Data, Airtime, Cable TV, Electricity and more at <b>Basic Reseller prices</b> and resell to your own
                    customers. No website, no branding, no setup fee -- just fund your wallet to activate.
                  </p>
                </>
              )}

              {isMerchant && !isActivated && (
                <>
                  <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800 }}>Almost There</h3>
                  <p style={{ margin: '0 0 20px', color: 'var(--text-gray)', fontSize: '14px', lineHeight: 1.6 }}>
                    Fund your wallet with at least <b>₦{minAmount.toLocaleString()}</b> in a single top-up to permanently
                    unlock Basic Reseller pricing on every purchase.
                  </p>
                  <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Wallet Balance</span>
                    <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px' }}>₦{(status?.walletBalance || 0).toLocaleString()}</div>
                  </div>
                </>
              )}

              {isMerchant && isActivated && (
                <>
                  <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>Merchant Pricing Active</h3>
                  <p style={{ margin: '0 0 20px', color: 'var(--text-gray)', fontSize: '14px', lineHeight: 1.6 }}>
                    You're all set. Every purchase you make now uses Basic Reseller pricing automatically.
                  </p>
                </>
              )}

              {error && (
                <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', padding: '12px', fontSize: '13px', marginBottom: '16px' }}>
                  {error}
                </div>
              )}

              {!isMerchant && (
                <button disabled={activating} onClick={handleBecomeMerchant} style={{ ...primaryBtnStyle, opacity: activating ? 0.7 : 1 }}>
                  {activating ? <Loader2 className="animate-spin" size={18} /> : <Store size={18} />}
                  <span>{activating ? 'Creating account...' : 'Become a Merchant'}</span>
                </button>
              )}

              {isMerchant && !isActivated && (
                <button onClick={() => navigate('/merchant/fund')} style={primaryBtnStyle}>
                  <Wallet2 size={18} />
                  <span>Fund Wallet</span>
                </button>
              )}

              {isMerchant && isActivated && (
                <button onClick={() => navigate('/merchant/services', { state: { defaultTab: 'data' } })} style={primaryBtnStyle}>
                  Start Buying
                </button>
              )}
            </div>

            {!isActivated && (
              <div style={{ ...cardStyle, padding: '18px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-gray)' }}>
                  What you get
                </h4>
                {[
                  { icon: Wifi, text: 'Discounted Data plan pricing' },
                  { icon: Smartphone, text: 'Reseller-rate Airtime' },
                  { icon: Tv2, text: 'Discounted Cable TV subscriptions' },
                  { icon: Zap, text: 'Discounted Electricity bills' }
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
                      <Icon size={16} color="var(--primary)" />
                      <span style={{ fontSize: '14px' }}>{item.text}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MerchantOnboarding;
