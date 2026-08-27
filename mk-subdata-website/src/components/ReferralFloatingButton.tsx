'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, UserPlus, Wallet, Infinity as InfinityIcon, CheckCircle2 } from 'lucide-react';

/**
 * ReferralFloatingButton — homepage-only entry point into the existing
 * referral program. Purely informational: reuses the two-track terminology
 * and amounts already published in Referrals.tsx / ReferralCenter.jsx.
 * No API calls — the public site has no authenticated session to fetch
 * a real referral link/code from, so the CTA routes to /get-started like
 * every other CTA on this site.
 */
export default function ReferralFloatingButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="btn-gold fixed right-3 md:right-5 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 p-3 md:pl-3 md:pr-4 rounded-full shadow-lg"
        aria-label="Open referral program details"
      >
        <Gift className="w-5 h-5 shrink-0" />
        <span className="hidden md:inline text-xs font-bold leading-none whitespace-nowrap">
          Refer &amp; Earn
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[88vh] overflow-y-auto"
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 sm:p-8">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
                  <Gift className="w-6 h-6 text-amber-600" />
                </div>

                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                  Refer &amp; Earn
                </h3>
                <p className="text-slate-500 font-medium mb-6">
                  Share 9JASUB and earn two ways — no limit on how much you can make.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2 mb-1">
                      <UserPlus className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-900 text-sm">Refer a Website Owner</span>
                    </div>
                    <p className="text-sm text-slate-500">
                      When someone you refer creates their own VTU website and activates it for ₦5,000, you instantly receive{' '}
                      <span className="font-bold text-emerald-600">₦2,000</span> in your wallet.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-900 text-sm">Refer Retail Customers</span>
                    </div>
                    <p className="text-sm text-slate-500">
                      Earn <span className="font-bold text-emerald-600">15% of 9JASUB&apos;s platform profit</span> on every eligible purchase your referred customers make — not 15% of what they pay.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-purple-200 bg-purple-50">
                    <div className="flex items-center gap-2 mb-1">
                      <InfinityIcon className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-slate-900 text-sm">Lifetime Commission</span>
                    </div>
                    <p className="text-sm text-slate-500">
                      Commissions don&apos;t stop after registration — you keep earning for as long as your referrals stay active. Unlimited referrals, unlimited earning potential.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-slate-400 mb-6">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Your personal referral link and full earnings dashboard are available once you sign in to your 9JASUB account.</span>
                </div>

                <Link
                  href="/get-started"
                  onClick={() => setOpen(false)}
                  className="btn-primary w-full inline-flex px-6 py-4 rounded-2xl font-bold text-base items-center justify-center gap-2"
                >
                  Get Started &amp; Start Referring
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
