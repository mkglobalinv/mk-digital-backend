'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Globe } from 'lucide-react';
import Link from 'next/link';

/**
 * PlatformAnnouncement — "Own Your Platform" promotion, directly after the
 * services hero. Uses the real product screenshots already shipped in
 * /public (dashboard_screenshot.png is the actual website-admin dashboard,
 * vtu_home_screenshot.png is the actual customer app home screen) inside
 * browser/phone device frames, rather than an ordinary text card — every
 * reseller site created with 9JASUB really does look like this.
 */
export default function PlatformAnnouncement() {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-b from-emerald-50/60 via-emerald-50/20 to-white">
      <div className="absolute -top-20 -left-20 w-[420px] h-[420px] bg-emerald-200/40 rounded-full glow-soft pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[380px] h-[380px] bg-emerald-100/60 rounded-full glow-soft pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-16">

          {/* Text column */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs uppercase tracking-widest mb-6"
            >
              <Sparkles size={14} /> Own Your Platform
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-5 leading-[1.12]"
            >
              Own Your Branded <span className="gradient-text">Website & App</span> Like Ours
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0"
            >
              It&apos;s <span className="font-extrabold text-emerald-600">FREE</span> to get started — automatically create your own platform in just 3 minutes with 9JASUB.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
            >
              <Link
                href="/get-started"
                className="btn-primary inline-flex px-8 py-4 rounded-2xl font-bold text-lg items-center justify-center gap-3"
              >
                Create My Platform <ArrowRight size={20} />
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-400"
            >
              Your Website &nbsp;&bull;&nbsp; Your Brand &nbsp;&bull;&nbsp; Your Business
            </motion.p>
          </div>

          {/* Device mockup visual — real product screenshots */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="relative w-full max-w-[420px] lg:max-w-none lg:flex-1"
          >
            {/* Browser frame — website admin dashboard */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-emerald-900/10 overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-100 border-b border-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-white px-3 py-1 rounded-md border border-slate-200">
                  <Globe size={11} /> yourbrand.9jasub.com
                </span>
              </div>
              <div className="aspect-[1024/448] bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/dashboard_screenshot.png"
                  alt="A real 9JASUB website-owner admin dashboard"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            {/* Phone frame — customer app home, overlapping the browser frame's corner */}
            <div className="absolute -bottom-8 left-3 sm:left-6 w-[110px] sm:w-[130px] rounded-[1.5rem] border-[5px] border-slate-900 bg-slate-900 shadow-2xl shadow-emerald-900/20 overflow-hidden">
              <div className="aspect-[500/581] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/vtu_home_screenshot.png"
                  alt="The real 9JASUB customer app home screen"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-5 -right-3 sm:right-4 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs font-bold text-slate-800">Live in 3 minutes</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
