import ServicesClient from './ServicesClient';

export const metadata = {
  title: 'Our Services | 9JASUB - Data, Airtime, Bills & More',
  description: 'Buy data, airtime, pay cable TV and electricity bills, get exam PINs, and verify or modify your NIN/BVN — all in one place with 9JASUB.',
  alternates: {
    canonical: '/services',
  },
  openGraph: {
    title: 'Our Services | 9JASUB - Data, Airtime, Bills & More',
    description: 'Buy data, airtime, pay cable TV and electricity bills, get exam PINs, and verify or modify your NIN/BVN — all in one place with 9JASUB.',
    url: '/services',
  },
};

export default function ServicesPage() {
  return <ServicesClient />;
}
