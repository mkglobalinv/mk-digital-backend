'use client';

import { motion } from 'framer-motion';
import {
  Globe,
  LayoutDashboard,
  TrendingUp,
  Users,
  SlidersHorizontal,
  Smartphone,
  Headphones,
  Layers,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

/*
 * Every line below is reused from capabilities already live/confirmed
 * elsewhere on the platform (reseller signup feature list, Services.tsx
 * catalog, existing reseller dashboard pages) — nothing invented here.
 */
const benefits = [
  { icon: Globe, text: 'Your own branded VTU website & web address' },
  { icon: LayoutDashboard, text: 'A full business dashboard to manage everything' },
  { icon: TrendingUp, text: 'Real-time profit tracking' },
  { icon: Users, text: 'Full customer management system' },
  { icon: SlidersHorizontal, text: 'Full pricing control' },
  { icon: Smartphone, text: 'Custom mobile app experience (Android/iOS)' },
  { icon: Layers, text: 'Access to the full digital services catalog — Data, Airtime, Electricity, Cable TV, Education e-pins & more' },
  { icon: Headphones, text: '24/7 platform support' },
];

export default function WhatYouGet() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4"
          >
            What Do I Get for ₦5,000?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500 font-medium"
          >
            ₦5,000 is the existing one-time activation fee, paid after your 3-day free trial, to keep your website live. Here&apos;s exactly what it unlocks:
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-12">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="card-light p-5 rounded-2xl flex flex-col items-center text-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <b.icon className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-slate-700 leading-snug">{b.text}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/get-started"
            className="btn-primary inline-flex px-8 py-4 rounded-2xl font-bold items-center justify-center gap-2"
          >
            Start My 3-Day Free Trial <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
