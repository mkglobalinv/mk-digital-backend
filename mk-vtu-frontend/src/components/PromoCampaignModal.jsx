import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Store, Wifi, Shield } from 'lucide-react';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import './PromoCampaignModal.css';

const PromoCampaignModal = () => {
  const [campaign, setCampaign] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await API.get('/api/promo-campaigns/active');
        if (res.data.success && res.data.campaign) {
          setCampaign(res.data.campaign);
          setIsVisible(true);
          
          // Log view
          API.post('/api/promo-campaigns/view', {
            campaignId: res.data.campaign._id,
            deviceId: localStorage.getItem('deviceId') || 'unknown'
          }).catch(console.error);
        }
      } catch (err) {
        console.error('Failed to load promo campaign', err);
      }
    };
    
    // Slight delay to ensure it doesn't block critical rendering
    const timer = setTimeout(() => {
      fetchCampaign();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleAction = (target, url) => {
    API.post('/api/promo-campaigns/click', {
      campaignId: campaign._id,
      target,
      deviceId: localStorage.getItem('deviceId') || 'unknown'
    }).catch(console.error);
    
    setIsVisible(false);
    if (url) navigate(url);
  };

  const getIcon = (iconName) => {
    const props = { size: 24, className: 'card-icon-svg' };
    switch (iconName?.toLowerCase()) {
      case 'calendar': return <Calendar {...props} />;
      case 'store': return <Store {...props} />;
      case 'network': return <Wifi {...props} />;
      default: return <Shield {...props} />;
    }
  };

  const getGradient = (color) => {
    switch(color) {
      case 'purple': return 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)';
      case 'blue': return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
      case 'green': return 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)';
      case 'orange': return 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)';
      case 'pink': return 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)';
      case 'red': return 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)';
      default: return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
    }
  };

  // Confetti particles for background
  const particles = Array.from({ length: 12 });

  return (
    <AnimatePresence>
      {isVisible && campaign && (
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
            initial={{ scale: 0.9, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
          >
            <button className="promo-close-btn" onClick={handleClose}>
              <X size={24} />
            </button>

            <motion.div 
              className="promo-header"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <h1 className="promo-title">
                {campaign.name.toLowerCase().includes('whooosh') ? campaign.name : "Whooosh! ⚡"}
              </h1>
            </motion.div>

            <div className="promo-cards-container">
              {campaign.cards?.map((card, index) => (
                <motion.div 
                  key={card._id || index}
                  className="promo-card"
                  style={{ background: getGradient(card.color) }}
                  initial={{ opacity: 0, y: 40, rotate: index % 2 === 0 ? -4 : 4 }}
                  animate={{ 
                    opacity: 1, 
                    y: [0, -8, 0], 
                    rotate: 0 
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    rotate: index % 2 === 0 ? 2 : -2,
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)"
                  }}
                  transition={{ 
                    opacity: { delay: 0.3 + (index * 0.1), duration: 0.4 },
                    rotate: { delay: 0.3 + (index * 0.1), type: "spring" },
                    y: { 
                      delay: 0.8 + (index * 0.2), 
                      duration: 3, 
                      repeat: Infinity, 
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }
                  }}
                  onClick={() => handleAction(`card_${index}`, campaign.ctaUrl)}
                >
                  <div className="promo-card-icon">
                    {getIcon(card.icon)}
                  </div>
                  <div className="promo-card-content">
                    <h3 className="promo-card-title">{card.title}</h3>
                    {card.subtitle && <p className="promo-card-subtitle">{card.subtitle}</p>}
                  </div>
                  <div className="promo-card-price">{card.price}</div>
                </motion.div>
              ))}
            </div>

            <motion.div 
              className="promo-bottom"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <h2 className="promo-bottom-title">Special Data Deals 🎉</h2>
              <p className="promo-bottom-subtitle">Grab the best data offers now!</p>
              
              <motion.button 
                className="promo-cta-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction('cta_button', campaign.ctaUrl)}
              >
                {campaign.ctaText || "Buy Now"}
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PromoCampaignModal;
