import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Store, Wifi, Shield, Zap, Smartphone, Monitor, Globe, Link } from 'lucide-react';
import API from '../../api';
import { useNavigate } from 'react-router-dom';
import CampaignCard from './CampaignCard';
import './MarketingPopup.css';

const ICONS = { Zap, Wifi, Smartphone, Monitor, Globe, Link, Calendar, Store, Shield };

const MarketingPopup = ({ user }) => {
  const [popupCampaigns, setPopupCampaigns] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const trackedViews = useRef(new Set());

  // Staff/admin accounts may preview their own campaigns, but a preview must never count
  // as a real impression/click or trigger any campaign side effects.
  const isStaffPreview = !!user && user.role !== 'user';

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await API.get('/api/marketing/campaigns/active');
        const popups = res.data.filter(c => {
          // Helper for logging
          const logDecision = (result) => {
            console.log(`Campaign: ${c.campaignType}\nUser Role: ${user ? user.role : 'none'}\nReferredBy: ${user ? user.referredBy : 'none'}\nResult: ${result}\n`);
            return result === 'ALLOWED';
          };

          // A logged-in user is required to personalize a Promotion; referral status no
          // longer affects eligibility (referred users should still see promos). Staff/
          // admin accounts are allowed through as a preview (tracked separately below).
          if (c.campaignType !== 'Announcement' && !user) return logDecision('BLOCKED');

          if (c.displayMode === 'Popup Only' || c.displayMode === 'Both') {
             return logDecision('ALLOWED');
          }
          return logDecision('BLOCKED');
        });

        if (popups.length > 0) {
          // Check which popups have been seen in this session
          const seenStr = sessionStorage.getItem('seen_marketing_campaigns');
          const seenIds = seenStr ? JSON.parse(seenStr) : [];
          
          const unseenPopups = popups.filter(c => !seenIds.includes(c._id));
          
          if (unseenPopups.length > 0) {
            setPopupCampaigns(unseenPopups);
            setIsVisible(true);
            
            // Mark these as seen
            const newSeenIds = [...seenIds, ...unseenPopups.map(c => c._id)];
            sessionStorage.setItem('seen_marketing_campaigns', JSON.stringify(newSeenIds));
            
            // Log views for all shown -- but a staff/admin preview must never count as
            // a real impression.
            if (!isStaffPreview) {
              unseenPopups.forEach(campaign => {
                API.post('/api/marketing/analytics/view', { campaignId: campaign._id }).catch(console.error);
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to load marketing campaigns', err);
      }
    };
    
    // Only fetch campaigns if we actually have the user object loaded,
    // to prevent fetching with null token or rendering prematurely.
    if (user !== undefined) {
      const timer = setTimeout(() => {
        fetchCampaigns();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleAction = async (campaign) => {
    // A staff/admin preview click must not count toward the campaign's real click count.
    if (!isStaffPreview) {
      try {
        await API.post('/api/marketing/analytics/click', { campaignId: campaign._id });
      } catch (e) {
        console.error("Track click error", e);
      }
    }

    setIsVisible(false);
    
    switch (campaign.actionType) {
      case 'Open Data Page': navigate('/purchase?service=data'); break;
      case 'Open Airtime Page': navigate('/purchase?service=airtime'); break;
      case 'Open Cable TV Page': navigate('/purchase?service=cable'); break;
      case 'Open Electricity Page': navigate('/purchase?service=electricity'); break;
      case 'Open Registration Page': navigate('/signup'); break;
      case 'Open Internal Route': if (campaign.actionUrl) navigate(campaign.actionUrl); break;
      case 'Open WhatsApp':
      case 'Open External Link':
      case 'Custom URL':
        if (campaign.actionUrl) window.open(campaign.actionUrl, '_blank');
        break;
      default: break;
    }
  };

  // Confetti particles for background
  const particles = Array.from({ length: 12 });

  return (
    <AnimatePresence>
      {isVisible && popupCampaigns.length > 0 && (
        <motion.div 
          className="promo-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="promo-confetti-container">
            {particles.map((_, i) => (
              <motion.div
                key={i}
                className={`confetti confetti-${i % 4}`}
                initial={{ 
                  y: -100, 
                  x: Math.random() * window.innerWidth, 
                  rotate: 0 
                }}
                animate={{ 
                  y: window.innerHeight + 100,
                  rotate: 360,
                  x: (Math.random() * window.innerWidth) + (Math.random() > 0.5 ? 100 : -100)
                }}
                transition={{ 
                  duration: Math.random() * 3 + 4, 
                  repeat: Infinity,
                  ease: "linear",
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>

          <motion.div 
            className="promo-modal-content"
            initial={{ y: 350, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 350, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 150 }}
          >
            <button className="promo-close-btn" onClick={handleClose}>
              <X size={24} />
            </button>


            <div className="promo-cards-container">
              {popupCampaigns.map((card, index) => (
                <motion.div 
                  key={card._id}
                  className="popup-card-wrapper"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + (index * 0.1), duration: 0.4 }}
                >
                  <CampaignCard campaign={card} onClick={handleAction} />
                </motion.div>
              ))}
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MarketingPopup;
