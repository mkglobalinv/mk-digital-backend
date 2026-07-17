import React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowLeftRight, CreditCard, Smartphone, Zap, Gift, Tv, GraduationCap, Server, FileText } from 'lucide-react';
import './FeatureGrid.css';

const features = [
  { id: 'data', name: 'Data Bundle', icon: <ArrowLeftRight size={24} />, route: '/data' },
  { id: 'recharge', name: 'Recharge2Cash', icon: <CreditCard size={24} />, route: '/recharge' },
  { id: 'airtime', name: 'Airtime', icon: <Smartphone size={24} />, route: '/buy-airtime' },
  { id: 'electricity', name: 'Electricity', icon: <Zap size={24} />, route: '/electricity' },
  { id: 'refer', name: 'Refer & Earn', icon: <Gift size={24} />, route: '/refer' },
  { id: 'cable', name: 'Cable', icon: <Tv size={24} />, route: '/cable' },
  { id: 'exam', name: 'Exam', icon: <GraduationCap size={24} />, route: '/exam' },
  { id: 'datacard', name: 'Data Card', icon: <Server size={24} />, route: '/datacard' },
  { id: 'rechargecard', name: 'Recharge Card', icon: <FileText size={24} />, route: '/rechargecard' },
];

const FeatureGrid = () => {
  return (
    <div className="feature-grid">
      {features.map((feature) => (
        <NavLink to={feature.route} key={feature.id} className="feature-item">
          <div className="feature-icon">
            <div className="feature-icon-inner">
               {feature.icon}
            </div>
          </div>
          <span className="feature-name">{feature.name}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default FeatureGrid;
