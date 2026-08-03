import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useBranding } from '../context/BrandingContext';

const PWAInstallPrompt = ({ deferredPrompt, setDeferredPrompt }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const siteInfo = useBranding() || {};

  useEffect(() => {
    // Only show if we have a prompt and haven't dismissed it this session
    if (deferredPrompt && !sessionStorage.getItem('pwa_prompt_dismissed')) {
      // Delay showing it so it's not too aggressive
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt]);

  useEffect(() => {
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
      window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: "App installed successfully!", type: "success" } }));
    };
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, [setDeferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else {
      console.log('User dismissed the install prompt');
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  const appName = siteInfo?.branding?.siteName || "Our App";
  const primaryColor = siteInfo?.branding?.primaryColor || "#3b82f6";
  const logoUrl = siteInfo?.branding?.logo;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 99999,
      width: 'calc(100% - 48px)',
      maxWidth: '400px',
      animation: 'fadeInUp 0.5s ease-out'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        borderRadius: '24px',
        padding: '20px',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        {logoUrl ? (
          <img src={logoUrl} alt={appName} style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'contain', background: '#f8fafc', border: '1px solid #e2e8f0' }} />
        ) : (
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
            {appName.charAt(0)}
          </div>
        )}
        
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Install {appName}</h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.4 }}>Add to home screen for quick access & offline support.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={handleDismiss} style={{ background: 'transparent', border: 'none', position: 'absolute', top: '8px', right: '8px', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
            <X size={16} />
          </button>
          <button 
            onClick={handleInstall} 
            style={{ 
              background: primaryColor, 
              color: 'white', 
              border: 'none', 
              padding: '10px 16px', 
              borderRadius: '12px', 
              fontWeight: '600', 
              fontSize: '14px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <Download size={16} /> Install
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
};

export default PWAInstallPrompt;
