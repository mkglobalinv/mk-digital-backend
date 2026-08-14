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
          transition={{ ease: "linear", duration: 120, repeat: Infinity }}
          className="flex gap-8 px-4 pb-12 w-max items-center"
          whileHover={{ animationPlayState: 'paused' }}
        >
          {/* First Set */}
          {showcaseItems.map((item, idx) => (
            <div key={idx} className="flex-none w-[85vw] sm:w-[600px] relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.4)] group">
              <div className="aspect-[16/9] w-full relative">
                <img src={item.image} alt={item.label} className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="inline-block px-4 py-2 bg-blue-600/90 backdrop-blur-sm rounded-lg text-white font-bold text-sm shadow-lg">
                  {item.label}
                </div>
              </div>
            </div>
          ))}

          {/* Duplicates for seamless looping */}
          {showcaseItems.map((item, idx) => (
            <div key={`dup-${idx}`} className="flex-none w-[85vw] sm:w-[600px] relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.4)] group">
              <div className="aspect-[16/9] w-full relative">
                <img src={item.image} alt={item.label} className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="inline-block px-4 py-2 bg-blue-600/90 backdrop-blur-sm rounded-lg text-white font-bold text-sm shadow-lg">
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
