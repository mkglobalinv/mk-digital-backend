'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, Headphones, ShieldCheck, Star, User, Zap } from 'lucide-react';
import { trackMetaEvent } from '@/lib/metaPixel';

const trustBadges = [
  { icon: ShieldCheck, line1: "100% Secure", line2: "Transactions" },
  { icon: Zap, line1: "Instant", line2: "Delivery" },
  { icon: Star, line1: "Trusted by", line2: "Thousands" },
  { icon: Headphones, line1: "24/7 Customer", line2: "Support" },
];

export default function Hero() {
  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 overflow-hidden bg-white">
      {/* Soft ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-200/60 rounded-full glow-soft pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-100/70 rounded-full glow-soft pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Left Text Content */}
          <div className="flex-1 text-center lg:text-left">

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]"
            >
              Cheap & Lasting <span className="gradient-text">Data, NIN, BVN</span> & More
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-500 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium"
            >
              NIN & BVN enrollment, modification and verification &bull; Buy cable &bull; Pay exam fees &bull; Pay your bills &bull; Airtime &bull; CAC Reg, Court Affidavit & more with 9JASUB.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid grid-cols-2 gap-2.5 sm:gap-4 max-w-xl mx-auto lg:mx-0"
            >
              <button
                type="button"
                onClick={() => {
                  trackMetaEvent('Lead', { content_name: 'Personal Account' });
                  window.location.assign('/onboarding');
                }}
                className="group text-left w-full min-w-0 bg-white border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 rounded-xl sm:rounded-2xl p-3 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                  <User size={16} className="sm:hidden" />
                  <User size={22} className="hidden sm:block" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-xs sm:text-lg mb-1 sm:mb-1.5 leading-tight">Personal Account</h3>
                <p className="hidden sm:block text-sm text-slate-500 font-medium leading-snug mb-5">
                  Buy data, airtime, pay bills and access all 9JASUB services.
                </p>
                <span className="btn-primary inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10.5px] sm:text-sm leading-tight w-full sm:w-auto justify-center">
                  <span className="sm:hidden">Buy Data & More</span>
                  <span className="hidden sm:inline">Buy Data, Airtime & More</span>
                  <ArrowRight size={14} className="sm:hidden shrink-0" />
                  <ArrowRight size={16} className="hidden sm:block shrink-0" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  trackMetaEvent('Lead', { content_name: 'Own Your VTU Website & App' });
                  window.location.assign('/business/signup');
                }}
                className="group relative text-left w-full min-w-0 bg-slate-900 border-2 border-slate-900 hover:bg-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/15 rounded-full glow-soft pointer-events-none group-hover:bg-emerald-500/25 transition-colors" />
                <div className="relative w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/10 text-white flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                  <Briefcase size={16} className="sm:hidden" />
                  <Briefcase size={22} className="hidden sm:block" />
                </div>
                <h3 className="relative font-extrabold text-white text-xs sm:text-lg mb-1 sm:mb-1.5 leading-tight">VTU Website Creator</h3>
                <p className="hidden sm:block relative text-sm text-slate-300 font-medium leading-snug mb-5">
                  Create your own branded VTU website and start selling online.
                </p>
                <span className="relative inline-flex items-center gap-1 sm:gap-2 bg-white text-slate-900 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10.5px] sm:text-sm font-bold leading-tight w-full sm:w-auto justify-center">
                  <span className="sm:hidden">Create Website</span>
                  <span className="hidden sm:inline">Create Your Own VTU Website</span>
                  <ArrowRight size={14} className="sm:hidden shrink-0" />
                  <ArrowRight size={16} className="hidden sm:block shrink-0" />
                </span>
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100"
            >
              {trustBadges.map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2 justify-center lg:justify-start">
                  <badge.icon className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-xs font-bold text-slate-600 leading-tight text-left">
                    {badge.line1}<br />{badge.line2}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Visual (provided hero photo + app mockup) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="relative w-full lg:flex-1 mt-10 lg:mt-0"
          >
            <img
              src="/hero_banner_photo.png"
              alt="9JASUB customers using the app on their phones"
              className="w-full h-auto"
            />

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-2 md:-left-4 bottom-4 lg:-left-8 p-4 md:p-5 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl z-20 flex items-center gap-4"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Zap className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Delivery</p>
                <p className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Instant & Secure
                </p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
