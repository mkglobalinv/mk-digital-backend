'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

type ShowcaseBusiness = {
  name: string;
  logo: string | null;
  url: string;
};

const MIN_ITEMS_TO_SHOW = 2;
const AUTO_SCROLL_INTERVAL_MS = 2600;
const RESUME_AFTER_INTERACTION_MS = 4000;

/**
 * BusinessShowcase — lightweight social-proof strip for the public homepage.
 * Shows real registered reseller business names (name/logo only — never
 * emails, phone numbers, IDs, or any private data). Renders nothing if the
 * API is unavailable or too few businesses qualify — no placeholder/fake
 * content is ever shown.
 */
export default function BusinessShowcase() {
  const [businesses, setBusinesses] = useState<ShowcaseBusiness[] | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/reseller/public/showcase')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled) return;
        const data = Array.isArray(json?.data) ? json.data : [];
        setBusinesses(data);
      })
      .catch(() => {
        if (!cancelled) setBusinesses([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const startAutoScroll = () => {
    if (autoScrollTimer.current) return;
    autoScrollTimer.current = setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 240, behavior: 'smooth' });
      }
    }, AUTO_SCROLL_INTERVAL_MS);
  };

  const pauseAutoScroll = () => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(startAutoScroll, RESUME_AFTER_INTERACTION_MS);
  };

  useEffect(() => {
    if (!businesses || businesses.length < MIN_ITEMS_TO_SHOW) return;
    startAutoScroll();
    return () => {
      if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [businesses]);

  if (!businesses || businesses.length < MIN_ITEMS_TO_SHOW) return null;

  return (
    <section className="py-10 bg-slate-50 border-y border-slate-100">
      <div className="container mx-auto px-4 md:px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-sm font-bold uppercase tracking-wide text-slate-400 mb-5"
        >
          Businesses Are Building With 9JASUB
        </motion.p>

        <div
          ref={scrollerRef}
          onTouchStart={pauseAutoScroll}
          onMouseDown={pauseAutoScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {businesses.map((biz, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 shrink-0 snap-start bg-white border border-slate-200 rounded-2xl px-5 py-3.5"
              style={{ minWidth: '220px' }}
            >
              {biz.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={biz.logo}
                  alt=""
                  className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200 bg-white"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Globe className="w-4.5 h-4.5 text-emerald-600" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate max-w-[140px]">{biz.name}</p>
                <p className="text-[11px] text-slate-400 font-semibold">Powered by 9JASUB</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
