'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Zap, ShieldCheck, Star, Headphones } from 'lucide-react';
import Link from 'next/link';

const trustBadges = [
  { icon: ShieldCheck, line1: "100% Secure", line2: "Transactions" },
  { icon: Zap, line1: "Instant", line2: "Delivery" },
  { icon: Star, line1: "Trusted by", line2: "Thousands" },
  { icon: Headphones, line1: "24/7 Customer", line2: "Support" },
];

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden min-h-screen flex items-center bg-white">
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
              NIN & BVN enrollment, modification and verification &bull; Buy cable &bull; Pay exam fees &bull; Pay your bills &bull; Airtime & more with 9JASUB.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <Link href="/services" className="w-full sm:w-auto">
                <button className="btn-primary w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3">
                  Explore Our Services <ArrowRight size={20} />
                </button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-slate-100"
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
