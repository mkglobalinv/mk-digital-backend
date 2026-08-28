import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import WebsiteDemo from '@/components/WebsiteDemo';
import BusinessShowcase from '@/components/BusinessShowcase';
import HowItWorks from '@/components/HowItWorks';
import Services from '@/components/Services';
import LiveWebsitePreview from '@/components/LiveWebsitePreview';
import WhatYouGet from '@/components/WhatYouGet';
import Referrals from '@/components/Referrals';
import MobileApp from '@/components/MobileApp';
import FinalCTA from '@/components/FinalCTA';
import Footer from '@/components/Footer';
import ReferralFloatingButton from '@/components/ReferralFloatingButton';

export const metadata = {
  title: '9JASUB - Own Your VTU Website & App',
  description: 'Launch your own fully automated, branded digital services business in just 5 minutes with zero coding required.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '9JASUB - Own Your VTU Website & App',
    description: 'Launch your own fully automated, branded digital services business in just 5 minutes with zero coding required.',
    url: '/',
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-600 font-sans selection:bg-emerald-500/20 selection:text-emerald-900">
      <Navbar />
      <main>
        <Hero />
        <BusinessShowcase />
        <WebsiteDemo />
        <LiveWebsitePreview />
        <HowItWorks />
        <Services />
        <WhatYouGet />
        <Referrals />
        <MobileApp />
        <FinalCTA />
      </main>
      <Footer />
      <ReferralFloatingButton />
    </div>
  );
}
