'use client';

import {
  Wifi, Smartphone, PlaySquare, Zap, GraduationCap,
  Fingerprint, ShieldCheck, Edit3, UserCog, Building2,
  FileText, Landmark,
  type LucideIcon,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ViewContentTracker from '@/components/ViewContentTracker';
import { trackMetaEvent } from '@/lib/metaPixel';

// Every href below points at an existing, already-gated route in the main
// app (mk-vtu-frontend) — token-checked there via <Route ... token ? X :
// <Navigate to="/login" />>, so an unauthenticated visitor lands on the
// existing Personal Account login/signup flow automatically. Data/Airtime/
// Cable/Electricity/Exam PIN share the same /purchase page as the in-app
// "Services" screen already does (see Purchase.jsx's ?service= handling,
// added alongside this page); the identity services route straight to
// /identity/:serviceId using the same api_plan_id slugs the authenticated
// app's own IdentityServicesGrid/IdentityPurchase components use.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

type ServiceCard = {
  name: string;
  desc: string;
  cta: string;
  href: string;
  icon: LucideIcon;
  tint: string; // Tailwind color classes for the icon badge
  // Official issuing-agency logo (NIMC/NIBSS/CAC), shown instead of the
  // icon when present. Cropped from the reference image supplied for this
  // page, per explicit sign-off to use these marks this way.
  badge?: string;
};

const SERVICES: ServiceCard[] = [
  {
    name: 'Data',
    desc: 'Buy affordable data bundles, instantly.',
    cta: 'Buy Data',
    href: '/purchase?service=data',
    icon: Wifi,
    tint: 'bg-blue-500/10 text-blue-600',
  },
  {
    name: 'Airtime',
    desc: 'Recharge any supported network in seconds.',
    cta: 'Buy Airtime',
    href: '/purchase?service=airtime',
    icon: Smartphone,
    tint: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    name: 'Cable TV',
    desc: 'Pay your TV subscription easily.',
    cta: 'Pay Cable',
    href: '/purchase?service=cable',
    icon: PlaySquare,
    tint: 'bg-purple-500/10 text-purple-600',
  },
  {
    name: 'Electricity',
    desc: 'Pay your electricity bill quickly.',
    cta: 'Pay Electricity',
    href: '/purchase?service=electricity',
    icon: Zap,
    tint: 'bg-amber-500/10 text-amber-600',
  },
  {
    name: 'Exam PIN',
    desc: 'Get supported examination PINs.',
    cta: 'Buy Exam PIN',
    href: '/purchase?service=epin',
    icon: GraduationCap,
    tint: 'bg-red-500/10 text-red-600',
  },
  {
    name: 'NIN Verification',
    desc: 'Confirm and retrieve NIN details fast.',
    cta: 'Verify NIN',
    href: '/identity/nin-verify',
    icon: Fingerprint,
    tint: 'bg-teal-500/10 text-teal-600',
    badge: '/badge-nimc.png',
  },
  {
    name: 'BVN Verification',
    desc: 'Confirm and retrieve BVN details fast.',
    cta: 'Verify BVN',
    href: '/identity/bvn-verify',
    icon: ShieldCheck,
    tint: 'bg-cyan-500/10 text-cyan-600',
    badge: '/badge-nibss.png',
  },
  {
    name: 'NIN Modification',
    desc: 'Correct your name, DOB, phone & more.',
    cta: 'Modify NIN',
    href: '/identity/nin-modification',
    icon: Edit3,
    tint: 'bg-indigo-500/10 text-indigo-600',
    badge: '/badge-nimc.png',
  },
  {
    name: 'BVN Modification',
    desc: 'Update your BVN records with ease.',
    cta: 'Modify BVN',
    href: '/identity/bvn-modification',
    icon: UserCog,
    tint: 'bg-violet-500/10 text-violet-600',
    badge: '/badge-nibss.png',
  },
  {
    name: 'CAC Registration',
    desc: 'Register your business name or company.',
    cta: 'Register CAC',
    href: '/identity/cac-registration',
    icon: Building2,
    tint: 'bg-slate-500/10 text-slate-700',
    badge: '/badge-cac.png',
  },
  {
    name: 'Birth Attestation Letter',
    desc: 'Get an assisted Birth Attestation Letter, fully processed for you.',
    cta: 'Request Letter',
    href: '/identity/birth-attestation-letter',
    icon: FileText,
    tint: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    name: 'Court Affidavit',
    desc: 'Prepare a Court Affidavit for name correction, age declaration & more.',
    cta: 'Prepare Affidavit',
    href: '/court-affidavit',
    icon: Landmark,
    tint: 'bg-blue-500/10 text-blue-600',
  },
];

export default function ServicesClient() {
  const handleServiceClick = (service: ServiceCard) => {
    trackMetaEvent('Lead', { content_name: service.name, content_category: 'services_page' });
  };

  return (
    <div className="min-h-screen bg-white text-slate-600 font-sans selection:bg-emerald-500/20 selection:text-emerald-900">
      <ViewContentTracker contentName="Services" contentCategory="product_catalog" />
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden bg-white">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-200/50 rounded-full glow-soft pointer-events-none" />
          <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-5 leading-[1.1]">
              Our Digital <span className="gradient-text">Services</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed">
              Access data, airtime, bills, verification and other digital services quickly and conveniently with 9JASUB.
            </p>
          </div>
        </section>

        {/* Services grid */}
        <section className="pb-24 px-4 md:px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {SERVICES.map((service) => {
                const Icon = service.icon;
                return (
                  <div
                    key={service.name}
                    className="card-light rounded-3xl p-5 md:p-7 flex flex-col"
                  >
                    {service.badge ? (
                      <div className="w-14 h-14 rounded-full mb-5 overflow-hidden ring-1 ring-slate-200 shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={service.badge} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${service.tint}`}>
                        <Icon size={26} />
                      </div>
                    )}
                    <h2 className="text-base md:text-lg font-extrabold text-slate-900 mb-1.5">
                      {service.name}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium leading-snug mb-5 flex-1">
                      {service.desc}
                    </p>
                    <a
                      href={`${APP_URL}${service.href}`}
                      onClick={() => handleServiceClick(service)}
                      className="btn-primary w-full py-3 rounded-xl font-bold text-sm text-center"
                    >
                      {service.cta}
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
