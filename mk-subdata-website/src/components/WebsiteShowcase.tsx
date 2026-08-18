'use client';

import { motion } from 'framer-motion';

const showcaseItems = [
  {
    image: "/vtu_home_screenshot.png",
    label: "Platform Preview - Storefront",
  },
  {
    image: "/dashboard_screenshot.png",
    label: "Platform Preview - Admin Dashboard",
  },
  {
    image: "/vtu_home_screenshot.png",
    label: "Example Website - Mobile View",
  }
];

export default function WebsiteShowcase() {
  return (
    <section className="py-24 relative overflow-hidden bg-slate-50 border-t border-slate-100" id="showcase">
      <div className="container mx-auto px-4 md:px-6 relative z-10 text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-5 tracking-tight"
        >
          See What Your Own Website Can Look Like
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-slate-500 font-medium max-w-2xl mx-auto"
        >
          Your own brand. Your own website. Your own digital services business.
        </motion.p>
      </div>

      <div className="w-full overflow-x-hidden relative flex">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 140, repeat: Infinity }}
          className="flex gap-8 px-4 pb-12 w-max items-center"
          whileHover={{ animationPlayState: 'paused' }}
        >
          {/* First Set */}
          {showcaseItems.map((item, idx) => (
            <div key={idx} className="flex-none w-[85vw] sm:w-[600px] relative rounded-[2rem] overflow-hidden card-light shadow-[0_16px_40px_rgba(15,23,42,0.12)] group">
              <div className="aspect-[16/9] w-full relative bg-white">
                <img src={item.image} alt={item.label} className="w-full h-full object-contain object-center" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="inline-block px-4 py-2 bg-emerald-600/95 backdrop-blur-sm rounded-lg text-white font-semibold text-sm shadow-lg">
                  {item.label}
                </div>
              </div>
            </div>
          ))}

          {/* Duplicates for seamless looping */}
          {showcaseItems.map((item, idx) => (
            <div key={`dup-${idx}`} className="flex-none w-[85vw] sm:w-[600px] relative rounded-[2rem] overflow-hidden card-light shadow-[0_16px_40px_rgba(15,23,42,0.12)] group">
              <div className="aspect-[16/9] w-full relative bg-white">
                <img src={item.image} alt={item.label} className="w-full h-full object-contain object-center" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="inline-block px-4 py-2 bg-emerald-600/95 backdrop-blur-sm rounded-lg text-white font-semibold text-sm shadow-lg">
                  {item.label}
                </div>
              </div>
            </div>
          ))}

        </motion.div>
      </div>
    </section>
  );
}
