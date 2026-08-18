'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/90 backdrop-blur-md ${isScrolled ? 'border-b border-slate-200 py-3.5 shadow-sm' : 'border-b border-transparent py-5'}`}>
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 z-50 group">
          <img src="/logo.jpg" alt="9JASUB Logo" className="w-10 h-10 rounded-xl object-cover shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform" />
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">9JASUB</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-semibold text-emerald-600 border-b-2 border-emerald-600 pb-0.5 transition-colors">Home</Link>
          <Link href="/services" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">Services</Link>
          <Link href="/get-started" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">Own your VTU site in 5 mins</Link>
          <Link href="/about" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">About Us</Link>
          <Link href="/#contact" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">Contact Us</Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/login`}>
            <button className="btn-outline px-5 py-2.5 text-sm font-semibold rounded-xl">
              Login
            </button>
          </a>
          <Link href="/get-started">
            <button className="btn-primary px-5 py-2.5 text-sm font-semibold rounded-xl">
              Get Started
            </button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-slate-700 hover:text-emerald-600 z-50"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-4 md:hidden flex flex-col gap-1 shadow-xl"
          >
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-emerald-600 bg-emerald-50 rounded-xl font-semibold transition-colors">Home</Link>
            <Link href="/services" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-slate-700 hover:text-emerald-600 hover:bg-slate-50 rounded-xl font-semibold transition-colors">Services</Link>
            <Link href="/get-started" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-slate-700 hover:text-emerald-600 hover:bg-slate-50 rounded-xl font-semibold transition-colors">Own your VTU site in 5 mins</Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-slate-700 hover:text-emerald-600 hover:bg-slate-50 rounded-xl font-semibold transition-colors">About Us</Link>
            <Link href="/#contact" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-slate-700 hover:text-emerald-600 hover:bg-slate-50 rounded-xl font-semibold transition-colors">Contact Us</Link>

            <div className="grid grid-cols-2 gap-3 mt-3 pt-4 border-t border-slate-200">
              <a href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/login`} onClick={() => setMobileMenuOpen(false)}>
                <button className="btn-outline w-full py-3 rounded-xl font-semibold">Login</button>
              </a>
              <Link href="/get-started" onClick={() => setMobileMenuOpen(false)}>
                <button className="btn-primary w-full py-3 rounded-xl font-semibold">Get Started</button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
