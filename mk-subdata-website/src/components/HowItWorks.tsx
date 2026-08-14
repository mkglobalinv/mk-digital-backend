'use client';

import { motion } from 'framer-motion';
import { Globe, Users, Wallet, Zap, CheckCircle, ArrowDown, Settings, Rocket } from 'lucide-react';

const capitalFlow = [
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
    title: "CUSTOMERS FUND WALLETS",
    description: "With their own money",
    color: "emerald"
  },
  {
    icon: Zap,
    title: "CUSTOMERS BUY SERVICES",
    description: "Using their balance",
    color: "amber"
  },
  {
    icon: CheckCircle,
    title: "YOU EARN MARKUP",
    description: "From transactions",
    color: "green"
  }
];

const launchSteps = [
  {
    icon: Globe,
    title: "Create Your Website",
    description: "Choose your business name, site name and branding.",
    color: "blue"
  },
  {
    icon: Settings,
    title: "Configure Your Business",
    description: "Set your services, pricing, markup and business settings.",
    color: "indigo"
  },
  {
    icon: Rocket,
    title: "Go Live & Grow",
    description: "Your branded website goes live and you start operating.",
    color: "green"
  }
];

export default function HowItWorks() {
  return (
    <section className="py-24 relative overflow-hidden bg-slate-900/50" id="how-it-works">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        {/* Launch in 3 Simple Steps */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight"
          >
            Launch in 3 Simple Steps
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-300 font-medium max-w-3xl mx-auto mb-12"
          >
            Set up your entire business in approximately 3 minutes.
          </motion.p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {launchSteps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex flex-col items-center text-center p-8 rounded-3xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors"
              >
                <div className={`w-16 h-16 rounded-2xl bg-${step.color}-500/20 text-${step.color}-400 flex items-center justify-center mb-6`}>
                  <step.icon className="w-8 h-8" />
                </div>
                <div className="text-sm font-bold text-slate-500 mb-2">0{idx + 1}</div>
                <h4 className="font-bold text-white text-xl mb-3">{step.title}</h4>
                <p className="text-slate-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* No Large Startup Capital */}
        <div className="text-center max-w-4xl mx-auto mt-32 mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight"
          >
            You Don't Need Large Startup Capital To Start
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto space-y-4 mb-10 font-medium"
          >
            <p>You don't need to fund the platform yourself to start.</p>
            <p>Your customers register on your website and fund their own wallets.</p>
            <p>They use their wallet balance to purchase services.</p>
            <p>You earn your markup/profit from successful transactions.</p>
          </motion.div>
          
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 uppercase tracking-wider mb-12"
          >
            Your Business. Your Brand. Your Customers.
          </motion.h3>
        </div>

        {/* Vertical Flow for Mobile, Horizontal for Desktop */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2 max-w-6xl mx-auto relative overflow-hidden py-4">
          {capitalFlow.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex flex-col md:flex-row items-center w-full md:w-auto"
            >
              <div className={`relative z-10 flex flex-col items-center text-center p-4 md:p-6 rounded-2xl bg-slate-800/80 border border-slate-700 w-full md:w-44 lg:w-48 h-full shadow-lg hover:border-${step.color}-500/50 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all duration-300`}>
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center mb-4 text-${step.color}-400 shrink-0`}>
                  <step.icon className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h4 className={`font-bold text-white text-xs md:text-sm leading-tight mb-2 ${idx === capitalFlow.length - 1 ? 'text-green-400' : ''}`}>{step.title}</h4>
                {step.description && (
                  <p className="text-[10px] md:text-xs text-slate-400 hidden sm:block">{step.description}</p>
                )}
              </div>
              
              {/* Arrow separator (hidden on last item) */}
              {idx < capitalFlow.length - 1 && (
                <div className="text-slate-600 my-2 md:my-0 md:mx-1 lg:mx-2 shrink-0">
                  <ArrowDown className="w-5 h-5 md:-rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
