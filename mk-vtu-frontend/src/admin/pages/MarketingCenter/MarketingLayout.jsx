import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Megaphone, LayoutGrid, BarChart2, Settings, FileText, Share2, Image, Radio } from 'lucide-react';
import './MarketingLayout.css';

const MarketingLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="marketing-center-layout">
      <div className="marketing-center-header">
        <div className="marketing-title-area">
          <Megaphone size={28} className="marketing-main-icon" />
          <div>
            <h2>Marketing Center</h2>
            <p>Manage campaigns, announcements, and track user engagement.</p>
          </div>
        </div>
      </div>

      <div className="marketing-container">
        <div className="marketing-sidebar">
          <div className="sidebar-section">
            <h4 className="sidebar-section-title">ACTIVE MODULES</h4>
            <NavLink to="/admin/marketing/campaigns" className={({isActive}) => `marketing-nav-link ${isActive ? 'active' : ''}`}>
              <LayoutGrid size={18} />
              <span>Campaigns</span>
            </NavLink>
            <NavLink to="/admin/marketing/announcements" className={({isActive}) => `marketing-nav-link ${isActive ? 'active' : ''}`}>
              <Radio size={18} />
              <span>Announcements</span>
            </NavLink>
            <NavLink to="/admin/marketing/analytics" className={({isActive}) => `marketing-nav-link ${isActive ? 'active' : ''}`}>
              <BarChart2 size={18} />
              <span>Analytics</span>
            </NavLink>
            <NavLink to="/admin/marketing/settings" className={({isActive}) => `marketing-nav-link ${isActive ? 'active' : ''}`}>
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
          </div>

          <div className="sidebar-section">
            <h4 className="sidebar-section-title">FUTURE / RESERVED</h4>
            <div className="marketing-nav-link disabled" title="Coming soon">
              <FileText size={18} />
              <span>Blog Posts</span>
              <span className="badge">Soon</span>
            </div>
            <div className="marketing-nav-link disabled" title="Coming soon">
              <Share2 size={18} />
              <span>Referrals</span>
              <span className="badge">Soon</span>
            </div>
            <div className="marketing-nav-link disabled" title="Coming soon">
              <Megaphone size={18} />
              <span>Advertisements</span>
              <span className="badge">Soon</span>
            </div>
            <div className="marketing-nav-link disabled" title="Coming soon">
              <Image size={18} />
              <span>Media Library</span>
              <span className="badge">Soon</span>
            </div>
          </div>
        </div>

        <div className="marketing-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MarketingLayout;
