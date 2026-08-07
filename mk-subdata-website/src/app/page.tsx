"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, Smartphone, ShieldCheck, 
  Globe, CheckCircle2, Wallet, Users, 
  Phone, Mail, MapPin, Briefcase, 
  Check, ChevronDown, ChevronUp, Zap, Activity, Award,
  Percent, Server, BarChart3, Database, Tv, MessageSquare, Play, Sparkles
} from 'lucide-react';

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] selection:bg-blue-100 selection:text-blue-900 font-sans antialiased text-slate-800">
      
      {/* ==================== NAVIGATION ==================== */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/40 py-3 shadow-sm' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.jpg" alt="9JASUB Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform" />
            <span className="text-2xl font-black tracking-tight text-slate-900 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">9JASUB</span>
          </Link>
          <div className="hidden lg:flex items-center gap-8 bg-white/60 backdrop-blur-md px-8 py-3 rounded-full border border-slate-200/40 shadow-sm">
            <Link href="#why-choose-us" className="text-slate-600 hover:text-blue-600 font-semibold text-sm transition-colors">Why 9JASUB</Link>
            <Link href="#features" className="text-slate-600 hover:text-blue-600 font-semibold text-sm transition-colors">Features</Link>
            <Link href="#pricing" className="text-slate-600 hover:text-blue-600 font-semibold text-sm transition-colors">Pricing</Link>
            <Link href="#faq" className="text-slate-600 hover:text-blue-600 font-semibold text-sm transition-colors">FAQ</Link>
          </div>
          <div className="flex items-center gap-4">
            <a href="/login" className="hidden sm:block text-slate-600 hover:text-blue-600 font-bold px-4 transition-colors">Login</a>
            <a href="/get-started" className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 hover:scale-[1.02]">Get Started</a>
          </div>
        </div>
      </nav>

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative pt-36 lg:pt-48 pb-20 px-6 overflow-hidden bg-slate-900 text-white">
        {/* Soft Blue Glowing Gradients & Watermark Backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-950/60 via-slate-900 to-slate-900 -z-10" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px] -z-10 animate-pulse-slow" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] -z-10" />
        
        {/* Africa network illustration background overlay */}
        <div className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-screen pointer-events-none -z-10" style={{ backgroundImage: "url('/africa_network.png')" }} />
        
        {/* Giant transparent watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none -z-10">
          <span className="text-[12vw] font-black text-white/[0.02] tracking-widest leading-none">9JASUB.COM</span>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-8 text-left z-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-300 rounded-full text-xs font-black tracking-wider border border-blue-500/20">
              <Sparkles size={12} className="text-blue-400" /> START YOUR OWN VTU WEBSITE Today
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Power Africa's <br />
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Digital Business</span>
            </h1>
            
            <p className="text-lg text-slate-300 leading-relaxed font-medium max-w-xl">
              Launch your own branded VTU website, sell Data, Airtime, Electricity, Cable TV and Exam Pins under your own brand with 9JASUB.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/get-started" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-lg flex items-center gap-3 hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02]">
                Start Your Website <ArrowRight size={20} />
              </Link>
              <a href="#showcase" className="px-8 py-4 bg-slate-800/80 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg flex items-center gap-2 border border-slate-700/80 transition-all hover:scale-[1.02]">
                <Play size={16} fill="currentColor" /> Watch Demo
              </a>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-800/80 max-w-md">
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Trusted by thousands</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Fast setup</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Secure payments</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Nationwide coverage</span>
              </div>
            </div>
          </div>

          {/* Hero Right Content: Premium 9JASUB Office Photo */}
          <div className="lg:col-span-6 relative flex justify-center items-center z-10 animate-fade-in delay-200">
            <div className="relative w-full">
              {/* Glow ring behind image */}
              <div className="absolute -inset-3 bg-gradient-to-tr from-blue-500/40 to-emerald-500/20 rounded-[32px] blur-[30px] opacity-50 animate-pulse-slow" />

              {/* Premium office photo — diverse Nigerian professionals */}
              <div className="w-full rounded-[28px] overflow-hidden border border-slate-700/60 shadow-2xl relative">
                <img
                  src="/nigeria_team.png"
                  alt="Nigerian Fintech Professionals — 9JASUB Team"
                  className="w-full h-auto object-cover object-center"
                />
                {/* Subtle bottom vignette to blend into hero bg */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
              </div>

              {/* Floating Fintech Icon Cards */}
              {/* Card 1: Data */}
              <div className="absolute -top-4 -left-4 glass-dark px-4 py-3 rounded-2xl flex items-center gap-3 shadow-xl animate-float">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Smartphone size={20} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mobile Data</div>
                  <div className="text-sm font-extrabold text-white">Instant Switch</div>
                </div>
              </div>

              {/* Card 2: Wallet */}
              <div className="absolute top-1/2 -right-6 glass-dark px-4 py-3 rounded-2xl flex items-center gap-3 shadow-xl animate-float-delayed">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Wallet size={20} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Secured API</div>
                  <div className="text-sm font-extrabold text-white">Auto Funding</div>
                </div>
              </div>

              {/* Card 3: Utility Bills */}
              <div className="absolute -bottom-4 left-6 glass-dark px-4 py-3 rounded-2xl flex items-center gap-3 shadow-xl animate-float">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Zap size={20} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Electricity</div>
                  <div className="text-sm font-extrabold text-white">Instant Tokens</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== STATS / TRUST BAR ==================== */}
      <section className="relative bg-white border-y border-slate-100 py-10 px-6 z-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-slate-100">
            {[
              { value: "10,000+", label: "Active Resellers", color: "text-blue-600" },
              { value: "₦2B+",    label: "Transactions Processed", color: "text-emerald-600" },
              { value: "99.9%",   label: "Platform Uptime", color: "text-indigo-600" },
              { value: "4 Networks", label: "MTN · Airtel · Glo · 9mobile", color: "text-amber-600" }
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center px-6 py-2">
                <span className={`text-3xl md:text-4xl font-black tracking-tight ${s.color}`}>{s.value}</span>
                <span className="text-xs text-slate-500 font-semibold mt-1 leading-snug">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== WHY CHOOSE US ==================== */}
      <section id="why-choose-us" className="py-24 bg-slate-50 px-6 relative overflow-hidden">
        {/* Decorative lighting effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Built for Next-Gen Fintech</h2>
            <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">
              Everything you need to launch a high-volume, reliable VTU distribution channel.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { icon: <Zap size={22} />, title: "Fast Activation", desc: "Get active within minutes after setup." },
              { icon: <Activity size={22} />, title: "Automated Platform", desc: "Instant service switching via API." },
              { icon: <MessageSquare size={22} />, title: "24/7 Support", desc: "Dedicated customer service channels." },
              { icon: <ShieldCheck size={22} />, title: "Secure Payments", desc: "Multi-network automated payment routing." },
              { icon: <Server size={22} />, title: "Multi-Network", desc: "MTN, Airtel, Glo & 9mobile services." }
            ].map((w, i) => (
              <div key={i} className="glass p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200/50">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                  {w.icon}
                </div>
                <h4 className="font-extrabold text-slate-900 text-base mb-2">{w.title}</h4>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FEATURES SECTION ==================== */}
      <section id="features" className="py-24 bg-slate-900 text-white px-6 relative overflow-hidden">
        {/* Backdrop outlines */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-900 to-slate-900 -z-10" />
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Full Suite Fintech Utilities</h2>
            <p className="text-lg text-slate-400 font-medium max-w-xl mx-auto">
              Everything you need to automate payments, configure routes, and scale.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { icon: <Globe size={24} className="text-blue-400" />, title: "White-Label Portal", desc: "Host VTU products entirely under your own custom domain name." },
              { icon: <Database size={24} className="text-blue-400" />, title: "Switching API Routing", desc: "Automate transactions directly through secure low-latency gateways." },
              { icon: <Percent size={24} className="text-blue-400" />, title: "Custom Pricing Engine", desc: "Set custom rates and profit margins for specific networks or tiers." },
              { icon: <Users size={24} className="text-blue-400" />, title: "Reseller Management", desc: "Permit sub-resellers to register and distribute services under your tree." },
              { icon: <BarChart3 size={24} className="text-blue-400" />, title: "Unified Analytics", desc: "Monitor active balances, transaction counts, and daily profit charts." },
              { icon: <ShieldCheck size={24} className="text-blue-400" />, title: "Audit Verification Logs", desc: "Detailed trace records for automated payouts and security actions." }
            ].map((f, i) => (
              <div key={i} className="glass-dark p-8 rounded-[24px] border border-slate-800 shadow-xl hover:border-slate-700 hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                  {f.icon}
                </div>
                <h4 className="font-extrabold text-white text-lg mb-2">{f.title}</h4>
                <p className="text-slate-400 text-sm font-semibold leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== DASHBOARD SHOWCASE ==================== */}
      <section className="py-20 bg-slate-50 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black tracking-wider border border-blue-100">
              <Sparkles size={12} /> Your Platform. Your Brand.
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">See the Dashboard in Action</h2>
            <p className="text-slate-500 font-medium max-w-xl mx-auto">
              A fully-featured admin panel to manage customers, transactions, pricing and more — all under your own brand.
            </p>
          </div>

          {/* Dashboard screenshot in clean browser frame */}
          <div className="rounded-[24px] overflow-hidden border border-slate-200 shadow-2xl shadow-slate-900/10 bg-white">
            {/* Browser chrome bar */}
            <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 max-w-sm mx-auto h-6 bg-slate-100 rounded-md text-[11px] text-slate-400 flex items-center justify-center font-semibold select-none">
                yourbrand.9jasub.com/dashboard
              </div>
            </div>
            {/* Actual dashboard screenshot */}
            <div className="w-full">
              <img
                src="/dashboard_screenshot.png"
                alt="9JASUB Admin Dashboard"
                className="w-full h-auto object-cover object-top"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==================== REFERRAL SECTION ==================== */}
      <section className="py-16 bg-white px-6">
        <div className="max-w-5xl mx-auto">
          {/* Horizontal, compact glassmorphic section */}
          <div className="glass rounded-[32px] border border-slate-200/80 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-extrabold uppercase tracking-wide">
                <Award size={12} /> Affiliate Program
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Refer & Earn Lifelong Income</h3>
              <p className="text-sm text-slate-500 font-semibold max-w-md">
                Refer entrepreneurs to launch their VTU websites and earn from every active customer.
              </p>
            </div>

            {/* Premium Commissions Illustrations Info */}
            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto">
              <div className="bg-slate-50 border border-slate-200/80 px-6 py-4 rounded-2xl text-center w-full sm:w-36 shadow-sm">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Commission</div>
                <div className="text-3xl font-black text-blue-600">15%</div>
                <div className="text-[9px] text-slate-400 font-semibold">Lifetime Yield</div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 px-6 py-4 rounded-2xl text-center w-full sm:w-36 shadow-sm">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payout</div>
                <div className="text-3xl font-black text-emerald-500">Daily</div>
                <div className="text-[9px] text-slate-400 font-semibold">Auto Settlements</div>
              </div>

              <Link href="/get-started" className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm text-center shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 transition-all w-full sm:w-auto">
                Join Program
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PRICING ==================== */}
      <section id="pricing" className="py-24 bg-slate-50 px-6 border-y border-slate-200/40 relative">
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Simple Pricing</h2>
            <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">Flat rates. Choose the plan tailored for your operational capacity.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {/* Personal Tier */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-1">Personal</h3>
                <p className="text-slate-400 text-xs font-semibold mb-4">For personal bills payment.</p>
                <div className="text-3xl font-black text-slate-900 mb-6">FREE</div>
                <div className="border-t border-slate-100 my-4"></div>
                <ul className="space-y-3 mb-6">
                  {["Buy Airtime & Data", "Pay Utility Bills", "Standard Support"].map((ft, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-500 font-semibold text-xs">
                      <Check size={14} className="text-emerald-500" strokeWidth={3} /> {ft}
                    </li>
                  ))}
                </ul>
              </div>
              <a href="/login" className="block w-full py-3 text-center bg-slate-50 text-slate-900 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors">Sign Up</a>
            </div>

            {/* Starter Tier (Highlighted) */}
            <div className="bg-slate-900 rounded-3xl p-6 border-2 border-blue-500 shadow-xl relative text-white flex flex-col justify-between transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-lg">Most Popular</div>
              <div>
                <h3 className="text-lg font-black mb-1">Website Starter</h3>
                <p className="text-slate-400 text-xs font-semibold mb-4">Start your own digital brand.</p>
                <div className="text-3xl font-black mb-1">₦5,000</div>
                <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-6">One-Time Setup Fee</div>
                <div className="border-t border-slate-800 my-4"></div>
                <ul className="space-y-3 mb-6">
                  {["Branded Website portal", "Configure Pricing Rates", "Secure Admin Panel", "Priority customer care"].map((ft, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
                      <Check size={14} className="text-blue-400" strokeWidth={3} /> {ft}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/get-started" className="block w-full py-3 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-blue-500/10">Start Selling</Link>
            </div>

            {/* Premium Tier */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-1">Premium Website</h3>
                <p className="text-slate-400 text-xs font-semibold mb-4">Website Hosting & Maintenance.</p>
                <div className="text-3xl font-black text-slate-900 mb-6">Custom</div>
                <div className="border-t border-slate-100 my-4"></div>
                <ul className="space-y-3 mb-6">
                  {["Price Rules Engine", "Ad Banner management", "Custom Domain Routing", "Push Notification Alert"].map((ft, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-500 font-semibold text-xs">
                      <Check size={14} className="text-emerald-500" strokeWidth={3} /> {ft}
                    </li>
                  ))}
                </ul>
              </div>
              <a href="https://wa.me/2349041050812" target="_blank" rel="noreferrer" className="block w-full py-3 text-center bg-slate-50 text-slate-900 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors">Contact Sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== STATISTICS ==================== */}
      <section className="py-20 bg-slate-900 text-white px-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto text-center">
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-black tracking-tight text-blue-400">50,000+</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Clients</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-black tracking-tight text-emerald-400">1,000,000+</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Transactions</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-black tracking-tight text-white">99.9%</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Uptime SLA</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-black tracking-tight text-indigo-400">20+</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Countries Served</div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section id="faq" className="py-24 bg-white px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "Do I need technical experience to run the website?", a: "No. The platform is completely automated and requires zero coding knowledge. We handle the host mapping, API configurations, security updates, and infrastructure." },
              { q: "How are services delivered to my customers?", a: "Transactions are processed instantly via our automated switching engine directly connected to major telecom carriers (MTN, Airtel, Glo, 9mobile) and energy distributors." },
              { q: "Can I set my own prices?", a: "Yes. As the site owner, you can override service prices and determine markup profit margins directly inside the admin dashboard." }
            ].map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:border-blue-300 transition-colors">
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full px-6 py-5 text-left flex items-center justify-between font-bold text-slate-800 cursor-pointer">
                  {faq.q}
                  {activeFaq === i ? <ChevronUp className="text-blue-500" /> : <ChevronDown className="text-slate-400" />}
                </button>
                {activeFaq === i && <div className="px-6 pb-5 text-slate-500 font-semibold leading-relaxed text-sm">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA SECTION ==================== */}
      <section className="py-24 bg-slate-950 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-8 relative">
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Ready to Launch Your Digital Business?</h2>
          <p className="text-lg text-slate-400 font-semibold max-w-xl mx-auto">
            Join thousands of active website administrators already generating income on 9JASUB.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link href="/get-started" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-base hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10">
              Create Website
            </Link>
            <a href="https://wa.me/2349041050812" target="_blank" rel="noreferrer" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-base hover:bg-slate-800 transition-all border border-slate-800">
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-slate-50 border-t border-slate-200/60 pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 space-y-6">
              <Link href="/" className="flex items-center gap-3">
                <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-xl font-black text-slate-900">9JASUB</span>
              </Link>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-sm">
                Africa's leading white-label VTU distribution infrastructure, powering digital entrepreneurs across the continent.
              </p>
              <p className="text-slate-400 text-[10px] font-bold">A Product of MK GLOBAL INVESTMENT LTD.</p>
            </div>
            
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm mb-4">Company</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li><Link href="#why-choose-us" className="hover:text-blue-600 transition-colors">Why 9JASUB</Link></li>
                <li><Link href="#features" className="hover:text-blue-600 transition-colors">Features</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-extrabold text-slate-900 text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li><Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-extrabold text-slate-900 text-sm mb-4">Contact</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> 0904 105 0812</li>
                <li className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> support@9jasub.com</li>
                <li className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> Kano, Nigeria</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center pt-8 border-t border-slate-200/60">
            <p className="text-slate-400 font-bold text-xs">© 2026 9JASUB. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

