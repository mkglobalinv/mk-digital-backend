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
import './ResellerMarketingHome.css';

const ResellerMarketingHome = ({ siteInfo }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const siteName = getSiteName(siteInfo);
  const logoUrl = siteInfo?.branding?.logo || null;
  const primaryColor = siteInfo?.branding?.primaryColor || '#2563eb'; 
  const supportEmail = getSiteSupportEmail(siteInfo);
  const whatsappNumber = siteInfo?.branding?.whatsappNumber || '';

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
    { name: 'Cheap Data', desc: 'Instant data top-up for all networks at wholesale prices.', icon: Wifi, iconColor: '#2563eb', iconBg: '#eff6ff' },
    { name: 'Airtime VTU', desc: 'Automated airtime recharge with instant delivery.', icon: Smartphone, iconColor: '#059669', iconBg: '#ecfdf5' },
    { name: 'Electricity Bills', desc: 'Pay prepaid and postpaid meters instantly.', icon: Lightbulb, iconColor: '#d97706', iconBg: '#fffbeb' },
    { name: 'Cable TV', desc: 'Renew DSTV, GOTV, and Startimes without delay.', icon: Tv, iconColor: '#7c3aed', iconBg: '#f5f3ff' },
    { name: 'WAEC Result', desc: 'Get WAEC result checker scratch cards.', icon: GraduationCap, iconColor: '#4f46e5', iconBg: '#eef2ff' },
    { name: 'NECO Tokens', desc: 'Instant NECO result checker tokens.', icon: GraduationCap, iconColor: '#e11d48', iconBg: '#fff1f2' },
    { name: 'JAMB E-Pins', desc: 'Purchase JAMB E-Pins securely and fast.', icon: GraduationCap, iconColor: '#ea580c', iconBg: '#fff7ed' },
    { name: 'Wallet Funding', desc: 'Automated bank transfers for instant wallet funding.', icon: Wallet, iconColor: '#0d9488', iconBg: '#f0fdfa' },
  ];

  const features = [
    { title: 'Lightning Fast', desc: 'Transactions are processed and delivered instantly via our automated system.', icon: Zap },
    { title: 'Bank-Grade Security', desc: 'Your funds and data are protected with enterprise-level security protocols.', icon: ShieldCheck },
    { title: 'Best Prices', desc: 'Enjoy the most affordable rates for data, airtime, and bill payments.', icon: CreditCard },
    { title: '24/7 Support', desc: 'Our dedicated customer success team is always available to assist you.', icon: HeadphonesIcon },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="rmh-container" style={{ '--theme-primary': primaryColor }}>
      
      {/* HEADER */}
      <header className={`rmh-header ${isScrolled ? 'rmh-scrolled' : ''}`}>
        <div className="rmh-header-inner">
          
          <Link to="/" className="rmh-logo-area">
            {logoUrl ? (
               <img src={logoUrl} alt={siteName} className="rmh-logo-img" />
            ) : (
              <div className="rmh-logo-fallback">
                {siteName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="rmh-site-name">{siteName}</span>
          </Link>

          <nav className="rmh-nav-desktop">
            <a href="#home">Home</a>
            <a href="#services">Services</a>
            <a href="#features">Why Us</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="rmh-cta-group">
            <Link to="/login" className="rmh-btn-outline">Sign In</Link>
            <Link to="/signup" className="rmh-btn-primary">
              Create Account <ArrowRight size={16} />
            </Link>
          </div>

          <button 
            className="rmh-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div className={`rmh-mobile-menu ${mobileMenuOpen ? 'rmh-menu-open' : ''}`}>
        <div className="rmh-mobile-nav">
          <a href="#home" onClick={closeMobileMenu}>Home</a>
          <a href="#services" onClick={closeMobileMenu}>Services</a>
          <a href="#features" onClick={closeMobileMenu}>Why Choose Us</a>
          <a href="#contact" onClick={closeMobileMenu}>Contact</a>
        </div>
        
        <div className="rmh-mobile-cta">
          <Link to="/login" onClick={closeMobileMenu} className="rmh-btn-outline">
            Sign In
          </Link>
          <Link to="/signup" onClick={closeMobileMenu} className="rmh-btn-primary">
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* HERO SECTION */}
      <section id="home" className="rmh-hero">
        <div className="rmh-hero-bg">
          <div className="rmh-hero-blob rmh-blob-1"></div>
          <div className="rmh-hero-blob rmh-blob-2"></div>
        </div>

        <div className="rmh-hero-content">
          <div className="rmh-badge">
            <span className="rmh-badge-dot"></span>
            The #1 Platform for VTU Services
          </div>
          
          <h1 className="rmh-hero-title">
            Automate Your <br />
            <span className="rmh-hero-highlight">Digital Payments</span>
          </h1>
          
          <p className="rmh-hero-subtitle">
            Experience the fastest and most secure way to buy data, airtime, pay electricity bills, and renew TV subscriptions directly from your devices.
          </p>
          
          <div className="rmh-hero-actions">
            <Link to="/signup" className="rmh-btn-hero-primary">
              Get Started Now <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="rmh-btn-hero-secondary">
              Sign In to Dashboard
            </Link>
          </div>

          <div className="rmh-trust-indicators">
            <div className="rmh-trust-item"><CheckCircle2 color="#10b981" size={18} /> <span>Instant Delivery</span></div>
            <div className="rmh-trust-item"><CheckCircle2 color="#10b981" size={18} /> <span>100% Secure</span></div>
            <div className="rmh-trust-item"><CheckCircle2 color="#10b981" size={18} /> <span>24/7 Automated</span></div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services" className="rmh-services">
        <div className="rmh-section-header">
          <h2 className="rmh-section-title">Everything You Need</h2>
          <p className="rmh-section-subtitle">One platform to handle all your utility bills and top-ups seamlessly.</p>
        </div>
        
        <div className="rmh-services-grid">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div key={index} className="rmh-service-card">
                <div className="rmh-service-icon-wrapper" style={{ backgroundColor: service.iconBg, color: service.iconColor }}>
                  <Icon size={28} strokeWidth={2.5} />
                </div>
                <h3 className="rmh-service-title">{service.name}</h3>
                <p className="rmh-service-desc">{service.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="rmh-features">
        <div className="rmh-features-inner">
          <div className="rmh-features-text">
            <h2 className="rmh-section-title">Why We Are Different</h2>
            <p className="rmh-section-subtitle rmh-margin-bottom">We built a platform that prioritizes speed, security, and affordability above everything else.</p>
            <Link to="/signup" className="rmh-btn-hero-primary rmh-inline-flex">
              Join Us Today <ArrowRight size={20} />
            </Link>
          </div>
          
          <div className="rmh-features-grid">
            {features.map((feat, index) => {
              const Icon = feat.icon;
              return (
                <div key={index} className="rmh-feature-card">
                  <div className="rmh-feature-icon">
                    <Icon size={24} strokeWidth={2.5} />
                  </div>
                  <h3 className="rmh-feature-title">{feat.title}</h3>
                  <p className="rmh-feature-desc">{feat.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="rmh-contact">
        <div className="rmh-section-header">
          <h2 className="rmh-section-title">We're Here to Help</h2>
          <p className="rmh-section-subtitle">Have questions? Reach out to our support team.</p>
        </div>
        
        <div className="rmh-contact-box">
          {supportEmail && (
            <a href={mailLink} className="rmh-contact-item rmh-contact-email">
              <div className="rmh-contact-icon">
                <Mail size={32} strokeWidth={2} />
              </div>
              <h4 className="rmh-contact-title">Email Support</h4>
              <span className="rmh-contact-value">{supportEmail}</span>
            </a>
          )}

          {whatsappNumber && (
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="rmh-contact-item rmh-contact-wa">
              <div className="rmh-contact-icon">
                <Phone size={32} strokeWidth={2} />
              </div>
              <h4 className="rmh-contact-title">WhatsApp Us</h4>
              <span className="rmh-contact-value">{whatsappNumber}</span>
            </a>
          )}

          {!supportEmail && !whatsappNumber && (
            <div className="rmh-contact-missing">
              Contact information is currently being updated.
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="rmh-footer">
        <div className="rmh-footer-inner">
          <div className="rmh-footer-grid">
            
            <div className="rmh-footer-brand">
              <Link to="/" className="rmh-footer-logo">
                {logoUrl ? (
                  <img src={logoUrl} alt={siteName} />
                ) : (
                  <span>{siteName}</span>
                )}
              </Link>
              <p className="rmh-footer-desc">
                Your reliable partner for automated digital payments, VTU services, and seamless utility bill settlements in Nigeria.
              </p>
            </div>
            
            <div className="rmh-footer-nav-col">
              <h4 className="rmh-footer-heading">Quick Links</h4>
              <ul className="rmh-footer-list">
                <li><Link to="/login">Sign In</Link></li>
                <li><Link to="/signup">Create Account</Link></li>
                <li><a href="#services">Our Services</a></li>
              </ul>
            </div>

            <div className="rmh-footer-nav-col">
              <h4 className="rmh-footer-heading">Contact</h4>
              <ul className="rmh-footer-list">
                {supportEmail && <li><a href={mailLink}>{supportEmail}</a></li>}
                {whatsappNumber && <li><a href={waLink} target="_blank" rel="noopener noreferrer">{whatsappNumber}</a></li>}
              </ul>
            </div>
          </div>
          
          <div className="rmh-footer-bottom">
            <div className="rmh-copyright">&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</div>
            <div className="rmh-footer-legal">
              <Link to="#">Privacy Policy</Link>
              <Link to="#">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ResellerMarketingHome;

