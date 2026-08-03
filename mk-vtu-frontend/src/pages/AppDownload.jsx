import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Smartphone, Download, CheckCircle, Shield, Share2, Rocket, ArrowRight } from 'lucide-react';
import API from '../api';

const AppDownload = () => {
    const [reseller, setReseller] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSiteInfo();
    }, []);

    const fetchSiteInfo = async () => {
        try {
            const res = await API.get('/api/site-info');
            setReseller(res.data.reseller);
        } catch (err) {
            console.error("Failed to fetch site info:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <div className="animate-pulse" style={{ width: '60px', height: '60px', background: '#3b82f6', borderRadius: '50%' }}></div>
            </div>
        );
    }

    const appName = reseller?.branding?.siteName || "Mobile App";
    const appLogo = reseller?.branding?.logo;
    const primaryColor = reseller?.branding?.primaryColor || "#3b82f6";
    const appSettings = reseller?.appSettings || {};
    const assets = appSettings?.generatedAssets || {};

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
            {/* Hero Section */}
            <div style={{ background: primaryColor, color: 'white', padding: '80px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                
                <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '100px', height: '100px', background: 'white', borderRadius: '24px', margin: '0 auto 24px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
                        {appLogo ? <img src={appLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Smartphone size={50} color={primaryColor} />}
                    </div>
                    <h1 style={{ fontSize: '46.2px', fontWeight: 900, marginBottom: '16px' }}>Download {appName} App</h1>
                    <p style={{ fontSize: '22.0px', opacity: 0.9, maxWidth: '600px', margin: '0 auto 32px' }}>
                        Experience fast, secure, and reliable VTU services right from your Android device.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {assets?.apkUrl ? (
                            <a 
                                href={assets.apkUrl} 
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ background: 'white', color: primaryColor, padding: '18px 36px', borderRadius: '16px', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            >
                                <Download size={24} /> Get APK for Android
                            </a>
                        ) : (
                            <button 
                                disabled
                                style={{ background: 'white', opacity: 0.6, cursor: 'not-allowed', color: primaryColor, padding: '18px 36px', borderRadius: '16px', fontWeight: 800, border: 'none', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            >
                                <Download size={24} /> APK Not Yet Available
                            </button>
                        )}
                        
                        <button 
                            onClick={async () => {
                                const promptEvent = window.deferredPrompt;
                                if (promptEvent) {
                                    promptEvent.prompt();
                                    const { outcome } = await promptEvent.userChoice;
                                    if (outcome === 'accepted') {
                                        window.deferredPrompt = null;
                                        window.dispatchEvent(new Event('appinstalled'));
                                    }
                                } else {
                                    window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: "App is already installed or your browser does not support it.", type: "info" } }));
                                }
                            }}
                            style={{ background: 'transparent', border: '2px solid white', color: 'white', padding: '18px 36px', borderRadius: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        >
                            <Smartphone size={24} /> Install Web App
                        </button>
                    </div>
                </div>
            </div>

            {/* Features / Mockups */}
            <div style={{ maxWidth: '1200px', margin: '-40px auto 80px', padding: '0 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                        <div style={{ width: '48px', height: '48px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                            <Shield size={24} color="#3b82f6" />
                        </div>
                        <h3 style={{ fontSize: '22.0px', fontWeight: 800, marginBottom: '12px' }}>Safe & Secure</h3>
                        <p style={{ color: '#64748b', lineHeight: '1.6' }}>All transactions are encrypted and secured. Your data is always safe with us.</p>
                    </div>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                        <div style={{ width: '48px', height: '48px', background: '#ecfdf5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                            <Rocket size={24} color="#10b981" />
                        </div>
                        <h3 style={{ fontSize: '22.0px', fontWeight: 800, marginBottom: '12px' }}>Lightning Fast</h3>
                        <p style={{ color: '#64748b', lineHeight: '1.6' }}>Instant delivery of data, airtime, and bill payments. No delays, no stress.</p>
                    </div>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                        <div style={{ width: '48px', height: '48px', background: '#fffbeb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                            <CheckCircle size={24} color="#f59e0b" />
                        </div>
                        <h3 style={{ fontSize: '22.0px', fontWeight: 800, marginBottom: '12px' }}>User Friendly</h3>
                        <p style={{ color: '#64748b', lineHeight: '1.6' }}>A clean, intuitive interface designed for the best user experience.</p>
                    </div>
                </div>
            </div>

            {/* Screenshots Section */}
            {assets?.screenshots?.length > 0 && (
                <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '35.2px', fontWeight: 900, marginBottom: '48px' }}>App Sneak Peek</h2>
                    <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', justifyContent: 'center' }}>
                        {assets.screenshots.map((ss, idx) => (
                            <img 
                                key={idx} 
                                src={ss} 
                                alt={`Screenshot ${idx}`} 
                                style={{ height: '500px', borderRadius: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '8px solid #1e293b' }} 
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer style={{ padding: '60px 20px', textAlign: 'center', borderTop: '1px solid #e2e8f0', color: '#64748b' }}>
                <p style={{ fontWeight: 700, marginBottom: '8px' }}>&copy; {new Date().getFullYear()} {appName}</p>
                {(!reseller || reseller.role === 'admin') && <p style={{ fontSize: '15.4px' }}>Powered by MK GLOBAL INVESTMENT LTD.</p>}
            </footer>
        </div>
    );
};

export default AppDownload;
