import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, 
    Zap, 
    Globe, 
    Palette, 
    Smartphone, 
    ArrowRight, 
    ArrowLeft,
    Check, 
    AlertCircle, 
    Layout,
    MessageCircle,
    Star
} from 'lucide-react';
import API from '../api';
import './Auth.css'; 
import './ResellerWizard.css';

const THEMES = [
    { id: 'blue', name: 'Professional Blue', primary: '#3b82f6', secondary: '#1d4ed8' },
    { id: 'green', name: 'Success Green', primary: '#10b981', secondary: '#047857' },
    { id: 'purple', name: 'Royal Purple', primary: '#8b5cf6', secondary: '#6d28d9' },
    { id: 'gold', name: 'Premium Gold', primary: '#f59e0b', secondary: '#b45309' },
];

const LivePreview = ({ formData }) => (
    <div className="live-preview-container">
        <span className="preview-label">Your Business Preview</span>
        <div className="mock-phone">
            <div className="mock-screen">
                <div className="mock-header" style={{ background: formData.primaryColor }}>
                    <div className="mock-brand-name">{formData.siteName || 'My Brand'}</div>
                </div>
                <div className="mock-content">
                    <div className="mock-hero" style={{ background: `${formData.primaryColor}22` }}>
                        <Zap size={20} color={formData.primaryColor} />
                    </div>
                    <div className="mock-line" style={{ width: '80%' }}></div>
                    <div className="mock-line" style={{ width: '60%' }}></div>
                    <div className="mock-line" style={{ width: '100%', marginTop: '10px', height: '20px', borderRadius: '4px', background: formData.primaryColor }}></div>
                    <div className="mock-line" style={{ width: '40%', alignSelf: 'center', marginTop: 'auto', marginBottom: '10px' }}></div>
                </div>
            </div>
        </div>
        <p style={{ fontSize: '11.0px', marginTop: '10px', color: '#666' }}>
            {formData.domainOption === 'subdomain' ? `${formData.requestedDomain || 'mybrand'}.9jasub.com` : (formData.requestedDomain || 'www.yourdomain.com')}
        </p>
    </div>
);

const WizardStep = ({ title, subtitle, children, showBack = true, onNext, onBack, nextLabel = "Continue", loading, error }) => (
    <div className="onboarding-wizard animate-slide-in">
        <div className="wizard-header">
            <h1 className="wizard-title">{title}</h1>
            <p className="wizard-subtitle">{subtitle}</p>
        </div>

        <div className="step-content">
            {children}
        </div>

        {error && <div className="auth-message error">{error}</div>}

        <div className="wizard-nav">
            {showBack && (
                <button type="button" className="nav-btn-back" onClick={onBack}>
                    <ArrowLeft size={20} />
                </button>
            )}
            <button 
                type="button"
                className="auth-btn nav-btn-next" 
                onClick={onNext}
                disabled={loading}
            >
                {loading ? 'Processing...' : nextLabel}
                {!loading && <ArrowRight size={18} />}
            </button>
        </div>
    </div>
);

const ResellerOnboarding = ({ user, refreshUser, siteInfo }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [subdomainAvailable, setSubdomainAvailable] = useState(null);
    
    // Custom Domain States
    const [customDomainAvailable, setCustomDomainAvailable] = useState(null);
    const [customDomainLoading, setCustomDomainLoading] = useState(false);
    const [customDomainError, setCustomDomainError] = useState('');
    const [customTimeoutId, setCustomTimeoutId] = useState(null);
    
    const [formData, setFormData] = useState({
        siteName: '',
        businessName: '',
        whatsappNumber: '',
        contactEmail: user?.email || '',
        primaryColor: THEMES[0].primary,
        secondaryColor: THEMES[0].secondary,
        selectedTheme: 'blue',
        domainOption: 'subdomain',
        requestedDomain: ''
    });

    useEffect(() => {
        // Special case: If user is already pending approval, skip to final status
        if (user?.resellerActivationStatus === 'pending_approval') setStep(100); 
        
        // Clean up timeout on unmount
        return () => {
            if (customTimeoutId) clearTimeout(customTimeoutId);
        };
    }, [user]);

    const checkSubdomain = async (val) => {
        if (val.length < 3) return;
        try {
            const res = await API.get(`/api/reseller/check-subdomain?subdomain=${val}`);
            setSubdomainAvailable(res.data.available);
        } catch (err) { console.error(err); }
    };

    const checkCustomDomain = async (domain) => {
        if (!domain) return;
        setCustomDomainLoading(true);
        try {
            const res = await API.get(`/api/reseller/check-custom-domain?domain=${domain}`);
            if (res.data.available) {
                setCustomDomainAvailable(true);
                setCustomDomainError('');
            } else {
                setCustomDomainAvailable(false);
                setCustomDomainError(res.data.reason || 'This domain is already connected to another brand.');
            }
        } catch (err) {
            console.error(err);
            setCustomDomainAvailable(true);
        } finally {
            setCustomDomainLoading(false);
        }
    };

    const handleCustomDomainChange = (val) => {
        // 1. Lowercase auto-format & trim spaces
        let formatted = val.toLowerCase().trim();
        
        // 2. Remove http://, https://, and www. prefixes
        formatted = formatted.replace(/^(https?:\/\/)?(www\.)?/i, '');
        
        // 3. Remove trailing slashes
        formatted = formatted.replace(/\/+$/, '');
        
        setFormData({ ...formData, requestedDomain: formatted });
        setCustomDomainAvailable(null);
        setCustomDomainError('');
        
        if (customTimeoutId) {
            clearTimeout(customTimeoutId);
        }
        
        if (!formatted) {
            return;
        }
        
        if (/\s/.test(formatted)) {
            setCustomDomainError('Domain cannot contain spaces.');
            return;
        }
        
        if (/[^a-z0-9\.\-]/i.test(formatted)) {
            setCustomDomainError('Domain contains invalid characters.');
            return;
        }
        
        const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,8}$/i;
        if (!domainRegex.test(formatted)) {
            setCustomDomainError('Enter a valid domain format (e.g. yourbrand.com).');
            return;
        }
        
        const timer = setTimeout(() => {
            checkCustomDomain(formatted);
        }, 500);
        setCustomTimeoutId(timer);
    };

    const handleThemeSelect = (themeId) => {
        const theme = THEMES.find(t => t.id === themeId);
        setFormData({
            ...formData, 
            selectedTheme: themeId, 
            primaryColor: theme.primary, 
            secondaryColor: theme.secondary 
        });
    };

    const nextStep = () => {
        setError('');
        if (step === 2 && !formData.siteName) return setError("Please enter your brand name.");
        if (step === 3 && formData.whatsappNumber.length < 10) return setError("Please enter a valid WhatsApp number.");
        if (step === 4) {
            if (formData.domainOption === 'subdomain') {
                if (!formData.requestedDomain) return setError("Please enter your free website address prefix.");
                if (!subdomainAvailable) return setError("This subdomain is already taken.");
            }
            if (formData.domainOption === 'own_domain') {
                if (!formData.requestedDomain) return setError("Please enter your custom domain.");
                if (customDomainError) return setError(customDomainError);
                if (customDomainAvailable === false) return setError("This domain is already connected to another brand or is pending setup.");
                if (customDomainAvailable !== true) {
                    if (customDomainLoading) return setError("Please wait while we check domain availability...");
                    return setError("Please enter a valid domain format.");
                }
            }
            if (formData.domainOption === 'request_purchase') {
                if (!formData.requestedDomain) return setError("Please enter the domain name you would like us to register.");
            }
        }
        
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            // First activate intent if not already done
            if (user?.resellerActivationStatus !== 'pending_onboarding') {
                await API.post('/api/reseller/activate-intent');
            }

            await API.post('/api/reseller/submit-onboarding', {
                branding: {
                    siteName: formData.siteName,
                    businessName: formData.siteName, // Use site name for business name too for simplicity
                    whatsappNumber: formData.whatsappNumber,
                    contactEmail: formData.contactEmail,
                    primaryColor: formData.primaryColor,
                    secondaryColor: formData.secondaryColor
                },
                domainOption: formData.domainOption,
                requestedDomain: formData.requestedDomain
            });
            refreshUser();
            setStep(100); // Success step
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally { setLoading(false); }
    };

    // --- STEPS ---

    if (step === 1) return (
        <WizardStep 
            title="Start Your Business"
            subtitle="Launch your own branded VTU website in 5 minutes. No technical skills required."
            showBack={false}
            nextLabel="Get Started"
            onNext={nextStep}
        >
            <div className="benefits-grid" style={{ marginTop: '0' }}>
                <div className="benefit-item">
                    <div className="icon-3d-glow" style={{ padding: '8px' }}><Star size={16} /></div>
                    <span>Your Own Brand & Domain</span>
                </div>
                <div className="benefit-item">
                    <div className="icon-3d-glow" style={{ padding: '8px' }}><Palette size={16} /></div>
                    <span>Customizable Themes</span>
                </div>
                <div className="benefit-item">
                    <div className="icon-3d-glow" style={{ padding: '8px' }}><Smartphone size={16} /></div>
                    <span>Mobile App Included</span>
                </div>
            </div>
            <div className="info-box-premium" style={{ marginTop: '20px' }}>
                <p><strong>7-Day Free Trial</strong>. Pay ₦5,000 only after you're happy with your new business.</p>
            </div>
        </WizardStep>
    );

    if (step === 2) return (
        <WizardStep 
            title="Your Brand Name"
            subtitle="What should customers call your business?"
            onNext={nextStep}
            onBack={prevStep}
            loading={loading}
            error={error}
        >
            <div className="large-input-wrapper">
                <input 
                    type="text" 
                    className="large-brand-input"
                    placeholder="e.g. FastData Hub"
                    value={formData.siteName}
                    onChange={(e) => setFormData({...formData, siteName: e.target.value})}
                    autoFocus
                />
                <p className="hint-text" style={{ textAlign: 'center', marginTop: '12px' }}>
                    This name will appear on your website, app, and receipts.
                </p>
            </div>
            <LivePreview formData={formData} />
        </WizardStep>
    );

    if (step === 3) return (
        <WizardStep 
            title="WhatsApp Contact"
            subtitle="Where should customers contact you for support?"
            onNext={nextStep}
            onBack={prevStep}
            loading={loading}
            error={error}
        >
            <div className="form-group">
                <label>WhatsApp Number</label>
                <div className="input-wrapper">
                    <div className="auth-input-icon"><MessageCircle size={18} /></div>
                    <input 
                        type="text" 
                        placeholder="e.g. 08123456789"
                        className="auth-input"
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                    />
                </div>
                <p className="hint-text">A WhatsApp button will be added to your site automatically.</p>
            </div>
            <LivePreview formData={formData} />
        </WizardStep>
    );

    if (step === 4) return (
        <WizardStep 
            title="Choose Your Address"
            subtitle="How will customers find your website?"
            onNext={nextStep}
            onBack={prevStep}
            loading={loading}
            error={error}
        >
            <div className="domain-cards-grid">
                <div 
                    className={`domain-card ${formData.domainOption === 'subdomain' ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, domainOption: 'subdomain'})}
                >
                    <div className="domain-card-icon"><Layout size={20} /></div>
                    <div className="domain-card-info">
                        <h4>Free Website Address</h4>
                        <p>Start instantly with a free link.</p>
                    </div>
                    <span className="recommended-badge">Free</span>
                </div>

                <div 
                    className={`domain-card ${formData.domainOption === 'own_domain' ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, domainOption: 'own_domain'})}
                >
                    <div className="domain-card-icon"><Globe size={20} /></div>
                    <div className="domain-card-info">
                        <h4>Use My Own Domain</h4>
                        <p>Connect your .com or .com.ng</p>
                    </div>
                </div>

                <div 
                    className={`domain-card ${formData.domainOption === 'request_purchase' ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, domainOption: 'request_purchase'})}
                >
                    <div className="domain-card-icon"><Star size={20} /></div>
                    <div className="domain-card-info">
                        <h4>Help Me Buy One</h4>
                        <p>We'll handle the registration for you.</p>
                    </div>
                </div>
            </div>

            <div className="domain-input-area animate-fade-in" style={{ marginTop: '10px' }}>
                {formData.domainOption === 'subdomain' && (
                    <div className="subdomain-input-wrapper animate-slide-in">
                        <input 
                            type="text" 
                            placeholder="mybrand"
                            value={formData.requestedDomain}
                            onChange={(e) => {
                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                                setFormData({...formData, requestedDomain: val});
                                checkSubdomain(val);
                            }}
                            className="auth-input"
                            style={{ paddingLeft: '16px' }}
                        />
                        <span className="suffix">.9jasub.com</span>
                        {formData.requestedDomain.length >= 3 && (
                            <p className={`availability-text ${subdomainAvailable ? 'success' : 'error'}`} style={{ fontSize: '12.1px', marginTop: '4px' }}>
                                {subdomainAvailable ? '✓ Available' : '✗ Already taken'}
                            </p>
                        )}
                    </div>
                )}

                {formData.domainOption === 'own_domain' && (
                    <div className="custom-domain-container">
                        <p className="custom-domain-helper">Connect your existing domain to your reseller website.</p>
                        <div className="custom-domain-input-wrapper">
                            <div className="custom-domain-icon-left">
                                <Globe size={18} />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Enter your domain"
                                value={formData.requestedDomain}
                                onChange={(e) => handleCustomDomainChange(e.target.value)}
                                className="custom-domain-input"
                            />
                            <div className="custom-domain-status-right">
                                {customDomainLoading && <div className="custom-domain-spinner" />}
                                {!customDomainLoading && customDomainAvailable === true && (
                                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span>
                                )}
                                {!customDomainLoading && customDomainAvailable === false && (
                                    <span style={{ color: '#f87171', fontWeight: 'bold' }}>✗</span>
                                )}
                            </div>
                        </div>
                        
                        {customDomainError && (
                            <p className="domain-validation-msg error">
                                <span>✗</span> {customDomainError}
                            </p>
                        )}
                        {!customDomainError && customDomainAvailable === true && (
                            <p className="domain-validation-msg success">
                                <span>✓</span> This domain is available for connection!
                            </p>
                        )}

                        <div className="custom-domain-examples">
                            Examples: <code>yourbrand.com</code> or <code>yourbrand.com.ng</code>
                        </div>
                    </div>
                )}

                {formData.domainOption === 'request_purchase' && (
                    <div className="custom-domain-container">
                        <p className="custom-domain-helper">Tell us the domain name you would like us to purchase and configure for you.</p>
                        <div className="custom-domain-input-wrapper">
                            <div className="custom-domain-icon-left">
                                <Star size={18} />
                            </div>
                            <input 
                                type="text" 
                                placeholder="e.g. yourbrand.com"
                                value={formData.requestedDomain}
                                onChange={(e) => {
                                    let formatted = e.target.value.toLowerCase().trim();
                                    formatted = formatted.replace(/^(https?:\/\/)?(www\.)?/i, '').replace(/\/+$/, '');
                                    setFormData({...formData, requestedDomain: formatted});
                                }}
                                className="custom-domain-input"
                            />
                        </div>
                        <div className="custom-domain-examples">
                            Examples: <code>yourbrand.com</code> or <code>yourbrand.com.ng</code>
                        </div>
                    </div>
                )}
            </div>
        </WizardStep>
    );

    if (step === 5) return (
        <WizardStep 
            title="Choose Your Theme"
            subtitle="Pick a color that represents your brand."
            nextLabel="Ready to Launch"
            onNext={handleSubmit}
            onBack={prevStep}
            loading={loading}
            error={error}
        >
            <div className="themes-grid">
                {THEMES.map(theme => (
                    <div 
                        key={theme.id}
                        className={`theme-card ${formData.selectedTheme === theme.id ? 'active' : ''}`}
                        onClick={() => handleThemeSelect(theme.id)}
                    >
                        <div className="theme-circle" style={{ background: theme.primary }}>
                            {formData.selectedTheme === theme.id && <Check size={16} color="#fff" />}
                        </div>
                        <span className="theme-name">{theme.name}</span>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: '10px' }}>
                <LivePreview formData={formData} />
            </div>
        </WizardStep>
    );

    // Final Success Step
    if (step === 100) return (
        <div className="onboarding-step success animate-scale-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: '36px'
            }}>
                🎉
            </div>

            <h1 className="wizard-title" style={{ fontSize: '26px', marginBottom: '8px', color: '#1e293b' }}>Website Created Successfully</h1>
            <p className="wizard-subtitle" style={{ fontSize: '15px', maxWidth: '380px', margin: '0 auto 32px auto', color: '#94a3b8' }}>
                Your website is ready.
            </p>
            
            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px', margin: '0 auto' }}>
                <a
                    href="https://bdpcitxadaygterabrqb.supabase.co/storage/v1/object/public/Reseller-app/WebsiteAdminPortal.apk?download="
                    download
                    className="auth-btn"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px', fontWeight: '700', background: '#3b82f6', color: '#fff' }}
                >
                    <span>📱</span> Download Your Website Admin Application
                </a>

                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 16px', lineHeight: '1.5' }}>
                    Manage your website from your Admin Portal. Download the app and sign in to manage your website.
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
    );

    return (
        <div className="auth-page onboarding-page">
            <div className="auth-card onboarding-card">
                {/* Fallback */}
                <WizardStep title="Error" subtitle="Something went wrong." onBack={() => setStep(1)} onNext={() => setStep(1)}>
                    <button onClick={() => setStep(1)}>Restart</button>
                </WizardStep>
            </div>
        </div>
    );
};

export default ResellerOnboarding;
