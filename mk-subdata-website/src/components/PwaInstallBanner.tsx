'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, X, Download } from 'lucide-react';

/**
 * PwaInstallBanner — sticky bottom prompt to install the 9JASUB PWA.
 *
 * Replaces the old direct-APK-download banner: instead of shipping a
 * separate .apk, this triggers the browser's native install flow
 * (beforeinstallprompt) for the same PWA the VTU app itself installs from
 * (public/manifest.json + sw.js, served for this domain too -- see
 * server.js). Only ever shows once the browser has actually fired that
 * event, so there's never a button that does nothing; never shows if the
 * app is already installed.
 *
 * Dismissed state is persisted in localStorage for 7 days.
 */
export default function PwaInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.error('SW Registration Failed:', err));
    }

    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      (navigator as any).standalone === true;
    if (isStandalone) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      const dismissed = localStorage.getItem('jasub_app_banner_dismissed');
      if (dismissed) {
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - parseInt(dismissed, 10) < sevenDays) return;
      }
      setTimeout(() => setVisible(true), 3000);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem('jasub_app_banner_dismissed', String(Date.now()));
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setVisible(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:hidden"
          role="banner"
          aria-label="Install the 9JASUB App"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 p-4 flex items-center gap-3">
            {/* Icon */}
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Install the 9JASUB App</p>
              <p className="text-slate-400 text-xs leading-tight mt-0.5 truncate">
                Add to your home screen for instant access
              </p>
            </div>

            {/* Install button */}
            <button
              id="pwa-install-btn"
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
              aria-label="Install the 9JASUB App"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>

            {/* Dismiss */}
            <button
              onClick={dismiss}
              className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
              aria-label="Dismiss install banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
