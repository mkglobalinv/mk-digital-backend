'use client';

import { motion } from 'framer-motion';
import { Wifi, Phone, Lightbulb, Tv, GraduationCap, ShieldCheck, FileText, Layers } from 'lucide-react';

const services = [
  { icon: Wifi, title: "Data" },
  { icon: Phone, title: "Airtime" },
  { icon: Lightbulb, title: "Electricity" },
  { icon: Tv, title: "Cable TV" },
  { icon: GraduationCap, title: "Education / E-PIN" },
  { icon: ShieldCheck, title: "NIN Verification" },
  { icon: ShieldCheck, title: "BVN Verification" },
  { icon: FileText, title: "NIN Modification" },
  { icon: FileText, title: "BVN Modification" },
  { icon: FileText, title: "CAC Registration" },
  { icon: Layers, title: "More Digital Services" }
];

export default function Services() {
  return (
    <section className="py-24 relative bg-slate-900" id="platform-services">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            Everything You Need
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 font-medium"
          >
            Actual platform services ready to sell from day one.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 flex flex-col items-center justify-center text-center hover:bg-slate-800 transition-colors"
            >
              <service.icon className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="font-bold text-slate-200">{service.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
