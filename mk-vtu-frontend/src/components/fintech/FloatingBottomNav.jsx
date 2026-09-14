import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Wallet, LayoutGrid, User, Briefcase } from 'lucide-react';
import './FintechComponents.css';

const FloatingBottomNav = ({ isReseller = false, isMerchant = false }) => {
  return (
    <nav className="fintech-floating-nav">
      <div className="fintech-nav-glass">
        <NavLink
          to={isMerchant ? '/merchant/dashboard' : (isReseller ? '/reseller/dashboard' : '/home')}
          className={({ isActive }) => `fintech-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-icon"><Home size={22} /></div>
          <span>{isMerchant ? 'Dashboard' : 'Home'}</span>
        </NavLink>

        <NavLink
          to={isMerchant ? '/merchant/fund' : (isReseller ? '/reseller/wallet' : '/wallet')}
          className={({ isActive }) => `fintech-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-icon"><Wallet size={22} /></div>
          <span>Wallet</span>
        </NavLink>

        <NavLink
          to={isMerchant ? '/merchant/services' : (isReseller ? '/reseller/customers' : '/services')}
          className={({ isActive }) => `fintech-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-icon">{isReseller ? <Briefcase size={22} /> : <LayoutGrid size={22} />}</div>
          <span>{isReseller ? 'Business' : 'Services'}</span>
        </NavLink>

        <NavLink
          to={isMerchant ? '/merchant/profile' : (isReseller ? '/reseller/settings' : '/profile')}
          className={({ isActive }) => `fintech-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-icon"><User size={22} /></div>
          <span>Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default FloatingBottomNav;
