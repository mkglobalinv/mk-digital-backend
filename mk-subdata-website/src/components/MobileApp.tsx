'use client';

import { motion } from 'framer-motion';
import { Smartphone, Download, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function MobileApp() {
  return (
    <section className="py-24 overflow-hidden relative border-y border-slate-800 bg-slate-950">
      {/* Background Glow */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center gap-12 relative z-10">
        <div className="md:w-1/2 space-y-8 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-sm tracking-wide"
          >
            <Smartphone size={16} /> Optional Upgrade
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black tracking-tight leading-tight"
          >
            Take Your Business to Mobile
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-400 font-medium leading-relaxed"
          >
            Premium website owners can request their own branded Android app. Give your customers a dedicated mobile experience with your own logo and brand identity.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="pt-4"
          >
            <Link href="/get-started" className="inline-flex px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold items-center justify-center gap-3 transition-all border border-slate-700">
              Start Your Business <ArrowRight className="w-5 h-5" />
            </Link>
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
              <img src="/vtu_home_screenshot.png" alt="Your Branded App" className="w-full h-full object-contain object-top" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
