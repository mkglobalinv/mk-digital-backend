'use client';

import { motion } from 'framer-motion';
import { UserPlus, Settings2, Rocket } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: "1. Create Free Account",
    description: ""
  },
  {
    icon: Settings2,
    title: "2. Choose Website Plan",
    description: ""
  },
  {
    icon: Rocket,
    title: "3. Receive Your Website",
    description: ""
  },
  {
    icon: Settings2,
    title: "4. Customize Your Brand",
    description: ""
  },
  {
    icon: Rocket,
    title: "5. Start Selling",
    description: ""
  }
];

export default function HowItWorks() {
  return (
    <section className="py-24 relative overflow-hidden" id="how-it-works">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            How It Works
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 font-medium"
          >
            Your journey to financial independence in 5 simple steps.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 max-w-6xl mx-auto relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0 z-0" />

          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mb-6 shadow-xl group-hover:border-blue-500/50 group-hover:shadow-[0_0_30px_rgba(37,99,235,0.2)] transition-all duration-300 relative">
                <div className="absolute inset-0 rounded-full bg-blue-500/10 scale-0 group-hover:scale-100 transition-transform duration-500" />
                <step.icon className="w-8 h-8 md:w-10 md:h-10 text-blue-400 relative z-10" />
              </div>
              <h3 className="font-bold text-white text-sm max-w-[120px] mx-auto leading-tight">{step.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
