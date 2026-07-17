import React from 'react';
import Link from 'next/link';
import { 
  Terminal, 
  Key, 
  Globe, 
  Code2, 
  Copy, 
  Shield, 
  Zap, 
  ChevronRight,
  Database,
  Smartphone,
  Wifi,
  Tv,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Zap size={18} fill="white" />
            </div>
            <span className="text-xl font-black text-slate-900">9JASUB API</span>
          </Link>
          <div className="flex items-center gap-4">
             <a href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://app.9jasub.com'}/developer`} className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Developer Console</a>
             <a href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://app.9jasub.com'}/signup`} className="px-5 py-2 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-all shadow-md">Get API Key</a>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-7xl mx-auto w-full flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 pt-24 pb-10 border-r border-slate-100 overflow-y-auto px-6 space-y-8">
          <div>
            <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Getting Started</h5>
            <ul className="space-y-3">
              <li><Link href="#introduction" className="text-sm font-bold text-blue-600">Introduction</Link></li>
              <li><Link href="#authentication" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Authentication</Link></li>
              <li><Link href="#base-url" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Base URL</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Services</h5>
            <ul className="space-y-3">
              <li><Link href="#balance" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Wallet Balance</Link></li>
              <li><Link href="#airtime" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Airtime VTU</Link></li>
              <li><Link href="#data" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Data Bundles</Link></li>
              <li><Link href="#electricity" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Electricity Bills</Link></li>
              <li><Link href="#cable" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Cable TV</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Account</h5>
            <ul className="space-y-3">
              <li><Link href="#status" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Transaction Status</Link></li>
              <li><Link href="#history" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">History</Link></li>
              <li><Link href="#webhooks" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Webhooks</Link></li>
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pt-24 pb-20 px-6 lg:px-16 max-w-4xl overflow-y-auto">
          <section id="introduction" className="space-y-6 mb-20">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Introduction</h1>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              Welcome to the 9JASUB Public API. Our API allows developers, website owners, and business partners to integrate our automated VTU services into their own websites, mobile apps, and software systems.
            </p>
            <div className="grid md:grid-cols-2 gap-6 pt-4">
              <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl space-y-3">
                <Shield className="text-blue-600" size={24} />
                <h3 className="font-black text-slate-900">Secure Integration</h3>
                <p className="text-sm text-slate-600 font-medium">Bank-grade security with API Key and Secret authentication.</p>
              </div>
              <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl space-y-3">
                <Zap className="text-emerald-600" size={24} />
                <h3 className="font-black text-slate-900">Instant Delivery</h3>
                <p className="text-sm text-slate-600 font-medium">Transactions are processed and delivered in less than 2 seconds.</p>
              </div>
            </div>
          </section>

          <section id="authentication" className="space-y-6 mb-20">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Key className="text-blue-600" size={28} /> Authentication
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              Every request to our API must include your API Key and API Secret in the request headers. You can generate your keys from the <a href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://app.9jasub.com'}/developer`} className="text-blue-600 font-bold hover:underline">Developer Console</a>.
            </p>
            
            <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between mb-4 text-slate-400 text-xs font-black uppercase tracking-widest">
                <span>Request Headers</span>
                <Copy size={14} className="cursor-pointer hover:text-white" />
              </div>
              <code className="text-blue-400 block font-mono text-sm leading-relaxed">
                x-api-key: YOUR_API_KEY <br/>
                x-api-secret: YOUR_API_SECRET
              </code>
            </div>

            <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-amber-900 font-medium">
                  <strong>Warning:</strong> Never share your API Secret. If your keys are compromised, regenerate them immediately in the Developer Console.
                </div>
            </div>
          </section>

          <section id="base-url" className="space-y-6 mb-20">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Globe className="text-blue-600" size={28} /> Base URL
            </h2>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 font-mono text-lg text-slate-900 font-black">
               https://api.9jasub.com/api/v1
            </div>
          </section>

          <section id="balance" className="space-y-8 mb-20">
            <div className="flex items-center gap-4">
               <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-black tracking-widest uppercase">GET</div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">/balance</h2>
            </div>
            <p className="text-slate-600 font-medium">Retrieve your current wallet balance.</p>
            
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Success Response (200 OK)</h4>
              <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden shadow-xl">
<pre className="text-emerald-400 text-sm font-mono leading-relaxed">{`{
  "status": "success",
  "balance": 25450.50,
  "currency": "NGN"
}`}</pre>
              </div>
            </div>
          </section>

          <section id="data" className="space-y-8 mb-20">
            <div className="flex items-center gap-4">
               <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black tracking-widest uppercase">POST</div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">/data</h2>
            </div>
            <p className="text-slate-600 font-medium">Purchase data bundle for a specific mobile number.</p>
            
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Request Body (JSON)</h4>
              <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden shadow-xl">
<pre className="text-blue-400 text-sm font-mono leading-relaxed">{`{
  "network": "MTN",
  "plan_id": "1",
  "phone": "08012345678",
  "reference": "my_unique_ref_001"
}`}</pre>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Success Response (200 OK)</h4>
              <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden shadow-xl">
<pre className="text-emerald-400 text-sm font-mono leading-relaxed">{`{
  "status": "success",
  "message": "Transaction processing",
  "reference": "api_abc123",
  "client_reference": "my_unique_ref_001",
  "amount": 250
}`}</pre>
              </div>
            </div>
          </section>

          <section id="webhooks" className="space-y-6 mb-20">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Webhooks</h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              You can receive real-time updates on your transactions by setting up a Webhook URL in your Developer Console. We will send a POST request to your URL whenever a transaction is completed.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 space-y-4">
               <h4 className="font-black text-slate-900 flex items-center gap-2">
                 <CheckCircle2 className="text-emerald-500" size={20} />
                 Automatic Retries
               </h4>
               <p className="text-sm text-slate-600 font-medium leading-relaxed">
                 If your server is down, we'll retry the webhook delivery 3 times over the next 30 minutes.
               </p>
            </div>
          </section>

          {/* Footer of Docs */}
          <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
             <p className="text-sm text-slate-400 font-bold italic">9JASUB API v1.0.0 Documentation</p>
             <Link href="https://app.9jasub.com/support" className="text-sm font-bold text-blue-600 hover:underline">Need Help? Contact API Support</Link>
          </div>
        </main>
      </div>
    </div>
  );
}
