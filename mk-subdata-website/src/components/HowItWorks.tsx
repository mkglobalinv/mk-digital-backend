'use client';

import { motion } from 'framer-motion';
import { Globe, Users, Wallet, Zap, CheckCircle, ArrowDown } from 'lucide-react';

const steps = [
  {
    icon: Globe,
    title: "YOUR VTU WEBSITE",
    description: "",
    color: "blue"
  },
  {
    icon: Users,
    title: "YOUR CUSTOMERS",
    description: "Register on your website",
    color: "indigo"
  },
  {
    icon: Wallet,
    title: "CUSTOMERS FUND THEIR OWN WALLETS",
    description: "With their own money",
    color: "emerald"
  },
  {
    icon: Zap,
    title: "CUSTOMERS BUY SERVICES",
    description: "Using their wallet balance",
    color: "amber"
  },
  {
    icon: CheckCircle,
    title: "YOU EARN YOUR MARKUP",
    description: "From successful transactions",
    color: "green"
  }
];

export default function HowItWorks() {
  return (
    <section className="py-24 relative overflow-hidden bg-slate-900/50" id="how-it-works">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight"
          >
            You Don't Need Large Startup Capital To Start
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-300 font-medium max-w-3xl mx-auto mb-6"
          >
            Start with a 3-day free trial. After your trial, pay just <span className="text-white font-bold bg-amber-500/20 px-2 py-1 rounded">₦5,000 one-time activation fee</span> to keep your website live and continue selling.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto space-y-2 mb-10"
          >
            <p>Your customers register on your website and fund their own wallets.</p>
            <p>They use their wallet balance to purchase services.</p>
            <p>You earn your markup/profit from successful transactions.</p>
          </motion.div>
          
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 uppercase tracking-wider"
          >
            Your Business. Your Brand. Your Customers.
          </motion.h3>
        </div>

        {/* Vertical Flow for Mobile, Horizontal for Desktop */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2 max-w-6xl mx-auto relative">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex flex-col md:flex-row items-center w-full md:w-auto"
            >
              <div className={`relative z-10 flex flex-col items-center text-center p-6 rounded-2xl bg-slate-800/80 border border-slate-700 w-full md:w-48 h-full shadow-lg hover:border-${step.color}-500/50 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all duration-300`}>
                <div className={`w-16 h-16 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center mb-4 text-${step.color}-400`}>
                  <step.icon className="w-8 h-8" />
                </div>
                <h4 className={`font-bold text-white text-sm leading-tight mb-2 ${idx === steps.length - 1 ? 'text-green-400' : ''}`}>{step.title}</h4>
                {step.description && (
                  <p className="text-xs text-slate-400">{step.description}</p>
                )}
              </div>
              
              {/* Arrow separator (hidden on last item) */}
              {idx < steps.length - 1 && (
                <div className="text-slate-600 my-4 md:my-0 md:mx-2">
                  <ArrowDown className="w-6 h-6 md:-rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
