const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src', 'app', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

const markers = [
  "{/* 1. NAVIGATION */}",
  "{/* 2. HERO SECTION */}",
  "{/* 2.5 WHY PEOPLE LOVE 9JASUB */}",
  "{/* 3. WHY CHOOSE 9JASUB (Features) */}",
  "{/* 4. PLATFORM SHOWCASE */}",
  "{/* 5. BUSINESS PACKAGES (Pricing) */}",
  "{/* 5.5 LIFETIME REFERRAL REWARDS SECTION (NEW) */}",
  "{/* 6. HOW IT WORKS */}",
  "{/* 7. BUSINESS BENEFITS (Trust & Stats) */}",
  "{/* 8. MOBILE APP SECTION */}",
  "{/* 9. ABOUT COMPANY */}",
  "{/* 10. FAQ SECTION */}",
  "{/* 11. CONTACT SECTION */}",
  "{/* 12. FOOTER */}"
];

// Split the file based on markers
let parts = {};
let currentMarker = "HEADER";
let currentContent = [];

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let foundMarker = false;
  for (const marker of markers) {
    if (line.includes(marker)) {
      parts[currentMarker] = currentContent.join('\n');
      currentMarker = marker;
      currentContent = [line];
      foundMarker = true;
      break;
    }
  }
  if (!foundMarker) {
    currentContent.push(line);
  }
}
parts[currentMarker] = currentContent.join('\n');

// Now, extract the exact last part (from Footer down to closing tags)
let footerLines = parts["{/* 12. FOOTER */}"].split('\n');
// the file ends with:
//     </div>
//   );
// }

// Create new sections:
const howWeEarnAndStory = `
      {/* NEW: HOW WEBSITE OWNERS EARN & REAL CUSTOMER EXAMPLE */}
      <section id="how-we-earn" className="py-24 bg-slate-50 px-6 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">How Your VTU Business Makes Money</h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
              Customers visit your website. They purchase digital services. Your website processes those orders. As a Website Owner, you earn from the difference between your selling price and the service cost.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/40">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Briefcase size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">Basic Website Owners</h3>
              <ul className="space-y-4">
                <li className="flex gap-3 text-slate-600 font-medium"><CheckCircle2 className="text-emerald-500 shrink-0" /> Ready-to-sell pricing</li>
                <li className="flex gap-3 text-slate-600 font-medium"><CheckCircle2 className="text-emerald-500 shrink-0" /> Prices already configured</li>
                <li className="flex gap-3 text-slate-600 font-medium"><CheckCircle2 className="text-emerald-500 shrink-0" /> Start selling immediately</li>
                <li className="flex gap-3 text-slate-600 font-medium"><CheckCircle2 className="text-emerald-500 shrink-0" /> No pricing knowledge required</li>
              </ul>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden text-white">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[50px] pointer-events-none" />
              <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                <Award size={24} />
              </div>
              <h3 className="text-2xl font-black text-white mb-4">Premium Website Owners</h3>
              <ul className="space-y-4">
                <li className="flex gap-3 text-slate-300 font-medium"><CheckCircle2 className="text-blue-400 shrink-0" /> Everything in Basic</li>
                <li className="flex gap-3 text-slate-300 font-medium"><CheckCircle2 className="text-blue-400 shrink-0" /> Customize your own prices</li>
                <li className="flex gap-3 text-slate-300 font-medium"><CheckCircle2 className="text-blue-400 shrink-0" /> Build your own pricing strategy</li>
                <li className="flex gap-3 text-slate-300 font-medium"><CheckCircle2 className="text-blue-400 shrink-0" /> Full pricing control</li>
              </ul>
            </div>
          </div>

          {/* Real Customer Example */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[3rem] p-8 md:p-12 shadow-2xl text-white relative overflow-hidden max-w-5xl mx-auto">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="grid md:grid-cols-5 gap-8 items-center relative z-10">
              <div className="md:col-span-2 flex justify-center">
                <div className="w-48 h-48 bg-white/10 rounded-full border-4 border-white/20 flex items-center justify-center shadow-inner">
                  <User size={80} className="text-white/80" />
                </div>
              </div>
              <div className="md:col-span-3 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-xs font-black tracking-widest uppercase border border-white/20 shadow-sm">
                  <Activity size={14} /> See How It Works
                </div>
                <div className="space-y-4 text-lg font-medium text-blue-50 leading-relaxed">
                  <p>Ahmed creates his VTU website. He shares his website on WhatsApp and Facebook.</p>
                  <p>Customers begin buying airtime, data, electricity, and other digital services.</p>
                  <p>Every successful transaction helps grow Ahmed's business through the pricing configured on his website.</p>
                  <p className="font-bold text-white">As his customer base grows, his earning potential grows too.</p>
                  <p className="text-xs text-blue-200 italic mt-4 opacity-80">*This example is illustrative only.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
`;

const finalCta = `
      {/* NEW: CONVERSION SECTION */}
      <section className="py-24 bg-white px-6 border-t border-slate-200">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight">Own Your VTU Business Today</h2>
            <p className="text-xl text-slate-500 font-bold max-w-2xl mx-auto">Launch your own branded VTU website for only ₦5,000.</p>
          </div>
          
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-slate-700 font-bold">
            <li className="flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={20}/> No office.</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={20}/> No developers.</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={20}/> No coding.</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={20}/> No expensive software.</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={20}/> No inventory.</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={20}/> Start selling immediately.</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={20}/> Your website works 24 hours a day.</li>
          </ul>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
            <Link href="/get-started" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all group">
              Create My Website
            </Link>
            <Link href="/#how-it-works" className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group">
              Learn How It Works
            </Link>
          </div>
        </div>
      </section>
`;

// Build new file structure in the requested order:
// Hero
// Platform Preview
// How It Works
// How Website Owners Earn
// Pricing
// Referral & Lifetime Rewards
// (Others: Why People Love, Features, Business Benefits, Mobile App, About, Contact)
// Testimonials / FAQ
// Final CTA
// Footer

const newOrder = [
  "HEADER",
  "{/* 1. NAVIGATION */}",
  "{/* 2. HERO SECTION */}",
  "{/* 4. PLATFORM SHOWCASE */}",
  "{/* 6. HOW IT WORKS */}",
  "HOW_WE_EARN_INJECTION",
  "{/* 5. BUSINESS PACKAGES (Pricing) */}",
  "{/* 5.5 LIFETIME REFERRAL REWARDS SECTION (NEW) */}",
  "{/* 2.5 WHY PEOPLE LOVE 9JASUB */}",
  "{/* 3. WHY CHOOSE 9JASUB (Features) */}",
  "{/* 7. BUSINESS BENEFITS (Trust & Stats) */}",
  "{/* 8. MOBILE APP SECTION */}",
  "{/* 9. ABOUT COMPANY */}",
  "{/* 11. CONTACT SECTION */}",
  "{/* 10. FAQ SECTION */}",
  "FINAL_CTA_INJECTION",
  "{/* 12. FOOTER */}"
];

let finalContent = "";

for (const sec of newOrder) {
  if (sec === "HOW_WE_EARN_INJECTION") {
    finalContent += howWeEarnAndStory + "\n";
  } else if (sec === "FINAL_CTA_INJECTION") {
    finalContent += finalCta + "\n";
  } else {
    finalContent += parts[sec] + "\n";
  }
}

fs.writeFileSync(pagePath, finalContent);
console.log("Reorder completed successfully.");
