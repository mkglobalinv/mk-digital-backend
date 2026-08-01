import React, { useState, useEffect } from 'react';
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
  Phone,
  Menu,
  X,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { getSiteName, getSiteSupportEmail } from '../utils/whiteLabelHelper';

const ResellerMarketingHome = ({ siteInfo }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const siteName = getSiteName(siteInfo);
  const logoUrl = siteInfo?.branding?.logo || null;
  const primaryColor = siteInfo?.branding?.primaryColor || '#2563eb'; // Default to a professional blue
  const supportEmail = getSiteSupportEmail(siteInfo);
  const whatsappNumber = siteInfo?.branding?.whatsappNumber || '';

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const waLink = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}` : '#';
  const mailLink = supportEmail ? `mailto:${supportEmail}` : '#';

  const services = [
    { name: 'Cheap Data', desc: 'Instant data top-up for all networks at wholesale prices.', icon: Wifi, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Airtime VTU', desc: 'Automated airtime recharge with instant delivery.', icon: Smartphone, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Electricity Bills', desc: 'Pay prepaid and postpaid meters instantly.', icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Cable TV', desc: 'Renew DSTV, GOTV, and Startimes without delay.', icon: Tv, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'WAEC Result', desc: 'Get WAEC result checker scratch cards.', icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'NECO Tokens', desc: 'Instant NECO result checker tokens.', icon: GraduationCap, color: 'text-rose-600', bg: 'bg-rose-50' },
    { name: 'JAMB E-Pins', desc: 'Purchase JAMB E-Pins securely and fast.', icon: GraduationCap, color: 'text-orange-600', bg: 'bg-orange-50' },
    { name: 'Wallet Funding', desc: 'Automated bank transfers for instant wallet funding.', icon: Wallet, color: 'text-teal-600', bg: 'bg-teal-50' },
  ];

  const features = [
    { title: 'Lightning Fast', desc: 'Transactions are processed and delivered instantly via our automated system.', icon: Zap },
    { title: 'Bank-Grade Security', desc: 'Your funds and data are protected with enterprise-level security protocols.', icon: ShieldCheck },
    { title: 'Best Prices', desc: 'Enjoy the most affordable rates for data, airtime, and bill payments.', icon: CreditCard },
    { title: '24/7 Support', desc: 'Our dedicated customer success team is always available to assist you.', icon: HeadphonesIcon },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden flex flex-col">
      
      {/* HEADER */}
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-200 py-3' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            
            {/* Logo */}
            <div className="flex items-center gap-3 z-50">
              {logoUrl ? (
                 <img src={logoUrl} alt={siteName} className="h-10 md:h-12 w-auto object-contain" />
              ) : (
                <div 
                  className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  {siteName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-extrabold text-xl md:text-2xl tracking-tight text-gray-900 hidden sm:block">
                {siteName}
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-10">
              <a href="#home" className="text-gray-600 hover:text-gray-900 font-semibold text-sm transition-colors">Home</a>
              <a href="#services" className="text-gray-600 hover:text-gray-900 font-semibold text-sm transition-colors">Services</a>
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-semibold text-sm transition-colors">Why Us</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 font-semibold text-sm transition-colors">Contact</a>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-4">
              <Link 
                to="/login" 
                className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all flex items-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                Create Account <ArrowRight size={16} />
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="lg:hidden z-50 flex items-center">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div 
          className={`fixed inset-0 bg-white z-40 transition-transform duration-300 ease-in-out transform ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          } lg:hidden pt-24 px-6 pb-8 flex flex-col h-screen overflow-y-auto`}
        >
          <nav className="flex flex-col space-y-6 mb-10 text-center">
            <a href="#home" onClick={closeMobileMenu} className="text-xl font-bold text-gray-800 hover:text-blue-600">Home</a>
            <a href="#services" onClick={closeMobileMenu} className="text-xl font-bold text-gray-800 hover:text-blue-600">Services</a>
            <a href="#features" onClick={closeMobileMenu} className="text-xl font-bold text-gray-800 hover:text-blue-600">Why Choose Us</a>
            <a href="#contact" onClick={closeMobileMenu} className="text-xl font-bold text-gray-800 hover:text-blue-600">Contact</a>
          </nav>
          
          <div className="flex flex-col gap-4 mt-auto">
            <Link 
              to="/login" 
              onClick={closeMobileMenu}
              className="w-full py-4 text-center text-base font-bold text-gray-700 bg-gray-100 rounded-2xl"
            >
              Sign In
            </Link>
            <Link 
              to="/signup" 
              onClick={closeMobileMenu}
              className="w-full py-4 text-center text-base font-bold text-white rounded-2xl shadow-lg flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              Create Free Account <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="home" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-white">
        {/* Premium Mesh Gradient Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-semibold text-xs md:text-sm mb-8">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
              The #1 Platform for VTU Services
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 md:leading-[1.1]">
              Automate Your <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Digital Payments
              </span>
            </h1>
            
            <p className="mt-6 text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Experience the fastest and most secure way to buy data, airtime, pay electricity bills, and renew TV subscriptions directly from your devices.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 px-4 sm:px-0">
              <Link 
                to="/signup" 
                className="w-full sm:w-auto px-8 py-4 text-base md:text-lg font-bold text-white rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                Get Started Now <ArrowRight size={20} />
              </Link>
              <Link 
                to="/login" 
                className="w-full sm:w-auto px-8 py-4 text-base md:text-lg font-bold text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-2xl transition-all text-center shadow-sm hover:shadow-md"
              >
                Sign In to Dashboard
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap justify-center gap-6 md:gap-12 text-sm md:text-base font-semibold text-gray-500">
              <div className="flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={20} /> Instant Delivery</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={20} /> 100% Secure</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={20} /> 24/7 Automated</div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Everything You Need</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg md:text-xl">One platform to handle all your utility bills and top-ups seamlessly.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div 
                  key={index} 
                  className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300 transform hover:-translate-y-2 group"
                >
                  <div className={`w-14 h-14 ${service.bg} ${service.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={26} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-xl mb-3">{service.name}</h3>
                  <p className="text-gray-500 leading-relaxed">{service.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US SECTION */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/3 text-center lg:text-left">
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Why We Are Different</h2>
              <p className="text-gray-600 text-lg md:text-xl mb-8 leading-relaxed">We built a platform that prioritizes speed, security, and affordability above everything else.</p>
              <Link 
                to="/signup" 
                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white rounded-2xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 w-full sm:w-auto"
                style={{ backgroundColor: primaryColor }}
              >
                Join Us Today
              </Link>
            </div>
            
            <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 w-full">
              {features.map((feat, index) => {
                const Icon = feat.icon;
                return (
                  <div key={index} className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6">
                      <Icon size={24} className="text-gray-800" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-900 mb-3">{feat.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feat.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">We're Here to Help</h2>
          <p className="text-gray-600 text-lg md:text-xl mb-12">Have questions? Reach out to our support team.</p>
          
          <div className="bg-white rounded-[2.5rem] p-8 md:p-16 border border-gray-100 shadow-xl shadow-gray-200/40 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20">
            
            {supportEmail && (
              <a href={mailLink} className="flex flex-col items-center gap-4 group">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center group-hover:-translate-y-2 transition-transform duration-300 shadow-sm border border-blue-100">
                  <Mail size={36} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-xl mb-1">Email Support</div>
                  <div className="text-blue-600 font-medium">{supportEmail}</div>
                </div>
              </a>
            )}

            {whatsappNumber && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-4 group">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center group-hover:-translate-y-2 transition-transform duration-300 shadow-sm border border-emerald-100">
                  <Phone size={36} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-xl mb-1">WhatsApp Us</div>
                  <div className="text-emerald-600 font-medium">{whatsappNumber}</div>
                </div>
              </a>
            )}

            {!supportEmail && !whatsappNumber && (
              <div className="text-gray-500 text-lg bg-gray-100 py-6 px-10 rounded-2xl">
                Contact information is currently being updated.
              </div>
            )}
            
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-16 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-gray-800 pb-12 mb-8">
            
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                {logoUrl ? (
                  <img src={logoUrl} alt={siteName} className="h-10 w-auto grayscale brightness-200" />
                ) : (
                  <div className="font-bold text-2xl text-white">{siteName}</div>
                )}
              </div>
              <p className="text-gray-400 max-w-sm leading-relaxed">
                Your reliable partner for automated digital payments, VTU services, and seamless utility bill settlements in Nigeria.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 text-lg">Quick Links</h4>
              <ul className="space-y-4">
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/signup" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><a href="#services" className="hover:text-white transition-colors">Our Services</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 text-lg">Contact</h4>
              <ul className="space-y-4">
                {supportEmail && <li><a href={mailLink} className="hover:text-white transition-colors">{supportEmail}</a></li>}
                {whatsappNumber && <li><a href={waLink} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{whatsappNumber}</a></li>}
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm font-medium">
            <div>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</div>
            <div className="flex gap-8">
              <span className="cursor-pointer hover:text-white transition-colors">Privacy Policy</span>
              <span className="cursor-pointer hover:text-white transition-colors">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ResellerMarketingHome;
