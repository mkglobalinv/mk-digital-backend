'use client';

import { motion } from 'framer-motion';
import { UserPlus, Settings2, Rocket } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: "1. Create an Account",
    description: "Sign up in seconds and choose your preferred hosting plan. No credit card required to explore the dashboard."
  },
  {
    icon: Settings2,
    title: "2. Configure Your Brand",
    description: "Upload your logo, set your unique domain name, and configure your VTU prices exactly how you want."
  },
  {
    icon: Rocket,
    title: "3. Launch Instantly",
    description: "Click launch and your fully automated VTU website is live immediately. Start processing sales and keeping 100% of your profits."
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
            Launch Your VTU Business in <span className="text-blue-400">3 Easy Steps</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400"
          >
            We've eliminated all the technical hurdles. You don't need to know how to code, manage servers, or integrate APIs. Just configure and launch.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0 z-0" />

          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.2 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className="w-24 h-24 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mb-6 shadow-xl group-hover:border-blue-500/50 group-hover:shadow-[0_0_30px_rgba(37,99,235,0.2)] transition-all duration-300 relative">
                <div className="absolute inset-0 rounded-full bg-blue-500/10 scale-0 group-hover:scale-100 transition-transform duration-500" />
                <step.icon className="w-10 h-10 text-blue-400 relative z-10" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>
              <p className="text-slate-400 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
