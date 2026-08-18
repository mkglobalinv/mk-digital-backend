'use client';

import { motion } from 'framer-motion';
import { Smartphone, Download, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function MobileApp() {
  return (
    <section className="py-24 overflow-hidden relative border-y border-slate-100 bg-white">
      {/* Background Glow */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-100/60 rounded-full glow-soft pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center gap-12 relative z-10">
        <div className="md:w-1/2 space-y-7 text-slate-900">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold text-sm tracking-wide"
          >
            <Smartphone size={16} /> Optional Upgrade
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]"
          >
            Take Your Business to Mobile
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-500 font-medium leading-relaxed"
          >
            Premium website owners can request their own branded Android app. Give your customers a dedicated mobile experience with your own logo and brand identity.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="pt-2"
          >
            <Link href="/get-started" className="btn-dark inline-flex px-8 py-4 rounded-2xl font-semibold items-center justify-center gap-3">
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
            className="w-64 h-[500px] bg-[#0F172A] rounded-[3rem] border-4 border-slate-800 shadow-2xl shadow-slate-400/40 relative overflow-hidden flex flex-col transform rotate-y-[-10deg] rotate-x-[5deg]"
          >
            <div className="absolute top-0 w-full h-6 bg-slate-800 rounded-t-2xl flex justify-center items-center z-20">
              <div className="w-16 h-4 bg-black rounded-b-xl"></div>
            </div>
            <div className="flex-1 bg-white mt-6 relative overflow-hidden">
              <img src="/vtu_home_screenshot.png" alt="Your Branded App" className="w-full h-full object-contain object-top" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
