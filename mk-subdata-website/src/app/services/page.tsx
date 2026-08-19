import React from 'react';
import Link from 'next/link';
import { Wifi, Smartphone, Zap, PlaySquare, GraduationCap, ShieldCheck, Clock, Zap as Lightning, ArrowRight } from 'lucide-react';
import ViewContentTracker from '@/components/ViewContentTracker';

export const metadata = {
  title: 'Our Services | 9JASUB - Data, Airtime, Bills & More',
  description: 'Explore 9JASUB\'s premium digital services: data bundles, airtime top-up, electricity bills, cable TV subscriptions, and education pins at the best rates in Nigeria.',
  alternates: {
    canonical: '/services',
  },
  openGraph: {
    title: 'Our Services | 9JASUB - Data, Airtime, Bills & More',
    description: 'Explore 9JASUB\'s premium digital services: data bundles, airtime top-up, electricity bills, cable TV subscriptions, and education pins at the best rates in Nigeria.',
    url: '/services',
  },
};

export default function ServicesPage() {
  const services = [
    {
      title: "Data Bundles",
      icon: <Wifi size={32} />,
      color: "blue",
      features: ["MTN SME / CG", "Airtel Gifting", "GLO / 9Mobile", "Instant Activation"],
      desc: "Get the most affordable data rates in Nigeria with instant delivery."
    },
    {
      title: "Airtime Top-up",
      icon: <Smartphone size={32} />,
      color: "emerald",
      features: ["2% Discount", "All Networks", "Automated Load", "Bulk VTU"],
      desc: "Recharge any phone number instantly and get discounts on every purchase."
    },
    {
      title: "Electricity Bills",
      icon: <Lightning size={32} />,
      color: "amber",
      features: ["Prepaid Meters", "Postpaid Bills", "Token History", "All DisCos"],
      desc: "Pay your electricity bills from the comfort of your home and get tokens instantly."
    },
    {
      title: "Cable TV",
      icon: <PlaySquare size={32} />,
      color: "purple",
      features: ["DSTV Subscription", "GOTV Renewal", "Startimes", "No Service Fee"],
      desc: "Renew your TV subscriptions instantly without any extra convenience fees."
    },
    {
      title: "Education Pins",
      icon: <GraduationCap size={32} />,
      color: "red",
      features: ["WAEC Result Checker", "NECO Token", "JAMB Profile ID", "NABTEB"],
      desc: "Access educational pins and result checkers instantly at official rates."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <ViewContentTracker contentName="Services" contentCategory="product_catalog" />
      <nav className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="9JASUB Logo" className="w-10 h-10 rounded-xl object-cover shadow-md shadow-emerald-500/20" />
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">9JASUB</span>
          </Link>
          <Link href="/get-started" className="btn-primary px-6 py-2.5 rounded-full font-semibold text-sm">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="pt-40 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">Our Premium <span className="text-emerald-600">Services.</span></h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              We provide high-speed automated digital utility services for thousands of Nigerians every day.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-200/20 hover:-translate-y-1 transition-all duration-300 group">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${
                   s.color === 'blue' ? 'bg-blue-500/10 text-blue-600' :
                   s.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' :
                   s.color === 'amber' ? 'bg-amber-500/10 text-amber-600' :
                   s.color === 'purple' ? 'bg-purple-500/10 text-purple-600' :
                   'bg-red-500/10 text-red-600'
                }`}>
                  {s.icon}
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-4">{s.title}</h2>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">{s.desc}</p>
                <div className="space-y-3">
                  {s.features.map((f, fi) => (
                    <div key={fi} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center text-emerald-600">
                         <ShieldCheck size={14} />
                      </div>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Own Website Card */}
            <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white flex flex-col justify-between border border-slate-800">
              <div>
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 text-emerald-400">
                  <Zap size={32} />
                </div>
                <h2 className="text-2xl font-extrabold mb-4">Own Your VTU Website</h2>
                <p className="text-slate-400 font-medium leading-relaxed mb-8">
                  Launch your own fully automated VTU platform in 5 minutes with our premium website builder.
                </p>
              </div>
              <Link href="/get-started" className="btn-primary w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 group">
                 Create Website <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
