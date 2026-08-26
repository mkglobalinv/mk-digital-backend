import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { useBranding } from '../context/BrandingContext';

// Safari on iOS never fires beforeinstallprompt (no native install API at all), so it
// needs its own "how to" card instead of an Install button that would never appear.
const isIosSafari = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIos && isSafari;
};

const isAlreadyInstalled = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator?.standalone === true;
};

const PWAInstallPrompt = ({ deferredPrompt, setDeferredPrompt, hasBottomNav }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const siteInfo = useBranding() || {};

  useEffect(() => {
    if (isAlreadyInstalled()) return;

    // Only show if we have a prompt and haven't dismissed it this session
    if (deferredPrompt && !sessionStorage.getItem('pwa_prompt_dismissed')) {
      // Delay showing it so it's not too aggressive
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // iOS Safari never fires beforeinstallprompt -- show manual instructions instead,
    // once, so those users still have a path to install the reseller's PWA.
    if (!deferredPrompt && isIosSafari() && !sessionStorage.getItem('pwa_ios_prompt_dismissed')) {
      const timer = setTimeout(() => setShowIosInstructions(true), 3000);
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

  const handleDismissIos = () => {
    sessionStorage.setItem('pwa_ios_prompt_dismissed', 'true');
    setShowIosInstructions(false);
  };

  if (!showPrompt && !showIosInstructions) return null;

  const appName = siteInfo?.branding?.siteName || "Our App";
  const primaryColor = siteInfo?.branding?.primaryColor || "#3b82f6";
  const logoUrl = siteInfo?.branding?.logo;

  return (
    <div style={{
      position: 'fixed',
      bottom: hasBottomNav ? 'calc(env(safe-area-inset-bottom, 16px) + 85px)' : 'calc(env(safe-area-inset-bottom, 16px) + 24px)',
      left: '24px',
      right: '24px',
      margin: '0 auto',
      zIndex: 99999,
      maxWidth: '400px',
      animation: 'fadeInUp 0.5s ease-out'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        borderRadius: '16px',
        padding: '12px 14px',
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        {logoUrl ? (
          <img src={logoUrl} alt={appName} style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain', background: '#f8fafc', border: '1px solid #e2e8f0', flexShrink: 0 }} />
        ) : (
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
            {appName.charAt(0)}
          </div>
        )}
        
        <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
          <h4 style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Install {appName}</h4>
          <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: showIosInstructions ? 1.4 : 1.2, whiteSpace: showIosInstructions ? 'normal' : 'nowrap', overflow: showIosInstructions ? 'visible' : 'hidden', textOverflow: 'ellipsis' }}>
            {showIosInstructions
              ? <>Tap <Share size={11} style={{ verticalAlign: 'middle' }} /> Share, then "Add to Home Screen".</>
              : 'Add to home screen for offline support.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {!showIosInstructions && (
            <button
              onClick={handleInstall}
              style={{
                background: primaryColor,
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Download size={14} /> Install
            </button>
          )}
          <button onClick={showIosInstructions ? handleDismissIos : handleDismiss} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', cursor: 'pointer', color: '#64748b', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default PWAInstallPrompt;
