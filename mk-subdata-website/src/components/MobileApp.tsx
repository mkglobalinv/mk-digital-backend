'use client';

import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

export default function MobileApp() {
  return (
    <section className="py-24 overflow-hidden relative border-y border-slate-800 bg-slate-950">
      {/* Background Glow */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center gap-12 relative z-10">
        <div className="md:w-1/2 space-y-8 text-white">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black tracking-tight leading-tight"
          >
            Download 9JASUB Mobile App
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-400 font-medium leading-relaxed"
          >
            Access your business anywhere and anytime. Buy data, track sales, and manage your wallet on the go.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <a href="#" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <Play className="fill-current w-5 h-5" /> Google Play
            </a>
            <button disabled className="px-8 py-4 bg-slate-900 text-slate-500 rounded-2xl font-bold flex items-center justify-center gap-3 cursor-not-allowed border border-slate-800">
              App Store (Coming Soon)
            </button>
          </motion.div>
        </div>
        
        <div className="md:w-1/2 flex justify-center perspective-1000">
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="w-64 h-[500px] bg-[#0F172A] rounded-[3rem] border-8 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col transform rotate-y-[-10deg] rotate-x-[5deg]"
          >
            <div className="absolute top-0 w-full h-6 bg-slate-800 rounded-t-2xl flex justify-center items-center z-20">
              <div className="w-16 h-4 bg-black rounded-b-xl"></div>
            </div>
            <div className="flex-1 bg-[#1E293B] mt-6 relative overflow-hidden">
              <img src="/vtu_home_screenshot.png" alt="9JASUB Mobile App" className="w-full h-full object-contain object-top" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
