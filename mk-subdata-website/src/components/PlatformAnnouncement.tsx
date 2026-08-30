'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

const ROTATE_MS = 3200;

/**
 * PlatformAnnouncement — compact, auto-rotating banner introducing the
 * "own your platform" offer right after the services hero. The two lines
 * below cycle vertically on a timer (a discrete slide/fade swap, not a
 * continuous marquee); the CTA stays fixed underneath since it's an action,
 * not part of the announcement.
 */
const slides = [
  { text: 'Own Your Branded Website & App Like Ours', className: 'text-xl md:text-2xl font-extrabold text-slate-900' },
  { text: "It's FREE to get started — automatically create your own platform in just 3 minutes with 9JASUB.", className: 'text-base md:text-lg font-medium text-slate-500' },
];

export default function PlatformAnnouncement() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-10 md:py-12 bg-emerald-50/50 border-y border-emerald-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto card-light rounded-3xl px-6 py-8 md:px-10 md:py-9 flex flex-col items-center text-center gap-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>

          <div
            className="relative w-full min-h-[64px] md:min-h-[56px] flex items-center justify-center overflow-hidden"
            aria-live="polite"
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className={`${slides[index].className} leading-snug max-w-xl`}
              >
                {slides[index].text}
              </motion.p>
            </AnimatePresence>
          </div>

          <Link
            href="/get-started"
            className="btn-primary inline-flex px-7 py-3.5 rounded-2xl font-bold items-center justify-center gap-2"
          >
            Create My Platform <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
