import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, Globe, Smartphone, BarChart, Bell, CheckCircle, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import API from '../../api';

const ResellerPremium = ({ user, refreshUser }) => {
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [pricing, setPricing] = useState({ sixMonths: 20000, yearly: 35000 });
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [confirmModal, setConfirmModal] = useState({ show: false, duration: null });

    useEffect(() => {
        if (location.state?.error) {
            setMsg({ type: 'error', text: location.state.error });
        }
    }, [location.state]);

    useEffect(() => {
        fetchPricing();
    }, []);

    const fetchPricing = async () => {
        try {
            const res = await API.get('/api/reseller/premium-pricing');
            setPricing(res.data);
        } catch (err) {
            console.error("Failed to fetch pricing");
        }
    };

    const triggerUpgrade = (duration) => {
        setConfirmModal({ show: true, duration });
    };

    const confirmUpgrade = async () => {
        const duration = confirmModal.duration;
        setConfirmModal({ show: false, duration: null });
        
        setLoading(true);
        setMsg({ type: '', text: '' });
        try {
            await API.post('/api/reseller/upgrade-premium', { duration });
            await refreshUser();
            const isRenewal = user?.resellerTier === 'premium' || user?.resellerTier === 'vip';
            const successMsg = `Successfully ${isRenewal ? 'renewed' : 'upgraded to'} Premium for ${duration === '6months' ? '6 months' : '1 year'}!`;
            setMsg({ type: 'success', text: successMsg });
            alert("CONGRATULATIONS! " + successMsg);
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Upgrade failed. Check your balance.' });
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { icon: <Globe size={20} />, title: 'Custom Domain Support', desc: 'Use your own .com or .com.ng domain instead of a subdomain.' },
        { icon: <Smartphone size={20} />, title: 'Android APK Generation', desc: 'Get a custom mobile app for your brand to list on Play Store.' },
        { icon: <ShieldCheck size={20} />, title: 'Advanced Branding', desc: 'Remove all platform watermarks and use custom CSS/Themes.' },
        { icon: <BarChart size={20} />, title: 'Premium Analytics', desc: 'Detailed website insights and daily exportable reports.' },
        { icon: <Bell size={20} />, title: 'Push Notifications', desc: 'Send unlimited push alerts directly to your customers devices.' },
        { icon: <Zap size={20} />, title: 'Priority Support', desc: 'Direct access to our senior engineering team for assistance.' }
    ];

    return (
        <div className="reseller-container animate-fade-in">
            <header className="reseller-header" style={{ textAlign: 'center', marginBottom: '48px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', padding: '8px 20px', borderRadius: '100px', fontSize: '15.4px', fontWeight: 700, marginBottom: '16px' }}>
                    <ShieldCheck size={18} /> Premium Website Plans
                </div>
                <h1 style={{ fontSize: '39.6px', fontWeight: 900, marginBottom: '16px' }}>Scale Your Website.</h1>
                <p style={{ color: '#64748b', fontSize: '19.8px', maxWidth: '700px', margin: '0 auto' }}>
                    Unlock advanced tools and infrastructure to professionalize your brand and increase customer retention.
                </p>
            </header>

            {msg.text && (
                <div className={`alert ${msg.type}`} style={{ maxWidth: '800px', margin: '0 auto 32px' }}>
                    {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span>{msg.text}</span>
                </div>
            )}

            {(user?.resellerTier === 'premium' || user?.resellerTier === 'vip') && (
                <div className="alert success" style={{ maxWidth: '800px', margin: '0 auto 32px' }}>
                    <CheckCircle size={20} />
                    <span>You have an active Premium Subscription. Valid until {user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString() : 'Active'}. You can renew below to extend your validity.</span>
                </div>
            )}

            <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
                
                {/* 6 MONTHS PLAN */}
                <div className="pricing-card" style={{ background: 'white', borderRadius: '32px', padding: '40px', border: '1px solid #f1f5f9', position: 'relative' }}>
                    <h3>Standard Premium</h3>
                    <div className="price" style={{ margin: '24px 0' }}>
                        <span style={{ fontSize: '52.8px', fontWeight: 900 }}>₦{pricing.sixMonths.toLocaleString()}</span>
                        <span style={{ color: '#64748b', fontSize: '17.6px' }}> / 6 Months</span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '15.4px', marginBottom: '32px' }}>Perfect for growing websites who want to professionalize their brand.</p>
                    <button className="auth-btn" style={{ width: '100%' }} onClick={() => triggerUpgrade('6months')} disabled={loading}>
                        {(user?.resellerTier === 'premium' || user?.resellerTier === 'vip') ? (loading ? 'Processing...' : 'Renew Subscription') : (loading ? 'Processing...' : 'Upgrade Now')}
                    </button>
                    <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15.4px', color: '#475569' }}><CheckCircle size={16} color="#10b981" /> Custom Domain Support</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15.4px', color: '#475569' }}><CheckCircle size={16} color="#10b981" /> APK Generation Access</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15.4px', color: '#475569' }}><CheckCircle size={16} color="#10b981" /> Advanced Branding Tools</div>
                    </div>
                </div>

                {/* YEARLY PLAN */}
                <div className="pricing-card featured" style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: '32px', padding: '40px', border: '1px solid #3730a3', position: 'relative', color: 'white' }}>
                    <div style={{ position: 'absolute', top: '20px', right: '20px', background: '#fbbf24', color: '#000', padding: '4px 12px', borderRadius: '100px', fontSize: '13.2px', fontWeight: 800 }}>BEST VALUE</div>
                    <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>Ultimate Partner</h3>
                    <div className="price" style={{ margin: '24px 0' }}>
                        <span style={{ fontSize: '52.8px', fontWeight: 900 }}>₦{pricing.yearly.toLocaleString()}</span>
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '17.6px' }}> / Year</span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15.4px', marginBottom: '32px' }}>Maximum value for serious entrepreneurs. Includes premium onboarding.</p>
                    <button className="auth-btn" style={{ width: '100%', background: 'white', color: '#1e1b4b' }} onClick={() => triggerUpgrade('12months')} disabled={loading}>
                        {(user?.resellerTier === 'premium' || user?.resellerTier === 'vip') ? (loading ? 'Processing...' : 'Renew Subscription') : (loading ? 'Processing...' : 'Upgrade Now')}
                    </button>
                    <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15.4px', color: 'rgba(255,255,255,0.8)' }}><CheckCircle size={16} color="#fbbf24" /> Everything in Standard</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15.4px', color: 'rgba(255,255,255,0.8)' }}><CheckCircle size={16} color="#fbbf24" /> Free Custom Domain Setup</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15.4px', color: 'rgba(255,255,255,0.8)' }}><CheckCircle size={16} color="#fbbf24" /> Priority Premium Onboarding</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15.4px', color: 'rgba(255,255,255,0.8)' }}><CheckCircle size={16} color="#fbbf24" /> Best Value — Save ₦5,000 with the Yearly Plan</div>
                    </div>
                </div>

            </div>

            {/* Premium Benefits Grid */}
            <div style={{ marginTop: '80px' }}>
                <h2 style={{ textAlign: 'center', fontSize: '26.4px', fontWeight: 800, marginBottom: '40px' }}>What you get with Premium</h2>
                <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    {features.map((f, i) => (
                        <div key={i} style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#8b5cf6' }}>
                                {f.icon}
                            </div>
                            <h4 style={{ fontSize: '19.8px', fontWeight: 800, marginBottom: '12px' }}>{f.title}</h4>
                            <p style={{ color: '#64748b', fontSize: '15.4px', lineHeight: '1.6', margin: 0 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ marginTop: '64px', padding: '40px', background: '#f8fafc', borderRadius: '32px', textAlign: 'center' }}>
                <Shield size={40} color="#6366f1" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '22.0px', fontWeight: 800, marginBottom: '8px' }}>Website Impact</h3>
                <p style={{ color: 'var(--reseller-text-muted)', lineHeight: '1.6' }}>
                    If your premium subscription expires, your website, customers, and website URL will remain fully active. You will only lose access to the VIP features (Bulk Email, Android App, Priority Support).
                </p>
            </div>

            {confirmModal.show && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', textAlign: 'center' }}>Upgrade Subscription</h2>
                        <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.6', marginBottom: '16px', textAlign: 'center' }}>
                            Your subscription fee of <strong>₦{(confirmModal.duration === '6months' ? pricing.sixMonths : pricing.yearly).toLocaleString()}</strong> will be deducted from your <strong>Main Wallet (Operating Balance)</strong>.
                        </p>
                        <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px', textAlign: 'center' }}>
                            Please ensure your Main Wallet has sufficient balance before continuing.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setConfirmModal({ show: false, duration: null })} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={confirmUpgrade} style={{ flex: 1, padding: '12px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Upgrade Now</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResellerPremium;
