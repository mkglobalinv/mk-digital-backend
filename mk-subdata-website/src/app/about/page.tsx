import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Target, Eye, Globe } from 'lucide-react';

export const metadata = {
  title: 'About 9JASUB | Our Mission & Vision',
  description: 'Learn more about 9JASUB, a digital utility and fintech platform operated by MK GLOBAL INVESTMENT LTD.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About 9JASUB | Our Mission & Vision',
    description: 'Learn more about 9JASUB, a digital utility and fintech platform operated by MK GLOBAL INVESTMENT LTD.',
    url: '/about',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-100 selection:text-emerald-900 pb-20">

      {/* Simple Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 py-5 px-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-extrabold text-xl tracking-tight text-slate-900 hover:text-emerald-600 transition-colors">
            9JASUB
          </Link>
          <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold tracking-widest uppercase">
          About Us
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Who We Are
        </h1>
        <p className="text-xl text-slate-500 font-medium leading-relaxed">
          9JASUB is a digital utility and fintech platform operated by <strong className="text-slate-900">MK GLOBAL INVESTMENT LTD</strong>.
        </p>
      </section>

      {/* Office Photo */}
      <section className="px-6 max-w-5xl mx-auto mb-16">
        <div className="rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-200 aspect-[16/9] md:aspect-[21/9]">
          <img src="/hero_office.png" alt="The 9JASUB team at work" className="w-full h-full object-cover" />
        </div>
      </section>

      {/* Content */}
      <section className="px-6 max-w-4xl mx-auto space-y-8">
        <div className="bg-white p-10 md:p-12 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2">
            <Globe size={28} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Our Services</h2>
          <p className="text-lg text-slate-600 leading-relaxed font-medium">
            We provide affordable data bundles, airtime, bill payments, website ownership solutions, VTU business setup services, and API integration solutions for individuals and businesses across Nigeria.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-10 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-2">
              <Target size={28} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Our Mission</h2>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              To empower entrepreneurs and businesses with affordable digital solutions and opportunities. We aim to break down barriers to entry and provide the tools needed to succeed in the digital utility market.
            </p>
          </div>

          <div className="bg-white p-10 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-2">
              <Eye size={28} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Our Vision</h2>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              To become one of Africa's leading digital utility service providers, renowned for our reliability, innovation, and commitment to the success of our business owners and partners.
            </p>
          </div>
        </div>

      </section>

    </div>
  );
}
