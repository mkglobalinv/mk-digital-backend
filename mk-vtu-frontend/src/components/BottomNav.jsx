import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Wallet, AppWindow, User } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
  return (
    <nav className="bottom-nav">
      <NavLink to="/home" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <div className="nav-icon-container">
          <Home size={22} />
        </div>
        <span>Home</span>
      </NavLink>
      <NavLink to="/wallet" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <div className="nav-icon-container">
          <Wallet size={22} />
        </div>
        <span>Wallet</span>
      </NavLink>
      <NavLink to="/services" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <div className="nav-icon-container">
          <AppWindow size={22} />
        </div>
        <span>Services</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <div className="nav-icon-container">
          <User size={22} />
        </div>
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
