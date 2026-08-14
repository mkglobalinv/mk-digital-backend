'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const reviews = [
  { name: "Ibrahim S.", location: "Kano", stars: 5, content: "As a student in BUK, starting my VTU business has been the best decision. The platform runs smoothly and I make good profits daily." },
  { name: "Oluwaseun A.", location: "Lagos", stars: 4, content: "The best platform for data reselling in Lagos. 9JASUB completely changed my business, the ₦5,000 activation fee is a steal." },
  { name: "Chidi N.", location: "Port Harcourt", stars: 5, content: "I integrated the VTU website alongside my POS shop in PH. Very fast API and my customers are happy." },
  { name: "Aisha F.", location: "Abuja", stars: 4, content: "The system is so easy to use. I just set my prices and the platform handles the rest. Highly recommended for entrepreneurs in Abuja." },
  { name: "Emeka O.", location: "Enugu", stars: 3, content: "Great platform! The automated wallet funding works perfectly. I don't have to stress about manual funding anymore." },
  { name: "Fatima M.", location: "Kaduna", stars: 5, content: "Starting my own brand was my dream. Now I have my own VTU website operating 24/7 in Kaduna." },
  { name: "Tunde O.", location: "Ibadan", stars: 4, content: "Excellent service and the cheapest data rates. I resell at a solid margin and keep 100% of my profits." },
  { name: "Yakubu D.", location: "Jos", stars: 5, content: "The dashboard is incredibly easy to use. No coding needed at all. My customers in Jos trust my brand." },
  { name: "Osas I.", location: "Benin City", stars: 5, content: "I love the referral system. I've earned so much just by inviting my friends to start their own VTU business." },
  { name: "Aminu B.", location: "Sokoto", stars: 4, content: "Very reliable network. Even during peak hours, transactions go through instantly. Best VTU creator in Nigeria." }
];

export default function WebsiteShowcase() {
  return (
    <section className="py-24 relative overflow-hidden bg-slate-950 border-t border-slate-800/50" id="reviews">
      <div className="container mx-auto px-4 md:px-6 relative z-10 text-center mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold text-white mb-6"
        >
          Loved by Entrepreneurs Across Nigeria
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-slate-400 font-medium max-w-2xl mx-auto"
        >
          Join thousands of successful digital business owners.
        </motion.p>
      </div>

      <div className="w-full overflow-x-hidden relative flex">
        <motion.div 
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 80, repeat: Infinity }}
          className="flex gap-6 px-4 pb-12 w-max"
        >
          {/* First Set of Reviews */}
          {reviews.map((review, idx) => (
            <div key={idx} className="flex-none w-[85vw] sm:w-[350px] relative rounded-3xl p-8 bg-slate-900 border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex flex-col justify-between hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-300">
              <div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.stars ? 'fill-yellow-500 text-yellow-500' : 'text-slate-700 fill-slate-700'}`} />
                  ))}
                </div>
                <p className="text-slate-300 italic mb-6">"{review.content}"</p>
              </div>
              <div className="border-t border-slate-800 pt-4">
                <h4 className="font-bold text-white">{review.name}</h4>
                <p className="text-sm text-blue-400 font-bold">{review.location}</p>
              </div>
            </div>
          ))}

          {/* Duplicates for seamless looping */}
          {reviews.map((review, idx) => (
            <div key={`dup-${idx}`} className="flex-none w-[85vw] sm:w-[350px] relative rounded-3xl p-8 bg-slate-900 border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex flex-col justify-between hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-300">
              <div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.stars ? 'fill-yellow-500 text-yellow-500' : 'text-slate-700 fill-slate-700'}`} />
                  ))}
                </div>
                <p className="text-slate-300 italic mb-6">"{review.content}"</p>
              </div>
              <div className="border-t border-slate-800 pt-4">
                <h4 className="font-bold text-white">{review.name}</h4>
                <p className="text-sm text-blue-400 font-bold">{review.location}</p>
              </div>
            </div>
          ))}
          
        </motion.div>
      </div>
    </section>
  );
}
