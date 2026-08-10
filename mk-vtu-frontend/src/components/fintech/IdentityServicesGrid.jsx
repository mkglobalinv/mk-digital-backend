import React, { useState } from 'react';
import {
  Fingerprint, ShieldCheck, Phone, MapPin,
  Users, Edit3, BookOpen, ChevronDown, ChevronUp, Sparkles, X
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
  const [showNinModifyModal, setShowNinModifyModal] = useState(false);

  /**
   * Navigate to /identity/:serviceId (retail) or /reseller/identity/:serviceId.
   * IdentityPurchase.jsx reads the serviceId URL param and fetches the full
   * service object from GET /api/retail/identity/service/:serviceId — no
   * data is passed via state.
   */
  const handleClick = (api_plan_id) => {
    if (api_plan_id === 'nin-phone') {
      setShowNinModifyModal(true);
      return;
    }
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

      {showNinModifyModal && (
        <div className="modal-overlay-modern" onClick={() => setShowNinModifyModal(false)}>
          <div className="modal-content-modern animate-scale-in" onClick={e => e.stopPropagation()} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>Select Modification Type</h2>
              <button className="icon-btn" onClick={() => setShowNinModifyModal(false)}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: 'var(--text-gray)', fontSize: '14px', marginBottom: '20px' }}>
              Choose the type of update you need on your NIN
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { title: 'Name Modification', desc: 'Correct or change name on NIN records', price: '₦6500' },
                { title: 'Date of Birth Modification', desc: 'Correct date of birth on NIN records', price: '₦37500' },
                { title: 'Phone Number Modification', desc: 'Update registered phone number', price: '₦6500' },
                { title: 'Address Modification', desc: 'Update residential address on NIN', price: '₦6500' },
                { title: 'State & LGA Modification', desc: 'Update state of origin, state of residence & local government areas', price: '₦9500' },
              ].map(opt => (
                <button
                  key={opt.title}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                    borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  onClick={() => {
                    const msg = encodeURIComponent(`Hello, I want to request for ${opt.title} (${opt.desc}) for ${opt.price}.`);
                    window.open(`https://wa.me/2347081385387?text=${msg}`, '_blank');
                  }}
                >
                  <div style={{ paddingRight: '10px' }}>
                    <div style={{ fontWeight: '800', color: 'var(--text-dark)', fontSize: '15px', marginBottom: '4px' }}>{opt.title}</div>
                    <div style={{ color: 'var(--text-gray)', fontSize: '12px' }}>{opt.desc}</div>
                  </div>
                  <div style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '16px', whiteSpace: 'nowrap' }}>
                    {opt.price}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdentityServicesGrid;

