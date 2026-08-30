'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink, Globe } from 'lucide-react';
import Link from 'next/link';

type ShowcaseBusiness = {
  name: string;
  logo: string | null;
  url: string;
};

const MIN_ITEMS_TO_SHOW = 2;
const MAX_DOTS = 10;
const CARD_STEP_PX = 296; // card width (280) + gap-4 (16)
const AUTO_ADVANCE_MS = 3200;
const RESUME_AFTER_INTERACTION_MS = 4500;

const hostname = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

/**
 * WebsiteShowcase — "Websites Created With 9JASUB" carousel.
 *
 * Reuses the same real, existing public GET /api/reseller/public/showcase
 * endpoint as BusinessShowcase/LiveWebsitePreview (name/logo/url of real
 * registered businesses only — no invented businesses, names, or stats).
 * Renders nothing if too few qualify, same as those components.
 *
 * Live reseller sites keep the default X-Frame-Options: SAMEORIGIN
 * (see server.js — only /storefront-preview is ever framed), so cards
 * link out to the real site in a new tab instead of embedding it.
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

  const scrollToIndex = (idx: number) => {
    scrollerRef.current?.scrollTo({ left: idx * CARD_STEP_PX, behavior: 'smooth' });
  };

  const startAutoAdvance = () => {
    if (autoAdvanceTimer.current || !businesses) return;
    autoAdvanceTimer.current = setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      const nextLeft = atEnd ? 0 : el.scrollLeft + CARD_STEP_PX;
      el.scrollTo({ left: nextLeft, behavior: 'smooth' });
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
    const onScroll = () => {
      setActiveIndex(Math.round(el.scrollLeft / CARD_STEP_PX));
    };
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

        <div
          ref={scrollerRef}
          onTouchStart={pauseAutoAdvance}
          onMouseDown={pauseAutoAdvance}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {businesses.map((biz, idx) => (
            <a
              key={idx}
              href={biz.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group shrink-0 snap-start w-[280px] rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 border-b border-slate-200">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="ml-2 text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 truncate">
                  {hostname(biz.url)}
                </span>
              </div>

              <div className="h-[150px] flex flex-col items-center justify-center gap-3 px-6 bg-gradient-to-b from-emerald-50/50 to-white">
                {biz.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={biz.logo}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-emerald-600" />
                  </div>
                )}
                <p className="font-bold text-slate-900 text-sm text-center truncate max-w-full">{biz.name}</p>
              </div>

              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 group-hover:gap-2.5 transition-all">
                Visit Website <ExternalLink size={13} />
              </div>
            </a>
          ))}
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
