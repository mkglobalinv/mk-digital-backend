'use client';

import { motion } from 'framer-motion';
import { Activity, Award, Users, Briefcase, Zap, Clock, ArrowDown, User, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-black tracking-widest uppercase border border-emerald-500/20 shadow-sm"
            >
              <Activity size={14} /> Grow Your Business
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight"
            >
              One Referral Can Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Monthly Income</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-400 max-w-xl leading-relaxed font-medium"
            >
              Help more people launch their own VTU Website & App and grow your digital business. Every successful website activation through your referral strengthens your network and unlocks referral rewards based on your account level. As your network grows, your earning potential grows too.
            </motion.p>
          </div>
          
          {/* INFOGRAPHIC */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="relative lg:block"
          >
            <div className="bg-slate-900 rounded-[32px] p-8 shadow-2xl border border-slate-800 relative">
              
              {/* Floating Badges */}
              <div className="absolute -right-6 top-10 bg-slate-800 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-bounce-slow">
                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
                  <Award size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Referral Reward</p>
                </div>
              </div>

              <div className="absolute -left-6 bottom-20 bg-slate-800 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 z-20" style={{ animation: "float 7s ease-in-out infinite" }}>
                <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Website Activation</p>
                </div>
              </div>
              
              <div className="absolute -right-4 bottom-8 bg-slate-950 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800 z-20 animate-bounce-slow">
                <div className="w-8 h-8 bg-white/10 text-white rounded-full flex items-center justify-center">
                  <Award size={16} />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Referral Bonus</p>
                </div>
              </div>

              <div className="absolute top-1/2 -translate-y-1/2 -left-8 bg-indigo-900/50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-indigo-500/30 z-20 animate-bounce-slow" style={{ animationDelay: "1s" }}>
                <div className="w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Lifetime Earnings</p>
                </div>
              </div>

              {/* Flowchart Structure */}
              <div className="flex flex-col items-center py-6">
                {/* YOU Node */}
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-900/50 mb-2 z-10 relative">
                  <User size={32} />
                  <div className="absolute -bottom-6 text-sm font-black text-slate-300">YOU</div>
                </div>
                
                {/* Vertical Line */}
                <div className="w-1 h-12 bg-slate-800 rounded-full my-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
                
                {/* Horizontal Branching */}
                <div className="w-full max-w-[280px] h-1 bg-slate-800 rounded-full relative">
                  <div className="absolute top-0 left-0 w-full h-full bg-blue-500 rounded-full animate-pulse opacity-50"></div>
                </div>
                
                {/* Connections & Downward lines */}
                <div className="flex justify-between w-full max-w-[300px] px-2 relative -top-1">
                  <div className="w-1 h-8 bg-slate-800 rounded-full"></div>
                  <div className="w-1 h-8 bg-slate-800 rounded-full"></div>
                  <div className="w-1 h-8 bg-slate-800 rounded-full"></div>
                  <div className="w-1 h-8 bg-slate-800 rounded-full"></div>
                </div>
                
                {/* Users Row */}
                <div className="flex justify-between w-full max-w-[340px] mt-2 z-10">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-slate-800 border-2 border-slate-700 rounded-full flex items-center justify-center text-slate-400 mb-2 transition-colors">
                        <Users size={20} />
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wider">Website<br/>Owner</div>
                    </div>
                  ))}
                </div>

                {/* Automatic Reward Section */}
                <div className="w-1 h-12 border-l-2 border-dashed border-emerald-500/50 my-4 relative">
                  <ArrowDown className="absolute -bottom-4 -left-3 text-emerald-400 animate-bounce" size={24} />
                </div>
                
                <div className="mt-4 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 font-bold flex items-center gap-2">
                  <ShieldCheck size={18} /> Automatic Referral Rewards
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* FEATURE CARDS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <Award size={24}/>, title: "Lifetime Referral Rewards", bg: "bg-blue-500/10", text: "text-blue-400", desc: "Earn rewards whenever your referred website owners successfully activate their websites." },
            { icon: <Users size={24}/>, title: "Unlimited Referrals", bg: "bg-purple-500/10", text: "text-purple-400", desc: "Invite as many people as you like and continue growing your digital business." },
            { icon: <Activity size={24}/>, title: "Instant Reward Tracking", bg: "bg-emerald-500/10", text: "text-emerald-400", desc: "Track referral activities and rewards directly from your dashboard." },
            { icon: <Briefcase size={24}/>, title: "Built Into Every Website", bg: "bg-amber-500/10", text: "text-amber-400", desc: "Every Website Owner automatically receives a referral link to help grow their business." }
          ].map((f, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-lg hover:shadow-slate-800/50 hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl ${f.bg} ${f.text} flex items-center justify-center mb-6`}>
                {f.icon}
              </div>
              <h4 className="font-bold text-white text-lg mb-3 leading-tight">{f.title}</h4>
              <p className="text-slate-400 font-medium leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* HIGHLIGHT BOX */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-slate-900 rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden border border-slate-800 max-w-5xl mx-auto text-center"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight">Imagine Growing Your Own Network</h3>
            <div className="space-y-4 text-slate-300 font-medium text-lg md:text-xl leading-relaxed">
              <p>Help entrepreneurs launch their own VTU websites.</p>
              <p>Every successful activation expands your network and creates new referral opportunities.</p>
              <p className="text-white font-bold">As your community grows, your business grows alongside it.</p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <div className="text-center space-y-8 pt-8">
          <h3 className="text-3xl font-black text-white">Start Building Your Referral Business Today</h3>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/get-started" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all">
              Start Your VTU Business <ArrowRight size={20} />
            </Link>
            <Link href="/#pricing" className="px-8 py-4 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 backdrop-blur-md transition-all">
              View Pricing
            </Link>
          </div>
        </div>
        
      </div>
    </section>
  );
}
