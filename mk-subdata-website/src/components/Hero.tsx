'use client';

import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, Smartphone, Globe, Zap } from 'lucide-react';
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-black tracking-widest uppercase mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Premium Fintech Platform
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight"
            >
              Own Your Own VTU Website & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Mobile App
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-400 mb-6 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium"
            >
              Start your own branded digital business in minutes. Your Brand. Your Website. Your Customers. Your Dashboard. Your Income. No coding required. Start free or launch your business for just ₦5,000.
            </motion.p>
            
            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="grid sm:grid-cols-2 gap-4 mb-8 text-left max-w-2xl mx-auto lg:mx-0"
            >
              {[
                "Your Own Brand", "Your Own Mobile App", "Your Own Website", 
                "Automated Delivery", "Your Own Admin Dashboard", "Technical Support"
              ].map((benefit, i) => (
                <li key={i} className="flex items-center gap-3 font-bold text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  {benefit}
                </li>
              ))}
            </motion.ul>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <Link href="/get-started">
                <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]">
                  💼 Launch My Business
                </button>
              </Link>
              <Link href="/get-started">
                <button className="w-full sm:w-auto px-8 py-4 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-white rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-md">
                  🚀 Start Free
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Right Visuals (Mockups & Cards) */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex-1 relative w-full h-[500px] lg:h-[600px] perspective-1000 mt-10 lg:mt-0"
          >
            {/* Dashboard Screenshot */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 left-0 lg:left-10 right-0 h-[400px] md:h-[500px] rounded-3xl border-8 border-slate-800 bg-[#0F172A] shadow-2xl overflow-hidden z-10 rotate-y-[-5deg] rotate-x-[5deg]"
            >
              <img src="/dashboard_screenshot.png" alt="9JASUB Dashboard" className="w-full h-full object-contain object-top" />
            </motion.div>

            {/* Live & Selling Badge */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -left-4 bottom-20 lg:-left-12 p-5 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-xl z-20 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</p>
                <p className="text-lg font-black text-white">Live & Selling</p>
              </div>
            </motion.div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
