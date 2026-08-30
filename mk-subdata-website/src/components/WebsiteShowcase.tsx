'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Wifi, Smartphone, Lightbulb, Tv } from 'lucide-react';
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

const FEATURE_ICONS = [Wifi, Smartphone, Lightbulb, Tv];

const hostname = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

/**
 * WebsiteShowcase — "Websites Created With 9JASUB" carousel.
 *
 * Reuses the same real, existing public GET /api/reseller/public/showcase
 * endpoint as the (now-removed) BusinessShowcase/LiveWebsitePreview did —
 * real registered business name/logo/url only, nothing invented. Renders
 * nothing if too few qualify.
 *
 * Every reseller site built with 9JASUB shares the exact same live
 * template (ResellerMarketingHome — nav with logo/name, "Digital
 * payments, simplified." hero, Data/Airtime/Bills/Cable icon row), so the
 * mini preview inside each card mirrors that real, shared layout with the
 * business's real name/logo — an accurate miniature, not a fabricated one.
 *
 * Live reseller sites keep the default X-Frame-Options: SAMEORIGIN (see
 * server.js — only /storefront-preview is ever framed), so cards link out
 * to the real site in a new tab instead of embedding it.
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
                <a
                  key={idx}
                  href={biz.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group shrink-0 snap-start w-[78vw] max-w-[300px] sm:w-[300px] rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Browser chrome */}
                  <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 border-b border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 truncate">
                      {hostname(biz.url)}
                    </span>
                  </div>

                  {/* Mini live-site preview — mirrors the real shared template */}
                  <div className="bg-white">
                    <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {biz.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={biz.logo} alt="" className="w-5 h-5 rounded-md object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-md bg-emerald-600 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                            {initial}
                          </div>
                        )}
                        <span className="text-[11px] font-extrabold text-slate-900 truncate">{biz.name}</span>
                      </div>
                      <span className="text-[8px] font-bold text-white bg-emerald-600 px-2 py-1 rounded-md shrink-0">Get Started</span>
                    </div>

                    <div className="px-4 py-6 bg-gradient-to-b from-emerald-50/70 to-white text-center">
                      <p className="text-[13px] font-extrabold text-slate-900 leading-snug mb-4">
                        Digital payments, <span className="text-emerald-600">simplified.</span>
                      </p>
                      <div className="flex items-center justify-center gap-2.5">
                        {FEATURE_ICONS.map((Icon, i) => (
                          <div key={i} className="w-7 h-7 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                            <Icon size={13} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 group-hover:gap-2.5 transition-all">
                    Visit Website <ExternalLink size={13} />
                  </div>
                </a>
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
