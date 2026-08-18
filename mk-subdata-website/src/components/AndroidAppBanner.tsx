'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, X, Download } from 'lucide-react';
import { APP_CONFIG } from '@/lib/appConfig';

/**
 * AndroidAppBanner — A compact, non-intrusive Android app download prompt.
 *
 * Behaviour:
 * - Android devices: Shows a sticky bottom banner after 3s. Can be dismissed.
 * - Non-Android: Does not render at all (no APK prompt on iPhone/desktop).
 * - Future Play Store: Just update NEXT_PUBLIC_APP_DOWNLOAD_URL and NEXT_PUBLIC_APP_STORE_TYPE.
 *
 * Dismissed state is persisted in localStorage for 7 days.
 */
export default function AndroidAppBanner() {
  const [visible, setVisible] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect Android user agent
    const ua = navigator.userAgent || '';
    const android = /android/i.test(ua);
    setIsAndroid(android);

    if (!android) return;

    // Check if dismissed within the last 7 days
    const dismissed = localStorage.getItem('jasub_app_banner_dismissed');
    if (dismissed) {
      const ts = parseInt(dismissed, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - ts < sevenDays) return;
    }

    // Show after 3 seconds
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem('jasub_app_banner_dismissed', String(Date.now()));
    setVisible(false);
  };

  const handleDownload = () => {
    // Direct APK download — browser will prompt to save/open
    window.location.href = APP_CONFIG.APP_DOWNLOAD_URL;
  };

  // Only render anything on Android
  if (!isAndroid) return null;

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
          aria-label="Download 9JASUB Android App"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 p-4 flex items-center gap-3">
            {/* Icon */}
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Get the 9JASUB App</p>
              <p className="text-slate-400 text-xs leading-tight mt-0.5 truncate">
                Access your account faster on Android
              </p>
            </div>

            {/* Download button */}
            <button
              id="android-app-download-btn"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
              aria-label="Download 9JASUB APK"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>

            {/* Dismiss */}
            <button
              onClick={dismiss}
              className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
              aria-label="Dismiss app download banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
