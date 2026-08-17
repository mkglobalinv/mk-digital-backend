'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_CONFIG } from '@/lib/appConfig';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 py-4' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 z-50 group">
          <img src="/logo.jpg" alt="9JASUB Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform" />
          <span className="text-2xl font-black tracking-tight text-white">9JASUB</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Home</Link>
          <Link href="/services" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Services</Link>
          <Link href="/get-started" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Own your VTU site in 5 mins</Link>
          <Link href="/about" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">About Us</Link>
          <Link href="/#contact" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Contact Us</Link>
          <a
            href={APP_CONFIG.APP_DOWNLOAD_URL}
            id="navbar-android-app-link"
            className="flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
            aria-label="Download 9JASUB Android App"
          >
            <Smartphone className="w-4 h-4" />
            Android App
          </a>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <a href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/login`} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Login
          </a>
          <Link href="/get-started">
            <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20">
              Get Started
            </button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-slate-300 hover:text-white z-50"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-800 p-4 md:hidden flex flex-col gap-4 shadow-2xl"
          >
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg font-medium">Home</Link>
            <Link href="/services" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg font-medium">Services</Link>
            <Link href="/get-started" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg font-medium">Own your VTU site in 5 mins</Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg font-medium">About Us</Link>
            <Link href="/#contact" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg font-medium">Contact Us</Link>

            {/* Android App Download */}
            <a
              href={APP_CONFIG.APP_DOWNLOAD_URL}
              id="mobile-menu-android-app-link"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded-lg font-medium"
              aria-label="Download 9JASUB Android App"
            >
              <Smartphone className="w-4 h-4" />
              📱 Get the 9JASUB App
            </a>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800">
              <a href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/login`} onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full py-3 bg-slate-800 text-white rounded-lg font-semibold">Login</button>
              </a>
              <Link href="/get-started" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold">Get Started</button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
