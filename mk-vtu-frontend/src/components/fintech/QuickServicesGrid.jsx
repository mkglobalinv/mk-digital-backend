import React, { useState, useEffect } from 'react';
import {
  Wifi, Smartphone, Tv2, Zap, Hash, Monitor, FileText,
  Globe, History, ChevronDown, ChevronUp, Sparkles, Banknote
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
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

// Airtime-to-Cash is shown only once the backend confirms it, so a tenant with the
// global service off, or their own tenant-specific override disabled, never sees a
// tile that would just fail server-side anyway -- the backend stays authoritative.
const AIRTIME_TO_CASH_SERVICE = { id: 'airtime-to-cash', label: 'Airtime to Cash', icon: Banknote, cls: 'srv-teal', route: '/airtime-to-cash' };

const QuickServicesGrid = ({ isReseller = false }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [airtimeToCashAvailable, setAirtimeToCashAvailable] = useState(false);

  useEffect(() => {
    API.get('/api/airtime-to-cash/config')
      .then((res) => {
        const data = res.data?.data;
        const anyNetworkEnabled = data?.networks && Object.values(data.networks).some(Boolean);
        setAirtimeToCashAvailable(Boolean(data?.enabled && anyNetworkEnabled));
      })
      .catch(() => setAirtimeToCashAvailable(false));
  }, []);

  const moreServices = airtimeToCashAvailable ? [...MORE_SERVICES, AIRTIME_TO_CASH_SERVICE] : MORE_SERVICES;

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
                <Icon size={28} />
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
          {moreServices.map(svc => {
            const Icon = svc.icon;
            return (
              <div key={svc.id} className={`service-card ${svc.cls}`} onClick={() => handleServiceClick(svc)}>
                <div className="service-icon-wrap">
                  <Icon size={28} />
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
