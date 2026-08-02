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
  X
} from 'lucide-react';
import { getSiteName, getSiteSupportEmail } from '../utils/whiteLabelHelper';
import vtuMockup from '../assets/vtu-app-mockup.png';
import './ResellerMarketingHome.css';

const ResellerMarketingHome = ({ siteInfo }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const siteName = getSiteName(siteInfo);
  const logoUrl = siteInfo?.branding?.logo || null;
  const primaryColor = siteInfo?.branding?.primaryColor || '#6366f1'; 
  const supportEmail = getSiteSupportEmail(siteInfo);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
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
            <a href="#features">Features</a>
            <a href="#services">Services</a>
            <a href="#pricing">Pricing</a>
          </nav>

          <div className="saas-cta-group">
            <Link to="/login" className="saas-btn-text">Sign In</Link>
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
          <a href="#features" onClick={closeMobileMenu}>Features</a>
          <a href="#services" onClick={closeMobileMenu}>Services</a>
          <a href="#pricing" onClick={closeMobileMenu}>Pricing</a>
        </div>
        <div className="saas-mobile-cta">
          <Link to="/login" onClick={closeMobileMenu} className="saas-btn-outline">Sign In</Link>
          <Link to="/signup" onClick={closeMobileMenu} className="saas-btn-primary">Get Started</Link>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="saas-hero">
        <div className="saas-hero-bg-gradient"></div>
        <div className="saas-hero-content">
          <div className="saas-hero-text">
            <div className="saas-badge animate-fade-in-up">
              <span className="saas-badge-dot"></span>
              Fast, Secure & Reliable
            </div>
            <h1 className="saas-hero-title animate-fade-in-up delay-100">
              The easiest way to <br className="hidden-mobile" />
              <span className="saas-gradient-text">Pay Bills & Top Up</span>
            </h1>
            <p className="saas-hero-subtitle animate-fade-in-up delay-200">
              Buy cheap data, airtime, and pay electricity or cable bills instantly. Enjoy the best rates directly from your device.
            </p>
            <div className="saas-hero-actions animate-fade-in-up delay-300">
              <Link to="/signup" className="saas-btn-primary saas-btn-large">
                Create Account <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="saas-btn-secondary saas-btn-large">
                Sign In
              </Link>
            </div>
          </div>
          
          <div className="saas-hero-visual animate-fade-in-up delay-400">
            <div className="saas-dashboard-wrapper">
              <img src={vtuMockup} alt="VTU App Preview" className="saas-dashboard-img" loading="lazy" />
              <div className="saas-dashboard-glow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS / TRUST ROW */}
      <section className="saas-stats-row">
        <div className="saas-stats-inner">
          <div className="saas-stat-item">
            <h4 className="saas-stat-value">99.9%</h4>
            <p className="saas-stat-label">Uptime</p>
          </div>
          <div className="saas-stat-divider"></div>
          <div className="saas-stat-item">
            <h4 className="saas-stat-value">10,000+</h4>
            <p className="saas-stat-label">Active Users</p>
          </div>
          <div className="saas-stat-divider"></div>
          <div className="saas-stat-item">
            <h4 className="saas-stat-value">Instant</h4>
            <p className="saas-stat-label">Delivery</p>
          </div>
          <div className="saas-stat-divider"></div>
          <div className="saas-stat-item">
            <h4 className="saas-stat-value">24/7</h4>
            <p className="saas-stat-label">Support</p>
          </div>
        </div>
      </section>

      {/* BENTO GRID SERVICES */}
      <section id="services" className="saas-services">
        <div className="saas-section-header">
          <h2 className="saas-section-title">Everything you need in one place</h2>
          <p className="saas-section-subtitle">A comprehensive suite of digital services designed to make your life easier.</p>
        </div>

        <div className="saas-bento-grid">
          <div className="saas-bento-card card-data">
            <div className="saas-bento-icon"><Wifi size={24} /></div>
            <h3>Cheap Data</h3>
            <p>Instant top-up for all networks at the best prices available.</p>
          </div>
          <div className="saas-bento-card card-airtime">
            <div className="saas-bento-icon"><Smartphone size={24} /></div>
            <h3>Airtime</h3>
            <p>Automated airtime recharge with instant delivery.</p>
          </div>
          <div className="saas-bento-card card-bills">
            <div className="saas-bento-icon"><Lightbulb size={24} /></div>
            <h3>Electricity</h3>
            <p>Pay prepaid and postpaid meters instantly from home.</p>
          </div>
          <div className="saas-bento-card card-tv">
            <div className="saas-bento-icon"><Tv size={24} /></div>
            <h3>Cable TV</h3>
            <p>Renew DSTV, GOTV, and Startimes without delay.</p>
          </div>
          <div className="saas-bento-card card-exams">
            <div className="saas-bento-icon"><GraduationCap size={24} /></div>
            <h3>Exam Pins</h3>
            <p>Instant WAEC, NECO, and JAMB result tokens delivered.</p>
          </div>
          <div className="saas-bento-card card-wallet">
            <div className="saas-bento-icon"><Wallet size={24} /></div>
            <h3>Secure Wallet</h3>
            <p>Automated bank transfers for instant, secure wallet funding.</p>
          </div>
        </div>
      </section>

      {/* PRICING COMPARISON */}
      <section id="pricing" className="saas-pricing">
        <div className="saas-section-header">
          <h2 className="saas-section-title">Unbeatable pricing, maximum value</h2>
          <p className="saas-section-subtitle">Stop paying expensive retail rates. Access cheap data and bills seamlessly.</p>
        </div>

        <div className="saas-comparison-container">
          <div className="saas-compare-card">
            <div className="saas-compare-header">
              <Wifi size={20} className="saas-compare-icon" /> Data Subscriptions
            </div>
            <div className="saas-compare-body">
              <div className="saas-compare-row">
                <span className="saas-compare-label">Retail Average</span>
                <span className="saas-compare-retail strike">₦350 / GB</span>
              </div>
              <div className="saas-compare-arrow">↓</div>
              <div className="saas-compare-row saas-highlight-row">
                <span className="saas-compare-label">Your Price</span>
                <span className="saas-compare-yours">Save up to 30%</span>
              </div>
            </div>
            <div className="saas-compare-footer">Stay connected longer</div>
          </div>

          <div className="saas-compare-card">
            <div className="saas-compare-header">
              <Smartphone size={20} className="saas-compare-icon" /> Airtime Topup
            </div>
            <div className="saas-compare-body">
              <div className="saas-compare-row">
                <span className="saas-compare-label">Retail Average</span>
                <span className="saas-compare-retail strike">Face Value</span>
              </div>
              <div className="saas-compare-arrow">↓</div>
              <div className="saas-compare-row saas-highlight-row">
                <span className="saas-compare-label">Your Price</span>
                <span className="saas-compare-yours">Up to 4% Discount</span>
              </div>
            </div>
            <div className="saas-compare-footer">Instant Cash Back</div>
          </div>

          <div className="saas-compare-card">
            <div className="saas-compare-header">
              <Lightbulb size={20} className="saas-compare-icon" /> Bill Payments
            </div>
            <div className="saas-compare-body">
              <div className="saas-compare-row">
                <span className="saas-compare-label">Retail Average</span>
                <span className="saas-compare-retail strike">₦100 Fee</span>
              </div>
              <div className="saas-compare-arrow">↓</div>
              <div className="saas-compare-row saas-highlight-row">
                <span className="saas-compare-label">Your Price</span>
                <span className="saas-compare-yours">Zero Extra Fees</span>
              </div>
            </div>
            <div className="saas-compare-footer">Cheaper Utilities</div>
          </div>
        </div>
      </section>

      {/* DASHBOARD SHOWCASE */}
      <section id="preview" className="saas-showcase">
        <div className="saas-showcase-inner">
          <div className="saas-showcase-text">
            <h2>Experience seamless payments</h2>
            <p>Our platform provides a clean, easy-to-use interface to manage your utility bills and data purchases effortlessly.</p>
            <ul className="saas-feature-list">
              <li><CheckCircle2 size={18} className="saas-check-icon" /> <strong>Automatic Transactions</strong> – Get value instantly, anytime.</li>
              <li><CheckCircle2 size={18} className="saas-check-icon" /> <strong>Secure Wallet</strong> – Your funds are safe and always accessible.</li>
              <li><CheckCircle2 size={18} className="saas-check-icon" /> <strong>Detailed History</strong> – Track every purchase easily.</li>
              <li><CheckCircle2 size={18} className="saas-check-icon" /> <strong>Dedicated Support</strong> – Always here to help if you need us.</li>
            </ul>
          </div>
          <div className="saas-showcase-image-wrapper">
             <img src={vtuMockup} alt="App Interface Preview" className="saas-showcase-img" loading="lazy" />
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="saas-cta-section">
        <div className="saas-cta-card">
          <h2>Start Enjoying Cheap Data Today</h2>
          <p>Join thousands of users who trust our platform for all their digital payments.</p>
          <div className="saas-cta-buttons">
            <Link to="/signup" className="saas-btn-primary saas-btn-large">Create Free Account</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
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
                Your reliable partner for automated digital payments and VTU services.
              </p>
            </div>
            
            <div className="saas-footer-links">
              <div className="saas-footer-col">
                <h4>Services</h4>
                <a href="#services">Buy Data</a>
                <a href="#services">Airtime Recharge</a>
                <a href="#services">Pay Bills</a>
              </div>
              <div className="saas-footer-col">
                <h4>Company</h4>
                <Link to="/login">Sign In</Link>
                <Link to="/signup">Create Account</Link>
                {supportEmail && <a href={`mailto:${supportEmail}`}>Contact Us</a>}
              </div>
            </div>
          </div>
          
          <div className="saas-footer-bottom">
            <p>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
            <div className="saas-footer-legal">
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
