"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, Wifi, Smartphone, Zap, ShieldCheck, 
  Zap as Lightning, Globe, CheckCircle2, 
  Wallet, PlaySquare, Code, Users, Activity, 
  MessagesSquare, Phone, Mail, MapPin, 
  Briefcase, MessageCircle, ArrowUpRight, Check, CheckSquare,
  ChevronDown, ChevronUp, Download, Play, Shield, Award, Clock, User, ArrowDown,
  Share2, BarChart, Layout, Settings, Rocket
} from 'lucide-react';

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeShowcase, setActiveShowcase] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showcaseItems = [
    { id: 0, title: "Website Admin Dashboard", icon: <Briefcase size={16}/> },
    { id: 1, title: "Customer Dashboard", icon: <Users size={16}/> },
    { id: 2, title: "Personal Dashboard", icon: <Wallet size={16}/> },
    { id: 3, title: "Mobile App", icon: <Smartphone size={16}/> }
  ];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] selection:bg-blue-100 selection:text-blue-900 font-sans">
      
      {/* 1. NAVIGATION */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/50 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.jpg" alt="9JASUB Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform" />
            <span className="text-2xl font-black tracking-tight text-slate-900">9JASUB</span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-8 bg-white/50 backdrop-blur-md px-8 py-3 rounded-full border border-slate-200/50 shadow-sm">
            <Link href="/" className="text-slate-600 hover:text-blue-600 font-bold transition-colors">Home</Link>
            <Link href="/services" className="text-slate-600 hover:text-blue-600 font-bold transition-colors">Services</Link>
            <Link href="/get-started" className="text-slate-600 hover:text-blue-600 font-bold transition-colors">Own your VTU site in 5 mins</Link>
            <Link href="/about" className="text-slate-600 hover:text-blue-600 font-bold transition-colors">About Us</Link>
            <Link href="/#contact" className="text-slate-600 hover:text-blue-600 font-bold transition-colors">Contact Us</Link>
          </div>

          <div className="flex items-center gap-4">
            <a href={`${appUrl}/login`} className="hidden sm:block text-slate-700 hover:text-blue-600 font-bold px-4 transition-colors">Login</a>
            <Link href="/get-started" className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden bg-white">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-50/50 to-white -z-10" />
        <div className="absolute top-20 right-0 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[100px] -z-10" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-black tracking-widest uppercase border border-blue-100 shadow-sm animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              Premium Fintech Platform
            </div>
            
            <h1 className="text-5xl lg:text-[4.5rem] font-black text-slate-900 leading-[1.05] tracking-tight">
              Own Your Own VTU Website & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">Mobile App</span>
            </h1>
            
            <p className="text-xl text-slate-500 max-w-xl leading-relaxed font-medium">
              Start your own branded digital business in minutes. Your Brand. Your Website. Your Customers. Your Dashboard. Your Income. No coding required. Start free or launch your business for just ₦5,000.
            </p>

            <ul className="grid sm:grid-cols-2 gap-4 pt-2">
              {[
                "Your Own Brand",
                "Your Own Mobile App",
                "Your Own Website",
                "Automated Delivery",
                "Your Own Admin Dashboard",
                "Technical Support"
              ].map((benefit, i) => (
                <li key={i} className="flex items-center gap-3 font-bold text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link href="/get-started" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all group">
                💼 Launch My Business
              </Link>
              <Link href="/get-started" className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group">
                🚀 Start Free
              </Link>
            </div>
          </div>

          <div className="relative animate-float lg:block z-10">
            {/* Real 9JASUB Dashboard Screenshot */}
            <div className="relative bg-[#0F172A] rounded-[32px] shadow-2xl shadow-slate-900/20 border-8 border-slate-800 overflow-hidden h-[580px] flex flex-col transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
               <img src="/dashboard_screenshot.png" alt="9JASUB Dashboard" className="w-full h-full object-contain object-top" />
            </div>
            
            <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl shadow-xl flex items-center gap-4 z-20 animate-bounce-slow">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                <Globe size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</p>
                <p className="text-lg font-black text-slate-900">Live & Selling</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 HOW YOUR VTU BUSINESS WORKS */}
      <section id="business-journey" className="py-24 bg-slate-50 px-6 border-t border-slate-200/50 overflow-hidden relative">
        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Section Header */}
          <div className="text-center mb-20 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-xs font-black tracking-widest uppercase border border-blue-200 shadow-sm mx-auto">
              <Rocket size={14} /> Start Your VTU Business Today
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
              Own Your Professional VTU Website & App for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Only ₦5,000</span>
            </h2>
            
            <div className="text-lg md:text-xl text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">
              <p className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4 font-bold text-slate-700">
                <span><CheckCircle2 size={20} className="inline text-emerald-500 mr-1"/> No huge capital.</span>
                <span><CheckCircle2 size={20} className="inline text-emerald-500 mr-1"/> No expensive software.</span>
                <span><CheckCircle2 size={20} className="inline text-emerald-500 mr-1"/> No coding knowledge.</span>
                <span><CheckCircle2 size={20} className="inline text-emerald-500 mr-1"/> No monthly development fees.</span>
              </p>
              <p>Launch your own branded VTU business and start selling digital services with just a one-time activation.</p>
            </div>
          </div>

          {/* 6-Step Journey Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-y-16 mb-24 relative mt-10">
            {/* Connecting lines for desktop */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 z-0 opacity-50" />
            
            {[
              { num: 1, title: "Create Your Account", icon: <User size={24}/>, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", desc: "Create your VTU website in just a few minutes." },
              { num: 2, title: "Activate Website", icon: <ShieldCheck size={24}/>, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", desc: "Start with a 3-day free trial, then activate your website with ₦5,000 only." },
              { num: 3, title: "Get Your Portal", icon: <Layout size={24}/>, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", desc: "Receive your own professional website, admin dashboard, and customer portal." },
              { num: 4, title: "Set Your Prices", icon: <Settings size={24}/>, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", desc: "Set your own selling prices and begin offering services such as airtime, data bundles, electricity payments, cable TV subscriptions, exam PINs, and more." },
              { num: 5, title: "Promote & Sell", icon: <Share2 size={24}/>, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", desc: "Promote your website on WhatsApp, Facebook, Instagram, TikTok, or any social media platform and grow your customer base." },
              { num: 6, title: "Manage Business", icon: <BarChart size={24}/>, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", desc: "Manage your business from anywhere using your dashboard and monitor sales, customers, referrals, and earnings." },
            ].map((step, i) => (
              <div key={i} className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/40 border border-slate-100 relative z-10 hover:-translate-y-2 transition-transform duration-300 mt-6 lg:mt-0">
                <div className="absolute -top-6 -left-6 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-2xl shadow-lg border-4 border-slate-50">
                  {step.num}
                </div>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${step.bg} ${step.color} ${step.border}`}>
                  {step.icon}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Premium Highlight Card */}
          <div className="bg-slate-900 rounded-[40px] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden mb-24 max-w-5xl mx-auto border border-slate-800">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <h3 className="text-3xl md:text-4xl font-black text-white">Why People Love 9JASUB</h3>
              <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed">
                Unlike many VTU businesses that require large startup capital, 9JASUB allows you to launch your own professional VTU website with <span className="text-white font-bold">a 3-day free trial and only a ₦5,000 activation</span>.
              </p>
              <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed">
                You can start building your customer base immediately and grow your business over time.
              </p>
            </div>
          </div>

          {/* Four Feature Highlights */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {[
              { icon: <Wallet size={24}/>, title: "3-Day Free Trial", bg: "bg-emerald-50", text: "text-emerald-600", desc: "Launch your branded VTU website and try it free for 3 days before a simple ₦5,000 activation." },
              { icon: <Globe size={24}/>, title: "Your Own Website", bg: "bg-blue-50", text: "text-blue-600", desc: "Operate under your own business name with a professional online presence." },
              { icon: <Share2 size={24}/>, title: "Sell Anywhere", bg: "bg-purple-50", text: "text-purple-600", desc: "Share your website across WhatsApp, Facebook, Instagram, TikTok, X, and other platforms." },
              { icon: <Activity size={24}/>, title: "Grow Your Business", bg: "bg-amber-50", text: "text-amber-600", desc: "Expand your customer base, manage referrals, and increase your earning opportunities from one dashboard." }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-md shadow-slate-200/20 hover:shadow-lg transition-all duration-300">
                <div className={`w-14 h-14 rounded-xl ${f.bg} ${f.text} flex items-center justify-center mb-6`}>
                  {f.icon}
                </div>
                <h4 className="font-bold text-slate-900 text-lg mb-3 leading-tight">{f.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center space-y-8">
            <h3 className="text-3xl font-black text-slate-900">Ready to Start Your Digital Business?</h3>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/get-started" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all">
                Create My Website <ArrowRight size={20} />
              </Link>
              <Link href="/#how-it-works" className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
                Learn How It Works
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 3. WHY CHOOSE 9JASUB (Features) */}
      <section className="py-24 bg-white px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Premium Features
            </h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
              Everything you need to run a successful digital business under one roof.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { icon: <Globe size={24}/>, title: "Own Website", bg: "bg-blue-50", text: "text-blue-600" },
              { icon: <Briefcase size={24}/>, title: "Own Brand", bg: "bg-emerald-50", text: "text-emerald-600" },
              { icon: <Shield size={24}/>, title: "Own Admin Dashboard", bg: "bg-amber-50", text: "text-amber-600" },
              { icon: <Users size={24}/>, title: "Customer Portal", bg: "bg-purple-50", text: "text-purple-600" },
              { icon: <Zap size={24}/>, title: "Automated Delivery", bg: "bg-rose-50", text: "text-rose-600" },
              { icon: <Wallet size={24}/>, title: "Wallet Management", bg: "bg-indigo-50", text: "text-indigo-600" },
              { icon: <ShieldCheck size={24}/>, title: "Secure Payments", bg: "bg-cyan-50", text: "text-cyan-600" },
              { icon: <Activity size={24}/>, title: "Business Analytics", bg: "bg-slate-100", text: "text-slate-800" },
              { icon: <Smartphone size={24}/>, title: "Mobile App", bg: "bg-fuchsia-50", text: "text-fuchsia-600" },
              { icon: <Award size={24}/>, title: "Business Growth", bg: "bg-sky-50", text: "text-sky-600" }
            ].map((f, i) => (
              <div key={i} className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-100 transition-all duration-300 flex flex-col items-center gap-4 text-center">
                <div className={`w-14 h-14 rounded-xl ${f.bg} ${f.text} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h4 className="font-bold text-slate-800">{f.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PLATFORM SHOWCASE */}
      <section id="showcase" className="py-24 bg-[#F8FAFC] px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">SEE THE PLATFORM IN ACTION</h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
              Explore the powerful interfaces designed specifically for your digital business.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {showcaseItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => setActiveShowcase(item.id)}
                className={`px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${
                  activeShowcase === item.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' 
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {item.icon} {item.title}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-[32px] p-4 md:p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 max-w-5xl mx-auto">
            <div className="bg-[#0F172A] rounded-2xl overflow-hidden shadow-inner border border-slate-800 h-[450px] relative">
              <div className="bg-slate-900 px-4 py-3 flex items-center gap-3 border-b border-slate-800">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <div className="bg-slate-800 flex-1 rounded-md h-6 max-w-md mx-auto flex items-center justify-center px-4">
                  <span className="text-[10px] text-slate-400 font-mono">https://9jasub.com/{
                    activeShowcase === 0 ? 'admin' :
                    activeShowcase === 1 ? 'customer-portal' :
                    activeShowcase === 2 ? 'personal-dashboard' : 'mobile-app'
                  }</span>
                </div>
              </div>

              <div className="h-full flex items-center justify-center bg-[#1E293B] relative overflow-hidden">
                <img src="/dashboard_screenshot.png" alt="9JASUB Showcase" className="w-full h-full object-contain object-top" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BUSINESS PACKAGES (Pricing) */}
      <section id="pricing" className="py-24 bg-slate-900 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Choose Your Plan</h2>
            <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto">
              Transparent pricing tailored for individuals and entrepreneurs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 text-white">
              <h3 className="text-2xl font-black mb-2">Personal Account</h3>
              <p className="text-slate-400 text-sm font-medium mb-6">For personal daily usage.</p>
              <div className="text-4xl font-black mb-8">FREE</div>
              <ul className="space-y-4 mb-8">
                {[
                  "Account Registration", "Data Purchase", "Airtime Purchase", "Bill Payments"
                ].map((ft, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                    <CheckCircle2 size={18} className="text-blue-400" /> {ft}
                  </li>
                ))}
              </ul>
              <Link href="/get-started" className="block w-full py-4 text-center bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors">
                Get Started
              </Link>
            </div>

            <div className="bg-gradient-to-b from-blue-600 to-indigo-700 rounded-3xl p-8 border-2 border-blue-400 shadow-2xl shadow-blue-900/50 text-white transform md:-translate-y-4 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <h3 className="text-2xl font-black mb-2">WEBSITE STARTER</h3>
              <p className="text-blue-200 text-sm font-medium mb-6">Launch your own brand today.</p>
              <div className="text-5xl font-black mb-8">₦5,000<span className="text-lg text-blue-300 font-medium">/setup</span></div>
              <ul className="space-y-4 mb-8">
                {[
                  "Personal VTU Website", "Mobile App Access", "Business Dashboard", "Business Owner Features", "Technical Support"
                ].map((ft, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={4} />
                    </div>
                    {ft}
                  </li>
                ))}
              </ul>
              <Link href="/get-started" className="block w-full py-4 text-center bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-black text-lg transition-colors shadow-lg">
                Own Your Website
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5.5 LIFETIME REFERRAL REWARDS SECTION (NEW) */}
      <section id="referrals" className="py-24 bg-[#F8FAFC] px-6 border-y border-slate-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-[100px] -z-10" />
        
        <div className="max-w-7xl mx-auto space-y-24 relative z-10">
          
          {/* HERO GRID */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black tracking-widest uppercase border border-emerald-100 shadow-sm animate-fade-in">
                <Activity size={14} /> Grow Your Business
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
                One Referral Can Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">Monthly Income</span>
              </h2>
              
              <p className="text-xl text-slate-500 max-w-xl leading-relaxed font-medium">
                Help more people launch their own VTU Website & App and grow your digital business. Every successful website activation through your referral strengthens your network and unlocks referral rewards based on your account level. As your network grows, your earning potential grows too.
              </p>
            </div>
            
            {/* INFOGRAPHIC */}
            <div className="relative animate-float lg:block">
              <div className="bg-white rounded-[32px] p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 relative">
                
                {/* Floating Badges */}
                <div className="absolute -right-6 top-10 bg-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100 animate-bounce-slow">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <Award size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Referral Reward</p>
                  </div>
                </div>

                <div className="absolute -left-6 bottom-20 bg-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100 z-20" style={{ animation: "float 7s ease-in-out infinite" }}>
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <Zap size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Website Activation</p>
                  </div>
                </div>
                
                <div className="absolute -right-4 bottom-8 bg-slate-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800 z-20 animate-bounce-slow">
                  <div className="w-8 h-8 bg-white/10 text-white rounded-full flex items-center justify-center">
                    <Award size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">Referral Bonus</p>
                  </div>
                </div>

                <div className="absolute top-1/2 -translate-y-1/2 -left-8 bg-indigo-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-indigo-100 z-20 animate-bounce-slow" style={{ animationDelay: "1s" }}>
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-indigo-900">Lifetime Earnings</p>
                  </div>
                </div>

                {/* Flowchart Structure */}
                <div className="flex flex-col items-center py-6">
                  {/* YOU Node */}
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-2 z-10 relative">
                    <User size={32} />
                    <div className="absolute -bottom-6 text-sm font-black text-slate-700">YOU</div>
                  </div>
                  
                  {/* Vertical Line */}
                  <div className="w-1 h-12 bg-slate-200 rounded-full my-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                  
                  {/* Horizontal Branching */}
                  <div className="w-full max-w-[280px] h-1 bg-slate-200 rounded-full relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-blue-500 rounded-full animate-pulse opacity-50"></div>
                  </div>
                  
                  {/* Connections & Downward lines */}
                  <div className="flex justify-between w-full max-w-[300px] px-2 relative -top-1">
                    <div className="w-1 h-8 bg-slate-200 rounded-full"></div>
                    <div className="w-1 h-8 bg-slate-200 rounded-full"></div>
                    <div className="w-1 h-8 bg-slate-200 rounded-full"></div>
                    <div className="w-1 h-8 bg-slate-200 rounded-full"></div>
                  </div>
                  
                  {/* Users Row */}
                  <div className="flex justify-between w-full max-w-[340px] mt-2 z-10">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-slate-100 border-2 border-slate-200 rounded-full flex items-center justify-center text-slate-500 mb-2 hover:border-blue-400 hover:text-blue-600 transition-colors bg-white">
                          <Users size={20} />
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wider">Website<br/>Owner</div>
                      </div>
                    ))}
                  </div>

                  {/* Automatic Reward Section */}
                  <div className="w-1 h-12 border-l-2 border-dashed border-emerald-300 my-4 relative">
                    <ArrowDown className="absolute -bottom-4 -left-3 text-emerald-500 animate-bounce" size={24} />
                  </div>
                  
                  <div className="mt-4 px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 font-bold flex items-center gap-2">
                    <ShieldCheck size={18} /> Automatic Referral Rewards
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE CARDS */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Award size={24}/>, title: "Lifetime Referral Rewards", bg: "bg-blue-50", text: "text-blue-600", desc: "Earn rewards whenever your referred website owners successfully activate their websites." },
              { icon: <Users size={24}/>, title: "Unlimited Referrals", bg: "bg-purple-50", text: "text-purple-600", desc: "Invite as many people as you like and continue growing your digital business." },
              { icon: <Activity size={24}/>, title: "Instant Reward Tracking", bg: "bg-emerald-50", text: "text-emerald-600", desc: "Track referral activities and rewards directly from your dashboard." },
              { icon: <Briefcase size={24}/>, title: "Built Into Every Website", bg: "bg-amber-50", text: "text-amber-600", desc: "Every Website Owner automatically receives a referral link to help grow their business." }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/20 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300">
                <div className={`w-14 h-14 rounded-xl ${f.bg} ${f.text} flex items-center justify-center mb-6`}>
                  {f.icon}
                </div>
                <h4 className="font-bold text-slate-900 text-lg mb-3 leading-tight">{f.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* HIGHLIGHT BOX */}
          <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden border border-slate-800 max-w-5xl mx-auto text-center">
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
          </div>

          {/* CTA */}
          <div className="text-center space-y-8 pt-8">
            <h3 className="text-3xl font-black text-slate-900">Start Building Your Referral Business Today</h3>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/get-started" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all">
                Start Your VTU Business <ArrowRight size={20} />
              </Link>
              <Link href="/#pricing" className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
                View Pricing
              </Link>
            </div>
          </div>
          
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">How It Works</h2>
            <p className="text-lg text-slate-500 font-medium">Your journey to financial independence in 5 simple steps.</p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0" />
            
            <div className="grid md:grid-cols-5 gap-8 relative z-10">
              {[
                { s: 1, t: "Create Free Account", bg: "bg-blue-100", c: "text-blue-600" },
                { s: 2, t: "Choose Website Plan", bg: "bg-amber-100", c: "text-amber-600" },
                { s: 3, t: "Receive Your Website", bg: "bg-emerald-100", c: "text-emerald-600" },
                { s: 4, t: "Customize Your Brand", bg: "bg-purple-100", c: "text-purple-600" },
                { s: 5, t: "Start Selling", bg: "bg-rose-100", c: "text-rose-600" }
              ].map((step) => (
                <div key={step.s} className="text-center group">
                  <div className={`w-16 h-16 mx-auto ${step.bg} ${step.c} rounded-2xl flex items-center justify-center text-2xl font-black mb-4 group-hover:scale-110 transition-transform shadow-sm border-4 border-white`}>
                    {step.s}
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm max-w-[120px] mx-auto leading-tight">{step.t}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. BUSINESS BENEFITS (Trust & Stats) */}
      <section className="py-16 bg-slate-900 text-white border-y border-slate-800 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: <Activity size={24} className="text-blue-400" />, stat: "99.9%", label: "Platform Uptime" },
              { icon: <Clock size={24} className="text-emerald-400" />, stat: "24/7", label: "Dedicated Support" },
              { icon: <Zap size={24} className="text-amber-400" />, stat: "Instant", label: "Service Delivery" },
              { icon: <Shield size={24} className="text-purple-400" />, stat: "100%", label: "Secure Transactions" }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-2 group">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-slate-700 transition-all duration-300">
                  {item.icon}
                </div>
                <h3 className="text-3xl font-black">{item.stat}</h3>
                <p className="text-slate-400 font-medium text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. MOBILE APP SECTION */}
      <section className="py-24 bg-blue-600 px-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="md:w-1/2 space-y-8 text-white">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Download 9JASUB Mobile App
            </h2>
            <p className="text-xl text-blue-100 font-medium">
              Access your business anywhere and anytime. Buy data, track sales, and manage your wallet on the go.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a href="#" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black transition-all">
                <Play className="fill-current" /> Google Play
              </a>
              <button disabled className="px-8 py-4 bg-blue-700/50 text-blue-200 rounded-2xl font-bold flex items-center justify-center gap-3 cursor-not-allowed border border-blue-500/50">
                App Store (Coming Soon)
              </button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="w-64 h-[500px] bg-[#0F172A] rounded-[3rem] border-8 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col transform rotate-3">
              <div className="absolute top-0 w-full h-6 bg-slate-800 rounded-t-2xl flex justify-center items-center z-20">
                <div className="w-16 h-4 bg-black rounded-b-xl"></div>
              </div>
              <div className="flex-1 bg-[#1E293B] mt-6 relative overflow-hidden">
                <img src="/vtu_home_screenshot.png" alt="9JASUB Mobile App" className="w-full h-full object-contain object-top" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. ABOUT COMPANY */}
      <section id="about" className="py-24 bg-[#F8FAFC] px-6 border-y border-slate-200/50">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-block p-4 bg-blue-100 rounded-3xl text-blue-600 mb-2">
            <Globe size={40} />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">About 9JASUB</h2>
          <div className="text-lg text-slate-600 leading-relaxed font-medium space-y-6">
            <p>9JASUB is a premium product of <strong className="text-slate-900">MK GLOBAL INVESTMENT LTD</strong>, proudly based in Kano, Nigeria.</p>
            <p>9JASUB provides the technology that enables entrepreneurs to own their own branded VTU websites and mobile apps, alongside reliable Data Subscription, Airtime VTU, and Bill Payment services.</p>
            <p className="text-xl font-bold text-blue-600">Our mission is to empower entrepreneurs with affordable technology and business tools.</p>
          </div>
        </div>
      </section>

      {/* 10. FAQ SECTION */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {[
              { q: "How does the ₦5,000 setup work?", a: "The ₦5,000 is a one-time setup fee that automatically provisions your business dashboard, sets up your custom website, and grants you business owner access instantly." },
              { q: "Do I need technical experience?", a: "Absolutely not! The platform is 100% automated. You don't need to know how to code to run your VTU business." },
              { q: "Can I own my own website?", a: "Yes, by purchasing the Website Starter package, you automatically become a business owner and can set your own prices for your customers on your branded website." },
              { q: "How are transactions delivered?", a: "Transactions are processed instantly via our automated switching engine connected directly to telecom providers." },
              { q: "How do I contact support?", a: "You can reach us 24/7 via the WhatsApp button, or email us at support@9jasub.com." }
            ].map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:border-blue-300 transition-colors">
                <button 
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between font-bold text-slate-800"
                >
                  {faq.q}
                  {activeFaq === i ? <ChevronUp className="text-blue-500" /> : <ChevronDown className="text-slate-400" />}
                </button>
                {activeFaq === i && (
                  <div className="px-6 pb-5 text-slate-600 font-medium leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. CONTACT SECTION */}
      <section id="contact" className="py-24 bg-slate-50 px-6 border-t border-slate-200/50">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[80px] opacity-20" />
          
          <div className="grid md:grid-cols-2 gap-12 relative z-10 text-white">
            <div className="space-y-6">
              <h2 className="text-4xl font-black tracking-tight">Get In Touch</h2>
              <p className="text-slate-400 font-medium text-lg">We're here to help you start and scale your VTU business.</p>
              
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center shrink-0"><Phone /></div>
                  <div>
                    <p className="text-sm text-slate-400 font-bold">Phone</p>
                    <p className="text-lg font-bold">0904 105 0812</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0"><Mail /></div>
                  <div>
                    <p className="text-sm text-slate-400 font-bold">Email</p>
                    <p className="text-lg font-bold">support@9jasub.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center shrink-0"><MapPin /></div>
                  <div>
                    <p className="text-sm text-slate-400 font-bold">Location</p>
                    <p className="text-lg font-bold">Kano, Nigeria</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-center gap-4">
              <a href="tel:09041050812" className="px-6 py-4 bg-white text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-100 transition-colors">
                <Phone size={20} /> Call Now
              </a>
              <a href="mailto:support@9jasub.com" className="px-6 py-4 bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-700 transition-colors border border-slate-700">
                <Mail size={20} /> Send Email
              </a>
              <a href="https://wa.me/2349041050812" target="_blank" rel="noreferrer" className="px-6 py-4 bg-[#25D366] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#128C7E] transition-colors shadow-lg shadow-[#25D366]/20">
                <MessageCircle size={20} /> Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 12. FOOTER */}
      <footer className="bg-white border-t border-slate-200 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-3">
                <img src="/logo.jpg" alt="9JASUB Logo" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-xl font-black text-slate-900">9JASUB</span>
              </Link>
              <p className="text-slate-500 font-bold text-sm">Data • Airtime • Bills • VTU Solutions</p>
              <p className="text-slate-400 text-sm font-medium">A Product of MK GLOBAL INVESTMENT LTD.</p>
            </div>
            
            <div>
              <h4 className="font-black text-slate-900 mb-6">Quick Links</h4>
              <ul className="space-y-4">
                <li><Link href="/" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">Home</Link></li>
                <li><Link href="/#pricing" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">Pricing</Link></li>
                <li><Link href="/#how-it-works" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">How It Works</Link></li>
                <li><Link href="/#about" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">About Us</Link></li>
                <li><a href={`${appUrl}/login`} className="text-slate-500 hover:text-blue-600 font-medium transition-colors">Login</a></li>
                <li><Link href="/#contact" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">Contact Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-black text-slate-900 mb-6">Legal Links</h4>
              <ul className="space-y-4">
                <li><Link href="/privacy" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">Terms of Service</Link></li>
                <li><Link href="/terms#refund" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-black text-slate-900 mb-6">Contact</h4>
              <ul className="space-y-4 text-slate-500 font-medium">
                <li className="flex items-center gap-2"><Phone size={16}/> 0904 105 0812</li>
                <li className="flex items-center gap-2"><Mail size={16}/> support@9jasub.com</li>
                <li className="flex items-center gap-2"><MapPin size={16}/> Kano, Nigeria</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center pt-8 border-t border-slate-200">
            <p className="text-slate-400 font-bold text-sm">© 2026 9JASUB. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
