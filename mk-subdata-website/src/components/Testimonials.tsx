'use client';

import { motion } from 'framer-motion';
import { Globe, Users, DollarSign, Wallet, Activity, Smartphone, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const benefits = [
  {
    icon: Globe,
    title: "Your Own Branded Website",
    content: "Get a professional, modern VTU website with your own domain name and branding. Completely white-labeled."
  },
  {
    icon: Users,
    title: "Your Own Customers",
    content: "Build your own customer base. Users register on your site, and you own the relationship."
  },
  {
    icon: DollarSign,
    title: "Your Own Pricing & Markup",
    content: "You have full control over your pricing. Set your own markup on all services and keep the profits."
  },
  {
    icon: Wallet,
    title: "Customer Wallet System",
    content: "Fully automated wallet funding. Customers fund their wallets directly without any manual intervention from you."
  },
  {
    icon: Activity,
    title: "Business Dashboard",
    content: "Track sales, monitor profits, manage users, and view transaction history from a powerful admin dashboard."
  },
  {
    icon: Smartphone,
    title: "Optional Mobile App",
    content: "Expand your reach by requesting a branded Android app for your business to publish on the Play Store."
  }
];

const faqs = [
  {
    question: "How long does it take to get my website?",
    answer: "Instantly. Once you pay the ₦5,000 hosting fee, your website is generated and activated within milliseconds. No waiting for developers."
  },
  {
    question: "Do I need to know how to code?",
    answer: "Absolutely not. Our platform handles 100% of the technical work. You just upload your logo, choose your colors, and set your prices from a simple dashboard."
  },
  {
    question: "How do I fund my wallet?",
    answer: "You are given a dedicated Monnify/Paystack virtual account number. Any transfer made to that account automatically funds your wallet instantly, 24/7."
  },
  {
    question: "Can I use my own domain name?",
    answer: "Yes! While we provide a free subdomain (e.g., yourname.9jasub.com), you can easily connect your own custom domain (e.g., yourname.com) from your dashboard."
  },
  {
    question: "What happens if a transaction fails?",
    answer: "Our system automatically detects failed transactions and instantly refunds your wallet. We also use intelligent failover routing to minimize failures in the first place."
  }
];

export default function Testimonials() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section className="py-24 relative bg-slate-950/80 border-t border-slate-800/50" id="benefits">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        {/* Benefits */}
        <div className="mb-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold text-white mb-6"
            >
              What <span className="text-blue-400">Business Owners</span> Get
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-full hover:border-slate-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                  <benefit.icon size={24} />
                </div>
                <h4 className="font-bold text-white mb-3 text-lg">{benefit.title}</h4>
                <p className="text-slate-400 leading-relaxed flex-1">{benefit.content}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-white mb-4"
            >
              Frequently Asked Questions
            </motion.h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex justify-between items-center text-left focus:outline-none"
                >
                  <span className="font-semibold text-white">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === idx ? 'auto' : 0, opacity: openFaq === idx ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 text-slate-400">
                    {faq.answer}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
