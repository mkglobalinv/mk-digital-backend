import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import WebsiteShowcase from '@/components/WebsiteShowcase';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';
import Services from '@/components/Services';
import Referrals from '@/components/Referrals';
import MobileApp from '@/components/MobileApp';
import FinalCTA from '@/components/FinalCTA';
import Footer from '@/components/Footer';

export const metadata = {
  title: '9JASUB - Own Your VTU Website & App',
  description: 'Launch your own fully automated, branded digital services business in just 5 minutes with zero coding required.',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-600 font-sans selection:bg-emerald-500/20 selection:text-emerald-900">
      <Navbar />
      <main>
        <Hero />
        <WebsiteShowcase />
        <HowItWorks />
        <Features />
        <Services />
        <Referrals />
        <MobileApp />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
