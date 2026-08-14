'use client';

import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, Smartphone, Globe, Zap, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-screen flex items-center">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Left Text Content */}
          <div className="flex-1 text-center lg:text-left">
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight"
            >
              Own Your VTU Website & App in Just <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">5 Minutes</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-400 mb-6 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium"
            >
              Start your own branded digital services business with a 3-day free trial.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8"
            >
              <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-sm">
                3-Day Free Trial
              </div>
              <div className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm">
                ₦5,000 One-Time Activation Fee After Trial
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              className="text-slate-300 font-bold tracking-wide uppercase mb-8"
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
                <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]">
                  Start Your Free Trial <ArrowRight size={20} />
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Right Visuals (Mockups) */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex-1 relative w-full h-[400px] md:h-[500px] lg:h-[600px] perspective-1000 mt-10 lg:mt-0"
          >
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 left-0 lg:left-10 right-0 h-[350px] md:h-[450px] lg:h-[500px] rounded-3xl border-8 border-slate-800 bg-[#0F172A] shadow-2xl overflow-hidden z-10 rotate-y-[-5deg] rotate-x-[5deg]"
            >
              <img src="/dashboard_screenshot.png" alt="Platform Dashboard Preview" className="w-full h-full object-cover object-top" />
            </motion.div>

            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -left-2 md:-left-4 bottom-10 lg:-left-12 p-4 md:p-5 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-xl z-20 flex items-center gap-4"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Globe className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</p>
                <p className="text-base md:text-lg font-black text-white">Live & Selling</p>
              </div>
            </motion.div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
