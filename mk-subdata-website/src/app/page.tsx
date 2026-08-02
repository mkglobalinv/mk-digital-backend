"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, Smartphone, ShieldCheck, 
  Globe, CheckCircle2, Wallet, Users, 
  Phone, Mail, MapPin, Briefcase, 
  Check, ChevronDown, ChevronUp, Zap, Activity, Award
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
    { id: 0, title: "Admin Dashboard", icon: <Briefcase size={16}/> },
    { id: 1, title: "Customer Portal", icon: <Users size={16}/> },
    { id: 2, title: "Mobile App", icon: <Smartphone size={16}/> }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] selection:bg-blue-100 selection:text-blue-900 font-sans">
      
      {/* 1. NAVIGATION & HERO */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/50 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.jpg" alt="9JASUB Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform" />
            <span className="text-2xl font-black tracking-tight text-slate-900">9JASUB</span>
          </Link>
          <div className="hidden lg:flex items-center gap-8 bg-white/50 backdrop-blur-md px-8 py-3 rounded-full border border-slate-200/50 shadow-sm">
            <Link href="#why-choose-us" className="text-slate-600 hover:text-blue-600 font-bold transition-colors">Why 9JASUB</Link>
            <Link href="#how-it-works" className="text-slate-600 hover:text-blue-600 font-bold transition-colors">How It Works</Link>
            <Link href="#pricing" className="text-slate-600 hover:text-blue-600 font-bold transition-colors">Pricing</Link>
            <Link href="#faq" className="text-slate-600 hover:text-blue-600 font-bold transition-colors">FAQ</Link>
          </div>
          <div className="flex items-center gap-4">
            <a href="/login" className="hidden sm:block text-slate-700 hover:text-blue-600 font-bold px-4 transition-colors">Login</a>
            <a href="/get-started" className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/25">Get Started</a>
          </div>
        </div>
      </nav>

      <section className="relative pt-40 pb-24 px-6 overflow-hidden bg-white">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-50/50 to-white -z-10" />
        <div className="absolute top-20 right-0 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[120px] -z-10" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6 z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-black tracking-widest border border-blue-100">
              🚀 Start Your Own VTU Website for Just ₦5,000!
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
              No wallet funding required to start selling.
            </h1>
            <ul className="flex flex-col gap-3 pt-2">
              {["Your own branded VTU website", "Sell Data, Airtime, Cable TV, Electricity & Exam Pins", "Start earning immediately", "We handle the technical setup"].map((benefit, i) => (
                <li key={i} className="flex items-center gap-3 font-bold text-slate-700 text-lg">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2 flex flex-col gap-2">
              <div className="text-xl font-black text-slate-800 flex items-center gap-2 mb-2">
                💰 One-Time Setup Fee: ₦5,000
              </div>
              <div className="flex gap-4">
                <Link href="/get-started" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-lg flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">
                  GET YOUR OWN VTU SITE Today! <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </div>

          <div className="relative animate-float lg:block z-10">
            <div className="relative bg-[#0F172A] rounded-[32px] shadow-2xl border-8 border-slate-800 overflow-hidden h-[580px] flex flex-col transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
               <img src="/dashboard_screenshot.png" alt="Dashboard" className="w-full h-full object-contain object-top" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHY CHOOSE 9JASUB */}
      <section id="why-choose-us" className="py-24 bg-slate-50 px-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Why Choose 9JASUB</h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
              Everything you need to run a profitable digital business.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Globe size={24}/>, title: "White-Label Website", desc: "Operate completely under your own custom domain and brand identity." },
              { icon: <Zap size={24}/>, title: "Instant Delivery", desc: "All airtime, data, and utility transactions are processed automatically." },
              { icon: <ShieldCheck size={24}/>, title: "Secure Infrastructure", desc: "Bank-grade security and 99.9% uptime for your peace of mind." },
              { icon: <Briefcase size={24}/>, title: "Full Admin Control", desc: "Set your own pricing, manage customers, and track your profits." }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                  {f.icon}
                </div>
                <h4 className="font-bold text-slate-900 text-lg mb-2">{f.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. PLATFORM PREVIEW */}
      <section id="showcase" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Platform Preview</h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
              Explore the professional interfaces designed for you and your customers.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {showcaseItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => setActiveShowcase(item.id)}
                className={`px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${
                  activeShowcase === item.id 
                    ? 'bg-slate-900 text-white shadow-lg scale-105' 
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {item.icon} {item.title}
              </button>
            ))}
          </div>

          <div className="bg-slate-50 rounded-[32px] p-4 md:p-8 border border-slate-100 max-w-5xl mx-auto">
            <div className="bg-[#0F172A] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 h-[500px] relative flex flex-col">
              <div className="bg-slate-900 px-4 py-3 flex items-center gap-3 border-b border-slate-800">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
              </div>
              <div className="flex-1 bg-[#1E293B] flex items-center justify-center overflow-hidden">
                <img 
                  src={activeShowcase === 2 ? "/vtu_home_screenshot.png" : "/dashboard_screenshot.png"} 
                  alt="Platform Preview" 
                  className="w-full h-full object-contain object-top" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-slate-900 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl font-black text-white tracking-tight">How It Works</h2>
            <p className="text-lg text-slate-400 font-medium">Launch your business in three simple steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative z-10 max-w-5xl mx-auto">
            {[
              { s: 1, t: "Register", d: "Create your free account instantly." },
              { s: 2, t: "Activate Website", d: "Upgrade your account and get your branded platform." },
              { s: 3, t: "Start Selling", d: "Set your prices and start earning profits immediately." }
            ].map((step) => (
              <div key={step.s} className="text-center group bg-slate-800 p-8 rounded-[32px] border border-slate-700">
                <div className="w-16 h-16 mx-auto bg-blue-500 text-white rounded-2xl flex items-center justify-center text-2xl font-black mb-6 shadow-lg shadow-blue-500/25">
                  {step.s}
                </div>
                <h4 className="font-black text-white text-xl mb-3">{step.t}</h4>
                <p className="text-slate-400 font-medium">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PRICING */}
      <section id="pricing" className="py-24 bg-white px-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Simple Pricing</h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">No hidden fees. Choose the right plan for your needs.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Personal */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200">
              <h3 className="text-2xl font-black mb-2 text-slate-900">Personal</h3>
              <p className="text-slate-500 text-sm font-medium mb-6">For individual usage.</p>
              <div className="text-4xl font-black mb-8 text-slate-900">FREE</div>
              <ul className="space-y-4 mb-8">
                {["Buy Data & Airtime", "Pay Utility Bills", "Standard Support"].map((ft, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                    <CheckCircle2 size={18} className="text-slate-400" /> {ft}
                  </li>
                ))}
              </ul>
              <a href="/login" className="block w-full py-4 text-center bg-slate-100 text-slate-900 hover:bg-slate-200 rounded-xl font-bold transition-colors">Sign Up</a>
            </div>

            {/* Starter */}
            <div className="bg-slate-900 rounded-3xl p-8 border-2 border-blue-500 shadow-2xl shadow-blue-900/20 transform md:-translate-y-4 relative text-white">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">Most Popular</div>
              <h3 className="text-2xl font-black mb-2">Website Starter</h3>
              <p className="text-blue-200 text-sm font-medium mb-6">Launch your business.</p>
              <div className="text-5xl font-black mb-8">₦5,000<span className="text-lg text-blue-300 font-medium">/setup</span></div>
              <ul className="space-y-4 mb-8">
                {["Branded Website", "Set Your Own Prices", "Admin Dashboard", "Priority Support"].map((ft, i) => (
                  <li key={i} className="flex items-center gap-3 font-medium">
                    <CheckCircle2 size={18} className="text-blue-400" /> {ft}
                  </li>
                ))}
              </ul>
              <Link href="/get-started" className="block w-full py-4 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-colors">Start Selling</Link>
            </div>

            {/* Premium */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200">
              <h3 className="text-2xl font-black mb-2 text-slate-900">Premium Website</h3>
              <p className="text-slate-500 text-sm font-medium mb-6">For established businesses.</p>
              <div className="text-4xl font-black mb-8 text-slate-900">Custom</div>
              <ul className="space-y-4 mb-8">
                {["Price Rules", "Banners & Ads", "Alert Notifications", "Custom Domain & Branding"].map((ft, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                    <CheckCircle2 size={18} className="text-slate-400" /> {ft}
                  </li>
                ))}
              </ul>
              <a href="/login" className="block w-full py-4 text-center bg-slate-100 text-slate-900 hover:bg-slate-200 rounded-xl font-bold transition-colors">Contact Sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. REFERRAL PROGRAM */}
      <section className="py-24 bg-[#F8FAFC] px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-blue-600 rounded-[40px] p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 text-white shadow-2xl shadow-blue-600/20 overflow-hidden relative">
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-white opacity-10 rounded-full blur-[80px]" />
            <div className="flex-1 space-y-6 z-10">
              <h2 className="text-4xl font-black tracking-tight">Refer & Earn Lifelong Income</h2>
              <p className="text-xl text-blue-100 font-medium max-w-lg">
                Invite entrepreneurs to launch their VTU websites and earn 15% of the platform profit from their active customers.
              </p>
              <ul className="space-y-3 pt-2">
                <li className="flex items-center gap-3 font-bold"><Award className="text-amber-400"/> 15% Platform Profit Commission</li>
                <li className="flex items-center gap-3 font-bold"><Activity className="text-emerald-400"/> Automatic Daily Payouts</li>
              </ul>
            </div>
            <div className="w-full md:w-auto z-10">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl text-center">
                <div className="text-sm font-bold uppercase tracking-wider text-blue-200 mb-2">Commission Rate</div>
                <div className="text-6xl font-black text-white mb-4">15%</div>
                <Link href="/get-started" className="block w-full px-8 py-4 bg-white text-blue-700 rounded-xl font-black hover:bg-slate-50 transition-colors">
                  Start Earning
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section id="faq" className="py-24 bg-white px-6 border-y border-slate-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "Do I need technical experience to run the website?", a: "No. The platform is completely automated and requires zero coding knowledge." },
              { q: "How are services delivered to my customers?", a: "Transactions are processed instantly via our automated switching engine directly connected to telecom providers." },
              { q: "Can I set my own prices?", a: "Yes. As a website owner, you have full control over your pricing and profit margins from the admin dashboard." }
            ].map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:border-blue-300 transition-colors">
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full px-6 py-5 text-left flex items-center justify-between font-bold text-slate-800">
                  {faq.q}
                  {activeFaq === i ? <ChevronUp className="text-blue-500" /> : <ChevronDown className="text-slate-400" />}
                </button>
                {activeFaq === i && <div className="px-6 pb-5 text-slate-600 font-medium leading-relaxed">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FINAL CALL TO ACTION */}
      <section className="py-24 bg-slate-900 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Ready to launch your business?</h2>
          <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">Join thousands of entrepreneurs running successful VTU platforms on 9JASUB.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link href="/get-started" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-colors">
              Create Account
            </Link>
            <a href="https://wa.me/2349041050812" target="_blank" rel="noreferrer" className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-bold text-lg hover:bg-slate-700 transition-colors border border-slate-700">
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-3">
                <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-xl font-black text-slate-900">9JASUB</span>
              </Link>
              <p className="text-slate-500 text-sm font-medium">A Product of MK GLOBAL INVESTMENT LTD.</p>
            </div>
            <div>
              <h4 className="font-black text-slate-900 mb-6">Platform</h4>
              <ul className="space-y-3">
                <li><Link href="#how-it-works" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">How It Works</Link></li>
                <li><Link href="#pricing" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-slate-900 mb-6">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="/privacy" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-slate-900 mb-6">Contact</h4>
              <ul className="space-y-3 text-slate-500 font-medium">
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
