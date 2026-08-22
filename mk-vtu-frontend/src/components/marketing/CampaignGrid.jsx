import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import CampaignCard from './CampaignCard';
import './CampaignGrid.css';

const CampaignGrid = ({ user }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const trackedViews = useRef(new Set());

  // Staff/admin accounts may preview their own campaigns, but a preview must never count
  // as a real impression/click or trigger any campaign side effects.
  const isStaffPreview = !!user && user.role !== 'user';

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await API.get('/api/marketing/campaigns/active');
        // Filter out popup-only or hidden
        const gridCampaigns = res.data.filter(c => {
          // Helper for logging
          const logDecision = (result) => {
            console.log(`Campaign: ${c.campaignType}\nUser Role: ${user ? user.role : 'none'}\nReferredBy: ${user ? user.referredBy : 'none'}\nResult: ${result}\n`);
            return result === 'ALLOWED';
          };

          // A logged-in user is required to personalize a Promotion; referral status no
          // longer affects eligibility (referred users should still see promos). Staff/
          // admin accounts are allowed through as a preview (tracked separately below).
          if (c.campaignType !== 'Announcement' && !user) return logDecision('BLOCKED');

          if (c.displayMode === 'Dashboard Grid Only' || c.displayMode === 'Both') {
             return logDecision('ALLOWED');
          }
          return logDecision('BLOCKED');
        });
        setCampaigns(gridCampaigns);
      } catch (err) {
        console.error("Failed to fetch campaigns", err);
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch campaigns if we actually have the user object loaded,
    // to prevent fetching with null token or rendering prematurely.
    if (user !== undefined) {
       fetchCampaigns();
    }
  }, [user]);

  // Track views when cards enter viewport
  useEffect(() => {
    if (campaigns.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const campaignId = entry.target.dataset.id;
          if (campaignId && !trackedViews.current.has(campaignId)) {
            trackedViews.current.add(campaignId);
            // A staff/admin preview must never count as a real impression.
            if (!isStaffPreview) {
              API.post('/api/marketing/analytics/view', { campaignId }).catch(e => console.error("Track view error", e));
            }
            observer.unobserve(entry.target);
          }
        }
      });
    }, { threshold: 0.5 });

    const cards = document.querySelectorAll('.promo-card');
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [campaigns]);

  const handleCardClick = async (campaign) => {
    // 1. Track click -- a staff/admin preview click must not count toward the campaign's
    // real click count.
    if (!isStaffPreview) {
      try {
        await API.post('/api/marketing/analytics/click', { campaignId: campaign._id });
      } catch (e) {
        console.error("Track click error", e);
      }
    }

    // 2. Perform action
    switch (campaign.actionType) {
      case 'Open Data Page':
        navigate('/purchase?service=data');
        break;
      case 'Open Airtime Page':
        navigate('/purchase?service=airtime');
        break;
      case 'Open Cable TV Page':
        navigate('/purchase?service=cable');
        break;
      case 'Open Electricity Page':
        navigate('/purchase?service=electricity');
        break;
      case 'Open Registration Page':
        navigate('/signup');
        break;
      case 'Open Internal Route':
        if (campaign.actionUrl) navigate(campaign.actionUrl);
        break;
      case 'Open WhatsApp':
      case 'Open External Link':
      case 'Custom URL':
        if (campaign.actionUrl) window.open(campaign.actionUrl, '_blank');
        break;
      default:
        break;
    }
  };

  if (loading || campaigns.length === 0) return null;

  return (
    <div className="promotion-grid-container">
      <div className="promotion-grid">
        {campaigns.map(campaign => (
          <CampaignCard 
            key={campaign._id} 
            campaign={campaign} 
            onClick={handleCardClick} 
          />
        ))}
      </div>
    </div>
  );
};

export default CampaignGrid;
