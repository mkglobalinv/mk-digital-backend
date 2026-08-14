import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wifi, 
  Smartphone, 
  Lightbulb, 
  Tv, 
  GraduationCap, 
  Wallet, 
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Zap,
  ShieldCheck,
  CreditCard,
  Building2,
  Users,
  LayoutDashboard,
  Fingerprint,
  PenTool,
  Rocket
} from 'lucide-react';
import { getSiteName, getSiteSupportEmail } from '../utils/whiteLabelHelper';
import vtuMockup from '../assets/vtu-app-mockup.png';
import dashboardMockup from '../assets/dashboard-mockup.png';
import dashboardHeroBg from '../assets/dashboard_hero_bg.png';
import './ResellerMarketingHome.css';

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
      
      {/* HEADER */}
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
            <a href="#how-it-works">How It Works</a>
            <a href="#services">Services</a>
            <a href="#business">Your Business</a>
          </nav>

          <div className="saas-cta-group">
            <Link to="/login" className="saas-btn-outline">Login</Link>
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
          <a href="#how-it-works" onClick={closeMobileMenu}>How It Works</a>
          <a href="#services" onClick={closeMobileMenu}>Services</a>
          <a href="#business" onClick={closeMobileMenu}>Your Business</a>
        </div>
        <div className="saas-mobile-cta">
          <Link to="/login" onClick={closeMobileMenu} className="saas-btn-outline">Login</Link>
          <Link to="/signup" onClick={closeMobileMenu} className="saas-btn-primary">Get Started</Link>
        </div>
      </div>

      {/* 1. HERO SECTION */}
      <section className="saas-hero">
        <div className="saas-hero-bg-gradient"></div>
        <div className="saas-hero-bg-glow"></div>
        <div className="saas-badge animate-fade-in-up">
          <Zap size={14} color={primaryColor} /> Launch in 5 Minutes
        </div>
        <h1 className="saas-hero-title animate-fade-in-up delay-100">
          Own Your VTU Website &amp; App <br className="hidden-mobile" />
          <span className="saas-gradient-text">in Just 5 Minutes.</span>
        </h1>
        <p className="saas-hero-subtitle animate-fade-in-up delay-200">
          Start your own branded digital services business with a website, wallet system, customer accounts and powerful business tools.
        </p>
        <div className="saas-hero-pricing-tag animate-fade-in-up delay-200">
          <strong>3-Day Free Trial</strong> • ₦5,000 One-Time Activation After Trial
        </div>
        <div className="saas-hero-actions animate-fade-in-up delay-300">
          <Link to="/signup" className="saas-btn-primary saas-btn-large">
            Get Started <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="saas-btn-secondary saas-btn-large">
            Login
          </Link>
        </div>
      </section>

      {/* 2. WEBSITE SHOWCASE CAROUSEL */}
      <section className="saas-showcase-section">
        <div className="saas-section-header">
          <h2 className="saas-section-title">See What Your Own Website Can Look Like</h2>
          <p className="saas-section-subtitle">Your own brand. Your own website. Your own digital services business.</p>
        </div>
        <div className="saas-carousel-container">
          <div className="saas-carousel-track">
            {/* Example mockups */}
            <div className="saas-carousel-item">
              <div className="saas-carousel-card">
                <span className="saas-carousel-label">Platform Preview</span>
                <img src={dashboardMockup} alt="Dashboard Preview 1" loading="lazy" />
              </div>
            </div>
            <div className="saas-carousel-item">
              <div className="saas-carousel-card">
                <span className="saas-carousel-label">Platform Preview</span>
                <img src={dashboardHeroBg} alt="Dashboard Preview 2" loading="lazy" />
              </div>
            </div>
            {/* Duplicate for infinite effect */}
            <div className="saas-carousel-item">
              <div className="saas-carousel-card">
                <span className="saas-carousel-label">Platform Preview</span>
                <img src={dashboardMockup} alt="Dashboard Preview 3" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section id="how-it-works" className="saas-section">
        <div className="saas-section-header">
          <h2 className="saas-section-title">Launch in 3 Simple Steps</h2>
          <p className="saas-section-subtitle">Setup takes about 3 minutes. No coding or technical skills required.</p>
        </div>
        <div className="saas-steps">
          <div className="saas-steps-line"></div>
          <div className="saas-step-item">
            <div className="saas-step-number"><PenTool size={28} /></div>
            <div className="saas-step-badge">Step 01</div>
            <h3>Create Your Website</h3>
            <p>Choose your business name, site name and branding.</p>
          </div>
          <div className="saas-step-item">
            <div className="saas-step-number"><Wallet size={28} /></div>
            <div className="saas-step-badge">Step 02</div>
            <h3>Configure Your Business</h3>
            <p>Set your services, pricing, markup and business settings.</p>
          </div>
          <div className="saas-step-item">
            <div className="saas-step-number"><Rocket size={28} /></div>
            <div className="saas-step-badge">Step 03</div>
            <h3>Go Live &amp; Grow</h3>
            <p>Your branded website goes live and you can start operating your own digital services business.</p>
          </div>
        </div>
      </section>

      {/* 4. START WITHOUT LARGE STARTUP CAPITAL */}
      <section className="saas-section saas-capital-section">
        <div className="saas-capital-grid">
          <div className="saas-capital-content">
            <h2 className="saas-section-title" style={{ textAlign: 'left', marginBottom: '24px' }}>Start Without Large Startup Capital</h2>
            <p className="saas-capital-lead">You don't need to fund the platform yourself to start.</p>
            <p className="saas-capital-desc">
              Start with a <strong>3-day free trial</strong>. After your trial, pay just <strong>₦5,000 one-time activation fee</strong> to keep your website live and continue selling.
            </p>
            
            <ul className="saas-capital-list">
              <li><CheckCircle2 color={primaryColor} size={20} /> Your customers register on your website and fund their own wallets.</li>
              <li><CheckCircle2 color={primaryColor} size={20} /> They use their wallet balance to purchase services.</li>
              <li><CheckCircle2 color={primaryColor} size={20} /> You earn your markup/profit from successful transactions.</li>
            </ul>

            <div className="saas-capital-ownership">
               <strong>You own the business. {siteName} provides the platform.</strong>
            </div>
          </div>

          <div className="saas-flow-visual">
            <div className="flow-card"><Globe size={24} /> Your Website</div>
            <div className="flow-arrow">↓</div>
            <div className="flow-card"><Users size={24} /> Your Customer</div>
            <div className="flow-arrow">↓</div>
            <div className="flow-card"><Wallet size={24} /> Customer Funds Wallet</div>
            <div className="flow-arrow">↓</div>
            <div className="flow-card"><CreditCard size={24} /> Customer Buys Service</div>
            <div className="flow-arrow">↓</div>
            <div className="flow-card"><Zap size={24} /> Transaction Processed</div>
            <div className="flow-arrow">↓</div>
            <div className="flow-card highlight"><TrendingDown size={24} style={{ transform: 'rotate(180deg)' }} /> You Earn Your Markup</div>
          </div>
        </div>
      </section>

      {/* 5. SERVICES */}
      <section id="services" className="saas-section">
        <div className="saas-section-header">
          <h2 className="saas-section-title">Everything You Need to Run Your Digital Services Business</h2>
        </div>
        <div className="saas-features-grid">
          <div className="saas-feature-card">
            <div className="saas-feature-icon"><Wifi size={24} /></div>
            <h3>Data</h3>
          </div>
          <div className="saas-feature-card">
            <div className="saas-feature-icon"><Smartphone size={24} /></div>
            <h3>Airtime</h3>
          </div>
          <div className="saas-feature-card">
            <div className="saas-feature-icon"><Lightbulb size={24} /></div>
            <h3>Electricity</h3>
          </div>
          <div className="saas-feature-card">
            <div className="saas-feature-icon"><Tv size={24} /></div>
            <h3>Cable TV</h3>
          </div>
          <div className="saas-feature-card">
            <div className="saas-feature-icon"><GraduationCap size={24} /></div>
            <h3>Education / E-PIN</h3>
          </div>
          <div className="saas-feature-card">
            <div className="saas-feature-icon"><Fingerprint size={24} /></div>
            <h3>NIN &amp; BVN Verification</h3>
          </div>
          <div className="saas-feature-card">
            <div className="saas-feature-icon"><Building2 size={24} /></div>
            <h3>CAC Registration</h3>
          </div>
          <div className="saas-feature-card">
            <div className="saas-feature-icon"><LayoutDashboard size={24} /></div>
            <h3>More Digital Services</h3>
          </div>
        </div>
      </section>

      {/* 6. YOUR BUSINESS, YOUR BRAND */}
      <section id="business" className="saas-section saas-benefits-section">
        <div className="saas-section-header">
          <h2 className="saas-section-title">Your Business. Your Brand.</h2>
        </div>
        <div className="saas-benefits-grid">
          <div className="saas-benefit-card">
            <Globe size={28} className="saas-benefit-icon" />
            <div className="saas-benefit-content">
              <h3>Your Own VTU Website</h3>
            </div>
          </div>
          <div className="saas-benefit-card">
            <ShieldCheck size={28} className="saas-benefit-icon" />
            <div className="saas-benefit-content">
              <h3>Your Own Domain/Subdomain</h3>
            </div>
          </div>
          <div className="saas-benefit-card">
            <PenTool size={28} className="saas-benefit-icon" />
            <div className="saas-benefit-content">
              <h3>Your Own Branding</h3>
            </div>
          </div>
          <div className="saas-benefit-card">
            <Users size={28} className="saas-benefit-icon" />
            <div className="saas-benefit-content">
              <h3>Your Own Customers</h3>
            </div>
          </div>
          <div className="saas-benefit-card">
            <Wallet size={28} className="saas-benefit-icon" />
            <div className="saas-benefit-content">
              <h3>Your Own Wallet System</h3>
            </div>
          </div>
          <div className="saas-benefit-card">
            <LayoutDashboard size={28} className="saas-benefit-icon" />
            <div className="saas-benefit-content">
              <h3>Your Own Dashboard</h3>
            </div>
          </div>
          <div className="saas-benefit-card">
            <CreditCard size={28} className="saas-benefit-icon" />
            <div className="saas-benefit-content">
              <h3>Pricing &amp; Markup Control</h3>
            </div>
          </div>
          <div className="saas-benefit-card">
            <CheckCircle2 size={28} className="saas-benefit-icon" />
            <div className="saas-benefit-content">
              <h3>Admin/Business Management</h3>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PREMIUM MOBILE APP */}
      <section className="saas-preview-section">
        <div className="saas-preview-bg"></div>
        <div className="saas-preview-layout">
           <div className="saas-preview-text">
             <h2 className="saas-section-title" style={{ textAlign: 'left', marginBottom: '16px' }}>Take Your Business to Mobile</h2>
             <p className="saas-section-subtitle" style={{ textAlign: 'left', margin: '0 0 24px 0' }}>
               Premium website owners can request their own branded Android app.
             </p>
             <div className="saas-app-features">
                <span className="app-feature-badge"><Globe size={16}/> Your Website</span>
                <span className="app-feature-badge"><PenTool size={16}/> Your Brand</span>
                <span className="app-feature-badge"><Smartphone size={16}/> Your Mobile App</span>
             </div>
           </div>
           <div className="saas-preview-img-container">
             <img src={vtuMockup} alt="Premium Mobile App" className="saas-app-mockup" loading="lazy" />
           </div>
        </div>
      </section>

      {/* 8. FINAL CTA */}
      <section className="saas-cta">
        <div className="saas-cta-glow"></div>
        <h2>Ready to Own Your VTU Business?</h2>
        <p>Start your 3-day free trial and see how your own branded VTU business works.</p>
        <div className="saas-cta-pricing">
           <strong>3-Day Free Trial</strong> • ₦5,000 One-Time Activation After Trial
        </div>
        <div style={{ marginTop: '32px' }}>
            <Link to="/signup" className="saas-btn-secondary saas-btn-large" style={{ color: 'var(--theme-primary)' }}>
            Get Started
            </Link>
        </div>
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
                Own Your VTU Website &amp; App in Just 5 Minutes. Start your digital business today.
              </p>
            </div>
            
            <div className="saas-footer-col">
              <h4>Quick Links</h4>
              <a href="#how-it-works">How It Works</a>
              <a href="#services">Services</a>
              <Link to="/pricing">Pricing</Link>
              <Link to="/about">About Us</Link>
            </div>
            
            <div className="saas-footer-col">
              <h4>Support &amp; Legal</h4>
              <Link to="/contact">Contact Us</Link>
              {supportEmail && <a href={`mailto:${supportEmail}`}>Support Email</a>}
              <Link to="/privacy-policy">Privacy Policy</Link>
              <Link to="/terms-of-service">Terms of Service</Link>
              <Link to="/refund-policy">Refund Policy</Link>
            </div>
          </div>
          
          <div className="saas-footer-bottom">
            <span>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</span>
            <div className="saas-footer-legal">
                <Link to="/login">Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ResellerMarketingHome;
