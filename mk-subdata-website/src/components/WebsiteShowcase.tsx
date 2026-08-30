'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Lock } from 'lucide-react';
import Link from 'next/link';

type ShowcaseBusiness = {
  name: string;
  logo: string | null;
  url: string;
};

const MIN_ITEMS_TO_SHOW = 2;
const MAX_DOTS = 10;
const GAP_PX = 16; // gap-4
const AUTO_ADVANCE_MS = 3400;
const RESUME_AFTER_INTERACTION_MS = 4500;

const hostname = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

/**
 * WebsiteShowcase — "Websites Created With 9JASUB" carousel.
 *
 * Reuses the same real, existing public GET /api/reseller/public/showcase
 * endpoint as the (now-removed) BusinessShowcase/LiveWebsitePreview did —
 * real registered business name/logo/url only, nothing invented. Renders
 * nothing if too few qualify.
 *
 * Each card shows only fields the API actually returns (real name, real
 * logo or initial, real domain) inside a polished browser-chrome frame —
 * the visual treatment (address bar, glow, live badge) is presentation
 * only, never a claim about the business's actual page content. Live
 * reseller sites keep the default X-Frame-Options: SAMEORIGIN (see
 * server.js — only /storefront-preview, fed synthetic demo branding, is
 * ever framed), so a live embed of the real page isn't available here;
 * cards link out to the real site in a new tab instead.
 */
export default function WebsiteShowcase() {
  const [businesses, setBusinesses] = useState<ShowcaseBusiness[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const getStep = () => {
    const el = scrollerRef.current;
    const firstCard = el?.firstElementChild as HTMLElement | undefined;
    return (firstCard?.offsetWidth ?? 280) + GAP_PX;
  };

  const scrollToIndex = (idx: number) => {
    scrollerRef.current?.scrollTo({ left: idx * getStep(), behavior: 'smooth' });
  };

  const scrollByDirection = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollLeft + direction * getStep(), behavior: 'smooth' });
  };

  const startAutoAdvance = () => {
    if (autoAdvanceTimer.current || !businesses) return;
    autoAdvanceTimer.current = setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + getStep(), behavior: 'smooth' });
    }, AUTO_ADVANCE_MS);
  };

  const pauseAutoAdvance = () => {
    if (autoAdvanceTimer.current) {
      clearInterval(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(startAutoAdvance, RESUME_AFTER_INTERACTION_MS);
  };

  useEffect(() => {
    if (!businesses || businesses.length < MIN_ITEMS_TO_SHOW) return;
    startAutoAdvance();
    return () => {
      if (autoAdvanceTimer.current) clearInterval(autoAdvanceTimer.current);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businesses]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => setActiveIndex(Math.round(el.scrollLeft / getStep()));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [businesses]);

  if (!businesses || businesses.length < MIN_ITEMS_TO_SHOW) return null;

  return (
    <section className="py-20 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4"
          >
            Websites Created With 9JASUB
          </motion.h2>
          <p className="text-lg text-slate-500 font-medium">
            Real branded platforms already live and selling — see what yours could look like.
          </p>
        </div>

        <div className="relative">
          <div
            ref={scrollerRef}
            onTouchStart={pauseAutoAdvance}
            onMouseDown={pauseAutoAdvance}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 px-4 -mx-4 md:px-0 md:mx-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {businesses.map((biz, idx) => {
              const initial = biz.name.charAt(0).toUpperCase();
              return (
                <motion.a
                  key={idx}
                  href={biz.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: Math.min(idx, 4) * 0.06 }}
                  className="group shrink-0 snap-start w-[78vw] max-w-[310px] sm:w-[310px] rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-md hover:shadow-2xl hover:shadow-emerald-900/10 hover:-translate-y-1.5 hover:border-emerald-200 transition-all duration-300"
                >
                  {/* Browser chrome — realistic address bar */}
                  <div className="flex items-center gap-2 px-3.5 py-3 bg-gradient-to-b from-slate-100 to-slate-50 border-b border-slate-200">
                    <div className="flex gap-1.5 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex-1 flex items-center gap-1.5 bg-white rounded-lg border border-slate-200 px-2.5 py-1.5 min-w-0">
                      <Lock size={10} className="text-emerald-600 shrink-0" />
                      <span className="text-[11px] font-medium text-slate-500 truncate">{hostname(biz.url)}</span>
                    </div>
                  </div>

                  {/* Real data only — name, logo, domain from the API. No fabricated page content. */}
                  <div className="relative h-[196px] flex flex-col items-center justify-center gap-3.5 px-6 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-200/40 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-12 -left-10 w-32 h-32 bg-emerald-100/50 rounded-full blur-2xl pointer-events-none" />

                    {biz.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={biz.logo}
                        alt=""
                        className="relative z-10 w-[72px] h-[72px] rounded-2xl object-cover bg-white shadow-lg ring-2 ring-white border border-slate-100 shrink-0 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="relative z-10 w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-3xl font-extrabold flex items-center justify-center shadow-lg ring-2 ring-white shrink-0 group-hover:scale-105 transition-transform duration-300">
                        {initial}
                      </div>
                    )}

                    <p className="relative z-10 font-extrabold text-slate-900 text-lg text-center truncate max-w-full leading-tight">
                      {biz.name}
                    </p>

                    <div className="relative z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100/80 border border-emerald-200/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Live Platform</span>
                    </div>
                  </div>

                  <div className="px-4 py-3.5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-sm font-bold text-emerald-600 group-hover:gap-2.5 transition-all">
                    Visit Website <ExternalLink size={14} />
                  </div>
                </motion.a>
              );
            })}
          </div>

          {businesses.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous website"
                onClick={() => scrollByDirection(-1)}
                className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-lg items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-300 transition-colors z-10"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                aria-label="Next website"
                onClick={() => scrollByDirection(1)}
                className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-lg items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-300 transition-colors z-10"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {businesses.length <= MAX_DOTS && (
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {businesses.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Go to website ${idx + 1}`}
                onClick={() => scrollToIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === activeIndex ? 'w-6 bg-emerald-600' : 'w-1.5 bg-slate-300'
                }`}
              />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-5">
            Ready to build your own brand and start selling online?
          </h3>
          <Link
            href="/get-started"
            className="btn-primary inline-flex px-8 py-4 rounded-2xl font-bold items-center justify-center gap-2"
          >
            Create Your Own Platform <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
