import GetStartedClient from './GetStartedClient';

export const metadata = {
  title: 'Get Started | 9JASUB',
  description: 'Own your VTU website and app in 5 minutes, or create a personal account to buy data, airtime, and pay bills instantly with 9JASUB.',
  alternates: {
    canonical: '/get-started',
  },
  openGraph: {
    title: 'Get Started | 9JASUB',
    description: 'Own your VTU website and app in 5 minutes, or create a personal account to buy data, airtime, and pay bills instantly with 9JASUB.',
    url: '/get-started',
  },
};

export default function GetStarted() {
  return <GetStartedClient />;
}
