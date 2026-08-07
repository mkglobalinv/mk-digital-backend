'use client';

import { motion } from 'framer-motion';
import { Star, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const testimonials = [
  {
    name: "Oluwaseun A.",
    role: "VTU Vendor in Lagos",
    content: "9JASUB completely changed my business. Before, I was manually sending data to customers. Now my website runs on autopilot even when I'm sleeping. The ₦5,000 monthly fee is nothing compared to what I make."
  },
  {
    name: "Chidi N.",
    role: "Student Entrepreneur",
    content: "I started my VTU website from my hostel with just my smartphone. Within 2 months, I've processed over 500 orders. The setup was instant, exactly as promised."
  },
  {
    name: "Aisha F.",
    role: "POS Business Owner",
    content: "I integrated the VTU website alongside my POS shop. My customers trust my brand because it's my own domain name. The API never fails during peak hours."
  },
  {
    name: "Tunde O.",
    role: "Digital Marketer",
    content: "The cheapest data rates I've seen. I resell at a solid margin and keep 100% of my profits. No coding needed, the dashboard is incredibly easy to use."
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
    <section className="py-24 relative bg-slate-950/80 border-t border-slate-800/50" id="testimonials">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        {/* Testimonials */}
        <div className="mb-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold text-white mb-6"
            >
              Loved by <span className="text-blue-400">Nigerian Entrepreneurs</span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-full"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-slate-300 italic mb-6 flex-1">"{testimonial.content}"</p>
                <div>
                  <h4 className="font-bold text-white">{testimonial.name}</h4>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </div>
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
