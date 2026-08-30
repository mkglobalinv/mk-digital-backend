'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Globe, Loader2 } from 'lucide-react';
import Link from 'next/link';

const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.9jasub.com';

/**
 * WebsiteDemo — "Own Your Platform" pitch, paired with the "See Your
 * Website" interactive preview demo.
 *
 * The preview panel embeds the REAL ResellerMarketingHome component (the
 * exact same one every live reseller storefront uses) via the dedicated
 * /storefront-preview route in the main app, fed only an in-memory brand
 * name through a URL query param — no API call from this site, no
 * account/platform is created. The CTAs route to the existing /get-started
 * flow, same as the rest of the site.
 */
export default function WebsiteDemo() {
  const [businessName, setBusinessName] = useState('');
  const [iframeSrc, setIframeSrc] = useState('');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const trimmed = businessName.trim();
  const displayName = trimmed || 'ABC Data';
  const slug = slugify(trimmed) || 'abcdata';

  // The preview only loads once the visitor explicitly asks for it — never
  // automatically on page load or while typing.
  const showWebsite = () => {
    setIframeLoaded(false);
    setIframeSrc(`${APP_URL}/storefront-preview?brand=${encodeURIComponent(displayName)}`);
    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Safety net: some browsers don't fire onLoad reliably for cross-origin
  // iframes. Hide the loading spinner after a short delay regardless, so it
  // never gets stuck even if onLoad doesn't fire.
  useEffect(() => {
    if (!iframeSrc) return;
    const handle = setTimeout(() => setIframeLoaded(true), 3000);
    return () => clearTimeout(handle);
  }, [iframeSrc]);

  return (
    <section className="py-20 lg:py-24 bg-white" id="see-your-website">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div className="text-center lg:text-left">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 leading-tight"
            >
              Own Your Branded Website & App Like Ours
            </motion.h2>
            <p className="text-lg text-slate-500 font-medium mb-2">
              It&apos;s <span className="font-extrabold text-emerald-600">FREE</span> to get started — automatically create your own platform in just 3 minutes with 9JASUB.
            </p>
            <p className="text-base text-slate-500 font-medium mb-6">
              Start offering digital services under your own brand, just like us.
            </p>

            <Link
              href="/get-started"
              className="btn-primary inline-flex w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg items-center justify-center gap-3"
            >
              Create My Platform <ArrowRight size={20} />
            </Link>

            <p className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-400">
              Your Website &nbsp;&bull;&nbsp; Your Brand &nbsp;&bull;&nbsp; Your Business
            </p>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-slate-700 font-bold mb-1">Want to see it first?</p>
              <p className="text-sm text-slate-500 font-medium mb-4">
                Enter your platform name to preview it before creating.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  showWebsite();
                }}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto lg:mx-0"
              >
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter your platform name"
                  maxLength={40}
                  className="flex-1 px-5 py-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="btn-outline px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shrink-0"
                >
                  Preview My Platform <ArrowRight size={18} />
                </button>
              </form>

              <p className="text-xs text-slate-400 mt-4">
                This is a visual preview only — no website or account is created until you sign up.
              </p>
            </div>
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

            <div className="relative bg-white" style={{ height: '520px' }}>
              {!iframeSrc ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 bg-slate-50">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
                    <Globe className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-slate-500 font-medium text-sm">
                    Enter your platform name and click <span className="font-bold text-slate-700">&ldquo;Preview My Platform&rdquo;</span> to see it here.
                  </p>
                </div>
              ) : (
                <>
                  {!iframeLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                      <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                    </div>
                  )}
                  <iframe
                    src={iframeSrc}
                    title="Live preview of your VTU website"
                    className="w-full h-full border-0"
                    onLoad={() => setIframeLoaded(true)}
                  />
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
