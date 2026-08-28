'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Wifi, Phone, Lightbulb, Tv } from 'lucide-react';
import Link from 'next/link';

const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * WebsiteDemo — "See Your Website" interactive marketing demo.
 * Purely client-side: typing a business name only updates a local preview
 * mock. No API calls, no account/reseller creation happens here — the CTA
 * routes to the existing /get-started flow, same as the rest of the site.
 */
export default function WebsiteDemo() {
  const [businessName, setBusinessName] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const trimmed = businessName.trim();
  const displayName = trimmed || 'ABC Data';
  const slug = slugify(trimmed) || 'abcdata';

  return (
    <section className="py-20 bg-white" id="see-your-website">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div className="text-center lg:text-left">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 leading-tight"
            >
              Create Your Own VTU Website
            </motion.h2>
            <p className="text-lg text-slate-500 font-medium mb-6">
              Enter your business name and see a live preview of what your own branded website could look like.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto lg:mx-0">
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter your business name"
                maxLength={40}
                className="flex-1 px-5 py-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className="btn-primary px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shrink-0"
              >
                See My Website <ArrowRight size={18} />
              </button>
            </div>

            <p className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-400">
              Your Website. Your Brand. Your Business.
            </p>

            <Link
              href="/get-started"
              className="btn-gold inline-flex mt-6 px-7 py-3.5 rounded-2xl font-bold items-center justify-center gap-2"
            >
              Start My 3-Day Free Trial
            </Link>

            <p className="text-xs text-slate-400 mt-4">
              This is a visual preview only — no website or account is created until you sign up.
            </p>
          </div>

          <motion.div
            ref={previewRef}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-md mx-auto w-full rounded-2xl border border-slate-200 shadow-xl overflow-hidden bg-white"
          >
            <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-100 border-b border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs font-medium text-slate-500 bg-white px-3 py-1 rounded-md border border-slate-200 truncate">
                {slug}.9jasub.com
              </span>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-lg shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-900 leading-tight truncate">{displayName}</p>
                  <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live & Selling
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                {[Wifi, Phone, Lightbulb, Tv].map((Icon, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <Icon className="w-4 h-4 text-emerald-600" />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 text-center">Data · Airtime · Electricity · Cable TV & more</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
