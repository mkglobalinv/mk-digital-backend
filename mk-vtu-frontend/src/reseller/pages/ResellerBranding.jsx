import React, { useState, useEffect, useRef } from 'react';
import { Globe, Palette, Save, Layout, Smartphone, Loader2 } from 'lucide-react';
import API from '../../api';
import { useToast } from '../components/ResellerToast';
import './Reseller.css';

const ResellerBranding = ({ user, refreshUser, refreshBranding }) => {
    const [settings, setSettings] = useState({
        siteName: '',
        primaryColor: '#3b82f6',
        secondaryColor: '#10b981',
        backgroundColor: '#f8fafc',
        balanceCardColor: '#1e293b',
        logo: '',
        footerText: '',
        whatsappNumber: '',
        supportAvailability: '',
        telegramLink: '',
        contactEmail: '',
        subdomain: '',
        customDomain: '',
        activatedManualServices: []
    });
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const isSavingRef = useRef(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchBranding();
    }, [user?._id]);

    const fetchBranding = async () => {
        if (!user?._id) return;
        try {
            // Use the reseller's ID specifically to avoid host-detection issues on main domain
            const res = await API.get(`/api/site-info?resellerId=${user._id}`);
            if (res.data.reseller) {
                const r = res.data.reseller;
                const b = r.branding || {};
                setSettings({
                    siteName: b.siteName || '',
                    primaryColor: b.primaryColor || '#3b82f6',
                    secondaryColor: b.secondaryColor || '#10b981',
                    backgroundColor: b.backgroundColor || '#f8fafc',
                    balanceCardColor: b.balanceCardColor || '#1e293b',
                    logo: b.logo || '',
                    footerText: b.footerText || '',
                    whatsappNumber: b.whatsappNumber || '',
                    supportAvailability: b.supportAvailability || 'Mon-Fri 9AM-5PM',
                    telegramLink: b.telegramLink || '',
                    contactEmail: b.contactEmail || '',
                    subdomain: r.subdomain || '',
                    customDomain: r.customDomain || '',
                    activatedManualServices: r.activatedManualServices || []
                });
            }
        } catch (err) {
            console.error("Failed to fetch branding", err);
            toast.error('Failed to fetch current branding settings');
        }
    };

    // Live update the CSS variable for real-time preview
    const updateColor = (key, color, cssVar) => {
        setSettings({...settings, [key]: color});
        if (cssVar) {
            document.documentElement.style.setProperty(cssVar, color);
            if (cssVar === '--primary') {
                document.documentElement.style.setProperty('--primary-light', color.startsWith('#') ? color + '22' : 'rgba(59, 130, 246, 0.15)');
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (isSavingRef.current) return;
        
        setLoading(true);
        isSavingRef.current = true;
        const toastId = toast.loading('Saving branding settings...');
        
        try {
            await API.post('/api/reseller/branding', {
                branding: {
                    siteName: settings.siteName,
                    primaryColor: settings.primaryColor,
                    secondaryColor: settings.secondaryColor,
                    backgroundColor: settings.backgroundColor,
                    balanceCardColor: settings.balanceCardColor,
                    logo: settings.logo,
                    footerText: settings.footerText,
                    whatsappNumber: settings.whatsappNumber,
                    supportAvailability: settings.supportAvailability,
                    telegramLink: settings.telegramLink,
                    contactEmail: settings.contactEmail
                }
            });
            toast.success('Branding updated successfully!', { id: toastId });
            
            // Refresh both global user info and branding info
            if (refreshUser) await refreshUser();
            if (refreshBranding) await refreshBranding();
            
        } catch (err) {
            toast.error('Failed to update branding settings', { id: toastId });
        } finally {
            setLoading(false);
            isSavingRef.current = false;
        }
    };

    const handleToggleService = async (serviceType, enabled) => {
        try {
            const res = await API.post('/api/reseller/manual-services/toggle', { serviceType, enabled });
            if (res.data.status === 'success') {
                setSettings({...settings, activatedManualServices: res.data.data.activatedManualServices});
                
                const serviceNames = {
                    'nin_modification': 'NIN Modification',
                    'bvn_modification': 'BVN Modification',
                    'cac_registration': 'CAC Registration',
                    'birth_attestation': 'Birth Attestation Letter',
                    'court_affidavit': 'Court Affidavit'
                };
                const name = serviceNames[serviceType] || 'Service';
                const action = enabled ? 'added to' : 'removed from';
                toast.success(`${name} ${action} your website.`);
            }
        } catch (err) {
            toast.error('Failed to toggle service');
        }
    };

    return (
        <div className="reseller-container">
            <header className="reseller-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1>Website Customization</h1>
                    <p>Personalize your VTU platform branding and colors</p>
                </div>
                <a 
                    href={settings.customDomain ? `https://${settings.customDomain}` : `https://${settings.subdomain || 'my'}.9jasub.com`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="tracker-step done"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', transition: 'background-color 0.3s, color 0.3s' }}
                >
                    <Globe size={18} /> View Live Website
                </a>
            </header>

            <form onSubmit={handleSave} className="reseller-form-card">
                <fieldset disabled={loading} style={{ border: 'none', padding: 0, margin: 0 }}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Website Name</label>
                            <input 
                                type="text" 
                                value={settings.siteName} 
                                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                                placeholder="e.g. My VTU Hub"
                            />
                        </div>

                        <div className="form-group">
                            <label>Primary Color</label>
                            <div className="color-picker-wrapper">
                                <input 
                                    type="color" 
                                    value={settings.primaryColor} 
                                    onChange={(e) => updateColor('primaryColor', e.target.value, '--primary')}
                                />
                                <span>{settings.primaryColor}</span>
                            </div>
                            <small style={{ color: '#64748b' }}>Changes preview instantly</small>
                        </div>

                        <div className="form-group">
                            <label>Secondary Color</label>
                            <div className="color-picker-wrapper">
                                <input 
                                    type="color" 
                                    value={settings.secondaryColor} 
                                    onChange={(e) => setSettings({...settings, secondaryColor: e.target.value})}
                                />
                                <span>{settings.secondaryColor}</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Background Color</label>
                            <div className="color-picker-wrapper">
                                <input 
                                    type="color" 
                                    value={settings.backgroundColor} 
                                    onChange={(e) => updateColor('backgroundColor', e.target.value, '--bg-color')}
                                />
                                <span>{settings.backgroundColor}</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Balance Card Color</label>
                            <div className="color-picker-wrapper">
                                <input 
                                    type="color" 
                                    value={settings.balanceCardColor} 
                                    onChange={(e) => updateColor('balanceCardColor', e.target.value, '--balance-card-bg')}
                                />
                                <span>{settings.balanceCardColor}</span>
                            </div>
                        </div>

                        <div className="form-group full-width" style={{ marginBottom: '20px' }}>
                            <label>Brand Logo</label>
                            <div className="logo-upload-section" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                                <div className="logo-preview-box" style={{ 
                                    width: '120px', height: '120px', borderRadius: '16px', 
                                    background: '#f8fafc', border: '2px dashed #cbd5e1',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden', position: 'relative'
                                }}>
                                    {settings.logo ? (
                                        <img src={settings.logo} alt="Brand Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <Layout size={40} color="#94a3b8" />
                                    )}
                                </div>
                                
                                <div className="upload-controls" style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                        <button 
                                            type="button"
                                            className="tracker-step done"
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: '10px', transition: 'background-color 0.3s, color 0.3s' }}
                                        >
                                            Upload New Logo
                                        </button>
                                        {settings.logo && (
                                            <button 
                                                type="button" 
                                                className="tracker-step" 
                                                onClick={() => setSettings({...settings, logo: ''})}
                                                style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: '10px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent' }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <input 
                                        id="logo-upload-input"
                                        ref={fileInputRef}
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                if (file.size > 200 * 1024) {
                                                    toast.error("Logo too large. Max size 200KB");
                                                    return;
                                                }
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setSettings({...settings, logo: reader.result});
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        style={{ display: 'none' }}
                                    />
                                    <p style={{ fontSize: '13.2px', color: '#64748b', margin: '8px 0 0' }}>
                                        Recommended: PNG or SVG with transparent background. Max 200KB.
                                    </p>
                                    
                                    <div style={{ marginTop: '20px' }}>
                                        <label style={{ fontSize: '14.3px', color: '#64748b', marginBottom: '8px', display: 'block' }}>Or use an external image URL</label>
                                        <input 
                                            type="text" 
                                            value={settings.logo?.startsWith('data:') ? '' : settings.logo} 
                                            onChange={(e) => setSettings({...settings, logo: e.target.value})}
                                            placeholder="https://..."
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>WhatsApp Support Number</label>
                            <input 
                                type="text" 
                                value={settings.whatsappNumber} 
                                onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})}
                                placeholder="234..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Support Availability Hours</label>
                            <input 
                                type="text" 
                                value={settings.supportAvailability} 
                                onChange={(e) => setSettings({...settings, supportAvailability: e.target.value})}
                                placeholder="e.g. Mon-Fri 9AM-5PM"
                            />
                        </div>

                        <div className="form-group">
                            <label>Telegram Link</label>
                            <input 
                                type="text" 
                                value={settings.telegramLink} 
                                onChange={(e) => setSettings({...settings, telegramLink: e.target.value})}
                                placeholder="https://t.me/..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Support Email</label>
                            <input 
                                type="email" 
                                value={settings.contactEmail} 
                                onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                                placeholder="support@yourbrand.com"
                            />
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label>Footer Text</label>
                        <textarea 
                            value={settings.footerText} 
                            onChange={(e) => setSettings({...settings, footerText: e.target.value})}
                            placeholder="Copyright text or tagline..."
                        />
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        {loading ? 'Saving Changes...' : 'Save Branding Changes'}
                    </button>
                    
                    <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: '24px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-dark)' }}>Add More Services</h2>
                        <p style={{ color: 'var(--text-gray, #64748b)', fontSize: '14px', marginBottom: '12px' }}>
                            Optional manual services you can add to your website. Earn when your customer's application is successfully completed.
                        </p>
                        
                        <div style={{ 
                            background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', 
                            padding: '12px', marginBottom: '24px', fontSize: '13px', color: '#1e3a8a' 
                        }}>
                            <strong>Note:</strong> You earn the commission only after your customer's application is successfully completed. Adding a service to your website does not generate a commission.
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                            {[
                                { 
                                    id: 'nin_modification', 
                                    title: 'NIN Modification',
                                    description: 'Help customers modify their NIN details.',
                                    earning: 'Earn ₦100 for each successfully completed service'
                                },
                                { 
                                    id: 'bvn_modification', 
                                    title: 'BVN Modification',
                                    description: 'Assist customers with BVN updates.',
                                    earning: 'Earn ₦100 for each successfully completed service'
                                },
                                {
                                    id: 'cac_registration',
                                    title: 'CAC Registration',
                                    description: 'Register businesses for your customers.',
                                    earning: 'Earn ₦500 for each successfully completed registration'
                                },
                                {
                                    id: 'birth_attestation',
                                    title: 'Birth Attestation Letter',
                                    description: 'Help customers request a Birth Attestation Letter.',
                                    earning: 'Earn ₦500 for each successfully completed request'
                                },
                                {
                                    id: 'court_affidavit',
                                    title: 'Court Affidavit',
                                    description: 'Help customers prepare a Court Affidavit.',
                                    earning: 'Earn ₦200 for each successfully completed request'
                                }
                            ].map(service => {
                                const isActive = settings.activatedManualServices?.includes(service.id);
                                return (
                                    <div key={service.id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', background: 'var(--bg-color, #f8fafc)', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0', color: 'var(--text-dark)' }}>{service.title}</h3>
                                                <span style={{
                                                    fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '600',
                                                    background: isActive ? '#d1fae5' : '#f1f5f9',
                                                    color: isActive ? '#059669' : '#64748b'
                                                }}>
                                                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '13px', color: 'var(--text-gray, #64748b)', margin: '0 0 12px' }}>{service.description}</p>
                                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#059669', background: '#ecfdf5', padding: '8px', borderRadius: '6px', display: 'inline-block' }}>
                                                {service.earning}
                                            </div>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => handleToggleService(service.id, !isActive)}
                                            style={{ 
                                                padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
                                                background: isActive ? '#fef2f2' : '#3b82f6',
                                                color: isActive ? '#ef4444' : '#ffffff',
                                                border: isActive ? '1px solid #fca5a5' : 'none',
                                                width: '100%', transition: 'all 0.2s', marginTop: 'auto'
                                            }}
                                        >
                                            {isActive ? 'Remove from My Website' : 'Add to My Website'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </fieldset>
            </form>
        </div>
    );
};


export default ResellerBranding;
