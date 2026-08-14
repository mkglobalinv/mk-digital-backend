'use client';

import { motion } from 'framer-motion';
import { Activity, Award, ArrowDown, UserPlus, Globe, CheckCircle, Zap, Wallet } from 'lucide-react';
import Link from 'next/link';

const referralSteps = [
  { text: "Refer Someone", icon: UserPlus, color: "blue" },
  { text: "They Create Their Website", icon: Globe, color: "indigo" },
  { text: "They Activate For ₦5,000", icon: CheckCircle, color: "amber", highlight: true },
  { text: "You Receive ₦2,000", icon: Award, color: "emerald", success: true },
  { text: "They Start Selling", icon: Zap, color: "orange" },
  { text: "You Keep Earning From Qualifying Transactions", icon: Wallet, color: "blue" }
];

export default function Referrals() {
  return (
    <section id="referrals" className="py-24 bg-slate-950 px-6 border-y border-slate-800/50 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto space-y-24 relative z-10">
        
        {/* HERO GRID */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight"
            >
              Refer. Earn. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Keep Earning.</span>
            </motion.h2>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-slate-400 max-w-xl leading-relaxed font-medium space-y-6"
            >
              <p>
                Refer someone who creates their own VTU website and activates it by paying the ₦5,000 activation fee.
              </p>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold">
                You instantly receive ₦2,000 in your profit wallet.
              </div>
              <p>
                When people you referred make qualifying purchases through their own website, you can continue earning referral commissions from those transactions.
              </p>
            </motion.div>
          </div>
          
          {/* VISUAL FLOW */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative lg:block"
          >
            <div className="bg-slate-900/80 rounded-3xl p-8 shadow-2xl border border-slate-800 flex flex-col items-center">
              
              {referralSteps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center w-full max-w-sm">
                  <div className={`w-full flex items-center gap-4 p-4 rounded-xl border ${
                    step.highlight ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    step.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    'bg-slate-800 border-slate-700 text-slate-200'
                  }`}>
                    <div className={`p-2 rounded-lg bg-${step.color}-500/20 text-${step.color}-400 shrink-0`}>
                      <step.icon size={20} />
                    </div>
                    <span className="font-bold">{step.text}</span>
                  </div>
                  
                  {idx < referralSteps.length - 1 && (
                    <div className="text-slate-600 my-2">
                      <ArrowDown size={24} />
                    </div>
                  )}
                </div>
              ))}
              
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
