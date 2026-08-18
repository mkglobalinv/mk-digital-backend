"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Briefcase, ArrowRight } from 'lucide-react';

export default function GetStarted() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const hasCompletedFirstEntry = localStorage.getItem('hasCompletedFirstEntry');

    if (token) {
      window.location.replace('/home');
    } else if (hasCompletedFirstEntry === 'true') {
      window.location.replace('/login');
    } else {
      localStorage.setItem('hasCompletedFirstEntry', 'true');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 font-medium transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-slate-200/60 border border-slate-100">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">WELCOME TO 9JASUB</h1>
            <p className="text-slate-500 font-medium">Please select your account type to continue.</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => window.location.assign('/onboarding')}
              className="group block w-full p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer relative overflow-hidden text-left"
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <User size={24} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 mb-1">Personal Account</h3>
                  <p className="text-sm text-slate-500 font-medium">Data, Airtime & Bills</p>
                </div>
                <ArrowRight className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
            </button>

            <button
              onClick={() => window.location.assign('/business/signup')}
              className="group block w-full p-6 bg-slate-900 border-2 border-slate-900 rounded-2xl hover:bg-slate-800 transition-all cursor-pointer relative overflow-hidden text-left"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/15 rounded-full glow-soft group-hover:bg-emerald-500/25 transition-colors" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Briefcase size={24} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-bold text-white mb-1">Own Your VTU Website & App</h3>
                  <p className="text-sm text-slate-300 font-medium">Start your own VTU business</p>
                </div>
                <ArrowRight className="text-slate-400 group-hover:text-white transition-colors" />
              </div>
            </button>
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Already have an account?{' '}
              <button onClick={() => window.location.assign('/login')} className="text-emerald-600 font-bold hover:underline">
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
