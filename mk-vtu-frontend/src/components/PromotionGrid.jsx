import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Wifi, Smartphone, Monitor, Globe, Link } from 'lucide-react';
import API from '../api';
import './PromotionGrid.css';

const ICONS = { Zap, Wifi, Smartphone, Monitor, Globe, Link };

const PromotionGrid = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const trackedViews = useRef(new Set());
  const cardRefs = useRef({});

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await API.get('/api/promotions');
        setPromotions(res.data);
      } catch (err) {
        console.error("Failed to fetch promotions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  // Track views when cards enter viewport
  useEffect(() => {
    if (promotions.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const promoId = entry.target.dataset.id;
          if (promoId && !trackedViews.current.has(promoId)) {
            trackedViews.current.add(promoId);
            // Fire view event
            API.post(`/api/promotions/${promoId}/view`).catch(e => console.error("Track view error", e));
            observer.unobserve(entry.target);
          }
        }
      });
    }, { threshold: 0.5 });

    Object.values(cardRefs.current).forEach(card => {
        if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, [promotions]);

  const handleCardClick = async (promo) => {
    // 1. Track click
    try {
      await API.post(`/api/promotions/${promo._id}/click`);
    } catch (e) {
      console.error("Track click error", e);
    }

    // 2. Perform action
    switch (promo.actionType) {
      case 'Open Data Page':
        navigate('/dashboard/data');
        break;
      case 'Open Airtime Page':
        navigate('/dashboard/airtime');
        break;
      case 'Open Cable TV Page':
        navigate('/dashboard/cable');
        break;
      case 'Open Electricity Page':
        navigate('/dashboard/electricity');
        break;
      case 'Open Registration Page':
        navigate('/register');
        break;
      case 'Open Internal Route':
        if (promo.actionUrl) navigate(promo.actionUrl);
        break;
      case 'Open WhatsApp':
      case 'Open External Link':
      case 'Custom URL':
        if (promo.actionUrl) window.open(promo.actionUrl, '_blank');
        break;
      default:
        // Do nothing or route to default
        break;
    }
  };

  if (loading || promotions.length === 0) return null;

  return (
    <div className="promotion-grid-container">
      <div className="promotion-grid">
        {promotions.map(promo => {
          const IconComponent = ICONS[promo.icon] || Zap;
          const bgStyle = promo.gradientColor 
            ? `linear-gradient(135deg, ${promo.bgColor}, ${promo.gradientColor})`
            : promo.bgColor;

          return (
            <div 
              key={promo._id} 
              data-id={promo._id}
              className="promo-card" 
              onClick={() => handleCardClick(promo)}
              ref={el => cardRefs.current[promo._id] = el}
            >
              <div className="promo-card-bg" style={{ background: bgStyle }}></div>
              <div className="promo-card-content">
                <div className="promo-header">
                  <div className="promo-icon-wrapper">
                    <IconComponent size={20} color="white" />
                  </div>
                  {promo.badgeText && (
                    <span className="promo-badge" style={{ color: promo.bgColor }}>{promo.badgeText}</span>
                  )}
                </div>
                
                <div style={{ flex: 1 }}>
                  <h3 className="promo-title">{promo.title}</h3>
                  {promo.subtitle && <p className="promo-subtitle">{promo.subtitle}</p>}
                </div>

                <div className="promo-footer">
                  {promo.price && <div className="promo-price">{promo.price}</div>}
                  {promo.buttonText && <div className="promo-action">{promo.buttonText}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PromotionGrid;
