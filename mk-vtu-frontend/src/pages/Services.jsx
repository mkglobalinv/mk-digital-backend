import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, Smartphone, Zap, GraduationCap, PlaySquare, FileText, SmartphoneIcon, Globe } from 'lucide-react';
import './Services.css';

const Services = () => {
  const navigate = useNavigate();

  const serviceCategories = [
    {
      title: "Telecom Services",
      items: [
        { id: 'data', name: 'Buy Data', icon: <Wifi />, color: '#3B82F6', desc: 'SME, CG & Gifting' },
        { id: 'airtime', name: 'Airtime', icon: <Smartphone />, color: '#10B981', desc: 'Instant Top-up' },
        { id: 'epin', name: 'Airtime PIN', icon: <SmartphoneIcon />, color: '#F59E0B', desc: 'Recharge Printing' },
      ]
    },
    {
      title: "Utilities & Bills",
      items: [
        { id: 'electricity', name: 'Electricity', icon: <Zap />, color: '#F59E0B', desc: 'Pay Utility Bills' },
        { id: 'cable', name: 'Cable TV', icon: <PlaySquare />, color: '#EF4444', desc: 'DSTV, GOTV, StarTimes' },
      ]
    },
    {
      title: "Education & Others",
      items: [
        { id: 'education', name: 'Education', icon: <GraduationCap />, color: '#8B5CF6', desc: 'WAEC, NECO, JAMB' },
        { id: 'history', name: 'Transactions', icon: <FileText />, color: '#64748B', desc: 'View Sales History' },
        { id: 'website', name: 'Our Website', icon: <Globe />, color: '#14B8A6', desc: 'Official Portal' },
      ]
    }
  ];

  const handleServiceClick = (id) => {
    if (id === 'website') {
      window.open('https://9jasub.com', '_blank');
      return;
    }
    if (['data', 'airtime', 'electricity', 'cable', 'epin', 'education'].includes(id)) {
      navigate('/purchase', { state: { defaultTab: id } });
    } else if (id === 'history') {
       navigate('/profile');
    } else {
      alert("Feature coming soon!");
    }
  };

  return (
    <div className="page-container services-page premium-theme">
      <div className="services-header">
        <h2>All Services</h2>
        <p>Select a service to get started</p>
      </div>

      <div className="services-content">
        {serviceCategories.map((cat, idx) => (
          <div key={idx} className="service-section">
            <h3 className="section-title">{cat.title}</h3>
            <div className="service-grid">
              {cat.items.map((item) => (
                <div key={item.id} className="service-card" onClick={() => handleServiceClick(item.id)}>
                  <div className="service-icon" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="service-info">
                    <h4>{item.name}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {/* Official Portal Button */}
        <div style={{ marginTop: '40px', paddingBottom: '40px' }}>
          <button 
            onClick={() => window.open('https://9jasub.com', '_blank')}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid var(--primary)',
              background: 'rgba(59, 130, 246, 0.05)',
              color: 'var(--primary)',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <Globe size={20} />
            Visit Official Portal
          </button>
        </div>
      </div>
    </div>
  );
};

export default Services;
