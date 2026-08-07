'use client';

import { motion } from 'framer-motion';
import { Lock, Zap, Clock, Shield } from 'lucide-react';
import Image from 'next/image';

const securityFeatures = [
  {
    icon: Lock,
    title: "Bank-Grade Security",
    description: "Your funds and data are protected with enterprise-level encryption. We process payments securely via Monnify & Paystack."
  },
  {
    icon: Zap,
    title: "Instant Activation",
    description: "No manual delays. Once you pay your website hosting fee, your automated VTU portal is deployed in milliseconds."
  },
  {
    icon: Clock,
    title: "24/7 Automation",
    description: "Your business runs even while you sleep. Our servers automatically process customer orders and API requests around the clock."
  },
  {
    icon: Shield,
    title: "Reliable Infrastructure",
    description: "Built for the Nigerian market with intelligent failover routing. If one provider fails, we automatically route to a backup."
  }
];

export default function Security() {
  return (
    <section className="py-24 relative overflow-hidden bg-slate-950">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Text */}
          <div className="flex-1 text-center lg:text-left">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold text-white mb-6"
            >
              Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Scale</span> & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Security</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto lg:mx-0"
            >
              We've engineered 9JASUB specifically for the Nigerian VTU market. Accept local payments securely, handle massive traffic spikes during peak hours, and never worry about downtime.
            </motion.p>

            <div className="grid sm:grid-cols-2 gap-6 text-left">
              {securityFeatures.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + (idx * 0.1) }}
                  className="flex gap-4"
                >
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <feature.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex-1 relative w-full aspect-square max-w-lg mx-auto"
          >
            <div className="absolute inset-0 bg-blue-600/10 rounded-full blur-[100px]" />
            <div className="relative w-full h-full rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-8 flex flex-col justify-between overflow-hidden group">
              {/* Fake API Monitoring UI */}
              <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                <div className="flex gap-2 items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-slate-300">System Status</span>
                </div>
                <span className="text-xs font-mono text-green-400 bg-green-500/10 px-2 py-1 rounded">ALL SYSTEMS NORMAL</span>
              </div>
              
              <div className="space-y-4 flex-1">
                {[
                  { label: "Paystack Gateway", speed: "120ms" },
                  { label: "Monnify Auto-Funding", speed: "85ms" },
                  { label: "MTN Corporate API", speed: "210ms" },
                  { label: "Ikeja Electric Node", speed: "190ms" }
                ].map((node, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg border border-slate-800/50 group-hover:border-slate-700 transition-colors">
                    <span className="text-sm text-slate-300">{node.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{node.speed}</span>
                      <Shield className="w-4 h-4 text-green-400" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Secure lock visual */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl" />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
