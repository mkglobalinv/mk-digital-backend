import React, { useState } from 'react';
import {
  Fingerprint, ShieldCheck, Phone, MapPin,
  Users, Edit3, BookOpen, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './FintechComponents.css';

/**
 * IDENTITY_SERVICES — display metadata only.
 * api_plan_id values MUST match the DataPlan.api_plan_id in MongoDB exactly.
 * Prices, plan names and provider come from the DB — never hardcoded here.
 */
const IDENTITY_SERVICES = [
  { api_plan_id: 'nin-verify',       label: 'NIN Verify',  icon: Fingerprint, color: '#10B981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)' },
  { api_plan_id: 'nin-phone',        label: 'NIN Modify',   icon: Phone,       color: '#3B82F6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)' },
  { api_plan_id: 'nin-tracking',     label: 'VBN Modify',   icon: MapPin,      color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
  { api_plan_id: 'nin-demographics', label: 'CAC',          icon: BookOpen,    color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.2)' },
  { api_plan_id: 'bvn-verify',       label: 'BVN Verify',  icon: ShieldCheck, color: '#10B981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)' },
  { api_plan_id: 'bvn-phone',        label: 'BVN Phone',   icon: Users,       color: '#2563EB', bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.2)' },
  { api_plan_id: 'nin-modification', label: 'NIN Modify',  icon: Edit3,       color: '#F4B400', bg: 'rgba(244,180,0,0.08)',   border: 'rgba(244,180,0,0.2)' },
];

const IdentityServicesGrid = ({ isReseller = false }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  /**
   * Navigate to /identity/:serviceId (retail) or /reseller/identity/:serviceId.
   * IdentityPurchase.jsx reads the serviceId URL param and fetches the full
   * service object from GET /api/retail/identity/service/:serviceId — no
   * data is passed via state.
   */
  const handleClick = (api_plan_id) => {
    if (isReseller) {
      navigate(`/reseller/identity/${api_plan_id}`);
    } else {
      navigate(`/identity/${api_plan_id}`);
    }
  };

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const availableServices = IDENTITY_SERVICES.filter(svc => {
    if (['bvn-verify', 'bvn-phone', 'nin-modification'].includes(svc.api_plan_id)) {
      return isLocalhost;
    }
    return true;
  });

  const visible = expanded ? availableServices : availableServices.slice(0, 4);

  return (
    <div className="identity-section">
      <div className="section-header" style={{ marginTop: '4px' }}>
        <h3 className="identity-header">
          <Fingerprint size={15} />
          Identity Services
        </h3>
      </div>

      <div className="identity-grid">
        {visible.map(svc => {
          const Icon = svc.icon;
          return (
            <div
              key={svc.api_plan_id}
              className="identity-card"
              onClick={() => handleClick(svc.api_plan_id)}
            >
              <div
                className="identity-icon-wrap"
                style={{ background: svc.bg, border: `1px solid ${svc.border}` }}
              >
                <Icon size={17} color={svc.color} />
              </div>
              <span className="identity-label">{svc.label}</span>
            </div>
          );
        })}
      </div>

      <button
        className={`explore-more-btn ${expanded ? 'expanded' : ''}`}
        onClick={() => setExpanded(v => !v)}
        style={{ marginTop: '12px' }}
      >
        <span className="explore-more-icon-wrap">
          <Sparkles size={13} />
        </span>
        <span className="explore-more-label">
          {expanded ? 'Show Less' : 'Explore More'}
        </span>
        <span className={`explore-chevron ${expanded ? 'rotated' : ''}`}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
    </div>
  );
};

export default IdentityServicesGrid;
