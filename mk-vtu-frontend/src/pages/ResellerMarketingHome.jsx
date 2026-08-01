import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Wifi, 
  Smartphone, 
  Lightbulb, 
  Tv, 
  GraduationCap, 
  Wallet, 
  Zap, 
  ShieldCheck, 
  CreditCard, 
  HeadphonesIcon,
  Mail,
  Phone
} from 'lucide-react';
import { getSiteName, getSiteSupportEmail } from '../utils/whiteLabelHelper';

const ResellerMarketingHome = ({ siteInfo }) => {
  const siteName = getSiteName(siteInfo);
  const logoUrl = siteInfo?.branding?.logo || '/images/default-logo.png';
  const primaryColor = siteInfo?.branding?.primaryColor || '#3b82f6';
  const supportEmail = getSiteSupportEmail(siteInfo);
  const whatsappNumber = siteInfo?.branding?.whatsappNumber || '';

  // Helper to ensure valid URL for links
  const waLink = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}` : '#';
  const mailLink = supportEmail ? `mailto:${supportEmail}` : '#';

  const services = [
    { name: 'Data', icon: Wifi, color: 'text-blue-500', bg: 'bg-blue-100' },
    { name: 'Airtime', icon: Smartphone, color: 'text-green-500', bg: 'bg-green-100' },
    { name: 'Electricity', icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { name: 'Cable TV', icon: Tv, color: 'text-purple-500', bg: 'bg-purple-100' },
    { name: 'WAEC', icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-100' },
    { name: 'NECO', icon: GraduationCap, color: 'text-pink-500', bg: 'bg-pink-100' },
    { name: 'JAMB', icon: GraduationCap, color: 'text-orange-500', bg: 'bg-orange-100' },
    { name: 'Fund Wallet', icon: Wallet, color: 'text-teal-500', bg: 'bg-teal-100' },
  ];

  const features = [
    { title: 'Fast Delivery', desc: 'Instant fulfillment for all transactions.', icon: Zap },
    { title: 'Secure Payments', desc: 'Bank-grade security for your funds.', icon: ShieldCheck },
    { title: 'Affordable Prices', desc: 'The best rates in the market.', icon: CreditCard },
    { title: '24/7 Support', desc: 'We are always here to help you.', icon: HeadphonesIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo & Name */}
            <div className="flex items-center gap-3">
              {siteInfo?.branding?.logo ? (
                 <img src={logoUrl} alt={`${siteName} Logo`} className="h-10 w-auto object-contain" />
              ) : (
                <div 
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  {siteName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-bold text-xl md:text-2xl tracking-tight text-slate-800 hidden sm:block">
                {siteName}
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8">
              <a href="#home" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Home</a>
              <a href="#services" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Services</a>
              <a href="#contact" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Contact</a>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                to="/login" 
                className="px-4 py-2 text-sm md:text-base font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="px-4 py-2 text-sm md:text-base font-semibold text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                style={{ backgroundColor: primaryColor }}
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="home" className="relative pt-20 pb-28 md:pt-32 md:pb-40 overflow-hidden flex-1 flex flex-col justify-center">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-50 via-white to-slate-100"></div>
        {/* Decorative background blur */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Buy Data, Airtime & <br className="hidden md:block" />
            <span style={{ color: primaryColor }}>Pay Bills Instantly</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg md:text-xl text-slate-600 mx-auto mb-10 leading-relaxed">
            Welcome to {siteName}. Enjoy automated, fast, and secure VTU services. Top-up your lines, pay electricity bills, and renew cable subscriptions with ease.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link 
              to="/signup" 
              className="w-full sm:w-auto px-8 py-4 text-lg font-bold text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              style={{ backgroundColor: primaryColor }}
            >
              Create Free Account
            </Link>
            <Link 
              to="/login" 
              className="w-full sm:w-auto px-8 py-4 text-lg font-bold text-slate-700 bg-white border-2 border-slate-200 hover:border-slate-300 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              Login to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our Services</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">We offer a wide range of automated services tailored just for you.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div 
                  key={index} 
                  className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default"
                >
                  <div className={`mx-auto w-14 h-14 ${service.bg} ${service.color} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
                    <Icon size={28} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">{service.name}</h3>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US SECTION */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Choose Us</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Experience the best VTU platform built for speed and reliability.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feat, index) => {
              const Icon = feat.icon;
              return (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center md:text-left">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                    <Icon size={24} className="text-slate-700" />
                  </div>
                  <h3 className="font-bold text-xl text-slate-900 mb-3">{feat.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">Get In Touch</h2>
          <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            
            {supportEmail && (
              <a href={mailLink} className="flex flex-col items-center gap-3 group">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail size={32} />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-lg">Email Us</div>
                  <div className="text-slate-500 font-medium">{supportEmail}</div>
                </div>
              </a>
            )}

            {whatsappNumber && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-3 group">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone size={32} />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-lg">WhatsApp</div>
                  <div className="text-slate-500 font-medium">{whatsappNumber}</div>
                </div>
              </a>
            )}

            {!supportEmail && !whatsappNumber && (
              <div className="text-slate-500 italic">Contact information is currently unavailable.</div>
            )}
            
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-300 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-slate-800 pb-8 mb-8">
            <div className="flex items-center gap-3">
              {siteInfo?.branding?.logo ? (
                <img src={logoUrl} alt={`${siteName} Logo`} className="h-8 w-auto grayscale brightness-200" />
              ) : (
                <div className="font-bold text-xl text-white">{siteName}</div>
              )}
            </div>
            
            <div className="flex gap-6">
              <Link to="/login" className="hover:text-white transition-colors">Login</Link>
              <Link to="/signup" className="hover:text-white transition-colors">Create Account</Link>
              {supportEmail && <a href={mailLink} className="hover:text-white transition-colors">Email</a>}
              {whatsappNumber && <a href={waLink} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a>}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <div>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</div>
            <div className="flex gap-4">
              <span className="cursor-pointer hover:text-slate-300">Privacy Policy</span>
              <span className="cursor-pointer hover:text-slate-300">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ResellerMarketingHome;
