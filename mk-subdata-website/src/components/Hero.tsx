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
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              The #1 VTU SaaS Platform in Nigeria
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight"
            >
              Power Nigeria&apos;s <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Digital Business
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              Launch your own fully automated, branded VTU website in minutes. Sell Data, Airtime, Electricity, and Exam Pins with zero coding required. Own your domain, set your own prices, and keep 100% of your profits.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <Link href="/register">
                <button className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]">
                  Start Your Website <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link href="#demo">
                <button className="w-full sm:w-auto px-8 py-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-md">
                  <PlayCircle className="w-5 h-5" /> Watch Live Demo
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Right Visuals (Mockups & Cards) */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex-1 relative w-full h-[500px] lg:h-[600px] perspective-1000"
          >
            {/* Dashboard Mockup */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 left-10 lg:left-0 right-0 h-72 md:h-96 rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden z-10 rotate-y-[-10deg] rotate-x-[5deg]"
            >
              {/* Mockup Header */}
              <div className="h-8 border-b border-slate-800 flex items-center px-4 gap-2 bg-slate-900/50">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <div className="ml-4 w-32 h-2 bg-slate-800 rounded-full" />
              </div>
              {/* Mockup Body */}
              <div className="p-6 flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex-1 h-24 bg-gradient-to-br from-blue-900/30 to-blue-600/10 rounded-xl border border-blue-500/20 p-4">
                    <div className="w-8 h-8 rounded bg-blue-500/20 mb-3" />
                    <div className="w-16 h-2 bg-slate-700 rounded-full mb-2" />
                    <div className="w-24 h-4 bg-slate-300 rounded-full" />
                  </div>
                  <div className="flex-1 h-24 bg-gradient-to-br from-indigo-900/30 to-indigo-600/10 rounded-xl border border-indigo-500/20 p-4">
                    <div className="w-8 h-8 rounded bg-indigo-500/20 mb-3" />
                    <div className="w-16 h-2 bg-slate-700 rounded-full mb-2" />
                    <div className="w-24 h-4 bg-slate-300 rounded-full" />
                  </div>
                </div>
                <div className="w-full h-32 bg-slate-800/50 rounded-xl border border-slate-700/50" />
              </div>
            </motion.div>

            {/* Floating Service Card 1 */}
            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -right-4 top-32 lg:-right-8 p-4 bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-xl z-20 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">MTN Data Sold</p>
                <p className="text-xs text-slate-400">Just now • Auto-delivered</p>
              </div>
            </motion.div>

            {/* Floating Service Card 2 */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -left-4 bottom-20 lg:-left-12 p-4 bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-xl z-20 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Ikeja Electric Paid</p>
                <p className="text-xs text-slate-400">Success • ₦10,000</p>
              </div>
            </motion.div>

            {/* Mobile App Preview */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute right-10 -bottom-10 w-48 h-80 bg-slate-950 border-4 border-slate-800 rounded-[2rem] shadow-2xl z-10 overflow-hidden hidden md:block"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-800 rounded-b-2xl z-20" />
              <div className="p-4 pt-8 h-full bg-slate-900/50 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="w-16 h-4 bg-slate-800 rounded" />
                  <div className="w-8 h-8 bg-blue-600 rounded-full" />
                </div>
                <div className="w-full h-24 bg-blue-600/20 border border-blue-500/30 rounded-xl" />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="h-16 bg-slate-800 rounded-lg" />
                  <div className="h-16 bg-slate-800 rounded-lg" />
                  <div className="h-16 bg-slate-800 rounded-lg" />
                  <div className="h-16 bg-slate-800 rounded-lg" />
                </div>
              </div>
            </motion.div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
