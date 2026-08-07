'use client';

import Link from 'next/link';
import { Mail, MapPin, Phone, MessageCircle, Globe, Camera } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 pt-20 pb-10 border-t border-slate-900">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand & About */}
          <div>
            <Link href="/" className="text-2xl font-bold text-white mb-6 block">
              9JA<span className="text-blue-500">SUB</span>
            </Link>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Powering Nigeria's digital economy. We provide the infrastructure for entrepreneurs to launch, scale, and automate their VTU businesses seamlessly.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500 hover:bg-blue-500/10 transition-all">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500 hover:bg-blue-500/10 transition-all">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500 hover:bg-blue-500/10 transition-all">
                <Camera className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-6">Product</h4>
            <ul className="space-y-4">
              <li><Link href="#features" className="text-slate-400 hover:text-blue-400 transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="text-slate-400 hover:text-blue-400 transition-colors">Pricing</Link></li>
              <li><Link href="#how-it-works" className="text-slate-400 hover:text-blue-400 transition-colors">How it Works</Link></li>
              <li><Link href="/register" className="text-slate-400 hover:text-blue-400 transition-colors">Create Account</Link></li>
              <li><Link href="/login" className="text-slate-400 hover:text-blue-400 transition-colors">Login</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-white mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><Link href="/terms" className="text-slate-400 hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-slate-400 hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refunds" className="text-slate-400 hover:text-blue-400 transition-colors">Refund Policy</Link></li>
              <li><Link href="/compliance" className="text-slate-400 hover:text-blue-400 transition-colors">Compliance</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <span className="text-slate-400">Lagos, Nigeria</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-slate-400">+234 (0) 800 9JASUB</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-slate-400">support@9jasub.com</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-900 text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} 9JASUB. All rights reserved.
          </p>
          <div className="flex gap-4">
            <div className="h-8 px-3 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-semibold text-slate-400">
              Secured by Paystack
            </div>
            <div className="h-8 px-3 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-semibold text-slate-400">
              Monnify Integration
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
