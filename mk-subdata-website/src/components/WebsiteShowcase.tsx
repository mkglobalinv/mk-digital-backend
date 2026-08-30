'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Lock, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

type ShowcaseBusiness = {
  name: string;
  logo: string | null;
  primaryColor: string | null;
  url: string;
};

const MIN_ITEMS_TO_SHOW = 2;
const MAX_DOTS = 10;
const GAP_PX = 16; // gap-4
const AUTO_ADVANCE_MS = 3400;
const RESUME_AFTER_INTERACTION_MS = 4500;
const DEFAULT_ACCENT = '#059669'; // 9JASUB emerald, used only when a business hasn't set a color
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

const hostname = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
const accentOf = (color: string | null) => (color && HEX_COLOR.test(color) ? color : DEFAULT_ACCENT);

/**
 * WebsiteShowcase — "Websites Created With 9JASUB" carousel.
 *
 * Reuses the same real, existing public GET /api/reseller/public/showcase
 * endpoint as the (now-removed) BusinessShowcase/LiveWebsitePreview did —
 * real registered business name/logo/url/primaryColor only, nothing
 * invented. Renders nothing if too few qualify.
 *
 * Every reseller site shares the exact same live template
 * (ResellerMarketingHome) with only name/logo/color swapped per business —
 * the "Digital payments, simplified." headline, subtitle, and trust badges
 * are hardcoded in that component, not business-authored, so reproducing
 * them here is accurate for every card, not fabricated. The business's
 * real primaryColor (also already stored, just newly exposed by this
 * endpoint) themes the accent so the mini preview actually matches what's
 * live at their real domain — e.g. a business that picked blue shows blue
 * here, not a default green.
 *
 * Live reseller sites keep the default X-Frame-Options: SAMEORIGIN (see
 * server.js — only /storefront-preview, fed synthetic demo branding, is
 * ever framed), so a live iframe embed of the real page isn't available
 * here; cards link out to the real site in a new tab instead.
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
              const accent = accentOf(biz.primaryColor);
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
                  className="group shrink-0 snap-start w-[80vw] max-w-[320px] sm:w-[320px] rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300"
                >
                  {/* Browser chrome — realistic address bar */}
                  <div className="flex items-center gap-2 px-3.5 py-3 bg-gradient-to-b from-slate-100 to-slate-50 border-b border-slate-200">
                    <div className="flex gap-1.5 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex-1 flex items-center gap-1.5 bg-white rounded-lg border border-slate-200 px-2.5 py-1.5 min-w-0">
                      <Lock size={10} className="shrink-0" style={{ color: accent }} />
                      <span className="text-[11px] font-medium text-slate-500 truncate">{hostname(biz.url)}</span>
                    </div>
                  </div>

                  {/* Mini nav bar — mirrors the real shared site header (real name/logo, real accent color) */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {biz.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={biz.logo} alt="" className="w-5 h-5 rounded-md object-cover border border-slate-200 shrink-0" />
                      ) : (
                        <div
                          className="w-5 h-5 rounded-md text-white text-[10px] font-extrabold flex items-center justify-center shrink-0"
                          style={{ backgroundColor: accent }}
                        >
                          {initial}
                        </div>
                      )}
                      <span className="text-[12px] font-extrabold text-slate-900 truncate">{biz.name}</span>
                    </div>
                    <span
                      className="text-[8px] font-bold text-white px-2 py-1 rounded-md shrink-0"
                      style={{ backgroundColor: accent }}
                    >
                      Get Started
                    </span>
                  </div>

                  {/* Hero mini-preview — the real, hardcoded headline/subtitle/badges every reseller site renders */}
                  <div className="px-5 py-6 bg-gradient-to-b from-slate-50/80 to-white text-center">
                    <p className="text-[15px] font-extrabold text-slate-900 leading-tight">
                      Digital payments,
                      <br />
                      <span style={{ color: accent }}>simplified.</span>
                    </p>
                    <p className="text-[10.5px] text-slate-500 font-medium mt-2.5 leading-snug px-1">
                      Purchase affordable data, airtime, and pay bills instantly.
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <div className="flex items-center gap-1">
                        <ShieldCheck size={12} style={{ color: accent }} />
                        <span className="text-[9px] font-bold text-slate-600">100% Secure</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap size={12} style={{ color: accent }} />
                        <span className="text-[9px] font-bold text-slate-600">Instant Delivery</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="px-4 py-3.5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-sm font-bold group-hover:gap-2.5 transition-all"
                    style={{ color: accent }}
                  >
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
