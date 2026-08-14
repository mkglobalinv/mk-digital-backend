import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Rocket, Smartphone, Globe, ShieldCheck, Zap, 
  Wallet, Layers, ArrowRight, Menu, X, CheckCircle, 
  Wifi, Lightbulb, Tv, GraduationCap, FileText, UserCheck, Phone
} from 'lucide-react';
import './PlatformMarketingHome.css';
import appMockup from '../assets/vtu-app-mockup.png';
import dashboardMockup from '../assets/dashboard-mockup.png';
import dashboardHeroBg from '../assets/dashboard_hero_bg.png';
import brandLogo from '../assets/9jasub.jpg'; // Assuming default logo

const PlatformMarketingHome = ({ siteInfo }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="platform-marketing-container">
      {/* HEADER / NAVIGATION */}
      <header className="platform-header">
        <div className="platform-header-content">
          <Link to="/" className="platform-brand">
            <img src={brandLogo} alt="9JASUB" className="platform-logo-img" />
            <span className="platform-brand-text">9JASUB</span>
          </Link>

          <nav className="platform-desktop-nav">
            <Link to="/#how-it-works" className="platform-nav-link">How It Works</Link>
            <Link to="/#services" className="platform-nav-link">Services</Link>
            <Link to="/#referral" className="platform-nav-link">Refer & Earn</Link>
          </nav>

          <div className="platform-header-actions">
            <Link to="/login" className="platform-login-btn">Login</Link>
            <Link to="/signup" className="platform-signup-btn">Get Started</Link>
          </div>

          <button className="platform-mobile-menu-btn" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* MOBILE MENU */}
        {isMobileMenuOpen && (
          <div className="platform-mobile-nav">
            <Link to="/#how-it-works" className="platform-mobile-link" onClick={toggleMobileMenu}>How It Works</Link>
            <Link to="/#services" className="platform-mobile-link" onClick={toggleMobileMenu}>Services</Link>
            <Link to="/#referral" className="platform-mobile-link" onClick={toggleMobileMenu}>Refer & Earn</Link>
            <div className="platform-mobile-actions">
              <Link to="/login" className="platform-login-btn full-width" onClick={toggleMobileMenu}>Login</Link>
              <Link to="/signup" className="platform-signup-btn full-width" onClick={toggleMobileMenu}>Get Started</Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="platform-hero">
          <div className="platform-hero-content">
            <div className="platform-hero-badge">Launch Your Business</div>
            <h1 className="platform-hero-title">
              Own Your VTU Website & App in Just 5 Minutes
            </h1>
            <p className="platform-hero-subtitle">
              Start your own branded digital services business with a 3-day free trial.
            </p>
            
            <div className="platform-hero-pricing">
              <div className="pricing-tag trial">3-Day Free Trial</div>
              <div className="pricing-tag activation">₦5,000 One-Time Activation Fee After Trial</div>
            </div>

            <div className="platform-hero-cta-group">
              <Link to="/signup" className="platform-btn-primary glow-effect">
                Start Your Free Trial <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="platform-btn-secondary">
                Login to Dashboard
              </Link>
            </div>
            <p className="platform-hero-guarantee">Your Business. Your Brand. Your Customers.</p>
          </div>
        </section>

        {/* WEBSITE SHOWCASE CAROUSEL */}
        <section className="platform-showcase">
          <div className="platform-section-header">
            <h2>See What Your Own Website Can Look Like</h2>
            <p>Your own brand. Your own website. Your own digital services business.</p>
          </div>
          <div className="platform-carousel-container">
            <div className="platform-carousel-track">
              <div className="platform-carousel-item">
                <div className="preview-label">Platform Preview</div>
                <img src={dashboardMockup} alt="Website Dashboard Preview" />
              </div>
              <div className="platform-carousel-item">
                <div className="preview-label">Platform Preview</div>
                <img src={dashboardHeroBg} alt="Hero Background Preview" />
              </div>
              <div className="platform-carousel-item">
                <div className="preview-label">Platform Preview</div>
                <img src={dashboardMockup} alt="Website Dashboard Preview" />
              </div>
              <div className="platform-carousel-item">
                <div className="preview-label">Platform Preview</div>
                <img src={dashboardHeroBg} alt="Hero Background Preview" />
              </div>
            </div>
          </div>
        </section>

        {/* BUSINESS MODEL / NO CAPITAL NEEDED */}
        <section className="platform-business-model" id="how-it-works">
          <div className="platform-section-header">
            <h2>You Don't Need Large Startup Capital To Start</h2>
            <p>Start with a 3-day free trial. After your trial, pay just ₦5,000 one-time activation fee to keep your website live and continue selling.</p>
          </div>
          
          <div className="platform-flow-container">
            <div className="platform-flow-step">
              <Globe size={40} className="flow-icon blue" />
              <h4>Your VTU Website</h4>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="platform-flow-step">
              <UserCheck size={40} className="flow-icon indigo" />
              <h4>Your Customers</h4>
              <p>Register on your website</p>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="platform-flow-step">
              <Wallet size={40} className="flow-icon green" />
              <h4>Customers Fund Wallets</h4>
              <p>With their own money</p>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="platform-flow-step">
              <Zap size={40} className="flow-icon orange" />
              <h4>Customers Buy Services</h4>
              <p>Using their wallet balance</p>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="platform-flow-step highlight">
              <CheckCircle size={40} className="flow-icon gold" />
              <h4>You Earn Your Markup</h4>
              <p>From successful transactions</p>
            </div>
          </div>
        </section>

        {/* 3 MINUTE SETUP */}
        <section className="platform-setup">
          <div className="platform-section-header">
            <h2>Launch in 3 Simple Steps</h2>
            <p>Ready in about 3 minutes.</p>
          </div>
          <div className="platform-steps-grid">
            <div className="platform-step-card">
              <div className="step-number">01</div>
              <h3>Create Your Website</h3>
              <p>Choose your business name, site name and branding.</p>
            </div>
            <div className="platform-step-card">
              <div className="step-number">02</div>
              <h3>Configure Your Business</h3>
              <p>Set your services, pricing, markup and business settings.</p>
            </div>
            <div className="platform-step-card">
              <div className="step-number">03</div>
              <h3>Go Live & Grow</h3>
              <p>Your branded website goes live and you can start operating your own digital services business.</p>
            </div>
          </div>
        </section>

        {/* REFERRAL & EARNINGS */}
        <section className="platform-referral" id="referral">
          <div className="platform-referral-content">
            <div className="platform-section-header left-align">
              <h2>Refer. Earn. Keep Earning.</h2>
              <p>Refer someone who creates their own VTU website and activates it by paying the ₦5,000 activation fee.</p>
            </div>

            <div className="referral-bonus-card">
              <h3>Instant ₦2,000 Bonus</h3>
              <p>You instantly receive ₦2,000 in your profit wallet when your referral activates their website.</p>
            </div>

            <div className="referral-ongoing-card">
              <h3>Ongoing Earning</h3>
              <p>When people you referred make qualifying purchases through their own website, you can continue earning referral commissions from those transactions.</p>
            </div>
          </div>
          
          <div className="platform-referral-visual">
            <div className="ref-flow">
              <div className="ref-item">Refer Someone</div>
              <div className="ref-arrow">↓</div>
              <div className="ref-item">They Create Their Website</div>
              <div className="ref-arrow">↓</div>
              <div className="ref-item highlight">They Activate For ₦5,000</div>
              <div className="ref-arrow">↓</div>
              <div className="ref-item success">You Receive ₦2,000</div>
              <div className="ref-arrow">↓</div>
              <div className="ref-item">They Start Selling</div>
              <div className="ref-arrow">↓</div>
              <div className="ref-item ongoing">You Continue Earning from qualifying transactions</div>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section className="platform-services" id="services">
          <div className="platform-section-header">
            <h2>Everything You Need to Run Your Digital Services Business</h2>
          </div>
          <div className="platform-services-grid">
            <div className="service-item"><Wifi size={24} /> Data</div>
            <div className="service-item"><Phone size={24} /> Airtime</div>
            <div className="service-item"><Lightbulb size={24} /> Electricity</div>
            <div className="service-item"><Tv size={24} /> Cable TV</div>
            <div className="service-item"><GraduationCap size={24} /> Education / E-PIN</div>
            <div className="service-item"><ShieldCheck size={24} /> NIN Verification</div>
            <div className="service-item"><ShieldCheck size={24} /> BVN Verification</div>
            <div className="service-item"><FileText size={24} /> NIN Modification</div>
            <div className="service-item"><FileText size={24} /> BVN Modification</div>
            <div className="service-item"><FileText size={24} /> CAC Registration</div>
            <div className="service-item"><Layers size={24} /> More Digital Services</div>
          </div>
        </section>

        {/* YOUR BUSINESS, YOUR BRAND */}
        <section className="platform-brand-features">
          <div className="platform-section-header">
            <h2>Your Business. Your Brand.</h2>
          </div>
          <div className="platform-features-list">
            <div className="feature-pill">✓ Your Own VTU Website</div>
            <div className="feature-pill">✓ Your Own Domain/Subdomain</div>
            <div className="feature-pill">✓ Your Own Branding</div>
            <div className="feature-pill">✓ Your Own Customers</div>
            <div className="feature-pill">✓ Wallet System</div>
            <div className="feature-pill">✓ Customer Accounts</div>
            <div className="feature-pill">✓ Reseller Dashboard</div>
            <div className="feature-pill">✓ Transaction History</div>
            <div className="feature-pill">✓ Pricing & Markup Control</div>
            <div className="feature-pill">✓ Branded Email OTP</div>
            <div className="feature-pill">✓ Admin/Business Management</div>
          </div>
        </section>

        {/* PREMIUM MOBILE APP */}
        <section className="platform-mobile-app">
          <div className="platform-app-content">
            <h2>Take Your Business to Mobile</h2>
            <p>Premium website owners can request their own branded Android app.</p>
            <ul className="app-features">
              <li><CheckCircle size={18} className="check-icon" /> Expand your reach with a native mobile presence.</li>
              <li><CheckCircle size={18} className="check-icon" /> Give your customers a seamless app experience.</li>
              <li><CheckCircle size={18} className="check-icon" /> Managed through the manual App Request workflow.</li>
            </ul>
          </div>
          <div className="platform-app-visual">
            <div className="preview-label app-label">Mobile Preview</div>
            <img src={appMockup} alt="Premium App Mockup" className="app-mockup-img" />
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="platform-final-cta">
          <div className="platform-cta-card">
            <h2>Ready to Own Your VTU Business?</h2>
            <p>Start your 3-day free trial and see how your own branded VTU business works.</p>
            
            <div className="platform-cta-tags">
              <span className="tag-trial">3-Day Free Trial</span>
              <span className="tag-activation">₦5,000 One-Time Activation After Trial</span>
            </div>

            <div className="platform-cta-buttons">
              <Link to="/signup" className="platform-btn-primary glow-effect large">
                Start Your Free Trial
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="platform-footer">
        <div className="platform-footer-grid">
          <div className="footer-col">
            <Link to="/" className="platform-brand footer-brand">
              <img src={brandLogo} alt="9JASUB" className="platform-logo-img" />
              <span className="platform-brand-text">9JASUB</span>
            </Link>
            <p>Your platform to build and operate a successful VTU and digital services business.</p>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <Link to="/login">Login</Link>
            <Link to="/signup">Get Started</Link>
            <Link to="/#how-it-works">How It Works</Link>
            <Link to="/#services">Services</Link>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </div>
        <div className="platform-footer-bottom">
          <p>&copy; {new Date().getFullYear()} 9JASUB. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PlatformMarketingHome;
