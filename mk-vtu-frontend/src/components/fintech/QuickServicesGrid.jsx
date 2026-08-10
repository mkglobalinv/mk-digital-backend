import React, { useState } from 'react';
import {
  Wifi, Smartphone, Tv2, Zap, Hash, Monitor, FileText,
  Globe, History, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './FintechComponents.css';

const PRIMARY_SERVICES = [
  { id: 'data',        label: 'Data',     icon: Wifi,       cls: 'srv-gold'  },
  { id: 'airtime',     label: 'Airtime',  icon: Smartphone, cls: 'srv-navy'  },
  { id: 'cable',       label: 'Cable TV', icon: Tv2,        cls: 'srv-blue'  },
  { id: 'electricity', label: 'Electric', icon: Zap,        cls: 'srv-teal'  },
];

const MORE_SERVICES = [
  { id: 'epin',    label: 'Airtime PIN', icon: Hash,      cls: 'srv-purple', route: null },
  { id: 'result',  label: 'Education',   icon: FileText,  cls: 'srv-amber',  route: null },
  { id: 'website', label: 'Website',     icon: Globe,     cls: 'srv-green',  route: '/reseller/onboarding' },
  { id: 'history', label: 'History',     icon: History,   cls: 'srv-gray',   route: '/transactions' },
];

const QuickServicesGrid = ({ isReseller = false }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleServiceClick = (svc) => {
    if (svc.route) {
      navigate(svc.route);
    } else {
      navigate(isReseller ? '/reseller/purchase' : '/purchase', { state: { defaultTab: svc.id } });
    }
  };

  return (
    <div className="qs-section">
      <div className="section-header">
        <h3>Quick Services</h3>
      </div>

      {/* Primary 4 */}
      <div className="services-grid primary-grid">
        {PRIMARY_SERVICES.map(svc => {
          const Icon = svc.icon;
          return (
            <div key={svc.id} className={`service-card ${svc.cls}`} onClick={() => handleServiceClick(svc)}>
              <div className="service-icon-wrap">
                <Icon size={22} />
              </div>
              <span>{svc.label}</span>
            </div>
          );
        })}
      </div>

      {/* Explore More Button */}
      <button
        className={`explore-more-btn ${expanded ? 'expanded' : ''}`}
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        <span className="explore-more-icon-wrap">
          <Sparkles size={13} />
        </span>
        <span className="explore-more-label">
          {expanded ? 'Show Less' : 'Explore More Services'}
        </span>
        <span className={`explore-chevron ${expanded ? 'rotated' : ''}`}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {/* Expanded panel */}
      <div className={`more-services-panel ${expanded ? 'open' : ''}`}>
        <div className="services-grid secondary-grid">
          {MORE_SERVICES.map(svc => {
            const Icon = svc.icon;
            return (
              <div key={svc.id} className={`service-card ${svc.cls}`} onClick={() => handleServiceClick(svc)}>
                <div className="service-icon-wrap">
                  <Icon size={22} />
                </div>
                <span>{svc.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickServicesGrid;
