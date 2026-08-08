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
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <img src="/logo.jpg" alt="9JASUB Logo" className="w-8 h-8 rounded-lg object-cover shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform" />
              <span className="text-xl font-black text-white tracking-tight">9JASUB</span>
            </Link>
            <p className="text-slate-400 font-bold text-sm mb-2">Data • Airtime • Bills • VTU Solutions</p>
            <p className="text-slate-500 text-sm font-medium mb-6">A Product of MK GLOBAL INVESTMENT LTD.</p>
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
            <h4 className="font-bold text-white mb-6">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link href="/" className="text-slate-400 hover:text-blue-400 font-medium transition-colors">Home</Link></li>
              <li><Link href="/#pricing" className="text-slate-400 hover:text-blue-400 font-medium transition-colors">Pricing</Link></li>
              <li><Link href="/#how-it-works" className="text-slate-400 hover:text-blue-400 font-medium transition-colors">How It Works</Link></li>
              <li><Link href="/#about" className="text-slate-400 hover:text-blue-400 font-medium transition-colors">About Us</Link></li>
              <li><a href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/login`} className="text-slate-400 hover:text-blue-400 font-medium transition-colors">Login</a></li>
              <li><Link href="/#contact" className="text-slate-400 hover:text-blue-400 font-medium transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-white mb-6">Legal Links</h4>
            <ul className="space-y-4">
              <li><Link href="/privacy" className="text-slate-400 hover:text-blue-400 font-medium transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-slate-400 hover:text-blue-400 font-medium transition-colors">Terms of Service</Link></li>
              <li><Link href="/terms#refund" className="text-slate-400 hover:text-blue-400 font-medium transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white mb-6">Contact</h4>
            <ul className="space-y-4 text-slate-400 font-medium">
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-500 shrink-0" />
                <span>0904 105 0812</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-500 shrink-0" />
                <span>support@9jasub.com</span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
                <span>Kano, Nigeria</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-900 text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm font-bold">
            © 2026 9JASUB. All Rights Reserved.
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
