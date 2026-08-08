'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Globe } from 'lucide-react';

const faqs = [
  { q: "How does the ₦5,000 setup work?", a: "The ₦5,000 is a one-time setup fee that automatically provisions your business dashboard, sets up your custom website, and grants you business owner access instantly." },
  { q: "Do I need technical experience?", a: "Absolutely not! The platform is 100% automated. You don't need to know how to code to run your VTU business." },
  { q: "Can I own my own website?", a: "Yes, by purchasing the Website Starter package, you automatically become a business owner and can set your own prices for your customers on your branded website." },
  { q: "How are transactions delivered?", a: "Transactions are processed instantly via our automated switching engine connected directly to telecom providers." },
  { q: "How do I contact support?", a: "You can reach us 24/7 via the WhatsApp button, or email us at support@9jasub.com." }
];

export default function FaqAndAbout() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <section className="py-24 bg-slate-950 relative border-t border-slate-800" id="about">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16">
          
          {/* About Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl mb-2 border border-blue-500/20">
              <Globe size={32} />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">About 9JASUB</h2>
            <div className="text-lg text-slate-400 leading-relaxed font-medium space-y-6">
              <p>9JASUB is a premium product of <strong className="text-white">MK GLOBAL INVESTMENT LTD</strong>, proudly based in Kano, Nigeria.</p>
              <p>9JASUB provides the technology that enables entrepreneurs to own their own branded VTU websites and mobile apps, alongside reliable Data Subscription, Airtime VTU, and Bill Payment services.</p>
              <p className="text-xl font-bold text-blue-400">Our mission is to empower entrepreneurs with affordable technology and business tools.</p>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl font-black text-white tracking-tight mb-8">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900 hover:border-slate-700 transition-colors">
                  <button 
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between font-bold text-slate-200"
                  >
                    {faq.q}
                    {activeFaq === i ? <ChevronUp className="text-blue-500 shrink-0" /> : <ChevronDown className="text-slate-500 shrink-0" />}
                  </button>
                  <AnimatePresence>
                    {activeFaq === i && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-6 pb-5 text-slate-400 font-medium leading-relaxed">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
