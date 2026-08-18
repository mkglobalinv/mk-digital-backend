'use client';

import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import { FaFacebook, FaWhatsapp } from 'react-icons/fa';

const WHATSAPP_NUMBER = '2349041050812';
const FACEBOOK_URL = 'https://www.facebook.com/share/1HYb8ZK6JE/';
const WHATSAPP_COMMUNITY_URL = 'https://whatsapp.com/channel/0029Vb5WEwe8KMqr4K5bSS0d';

export default function Footer() {
  return (
    <footer className="bg-slate-950 pt-20 pb-10 border-t border-slate-900">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand & About */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <img src="/logo.jpg" alt="9JASUB Logo" className="w-8 h-8 rounded-lg object-cover shadow-lg shadow-emerald-500/15 ring-1 ring-white/10 group-hover:scale-105 transition-transform" />
              <span className="text-xl font-extrabold text-white tracking-tight">9JASUB</span>
            </Link>
            <p className="text-slate-400 font-semibold text-sm mb-2">Data • Airtime • Bills • VTU Solutions</p>
            <p className="text-slate-500 text-sm font-medium mb-6">A Product of MK GLOBAL INVESTMENT LTD.</p>
            <div className="flex gap-3">
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="9JASUB on Facebook"
                className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-emerald-500/60 hover:bg-emerald-500/10 transition-all"
              >
                <FaFacebook className="w-4 h-4" />
              </a>
              <a
                href={WHATSAPP_COMMUNITY_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="9JASUB WhatsApp Community"
                className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-emerald-500/60 hover:bg-emerald-500/10 transition-all"
              >
                <FaWhatsapp className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-6 text-sm tracking-wide uppercase text-slate-300">Quick Links</h4>
            <ul className="space-y-3.5">
              <li><Link href="/" className="text-slate-400 hover:text-emerald-400 font-medium transition-colors">Home</Link></li>
              <li><Link href="/#pricing" className="text-slate-400 hover:text-emerald-400 font-medium transition-colors">Pricing</Link></li>
              <li><Link href="/#how-it-works" className="text-slate-400 hover:text-emerald-400 font-medium transition-colors">How It Works</Link></li>
              <li><Link href="/#about" className="text-slate-400 hover:text-emerald-400 font-medium transition-colors">About Us</Link></li>
              <li><a href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/login`} className="text-slate-400 hover:text-emerald-400 font-medium transition-colors">Login</a></li>
              <li><Link href="/#contact" className="text-slate-400 hover:text-emerald-400 font-medium transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-white mb-6 text-sm tracking-wide uppercase text-slate-300">Legal Links</h4>
            <ul className="space-y-3.5">
              <li><Link href="/privacy" className="text-slate-400 hover:text-emerald-400 font-medium transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-slate-400 hover:text-emerald-400 font-medium transition-colors">Terms of Service</Link></li>
              <li><Link href="/terms#refund" className="text-slate-400 hover:text-emerald-400 font-medium transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white mb-6 text-sm tracking-wide uppercase text-slate-300">Contact</h4>
            <ul className="space-y-3.5 text-slate-400 font-medium">
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>0904 105 0812</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>support@9jasub.com</span>
              </li>
            </ul>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-colors"
            >
              <FaWhatsapp className="w-4 h-4" />
              Chat on WhatsApp
            </a>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-900 text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm font-semibold">
            © 2026 9JASUB. All Rights Reserved.
          </p>
          <div className="flex gap-4">
            {/* Payment badges removed as requested */}
          </div>
        </div>
      </div>
    </footer>
  );
}
