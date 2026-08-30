import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import WebsiteShowcase from '@/components/WebsiteShowcase';
import BusinessShowcase from '@/components/BusinessShowcase';
import HowItWorks from '@/components/HowItWorks';
import LiveWebsitePreview from '@/components/LiveWebsitePreview';
import WhatYouGet from '@/components/WhatYouGet';
import Referrals from '@/components/Referrals';
import MobileApp from '@/components/MobileApp';
import FinalCTA from '@/components/FinalCTA';
import Footer from '@/components/Footer';
import ReferralFloatingButton from '@/components/ReferralFloatingButton';

export const metadata = {
  title: '9JASUB - Data, Airtime, NIN, BVN & Bills',
  description: 'Buy cheap data and airtime, pay bills, cable and exam fees, and handle NIN/BVN enrollment, modification and verification instantly with 9JASUB — plus create your own branded platform for free in just 3 minutes.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '9JASUB - Data, Airtime, NIN, BVN & Bills',
    description: 'Buy cheap data and airtime, pay bills, cable and exam fees, and handle NIN/BVN enrollment, modification and verification instantly with 9JASUB — plus create your own branded platform for free in just 3 minutes.',
    url: '/',
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-600 font-sans selection:bg-emerald-500/20 selection:text-emerald-900">
      <Navbar />
      <main>
        <Hero />
        <WebsiteShowcase />
        <BusinessShowcase />
        <LiveWebsitePreview />
        <HowItWorks />
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
