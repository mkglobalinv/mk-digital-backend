'use client';

import { motion } from 'framer-motion';
import { Globe, Briefcase, Shield, Users, Zap, Wallet, ShieldCheck, Activity, Smartphone, Award } from 'lucide-react';

const features = [
  { icon: Globe, title: "Own Website", color: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-400" },
  { icon: Briefcase, title: "Own Brand", color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-400" },
  { icon: Shield, title: "Own Admin Dashboard", color: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-400" },
  { icon: Users, title: "Customer Portal", color: "from-purple-500/20 to-purple-500/5", iconColor: "text-purple-400" },
  { icon: Zap, title: "Automated Delivery", color: "from-rose-500/20 to-rose-500/5", iconColor: "text-rose-400" },
  { icon: Wallet, title: "Wallet Management", color: "from-indigo-500/20 to-indigo-500/5", iconColor: "text-indigo-400" },
  { icon: ShieldCheck, title: "Secure Payments", color: "from-cyan-500/20 to-cyan-500/5", iconColor: "text-cyan-400" },
  { icon: Activity, title: "Business Analytics", color: "from-slate-500/20 to-slate-500/5", iconColor: "text-slate-400" },
  { icon: Smartphone, title: "Mobile App", color: "from-fuchsia-500/20 to-fuchsia-500/5", iconColor: "text-fuchsia-400" },
  { icon: Award, title: "Business Growth", color: "from-sky-500/20 to-sky-500/5", iconColor: "text-sky-400" }
];

export default function Features() {
  return (
    <section className="py-24 relative bg-slate-950" id="services">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            Premium Features
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 font-medium"
          >
            Everything you need to run a successful digital business under one roof.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group relative p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all duration-300 overflow-hidden"
            >
              {/* Hover Glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 text-center">{feature.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
