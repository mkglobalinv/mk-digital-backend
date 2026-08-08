'use client';

import { motion } from 'framer-motion';
import { Check, Info } from 'lucide-react';
import Link from 'next/link';

export default function Pricing() {
  return (
    <section className="py-24 relative" id="pricing">
      {/* Background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            Choose Your <span className="text-blue-400">Plan</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400"
          >
            Transparent pricing tailored for individuals and entrepreneurs.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
          
          {/* Basic Reseller Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm"
          >
            <h3 className="text-2xl font-bold text-white mb-2">Personal Account</h3>
            <p className="text-slate-400 mb-6 font-medium">For personal daily usage.</p>
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">FREE</span>
            </div>
            <ul className="space-y-4 mb-8">
              {[
                "Account Registration",
                "Data Purchase",
                "Airtime Purchase",
                "Bill Payments"
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-300 font-bold">
                  <Check className="w-5 h-5 text-slate-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href="/get-started">
              <button className="w-full py-4 rounded-xl font-bold text-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors">
                Get Started
              </button>
            </Link>
          </motion.div>

          {/* Website Hosting Plan (Highlighted) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative p-8 rounded-3xl bg-gradient-to-b from-blue-900/40 to-slate-900/80 border border-blue-500/50 backdrop-blur-md shadow-[0_0_40px_rgba(37,99,235,0.15)]"
          >
            <div className="absolute top-0 right-8 -translate-y-1/2">
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                Most Popular
              </span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">WEBSITE STARTER</h3>
            <p className="text-blue-200/70 mb-6 font-medium">Launch your own brand today.</p>
            
            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold text-white">₦5,000</span>
                <span className="text-slate-400 font-medium">/setup</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Personal VTU Website",
                "Mobile App Access",
                "Business Dashboard",
                "Business Owner Features",
                "Technical Support"
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-100 font-bold">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
            <Link href="/get-started">
              <button className="w-full py-4 rounded-xl font-black text-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]">
                Own Your Website
              </button>
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
