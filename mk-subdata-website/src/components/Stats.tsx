'use client';

import { motion } from 'framer-motion';
import { Activity, Clock, Zap, Shield } from 'lucide-react';

const stats = [
  {
    icon: Activity,
    value: "99.9%",
    label: "Platform Uptime",
  },
  {
    icon: Clock,
    value: "24/7",
    label: "Dedicated Support",
  },
  {
    icon: Zap,
    value: "Instant",
    label: "Service Delivery",
  },
  {
    icon: Shield,
    value: "100%",
    label: "Secure Transactions",
  }
];

export default function Stats() {
  return (
    <section className="py-20 relative bg-slate-950/50 border-y border-slate-800/50">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-sm hover:bg-slate-800/60 transition-colors duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                <stat.icon className="w-6 h-6" />
              </div>
              <h3 className="text-4xl font-bold text-white mb-2">{stat.value}</h3>
              <p className="text-lg font-semibold text-slate-300">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
