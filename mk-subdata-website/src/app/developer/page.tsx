import React from 'react';
import Link from 'next/link';
import {
  ArrowRight, ShieldCheck, Globe,
  CheckCircle2, Code, Activity, Terminal, ArrowUpRight, Zap
} from 'lucide-react';

export default function DeveloperApi() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 selection:bg-emerald-100 selection:text-emerald-900">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] bg-white/85 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="9JASUB Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-emerald-200" />
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">9JASUB</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            <Link href="/" className="text-slate-600 hover:text-emerald-600 font-semibold transition-colors">Home</Link>
            <Link href="/#showcase" className="text-slate-600 hover:text-emerald-600 font-semibold transition-colors flex items-center gap-1">Own Your Website <ArrowUpRight size={14} /></Link>
            <Link href="/#pricing" className="text-slate-600 hover:text-emerald-600 font-semibold transition-colors">Pricing</Link>
            <Link href="/#how-it-works" className="text-slate-600 hover:text-emerald-600 font-semibold transition-colors">How It Works</Link>
            <Link href="/about" className="text-slate-600 hover:text-emerald-600 font-semibold transition-colors">About Us</Link>
            <Link href="/#contact" className="text-slate-600 hover:text-emerald-600 font-semibold transition-colors">Contact Us</Link>
          </div>

          <div className="flex items-center gap-4">
            <a href="/login" className="hidden sm:block text-slate-900 hover:text-emerald-600 font-bold px-4">Login</a>
            <Link href="/get-started" className="px-6 py-3 bg-slate-900 text-white rounded-full font-semibold hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden bg-white">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-emerald-50 rounded-full glow-soft -z-10" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10 z-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold tracking-widest uppercase border border-emerald-100 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              Built For Developers
            </div>

            <h1 className="text-5xl lg:text-[4.5rem] font-extrabold text-slate-900 leading-[1.05] tracking-tight">
              Powerful VTU API <br />For <span className="gradient-text">Developers</span>
            </h1>

            <p className="text-xl text-slate-500 max-w-xl leading-relaxed font-medium">
              Integrate fast, reliable, and secure VTU services into your applications in minutes. Automate airtime, data, and bill payments with a few lines of code.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/get-started" className="btn-primary px-8 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 group">
                GET API KEYS <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/docs" className="px-8 py-5 bg-white text-slate-900 rounded-2xl font-semibold text-lg flex items-center justify-center border-2 border-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm group">
                <Code className="text-emerald-500 group-hover:scale-110 transition-transform" /> View Documentation
              </Link>
            </div>
          </div>

          <div className="relative z-10 hidden lg:block">
            <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl overflow-hidden border border-slate-800">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-slate-500 text-sm font-mono ml-4">bash ~ request.js</span>
              </div>
              <pre className="text-emerald-400 font-mono text-sm leading-loose">
                <span className="text-purple-400">const</span> axios = <span className="text-blue-400">require</span>(<span className="text-yellow-300">'axios'</span>);{'\n\n'}
                <span className="text-slate-400">// Purchase Data Bundle</span>{'\n'}
                axios.<span className="text-blue-400">post</span>(<span className="text-yellow-300">'https://api.9jasub.com/v1/data'</span>, {'{\n'}
                {'  '}network: <span className="text-yellow-300">'MTN'</span>,{'\n'}
                {'  '}phone: <span className="text-yellow-300">'08012345678'</span>,{'\n'}
                {'  '}plan: <span className="text-yellow-300">'1GB'</span>{'\n'}
                {'}'}, {'{\n'}
                {'  '}headers: {'{\n'}
                {'    '}<span className="text-yellow-300">'Authorization'</span>: <span className="text-yellow-300">'Bearer YOUR_API_KEY'</span>{'\n'}
                {'  }\n'}
                {'}'}).<span className="text-blue-400">then</span>(res ={'>'} {'{\n'}
                {'  '}console.<span className="text-blue-400">log</span>(res.data);{'\n'}
                {'}'});
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">Everything You Need To Build</h2>
            <p className="text-xl text-slate-500 font-medium">
              We handle the complex telecom infrastructure so you can focus on building a great experience for your users.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap size={32} className="text-blue-600" />,
                title: "Lightning Fast",
                desc: "Transactions are processed instantly with automatic retries for maximum success rates.",
                chipBg: "bg-blue-50"
              },
              {
                icon: <ShieldCheck size={32} className="text-emerald-600" />,
                title: "Secure & Reliable",
                desc: "Bank-level encryption with built-in fraud protection and IP whitelisting.",
                chipBg: "bg-emerald-50"
              },
              {
                icon: <Activity size={32} className="text-purple-600" />,
                title: "Real-time Webhooks",
                desc: "Get instant notifications for transaction status changes and wallet funding events.",
                chipBg: "bg-purple-50"
              },
              {
                icon: <Code size={32} className="text-amber-600" />,
                title: "Simple Documentation",
                desc: "Clear, copy-paste ready code snippets in multiple programming languages.",
                chipBg: "bg-amber-50"
              },
              {
                icon: <Globe size={32} className="text-rose-600" />,
                title: "All Networks Supported",
                desc: "MTN, Glo, Airtel, 9mobile, DSTV, GOTV, and all major DisCos included in one API.",
                chipBg: "bg-rose-50"
              },
              {
                icon: <Terminal size={32} className="text-slate-900" />,
                title: "Sandbox Environment",
                desc: "Test your integration safely using our dedicated sandbox keys and test numbers.",
                chipBg: "bg-slate-100"
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all hover:-translate-y-1">
                <div className={`w-16 h-16 rounded-2xl ${feature.chipBg} flex items-center justify-center mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500 rounded-full glow-soft opacity-40 -z-0" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight">Ready to integrate?</h2>
          <p className="text-xl text-slate-300 font-medium mb-10 max-w-2xl mx-auto">
            Get your free API keys today and start processing VTU transactions in your own application.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/get-started" className="btn-primary px-8 py-5 rounded-2xl font-bold text-lg">
              Get Started Now
            </Link>
            <Link href="/docs" className="px-8 py-5 bg-slate-800 text-white rounded-2xl font-semibold text-lg border border-slate-700 hover:bg-slate-700 transition-all">
              View API Docs
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="9JASUB Logo" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-xl font-extrabold text-slate-900">9JASUB</span>
          </div>

          <div className="text-slate-500 font-medium text-center md:text-left">
            © {new Date().getFullYear()} MK Global Investment Ltd. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
