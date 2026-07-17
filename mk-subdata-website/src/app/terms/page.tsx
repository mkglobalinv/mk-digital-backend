import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | 9JASUB',
  description: 'Terms of Service and conditions for using 9JASUB VTU platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900 pb-20">
      
      {/* Simple Header */}
      <header className="bg-white border-b border-slate-200 py-6 px-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-tight text-slate-900 hover:text-blue-600 transition-colors">
            9JASUB
          </Link>
          <Link href="/" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto space-y-6">
        <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
          <Scale size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Terms of Service
        </h1>
        <p className="text-lg text-slate-500 font-medium">
          Last Updated: {new Date().toLocaleDateString()}
        </p>
      </section>

      {/* Content */}
      <section className="px-6 max-w-4xl mx-auto">
        <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-slate-200 shadow-sm prose prose-slate prose-lg max-w-none">
          
          <p>
            Welcome to 9JASUB. By registering for an account, accessing our website, using our API, or purchasing our VTU business setup services, you agree to be bound by these Terms of Service. Please read them carefully.
          </p>

          <h3 className="text-2xl font-black text-slate-900 mt-8 mb-4">1. Account Registration</h3>
          <p>
            To use our services, you must register for an account and provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials, wallet PIN, and API keys. 9JASUB will not be liable for any loss arising from your failure to secure your account.
          </p>

          <h3 className="text-2xl font-black text-slate-900 mt-8 mb-4">2. User Responsibilities</h3>
          <p>As a user or business owner on 9JASUB, you agree to:</p>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>Fund your wallet using only legitimate and authorized payment methods.</li>
            <li>Ensure the accuracy of phone numbers, meter numbers, and smart card numbers before initiating a transaction.</li>
            <li>Comply with all applicable Nigerian laws and telecommunication regulations regarding digital utility vending.</li>
          </ul>

          <h3 className="text-2xl font-black text-slate-900 mt-8 mb-4">3. Transaction Policies & Service Availability</h3>
          <p>
            9JASUB facilitates transactions through third-party providers (e.g., MTN, Airtel, DisCos). While we strive for 99.9% uptime, we do not guarantee uninterrupted service if the underlying network provider is experiencing downtime. Completed transactions cannot be reversed once processed by the network provider.
          </p>

          <h3 id="refund" className="text-2xl font-black text-slate-900 mt-8 mb-4">4. Refund Policy</h3>
          <p>
            Refunds are only issued for transactions that fail definitively on our end without delivering the requested value. 
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li><strong>Failed Transactions:</strong> If your wallet is debited but the service fails, the system will automatically refund your wallet. If it does not, please contact support within 24 hours.</li>
            <li><strong>User Errors:</strong> We do not offer refunds for transactions sent to the wrong phone number or wrong meter number due to user error. Please verify all details before confirming purchases.</li>
            <li><strong>Business Setup Fee:</strong> The ₦5,000 VTU business setup fee is non-refundable once the platform deployment process has commenced.</li>
          </ul>

          <h3 className="text-2xl font-black text-slate-900 mt-8 mb-4">5. Prohibited Activities</h3>
          <p>Users are strictly prohibited from:</p>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>Using stolen credit cards or fraudulent funds to top-up wallets.</li>
            <li>Attempting to hack, exploit, or disrupt the 9JASUB API or business platform.</li>
            <li>Using our services for money laundering or any illegal activities.</li>
          </ul>

          <h3 className="text-2xl font-black text-slate-900 mt-8 mb-4">6. Account Suspension</h3>
          <p>
            9JASUB reserves the right to suspend or terminate any account found violating these Terms of Service, engaging in fraudulent activities, or maintaining an abnormal dispute rate, without prior notice.
          </p>

          <h3 className="text-2xl font-black text-slate-900 mt-8 mb-4">7. Limitation of Liability</h3>
          <p>
            Under no circumstances shall MK GLOBAL INVESTMENT LTD be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our services, including lost profits or business interruptions.
          </p>

          <h3 className="text-2xl font-black text-slate-900 mt-8 mb-4">8. Contact Information</h3>
          <p>
            For legal inquiries or questions regarding these Terms, contact us:
          </p>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-4">
            <p className="mb-2"><strong>Company:</strong> MK GLOBAL INVESTMENT LTD</p>
            <p className="mb-2"><strong>Email:</strong> support@9jasub.com</p>
            <p className="mb-2"><strong>Phone:</strong> 0904 105 0812</p>
          </div>

        </div>
      </section>

    </div>
  );
}
