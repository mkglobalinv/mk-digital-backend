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
  Globe
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
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#referral">Referral</a>
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
          <a href="#features" onClick={closeMobileMenu}>Features</a>
          <a href="#pricing" onClick={closeMobileMenu}>Pricing</a>
          <a href="#referral" onClick={closeMobileMenu}>Referral</a>
          <a href="#faq" onClick={closeMobileMenu}>FAQ</a>
        </div>
        <div className="saas-mobile-cta">
          <Link to="/login" onClick={closeMobileMenu} className="saas-btn-outline">Sign In</Link>
          <Link to="/signup" onClick={closeMobileMenu} className="saas-btn-primary">Get Started</Link>
        </div>
      </div>

      {/* 1. HERO SECTION */}
      <section className="saas-hero">
        <div className="saas-hero-bg-gradient"></div>
        <div className="saas-badge animate-fade-in-up">
          <Zap size={14} color={primaryColor} /> Fast, Secure & Automated
        </div>
        <h1 className="saas-hero-title animate-fade-in-up delay-100">
          Digital payments, <br className="hidden-mobile" />
          <span className="saas-gradient-text">simplified.</span>
        </h1>
        <p className="saas-hero-subtitle animate-fade-in-up delay-200">
          Purchase cheap data, airtime, and pay bills instantly. Experience seamless, bank-level secure transactions without the wait.
        </p>
        <div className="saas-hero-actions animate-fade-in-up delay-300">
          <Link to="/signup" className="saas-btn-primary saas-btn-large">
            Create Free Account <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="saas-btn-secondary saas-btn-large">
            Sign In
          </Link>
        </div>
      </section>

      {/* 2. TRUST & SUPPORTED NETWORKS */}
      <section className="saas-trust">
        <div className="saas-trust-inner">
          <div className="saas-trust-stat">
            <p className="saas-trust-val">99.9%</p>
            <p className="saas-trust-label">Uptime</p>
          </div>
          <div className="saas-trust-networks">
            <span className="saas-network-badge">MTN</span>
            <span className="saas-network-badge">AIRTEL</span>
            <span className="saas-network-badge">GLO</span>
            <span className="saas-network-badge">9MOBILE</span>
            <span className="saas-network-badge">DSTV</span>
          </div>
          <div className="saas-trust-stat">
            <p className="saas-trust-val">24/7</p>
            <p className="saas-trust-label">Support</p>
          </div>
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
            <h3>Cheap Data</h3>
            <p>Access high-speed internet across all networks at unbeatable discounted rates.</p>
          </div>
          <div className="saas-feature-card">
            <div className="saas-feature-icon"><Smartphone size={24} /></div>
            <h3>Instant Airtime</h3>
            <p>Recharge your line seamlessly and earn cash-back on every single top-up.</p>
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
        <div className="saas-section-header" style={{ marginBottom: '40px' }}>
          <h2 className="saas-section-title">Designed for speed</h2>
          <p className="saas-section-subtitle">Enjoy a clean, intuitive dashboard that makes managing your transactions incredibly simple.</p>
        </div>
        <div className="saas-preview-wrapper">
          <img src={vtuMockup} alt="Platform Dashboard" className="saas-preview-img" loading="lazy" />
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
            <p>Sign up in seconds. It's completely free and requires no paperwork.</p>
          </div>
          <div className="saas-step-item">
            <div className="saas-step-number">2</div>
            <h3>Fund Wallet</h3>
            <p>Transfer to your dedicated automated account number instantly.</p>
          </div>
          <div className="saas-step-item">
            <div className="saas-step-number">3</div>
            <h3>Transact</h3>
            <p>Buy data or pay bills at discounted rates and get instant value.</p>
          </div>
        </div>
      </section>

      {/* 6. PRICING */}
      <section id="pricing" className="saas-section" style={{ background: 'var(--gray-50)', padding: '100px 24px', maxWidth: 'none' }}>
        <div className="saas-section-header">
          <h2 className="saas-section-title">Simple, transparent pricing</h2>
          <p className="saas-section-subtitle">Choose the plan that best fits your needs. Upgrade anytime.</p>
        </div>
        <div className="saas-pricing-grid">
          <div className="saas-pricing-card">
            <h3 className="saas-pricing-title">Personal</h3>
            <p className="saas-pricing-desc">Perfect for individuals who want cheap data and airtime.</p>
            <div className="saas-pricing-price">Free <span>/ forever</span></div>
            <ul className="saas-pricing-features">
              <li><CheckCircle2 size={18} className="saas-pricing-icon" /> Discounted Data Rates</li>
              <li><CheckCircle2 size={18} className="saas-pricing-icon" /> Airtime Cash-Back</li>
              <li><CheckCircle2 size={18} className="saas-pricing-icon" /> Zero Extra Fees</li>
              <li><CheckCircle2 size={18} className="saas-pricing-icon" /> Secure Wallet Access</li>
            </ul>
            <Link to="/signup" className="saas-btn-secondary saas-pricing-btn">Get Started</Link>
          </div>
          
          <div className="saas-pricing-card premium">
            <div className="saas-pricing-badge">Recommended</div>
            <h3 className="saas-pricing-title">Website Owner</h3>
            <p className="saas-pricing-desc">Launch your own branded VTU business instantly.</p>
            <div className="saas-pricing-price">₦5,000 <span>/ one-time</span></div>
            <ul className="saas-pricing-features">
              <li><CheckCircle2 size={18} className="saas-pricing-icon" /> Everything in Personal</li>
              <li><CheckCircle2 size={18} className="saas-pricing-icon" /> Your Own Branded Website</li>
              <li><CheckCircle2 size={18} className="saas-pricing-icon" /> Set Your Own Prices</li>
              <li><CheckCircle2 size={18} className="saas-pricing-icon" /> Keep 100% of Your Profit</li>
              <li><CheckCircle2 size={18} className="saas-pricing-icon" /> Automated Customer Wallets</li>
            </ul>
            <Link to="/signup" className="saas-btn-primary saas-pricing-btn">Start Your Business</Link>
          </div>
        </div>
      </section>

      {/* 7. REFERRAL PROGRAM */}
      <section id="referral" className="saas-referral">
        <div className="saas-referral-text">
          <h2>Earn while you sleep</h2>
          <p>Invite friends to {siteName} and earn a massive 15% commission on our platform profit from every eligible transaction they make. Forever.</p>
          <Link to="/signup" className="saas-btn-primary">Start Earning <ArrowRight size={18}/></Link>
        </div>
        <div className="saas-referral-graphic">
          <h3>15%</h3>
          <p>Profit Commission</p>
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="saas-section">
        <div className="saas-section-header">
          <h2 className="saas-section-title">Frequently asked questions</h2>
          <p className="saas-section-subtitle">Everything you need to know about the product and billing.</p>
        </div>
        <div className="saas-faq">
          <div className="saas-faq-item">
            <h4 className="saas-faq-q">How fast is the delivery?</h4>
            <p className="saas-faq-a">Transactions are processed instantly. Once your payment is confirmed via your wallet, the service is delivered in milliseconds.</p>
          </div>
          <div className="saas-faq-item">
            <h4 className="saas-faq-q">How do I fund my wallet?</h4>
            <p className="saas-faq-a">Upon registration, you are assigned a dedicated automated bank account. Any transfer to this account instantly funds your wallet.</p>
          </div>
          <div className="saas-faq-item">
            <h4 className="saas-faq-q">Can I start my own VTU business?</h4>
            <p className="saas-faq-a">Yes! Upgrade to the Website Owner plan for a one-time fee to get a fully branded portal where you set your own prices and keep the profit.</p>
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="saas-cta">
        <h2>Ready to simplify your payments?</h2>
        <p>Join thousands of users leveraging {siteName} for fast, reliable, and secure digital transactions.</p>
        <Link to="/signup" className="saas-btn-secondary saas-btn-large" style={{ color: 'var(--theme-primary)' }}>
          Create Free Account
        </Link>
      </section>

      {/* 10. FOOTER */}
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
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#referral">Referral Program</a>
            </div>
            
            <div className="saas-footer-col">
              <h4>Company</h4>
              <Link to="/login">Sign In</Link>
              <Link to="/signup">Create Account</Link>
              {supportEmail && <a href={`mailto:${supportEmail}`}>Contact Support</a>}
            </div>
          </div>
          
          <div className="saas-footer-bottom">
            <span>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</span>
            <div className="saas-footer-legal">
              <Link to="#">Privacy</Link>
              <Link to="#">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ResellerMarketingHome;
