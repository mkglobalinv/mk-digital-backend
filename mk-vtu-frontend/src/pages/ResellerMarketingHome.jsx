import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wifi,
  Smartphone,
  Lightbulb,
  Tv,
  GraduationCap,
  Wallet,
  ArrowRight,
  Menu,
  X,
  Zap,
  ShieldCheck,
  TrendingDown,
  Clock,
  CreditCard,
  Headphones,
  Globe,
  Star,
  Activity
} from 'lucide-react';
import { getSiteName, getSiteSupportEmail } from '../utils/whiteLabelHelper';
import vtuMockup from '../assets/vtu-app-mockup.png';
import resellerHeroSupport from '../assets/reseller-hero-support.jpg';
import './ResellerMarketingHome.css';

// Mirrors the main 9jasub.com marketing site's actual Hero.tsx trust-badge
// row (same 4 icons/positions), so reseller sites share its visual language
// instead of a one-off design.
const HERO_TRUST_BADGES = [
  { icon: ShieldCheck, line1: '100% Secure', line2: 'Transactions' },
  { icon: Zap, line1: 'Instant', line2: 'Delivery' },
  { icon: Star, line1: 'Trusted by', line2: 'Customers' },
  { icon: Headphones, line1: '24/7 Customer', line2: 'Support' },
];

// Mirrors the main site's Stats.tsx section.
const PLATFORM_STATS = [
  { icon: Activity, value: '99.9%', label: 'Platform Uptime' },
  { icon: Clock, value: '24/7', label: 'Dedicated Support' },
  { icon: Zap, value: 'Instant', label: 'Service Delivery' },
  { icon: ShieldCheck, value: '100%', label: 'Secure Transactions' },
];

const ResellerMarketingHome = ({ siteInfo }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const siteName = getSiteName(siteInfo);
  const logoUrl = siteInfo?.branding?.logo || null;
  const primaryColor = siteInfo?.branding?.primaryColor || '#6366f1'; 
  const supportEmail = getSiteSupportEmail(siteInfo);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="saas-container" style={{ '--theme-primary': primaryColor }}>
      
      {/* 1. HEADER */}
      <header className={`saas-header ${isScrolled ? 'saas-scrolled' : ''}`}>
        <div className="saas-header-inner">
          <Link to="/" className="saas-logo-area">
            {logoUrl ? (
               <img src={logoUrl} alt={siteName} className="saas-logo-img" loading="lazy" />
            ) : (
              <div className="saas-logo-fallback">{siteName.charAt(0).toUpperCase()}</div>
            )}
            <span className="saas-site-name">{siteName}</span>
          </Link>

          <nav className="saas-nav-desktop">
            <a href="#services">Services</a>
            <a href="#features">Features</a>
            <a href="#why-us">Why Us</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="saas-cta-group">
            <Link to="/login" className="saas-btn-outline">Sign In</Link>
            <Link to="/signup" className="saas-btn-primary">Get Started</Link>
          </div>

          <button className="saas-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div className={`saas-mobile-menu ${mobileMenuOpen ? 'saas-menu-open' : ''}`}>
        <div className="saas-mobile-nav">
          <a href="#services" onClick={closeMobileMenu}>Services</a>
          <a href="#features" onClick={closeMobileMenu}>Features</a>
          <a href="#why-us" onClick={closeMobileMenu}>Why Us</a>
          <a href="#faq" onClick={closeMobileMenu}>FAQ</a>
        </div>
        <div className="saas-mobile-cta">
          <Link to="/login" onClick={closeMobileMenu} className="saas-btn-outline">Sign In</Link>
          <Link to="/signup" onClick={closeMobileMenu} className="saas-btn-primary">Get Started</Link>
        </div>
      </div>

      {/* 1. HERO SECTION */}
      <section className="saas-hero saas-hero-split">
        <div className="saas-hero-bg-gradient"></div>
        <div className="saas-hero-bg-glow"></div>

        <div className="saas-hero-content">
          <h1 className="saas-hero-title animate-fade-in-up delay-100">
            Digital payments, <br className="hidden-mobile" />
            <span className="saas-gradient-text">simplified.</span>
          </h1>
          <p className="saas-hero-subtitle animate-fade-in-up delay-200">
            Purchase affordable data, airtime, and pay bills instantly. Experience seamless, bank-level secure transactions without the wait.
          </p>

          <div className="saas-hero-actions animate-fade-in-up delay-300">
            <Link to="/signup" className="saas-btn-primary saas-btn-large">
              Create Account <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="saas-btn-secondary saas-btn-large">
              Login
            </Link>
          </div>

          <div className="saas-hero-trust-row animate-fade-in-up delay-300">
            {HERO_TRUST_BADGES.map(({ icon: Icon, line1, line2 }, idx) => (
              <div className="saas-hero-trust-item" key={idx}>
                <Icon size={20} />
                <p>{line1}<br />{line2}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="saas-hero-visual animate-fade-in-up delay-300">
          <img src={resellerHeroSupport} alt="Customer support" className="saas-hero-photo" loading="lazy" />
        </div>
      </section>

      {/* 2. PLATFORM STATS */}
      <section id="services" className="saas-stats">
        <div className="saas-stats-grid">
          {PLATFORM_STATS.map(({ icon: Icon, value, label }, idx) => (
            <div className="saas-stat-card" key={idx}>
              <div className="saas-stat-icon"><Icon size={22} /></div>
              <h3>{value}</h3>
              <p>{label}</p>
            </div>
          ))}
        </div>
        <div className="saas-trust-networks">
          <span className="saas-network-badge">MTN</span>
          <span className="saas-network-badge">AIRTEL</span>
          <span className="saas-network-badge">GLO</span>
          <span className="saas-network-badge">9MOBILE</span>
          <span className="saas-network-badge">DSTV</span>
        </div>
      </section>

      {/* 3. CORE FEATURES */}
      <section id="features" className="saas-section">
        <div className="saas-section-header">
          <h2 className="saas-section-title">Everything you need</h2>
          <p className="saas-section-subtitle">A comprehensive suite designed to make your daily digital transactions effortless and cost-effective.</p>
        </div>
        <div className="saas-features-grid">
          <div className="saas-feature-card">
            <div className="saas-feature-icon"><Wifi size={24} /></div>
            <h3>Data Bundles</h3>
            <p>Access high-speed internet across all networks at unbeatable discounted rates.</p>
          </div>
          <div className="saas-feature-card">
            <div className="saas-feature-icon"><Smartphone size={24} /></div>
            <h3>Instant Airtime</h3>
            <p>Recharge your line seamlessly and enjoy fast delivery on every top-up.</p>
          </div>
          <div className="saas-feature-card">
            <div className="saas-feature-icon"><Lightbulb size={24} /></div>
            <h3>Utility Bills</h3>
            <p>Clear your prepaid and postpaid electricity bills instantly from your couch.</p>
          </div>
          <div className="saas-feature-card">
            <div className="saas-feature-icon"><Tv size={24} /></div>
            <h3>Cable TV</h3>
            <p>Never miss a show. Renew DSTV, GOTV, and Startimes without delays.</p>
          </div>
          <div className="saas-feature-card">
            <div className="saas-feature-icon"><GraduationCap size={24} /></div>
            <h3>Exam Pins</h3>
            <p>Instantly generate result checking tokens for WAEC, NECO, and JAMB.</p>
          </div>
          <div className="saas-feature-card">
            <div className="saas-feature-icon"><Wallet size={24} /></div>
            <h3>Secure Wallet</h3>
            <p>Fund your account via automated bank transfers with bank-level encryption.</p>
          </div>
        </div>
      </section>

      {/* 4. PLATFORM PREVIEW */}
      <section className="saas-preview-section">
        <div className="saas-preview-bg"></div>
        <div className="saas-section-header" style={{ marginBottom: '40px', position: 'relative', zIndex: 2 }}>
          <h2 className="saas-section-title">Designed for speed</h2>
          <p className="saas-section-subtitle">Enjoy a clean, intuitive dashboard that makes managing your transactions incredibly simple.</p>
        </div>
        <div className="saas-preview-wrapper">
          <div className="saas-device-frame">
            <img src={vtuMockup} alt="Platform Dashboard" className="saas-preview-img" loading="lazy" />
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="saas-section">
        <div className="saas-section-header">
          <h2 className="saas-section-title">How it works</h2>
          <p className="saas-section-subtitle">Get started in three simple steps. No complicated setups required.</p>
        </div>
        <div className="saas-steps">
          <div className="saas-steps-line"></div>
          <div className="saas-step-item">
            <div className="saas-step-number">1</div>
            <h3>Create Account</h3>
            <p>Sign up in seconds. It's completely free and highly secure.</p>
          </div>
          <div className="saas-step-item">
            <div className="saas-step-number">2</div>
            <h3>Fund Wallet</h3>
            <p>Transfer to your dedicated automated account number instantly.</p>
          </div>
          <div className="saas-step-item">
            <div className="saas-step-number">3</div>
            <h3>Transact</h3>
            <p>Buy data or pay bills at affordable rates and get instant value.</p>
          </div>
        </div>
      </section>

      {/* 6. WHY CHOOSE US & BENEFITS */}
      <section id="why-us" className="saas-section saas-benefits-section">
        <div className="saas-section-header">
          <h2 className="saas-section-title">Why customers choose us</h2>
          <p className="saas-section-subtitle">Experience the next generation of digital payments, built entirely around your needs.</p>
        </div>
        <div className="saas-benefits-grid">
          <div className="saas-benefit-card">
            <TrendingDown size={28} className="saas-benefit-icon" />
            <div className="saas-benefit-content">
              <h3>Save More</h3>
              <p>Enjoy highly competitive and affordable rates on all network data plans and VTU services.</p>
            </div>
          </div>
          <div className="saas-benefit-card">
            <Zap size={28} className="saas-benefit-icon" />
            <div className="saas-benefit-content">
              <h3>Fast Delivery</h3>
              <p>Say goodbye to pending transactions. Get instant value delivery guaranteed.</p>
            </div>
          </div>
          <div className="saas-benefit-card">
            <ShieldCheck size={28} className="saas-benefit-icon" />
            <div className="saas-benefit-content">
              <h3>Secure Payments</h3>
              <p>Your transactions are protected by industry-leading encryption and bank-level security.</p>
            </div>
          </div>
          <div className="saas-benefit-card">
            <Clock size={28} className="saas-benefit-icon" />
            <div className="saas-benefit-content">
              <h3>24/7 Availability</h3>
              <p>Our platform never sleeps. Recharge or pay bills any time of the day or night.</p>
            </div>
          </div>
          <div className="saas-benefit-card">
            <CreditCard size={28} className="saas-benefit-icon" />
            <div className="saas-benefit-content">
              <h3>Simple Wallet Funding</h3>
              <p>Get a personalized bank account for instant and automatic wallet top-ups.</p>
            </div>
          </div>
          <div className="saas-benefit-card">
            <Headphones size={28} className="saas-benefit-icon" />
            <div className="saas-benefit-content">
              <h3>Excellent Support</h3>
              <p>Our dedicated support team is always on standby to resolve any issues promptly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section id="faq" className="saas-section">
        <div className="saas-section-header">
          <h2 className="saas-section-title">Frequently asked questions</h2>
          <p className="saas-section-subtitle">Got questions? We've got answers.</p>
        </div>
        <div className="saas-faq">
          <div className="saas-faq-item">
            <h4 className="saas-faq-q">How fast are transactions?</h4>
            <p className="saas-faq-a">Transactions are processed and delivered instantly. Once you complete a purchase, the service is credited to the target number in milliseconds.</p>
          </div>
          <div className="saas-faq-item">
            <h4 className="saas-faq-q">Which networks are supported?</h4>
            <p className="saas-faq-a">We support all major networks including MTN, Airtel, GLO, and 9mobile for both data and airtime purchases.</p>
          </div>
          <div className="saas-faq-item">
            <h4 className="saas-faq-q">How do I fund my wallet?</h4>
            <p className="saas-faq-a">Upon registration, you are instantly assigned a dedicated automated bank account. Any transfer made to this account automatically funds your wallet within seconds.</p>
          </div>
          <div className="saas-faq-item">
            <h4 className="saas-faq-q">Are my payments secure?</h4>
            <p className="saas-faq-a">Yes. We use advanced, bank-level encryption to secure all your data and payments. We never store your card details directly.</p>
          </div>
          <div className="saas-faq-item">
            <h4 className="saas-faq-q">What happens if a transaction fails?</h4>
            <p className="saas-faq-a">In the rare event of a network failure, our system automatically reverses the transaction and refunds your wallet instantly.</p>
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA */}
      <section className="saas-cta">
        <div className="saas-cta-glow"></div>
        <h2>Ready to simplify your payments?</h2>
        <p>Join thousands of happy customers using {siteName} for fast, reliable, and secure digital transactions.</p>
        <Link to="/signup" className="saas-btn-secondary saas-btn-large" style={{ color: 'var(--theme-primary)' }}>
          Create Account Now
        </Link>
      </section>

      {/* 9. FOOTER */}
      <footer className="saas-footer">
        <div className="saas-footer-inner">
          <div className="saas-footer-top">
            <div className="saas-footer-brand">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="saas-footer-logo" loading="lazy" />
              ) : (
                <span className="saas-footer-logo-text">{siteName}</span>
              )}
              <p className="saas-footer-desc">
                The modern standard for automated digital payments, VTU services, and bill settlements.
              </p>
            </div>
            
            <div className="saas-footer-col">
              <h4>Quick Links</h4>
              <a href="#services">Services</a>
              <a href="#features">Features</a>
              <a href="#why-us">Why Choose Us</a>
              <a href="#faq">FAQ</a>
            </div>
            
            <div className="saas-footer-col">
              <h4>Support & Legal</h4>
              {supportEmail && <a href={`mailto:${supportEmail}`}>Contact Support</a>}
              <Link to="#">Privacy Policy</Link>
              <Link to="#">Terms of Service</Link>
            </div>
          </div>
          
          <div className="saas-footer-bottom">
            <span>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</span>
            <div className="saas-footer-legal">
              {/* Optional: Add social links here if provided in siteInfo */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ResellerMarketingHome;
