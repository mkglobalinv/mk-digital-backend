'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Globe } from 'lucide-react';

type ShowcaseBusiness = {
  name: string;
  logo: string | null;
  url: string;
};

/**
 * LiveWebsitePreview — "See a Live Website in Action" CTA.
 * Reuses the same public GET /api/reseller/public/showcase endpoint as
 * BusinessShowcase and links out to one real, currently-eligible reseller
 * website. Renders nothing while loading or if no eligible website exists —
 * never a placeholder/fake site.
 */
export default function LiveWebsitePreview() {
  const [featured, setFeatured] = useState<ShowcaseBusiness | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/reseller/public/showcase')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled) return;
        const list: ShowcaseBusiness[] = Array.isArray(json?.data) ? json.data : [];
        setFeatured(list.length > 0 ? list[Math.floor(Math.random() * list.length)] : null);
      })
      .catch(() => {
        if (!cancelled) setFeatured(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!featured) return null;

  return (
    <section className="py-16 bg-slate-50 border-y border-slate-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center card-light rounded-3xl p-8 sm:p-12 border border-slate-200">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
            See a Live Website in Action
          </h2>
          <p className="text-slate-500 font-medium mb-8">
            Explore what your own branded VTU website can look like.
          </p>

          <div className="flex items-center justify-center gap-3 mb-8">
            {featured.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.logo}
                alt=""
                className="w-11 h-11 rounded-xl object-cover border border-slate-200 bg-white"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Globe className="w-5 h-5 text-emerald-600" />
              </div>
            )}
            <span className="font-bold text-slate-900 text-lg">{featured.name}</span>
          </div>

          <a
            href={featured.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex px-8 py-4 rounded-2xl font-bold items-center justify-center gap-2"
          >
            Visit Live Website <ExternalLink size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
