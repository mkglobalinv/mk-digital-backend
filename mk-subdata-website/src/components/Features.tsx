'use client';

import { motion } from 'framer-motion';
import { Globe, Settings, Rocket } from 'lucide-react';

const steps = [
  { 
    number: "01",
    icon: Globe, 
    title: "Create Your Website", 
    description: "Choose your business name, site name and branding.",
    color: "from-blue-500/20 to-blue-500/5", 
    iconColor: "text-blue-400" 
  },
  { 
    number: "02",
    icon: Settings, 
    title: "Configure Your Business", 
    description: "Set your services, pricing, markup and business settings.",
    color: "from-amber-500/20 to-amber-500/5", 
    iconColor: "text-amber-400" 
  },
  { 
    number: "03",
    icon: Rocket, 
    title: "Go Live & Grow", 
    description: "Your branded website goes live and you can start operating your own digital services business.",
    color: "from-emerald-500/20 to-emerald-500/5", 
    iconColor: "text-emerald-400" 
  }
];

export default function Features() {
  return (
    <section className="py-24 relative bg-slate-950" id="setup">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            Launch in 3 Simple Steps
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 font-medium"
          >
            Ready in about 3 minutes.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          
          {/* Connecting Line for Desktop */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-slate-800 z-0" />

          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group relative p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all duration-300 overflow-hidden text-center z-10"
            >
              {/* Hover Glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="absolute -top-6 -right-6 text-7xl font-black text-slate-800/50 group-hover:text-slate-700/50 transition-colors duration-300 z-0">
                {step.number}
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-6 shadow-lg relative">
                  <step.icon className={`w-8 h-8 ${step.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 text-center">{step.title}</h3>
                <p className="text-slate-400">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 text-center text-slate-500 font-bold tracking-widest text-sm flex items-center justify-center gap-4 flex-wrap">
          <span>CREATE</span> <span className="text-blue-500">→</span>
          <span>CONFIGURE</span> <span className="text-amber-500">→</span>
          <span>LAUNCH</span> <span className="text-emerald-500">→</span>
          <span>GROW</span>
        </div>
      </div>
    </section>
  );
}
