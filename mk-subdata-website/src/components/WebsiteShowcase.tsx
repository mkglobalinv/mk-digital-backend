'use client';

import { motion } from 'framer-motion';

export default function WebsiteShowcase() {
  return (
    <section className="py-24 relative overflow-hidden bg-slate-950 border-t border-slate-800/50" id="showcase">
      <div className="container mx-auto px-4 md:px-6 relative z-10 text-center mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold text-white mb-6"
        >
          See What Your Own Website Can Look Like
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-slate-400 font-medium max-w-2xl mx-auto"
        >
          Your own brand. Your own website. Your own digital services business.
        </motion.p>
      </div>

      <div className="w-full overflow-x-hidden relative flex">
        <motion.div 
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 30, repeat: Infinity }}
          className="flex gap-6 px-4 pb-12 w-max"
        >
          
          <div className="flex-none w-[85vw] md:w-[600px] lg:w-[700px] relative rounded-3xl overflow-hidden border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-full z-10">
              Platform Preview
            </div>
            <img src="/dashboard_screenshot.png" alt="Dashboard Preview" className="w-full h-auto object-cover" />
          </div>

          <div className="flex-none w-[85vw] md:w-[600px] lg:w-[700px] relative rounded-3xl overflow-hidden border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-full z-10">
              Platform Preview
            </div>
            <img src="/vtu_home_screenshot.png" alt="Website Preview" className="w-full h-auto object-cover" />
          </div>
          
          {/* Duplicates for seamless looping */}
          <div className="flex-none w-[85vw] md:w-[600px] lg:w-[700px] relative rounded-3xl overflow-hidden border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-full z-10">
              Platform Preview
            </div>
            <img src="/dashboard_screenshot.png" alt="Dashboard Preview" className="w-full h-auto object-cover" />
          </div>

          <div className="flex-none w-[85vw] md:w-[600px] lg:w-[700px] relative rounded-3xl overflow-hidden border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-full z-10">
              Platform Preview
            </div>
            <img src="/vtu_home_screenshot.png" alt="Website Preview" className="w-full h-auto object-cover" />
          </div>
          
        </motion.div>
      </div>
    </section>
  );
}
