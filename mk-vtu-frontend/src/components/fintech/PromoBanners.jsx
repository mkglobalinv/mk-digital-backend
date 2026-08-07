import React from 'react';
import { Globe, Share2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './FintechComponents.css';

/**
 * Two promo cards:
 *  1. Website Builder  → /reseller/onboarding (existing route, never changed)
 *  2. Referral Program → /referrals           (existing route, never changed)
 *
 * The Referral banner is hidden ONLY on confirmed white-label storefronts
 * (when siteInfo is a truthy object coming from the whiteLabelHelper).
 * If siteInfo is undefined/null/false it is shown.
 */
const PromoBanners = ({ referralAnalytics, siteInfo }) => {
  const navigate = useNavigate();

  // Guard: only suppress referral on real white-label tenants
  const hideReferral = siteInfo && typeof siteInfo === 'object' && siteInfo !== null;

  return (
    <div className="promo-cards-container">

      {/* ── Card 1: Website Builder ── */}
      <div
        className="promo-card promo-card-website"
        onClick={() => navigate('/reseller/onboarding')}
        role="button"
        tabIndex={0}
      >
        <div className="promo-card-glow website-glow" />
        <div className="promo-card-left">
          <div className="promo-card-icon-wrap website-icon-wrap">
            <Globe size={19} color="#2563EB" />
          </div>
          <div className="promo-card-text">
            <h4>Launch Your Business Website</h4>
            <p>Start selling data, airtime &amp; bills online today.</p>
          </div>
        </div>
        <div className="promo-card-cta website-cta">
          <ChevronRight size={13} />
        </div>
      </div>

      {/* ── Card 2: Referral Program ── */}
      {!hideReferral && (
        <div
          className="promo-card promo-card-referral"
          onClick={() => navigate('/referrals')}
          role="button"
          tabIndex={0}
        >
          <div className="promo-card-glow referral-glow" />
          <div className="promo-card-left">
            <div className="promo-card-icon-wrap referral-icon-wrap">
              <Share2 size={19} color="#D97706" />
            </div>
            <div className="promo-card-text">
              <h4>Invite Friends &amp; Earn</h4>
              <p>
                {referralAnalytics?.totalReferralIncome > 0
                  ? `You've earned ₦${referralAnalytics.totalReferralIncome.toLocaleString()} so far`
                  : 'Earn rewards every time your referrals transact.'}
              </p>
            </div>
          </div>
          <div className="promo-card-cta referral-cta">
            <ChevronRight size={13} />
          </div>
        </div>
      )}

    </div>
  );
};

export default PromoBanners;
