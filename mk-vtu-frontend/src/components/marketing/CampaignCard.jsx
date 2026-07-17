import React from 'react';
import { Zap, Info, ArrowRight, Gift } from 'lucide-react';
import './CampaignCard.css';

const CampaignCard = ({ campaign, onClick }) => {
  if (!campaign) return null;

  const handleClick = () => {
    if (onClick) onClick(campaign);
  };

  const renderPromotion = () => {
    const bgStyle = campaign.gradientColor 
      ? `linear-gradient(135deg, ${campaign.bgColor || '#3b82f6'}, ${campaign.gradientColor})`
      : (campaign.bgColor || '#3b82f6');

    return (
      <div className="campaign-card-container card-type-promotion" onClick={handleClick}>
        <div className="promotion-bg" style={{ background: bgStyle }}></div>
        <div className="promotion-content">
          <div className="promo-top">
            {campaign.badgeText ? (
              <span className="promo-badge" style={{ color: campaign.bgColor || '#3b82f6' }}>{campaign.badgeText}</span>
            ) : <div />}
            <Zap size={20} color="white" opacity={0.8} />
          </div>
          <div className="promo-title-area">
            <h3>{campaign.title}</h3>
            {(campaign.subtitle || campaign.content) && <p>{campaign.subtitle || campaign.content}</p>}
          </div>
          <div className="promo-bottom">
            <div className="promo-price">{campaign.price}</div>
            <div className="promo-btn">{campaign.buttonText || 'BUY NOW'}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderAdvertisement = () => {
    return (
      <div className="campaign-card-container card-type-advertisement" onClick={handleClick}>
        {campaign.featuredImage && (
          <div className="adv-image-container">
            <img src={campaign.featuredImage} alt={campaign.title} />
          </div>
        )}
        <div className="adv-content">
          <h3 className="adv-title">{campaign.title}</h3>
          {(campaign.subtitle || campaign.content) && <p className="adv-desc">{campaign.subtitle || campaign.content}</p>}
          <div className="adv-btn">{campaign.buttonText || 'LEARN MORE'}</div>
        </div>
      </div>
    );
  };

  const renderAnnouncement = () => {
    // Colors based on priority
    let borderColor = '#3b82f6';
    let iconColor = '#3b82f6';
    if (campaign.priority === 'Warning') { borderColor = '#f59e0b'; iconColor = '#f59e0b'; }
    if (campaign.priority === 'Critical') { borderColor = '#ef4444'; iconColor = '#ef4444'; }

    return (
      <div className="campaign-card-container card-type-announcement" style={{ borderLeftColor: borderColor }} onClick={handleClick}>
        <div className="ann-content">
          <Info size={20} className="ann-icon" style={{ color: iconColor }} />
          <div className="ann-text">
            <h3>{campaign.title}</h3>
            <p>{campaign.content || campaign.subtitle}</p>
            <div className="ann-btn">{campaign.buttonText || 'UNDERSTOOD'}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderBlog = () => {
    return (
      <div className="campaign-card-container card-type-blog" onClick={handleClick}>
        {campaign.featuredImage && (
          <img className="blog-image" src={campaign.featuredImage} alt={campaign.title} />
        )}
        <div className="blog-content">
          {campaign.category && <span className="blog-category">{campaign.category}</span>}
          <h3 className="blog-title">{campaign.title}</h3>
          <div className="blog-btn">
            {campaign.buttonText || 'READ ARTICLE'} <ArrowRight size={14} />
          </div>
        </div>
      </div>
    );
  };

  const renderReferral = () => {
    return (
      <div className="campaign-card-container card-type-referral" onClick={handleClick}>
        <div className="ref-icon-wrapper">
          <Gift size={24} color="white" />
        </div>
        <h3 className="ref-bonus">{campaign.referralBonus || campaign.price || 'Earn Rewards'}</h3>
        <p className="ref-desc">{campaign.subtitle || campaign.content || campaign.title}</p>
        <div className="ref-btn">{campaign.buttonText || 'INVITE NOW'}</div>
      </div>
    );
  };

  switch (campaign.campaignType) {
    case 'Advertisement':
      return renderAdvertisement();
    case 'Announcement':
      return renderAnnouncement();
    case 'Blog':
      return renderBlog();
    case 'Referral':
      return renderReferral();
    case 'Promotion':
    default:
      return renderPromotion();
  }
};

export default CampaignCard;
