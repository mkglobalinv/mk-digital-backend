import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wifi, 
  Smartphone, 
  Lightbulb, 
  Tv, 
  GraduationCap, 
  Wallet, 
  Code,
  Zap, 
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  HeadphonesIcon,
  Server,
  PlayCircle,
  Menu,
  X
} from 'lucide-react';
import { getSiteName, getSiteSupportEmail } from '../utils/whiteLabelHelper';
import dashboardMockup from '../assets/dashboard-mockup.png';
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
               <img src={logoUrl} alt={siteName} className="saas-logo-img" />
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
          <Link to="/signup" onClick={closeMobileMenu} className="saas-btn-primary">Get Started Free</Link>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="saas-hero">
        <div className="saas-hero-bg-gradient"></div>
        <div className="saas-hero-content">
          <div className="saas-hero-text">
            <div className="saas-badge animate-fade-in-up">
              <span className="saas-badge-dot"></span>
              Welcome to the future of digital payments
            </div>
            <h1 className="saas-hero-title animate-fade-in-up delay-100">
              The complete toolkit for <br className="hidden-mobile" />
              <span className="saas-gradient-text">VTU & Bill Payments</span>
            </h1>
            <p className="saas-hero-subtitle animate-fade-in-up delay-200">
              Launch your branded VTU website, process transactions instantly, and manage your telecom business with our powerful infrastructure.
            </p>
            <div className="saas-hero-actions animate-fade-in-up delay-300">
              <Link to="/signup" className="saas-btn-primary saas-btn-large">
                Create Website <ArrowRight size={18} />
              </Link>
              <a href="#preview" className="saas-btn-secondary saas-btn-large">
                <PlayCircle size={18} /> View Demo
              </a>
            </div>
          </div>
          
          <div className="saas-hero-visual animate-fade-in-up delay-400">
            <div className="saas-dashboard-wrapper">
              <img src={dashboardMockup} alt="Dashboard Preview" className="saas-dashboard-img" />
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
            <p className="saas-stat-label">API Uptime</p>
          </div>
          <div className="saas-stat-divider"></div>
          <div className="saas-stat-item">
            <h4 className="saas-stat-value">1,000+</h4>
            <p className="saas-stat-label">Active Resellers</p>
          </div>
          <div className="saas-stat-divider"></div>
          <div className="saas-stat-item">
            <h4 className="saas-stat-value">Instant</h4>
            <p className="saas-stat-label">Transactions</p>
          </div>
          <div className="saas-stat-divider"></div>
          <div className="saas-stat-item">
            <h4 className="saas-stat-value">24/7</h4>
            <p className="saas-stat-label">Customer Support</p>
          </div>
        </div>
      </section>

      {/* BENTO GRID SERVICES */}
      <section id="services" className="saas-services">
        <div className="saas-section-header">
          <h2 className="saas-section-title">Everything you need to scale</h2>
          <p className="saas-section-subtitle">A comprehensive suite of digital services designed for maximum profitability.</p>
        </div>

        <div className="saas-bento-grid">
          <div className="saas-bento-card card-data">
            <div className="saas-bento-icon"><Wifi size={24} /></div>
            <h3>Cheap Data</h3>
            <p>Instant top-up for all networks at wholesale prices.</p>
          </div>
          <div className="saas-bento-card card-airtime">
            <div className="saas-bento-icon"><Smartphone size={24} /></div>
            <h3>Airtime VTU</h3>
            <p>Automated airtime recharge with instant delivery.</p>
          </div>
          <div className="saas-bento-card card-bills">
            <div className="saas-bento-icon"><Lightbulb size={24} /></div>
            <h3>Electricity</h3>
            <p>Pay prepaid and postpaid meters instantly.</p>
          </div>
          <div className="saas-bento-card card-tv">
            <div className="saas-bento-icon"><Tv size={24} /></div>
            <h3>Cable TV</h3>
            <p>Renew DSTV, GOTV, and Startimes without delay.</p>
          </div>
          <div className="saas-bento-card card-exams">
            <div className="saas-bento-icon"><GraduationCap size={24} /></div>
            <h3>Exam Pins</h3>
            <p>Instant WAEC, NECO, and JAMB result tokens.</p>
          </div>
          <div className="saas-bento-card card-wallet">
            <div className="saas-bento-icon"><Wallet size={24} /></div>
            <h3>Wallet System</h3>
            <p>Automated bank transfers for instant wallet funding.</p>
          </div>
          <div className="saas-bento-card card-website">
            <div className="saas-bento-icon"><Code size={24} /></div>
            <h3>Website Builder</h3>
            <p>Launch your own VTU platform in minutes.</p>
          </div>
          <div className="saas-bento-card card-api">
            <div className="saas-bento-icon"><Server size={24} /></div>
            <h3>Developer API</h3>
            <p>Integrate our fast VTU engine into your app.</p>
          </div>
        </div>
      </section>

      {/* PRICING COMPARISON */}
      <section id="pricing" className="saas-pricing">
        <div className="saas-section-header">
          <h2 className="saas-section-title">Wholesale pricing, maximum profit</h2>
          <p className="saas-section-subtitle">Stop paying retail. Access direct-to-market rates and scale your margins.</p>
        </div>

        <div className="saas-comparison-container">
          <div className="saas-compare-card">
            <div className="saas-compare-header">
              <Wifi size={20} className="saas-compare-icon" /> Data Subscriptions
            </div>
            <div className="saas-compare-body">
              <div className="saas-compare-row">
                <span className="saas-compare-label">Retail Average</span>
                <span className="saas-compare-retail strike">₦300 / GB</span>
              </div>
              <div className="saas-compare-arrow">↓</div>
              <div className="saas-compare-row saas-highlight-row">
                <span className="saas-compare-label">Your Price</span>
                <span className="saas-compare-yours">Save up to 30%</span>
              </div>
            </div>
            <div className="saas-compare-footer">High Profit Margins</div>
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
            <div className="saas-compare-footer">Keep 100% of Surcharges</div>
          </div>
        </div>
      </section>

      {/* DASHBOARD SHOWCASE */}
      <section id="preview" className="saas-showcase">
        <div className="saas-showcase-inner">
          <div className="saas-showcase-text">
            <h2>Built for business owners</h2>
            <p>Our dashboard provides everything you need to manage users, track revenue, and configure your white-label brand.</p>
            <ul className="saas-feature-list">
              <li><CheckCircle2 size={18} className="saas-check-icon" /> <strong>Automatic Transactions</strong> – Zero manual intervention required.</li>
              <li><CheckCircle2 size={18} className="saas-check-icon" /> <strong>Wallet Management</strong> – Automated virtual bank accounts for users.</li>
              <li><CheckCircle2 size={18} className="saas-check-icon" /> <strong>Website Builder</strong> – Launch and customize your domain.</li>
              <li><CheckCircle2 size={18} className="saas-check-icon" /> <strong>Live Analytics</strong> – Track sales, profit, and user growth.</li>
              <li><CheckCircle2 size={18} className="saas-check-icon" /> <strong>White-label Branding</strong> – Make the platform 100% yours.</li>
            </ul>
          </div>
          <div className="saas-showcase-image-wrapper">
             <img src={dashboardMockup} alt="Product Showcase" className="saas-showcase-img" />
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="saas-cta-section">
        <div className="saas-cta-card">
          <h2>Launch Your VTU Website Today</h2>
          <p>Join thousands of resellers building their businesses on our infrastructure.</p>
          <div className="saas-cta-buttons">
            <Link to="/signup" className="saas-btn-primary saas-btn-large">Start Free</Link>
            <a href={`mailto:${supportEmail || 'support@' + siteName.toLowerCase().replace(/\s+/g, '') + '.com'}`} className="saas-btn-secondary saas-btn-large">Contact Sales</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="saas-footer">
        <div className="saas-footer-inner">
          <div className="saas-footer-top">
            <div className="saas-footer-brand">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="saas-footer-logo" />
              ) : (
                <span className="saas-footer-logo-text">{siteName}</span>
              )}
              <p className="saas-footer-desc">
                Your reliable partner for automated digital payments and VTU services.
              </p>
            </div>
            
            <div className="saas-footer-links">
              <div className="saas-footer-col">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#services">Services</a>
                <a href="#pricing">Pricing</a>
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
