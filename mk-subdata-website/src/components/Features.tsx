'use client';

import { motion } from 'framer-motion';
import { Wifi, Phone, Tv, GraduationCap, Zap, Repeat } from 'lucide-react';

const features = [
  {
    icon: Wifi,
    title: "Cheap Data Bundles",
    description: "Sell MTN, Airtel, GLO, and 9mobile data at the cheapest rates available in Nigeria. Automated delivery 24/7.",
    color: "from-green-500/20 to-green-500/5",
    iconColor: "text-green-400"
  },
  {
    icon: Phone,
    title: "Airtime Top-Up",
    description: "Instant airtime top-up for all networks with generous discounts that maximize your profit margins.",
    color: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400"
  },
  {
    icon: Tv,
    title: "Cable TV Subscriptions",
    description: "Process DSTV, GOTV, and Startimes subscriptions instantly. Customers get reconnected within seconds.",
    color: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-400"
  },
  {
    icon: Zap,
    title: "Electricity Tokens",
    description: "Generate prepaid electricity tokens for IBEDC, IKEDC, EKEDC, AEDC, and all other major discos nationwide.",
    color: "from-yellow-500/20 to-yellow-500/5",
    iconColor: "text-yellow-400"
  },
  {
    icon: GraduationCap,
    title: "Exam Result Pins",
    description: "Generate WAEC, NECO, and NABTEB result checking pins instantly for students.",
    color: "from-red-500/20 to-red-500/5",
    iconColor: "text-red-400"
  },
  {
    icon: Repeat,
    title: "Airtime to Cash",
    description: "Allow your customers to seamlessly convert excess airtime back to cash straight into their wallets.",
    color: "from-indigo-500/20 to-indigo-500/5",
    iconColor: "text-indigo-400"
  }
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
            Everything You Need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Dominate</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400"
          >
            Provide your customers with a complete suite of digital services. Our automated API routing ensures 99.9% success rates on all transactions.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
