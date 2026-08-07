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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 py-4' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-white z-50">
          9JA<span className="text-blue-500">SUB</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#how-it-works" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">How it Works</Link>
          <Link href="#services" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Services</Link>
          <Link href="#pricing" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Pricing</Link>
          <Link href="#testimonials" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Testimonials</Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/register">
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
            <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg font-medium">How it Works</Link>
            <Link href="#services" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg font-medium">Services</Link>
            <Link href="#pricing" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg font-medium">Pricing</Link>
            <Link href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg font-medium">Testimonials</Link>
            
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full py-3 bg-slate-800 text-white rounded-lg font-semibold">Login</button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold">Get Started</button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
