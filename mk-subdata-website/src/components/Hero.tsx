'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Globe } from 'lucide-react';
import Link from 'next/link';

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
              Own Your VTU Website & App in Just <span className="gradient-text">5 Minutes</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-500 mb-6 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium"
            >
              Start your own branded digital services business with a 3-day free trial. After your 3-day trial, pay just ₦5,000 one-time activation fee to keep your website live and continue selling.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8"
            >
              <div className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm">
                3-Day Free Trial
              </div>
              <div className="px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-bold text-sm">
                ₦5,000 One-Time Activation Fee After Trial
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              className="text-slate-500 font-bold tracking-wide uppercase mb-8"
            >
              YOUR WEBSITE &nbsp;•&nbsp; YOUR BRAND &nbsp;•&nbsp; YOUR BUSINESS
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <Link href="/get-started" className="w-full sm:w-auto">
                <button className="btn-primary w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3">
                  Start Your Free Trial <ArrowRight size={20} />
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Right Visuals (Real team photo + product mockup) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] lg:flex-1 mt-10 lg:mt-0"
          >
            <div className="absolute top-0 left-0 lg:left-6 right-0 h-[340px] md:h-[430px] lg:h-[480px] rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-300/60 border border-slate-200">
              <img src="/nigeria_team.png" alt="9JASUB business owners at work" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
            </div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-0 right-0 lg:-right-6 w-[190px] md:w-[230px] rounded-[1.75rem] border-4 border-white bg-white shadow-2xl shadow-slate-400/40 overflow-hidden z-10"
            >
              <img src="/vtu_home_screenshot.png" alt="9JASUB App Preview" className="w-full h-auto object-cover object-top" />
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -left-2 md:-left-4 bottom-6 lg:-left-8 p-4 md:p-5 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl z-20 flex items-center gap-4"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Globe className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</p>
                <p className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live & Selling
                </p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
