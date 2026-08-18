import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | 9JASUB',
  description: 'Privacy Policy and Data Protection guidelines for 9JASUB users.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-100 selection:text-emerald-900 pb-20">

      {/* Simple Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 py-5 px-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-extrabold text-xl tracking-tight text-slate-900 hover:text-emerald-600 transition-colors">
            9JASUB
          </Link>
          <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto space-y-6">
        <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-lg text-slate-500 font-medium">
          Last Updated: {new Date().toLocaleDateString()}
        </p>
      </section>

      {/* Content */}
      <section className="px-6 max-w-4xl mx-auto">
        <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-slate-200 shadow-sm prose prose-slate prose-lg max-w-none">

          <p>
            At 9JASUB, operated by <strong>MK GLOBAL INVESTMENT LTD</strong>, we take your privacy and data security seriously. This Privacy Policy explains how we collect, use, and protect your information when you use our VTU business platform, website ownership services, and API solutions.
          </p>

          <h3 className="text-2xl font-black text-slate-900 mt-8 mb-4">1. Information We Collect</h3>
          <p>
            When you register for an account, setup a VTU business, or use our services, we may collect the following information:
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li><strong>Personal Information:</strong> Name, email address, phone number, and business details.</li>
            <li><strong>Transaction Records:</strong> History of your data, airtime, and utility purchases.</li>
            <li><strong>Technical Data:</strong> IP address, browser type, and device information used to access our API and dashboards.</li>
          </ul>

          <h3 className="text-2xl font-black text-slate-900 mt-8 mb-4">2. Payment Information Handling</h3>
          <p>
            We do not store your full credit card details. All payment processing is handled securely by our licensed third-party payment gateways (e.g., Paystack, Monnify). We only retain payment references and transaction statuses to credit your wallet and maintain your account history.
          </p>

          <h3 className="text-2xl font-black text-slate-900 mt-8 mb-4">3. How We Use Your Information</h3>
          <p>We use the collected information to:</p>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>Process your VTU transactions and API requests.</li>
            <li>Manage your website owner account and business setup.</li>
            <li>Provide customer support and technical assistance.</li>
            <li>Send important account alerts, security notices, and service updates.</li>
          </ul>

          <h3 className="text-2xl font-black text-slate-900 mt-8 mb-4">4. Account Security</h3>
          <p>
            We implement industry-standard encryption (SSL/TLS) to protect data transmitted between your browser and our servers. API keys are generated cryptographically and must be kept secure by the user. We strongly advise users never to share their login credentials or API keys.
          </p>

          <h3 className="text-2xl font-black text-slate-900 mt-8 mb-4">5. Cookies and Analytics</h3>
          <p>
            We use cookies to maintain your session securely and improve our platform's performance. You can manage cookie preferences through your browser settings, though disabling them may impact your ability to use the website admin dashboard effectively.
          </p>

          <h3 className="text-2xl font-black text-slate-900 mt-8 mb-4">6. Your Data Rights</h3>
          <p>
            You have the right to access, correct, or request the deletion of your personal data. Please contact our support team if you wish to exercise these rights or close your 9JASUB account.
          </p>

          <h3 className="text-2xl font-black text-slate-900 mt-8 mb-4">7. Contact Information</h3>
          <p>
            If you have any questions or concerns about this Privacy Policy, please contact us:
          </p>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-4">
            <p className="mb-2"><strong>Company:</strong> MK GLOBAL INVESTMENT LTD (trading as 9JASUB)</p>
            <p className="mb-2"><strong>Email:</strong> support@9jasub.com</p>
            <p className="mb-2"><strong>Location:</strong> Kano, Nigeria</p>
          </div>

        </div>
      </section>

    </div>
  );
}
