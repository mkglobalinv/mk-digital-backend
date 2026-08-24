'use client';

import { motion } from 'framer-motion';
import { Wifi, Phone, Lightbulb, Tv, GraduationCap, ShieldCheck, FileText, Landmark, Layers } from 'lucide-react';

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
  { icon: FileText, title: "Birth Attestation Letter" },
  { icon: Landmark, title: "Court Affidavit" },
  { icon: Layers, title: "More Digital Services" }
];

export default function Services() {
  return (
    <section className="py-24 relative bg-white" id="platform-services">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-slate-900 mb-6"
          >
            Everything You Need
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500 font-medium"
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
              className="card-light p-6 rounded-2xl flex flex-col items-center justify-center text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                <service.icon className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-700 text-sm leading-snug">{service.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
