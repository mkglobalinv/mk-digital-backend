import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';
import Pricing from '@/components/Pricing';
import Security from '@/components/Security';
import MobileApp from '@/components/MobileApp';
import Referrals from '@/components/Referrals';
import FaqAndAbout from '@/components/FaqAndAbout';
import Footer from '@/components/Footer';

export const metadata = {
  title: '9JASUB - Power Nigeria\'s Digital Business | VTU Website Creator',
  description: 'Launch your own fully automated, branded VTU website in minutes. Sell Data, Airtime, Electricity, and Exam Pins with zero coding required.',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-blue-500/30 selection:text-blue-200">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <HowItWorks />
        <Features />
        <Pricing />
        <Referrals />
        <MobileApp />
        <Security />
        <FaqAndAbout />
      </main>
      <Footer />
    </div>
  );
}
