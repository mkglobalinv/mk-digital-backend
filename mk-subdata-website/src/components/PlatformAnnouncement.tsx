'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

const ROTATE_MS = 3200;

/**
 * PlatformAnnouncement — compact, auto-rotating card introducing the "own
 * your platform" offer, embedded directly under the hero's "Explore Our
 * Services" button. The two lines below cycle vertically on a timer (a
 * discrete slide/fade swap, not a continuous marquee); the CTA stays fixed
 * underneath since it's an action, not part of the announcement.
 */
const slides = [
  { text: 'Own Your Branded Website & App Like Ours', className: 'text-lg md:text-xl font-extrabold text-slate-900' },
  { text: "It's FREE to get started — automatically create your own platform in just 3 minutes with 9JASUB.", className: 'text-sm md:text-base font-medium text-slate-500' },
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
    <div className="w-full card-light rounded-3xl px-6 py-6 md:px-8 md:py-7 flex flex-col items-center text-center gap-4">
      <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
        <Sparkles className="w-4.5 h-4.5" />
      </div>

      <div
        className="relative w-full min-h-[56px] md:min-h-[48px] flex items-center justify-center overflow-hidden"
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
  );
}
