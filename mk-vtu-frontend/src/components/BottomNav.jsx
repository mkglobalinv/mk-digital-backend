import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Wallet, LayoutGrid, User, Headphones } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
  return (
    <nav className="bottom-nav">
      <NavLink to="/home" className={({ isActive }) => `nav-item nav-home ${isActive ? 'active' : ''}`}>
        <Home size={16} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/wallet" className={({ isActive }) => `nav-item nav-wallet ${isActive ? 'active' : ''}`}>
        <Wallet size={16} />
        <span>Wallet</span>
      </NavLink>
      <NavLink to="/services" className={({ isActive }) => `nav-item nav-services ${isActive ? 'active' : ''}`}>
        <LayoutGrid size={16} />
        <span>Services</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-item nav-profile ${isActive ? 'active' : ''}`}>
        <User size={16} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
