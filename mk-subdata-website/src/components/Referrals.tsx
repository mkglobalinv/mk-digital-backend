'use client';

import { motion } from 'framer-motion';
import { Award, UserPlus, Globe, CheckCircle, Zap, Wallet } from 'lucide-react';
import Link from 'next/link';

const colorMap = {
  blue: { chipBg: 'bg-blue-50', chipText: 'text-blue-600' },
  sky: { chipBg: 'bg-sky-50', chipText: 'text-sky-600' },
  amber: { chipBg: 'bg-amber-50', chipText: 'text-amber-600' },
  emerald: { chipBg: 'bg-emerald-50', chipText: 'text-emerald-600' },
} as const;

type ReferralStep = {
  text: string;
  icon: typeof UserPlus;
  color: keyof typeof colorMap;
  highlight?: boolean;
  success?: boolean;
};

const referralSteps: ReferralStep[] = [
  { text: "Refer Someone", icon: UserPlus, color: "blue" },
  { text: "They Create Their Website", icon: Globe, color: "sky" },
  { text: "They Activate For ₦5,000", icon: CheckCircle, color: "amber", highlight: true },
  { text: "You Receive ₦2,000", icon: Award, color: "emerald", success: true },
  { text: "They Start Selling", icon: Zap, color: "amber" },
  { text: "You Keep Earning From Qualifying Transactions", icon: Wallet, color: "blue" }
];

export default function Referrals() {
  return (
    <section id="referrals" className="py-24 bg-slate-50 px-6 border-y border-slate-100 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-100/60 rounded-full glow-soft pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-100/50 rounded-full glow-soft pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-24 relative z-10">

        {/* HERO GRID */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight"
            >
              Refer. Earn. <span className="gradient-text">Keep Earning.</span>
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-slate-500 max-w-xl leading-relaxed font-medium space-y-6"
            >
              <p>
                Refer someone who creates their own VTU website and activates it by paying the ₦5,000 activation fee.
              </p>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-bold">
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
            <div className="card-light rounded-[2rem] p-5 sm:p-8 shadow-xl">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {referralSteps.map((step, idx) => {
                  const c = colorMap[step.color];
                  return (
                    <div
                      key={idx}
                      className={`relative flex flex-col items-center text-center gap-2 p-3 sm:p-4 rounded-xl border ${
                        step.highlight ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        step.success ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="absolute top-2 right-2 text-[10px] font-bold text-slate-300">{idx + 1}</span>
                      <div className={`p-2 rounded-lg ${c.chipBg} ${c.chipText} shrink-0`}>
                        <step.icon size={20} />
                      </div>
                      <span className="font-semibold text-xs sm:text-sm leading-snug">{step.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
