import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Tag, 
  Palette, 
  Globe, 
  Settings, 
  BarChart2, 
  Bell, 
  ShieldCheck, 
  Headphones,
  LogOut,
  ExternalLink,
  Home,
  Smartphone,
  Zap,
  X,
  Lock,
  Gift
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

const ResellerSidebar = ({ user, logout, isOpen, onClose }) => {
    const navigate = useNavigate();

    const menuGroups = [
        {
            label: "Main",
            items: [
                { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} />, path: '/reseller/dashboard' },
                { id: 'customers', label: 'Customers', icon: <Users size={20} />, path: '/reseller/customers' },
                { id: 'transactions', label: 'Transactions', icon: <CreditCard size={20} />, path: '/reseller/transactions' },
            ]
        },
        {
            label: "Management",
            items: [
                { id: 'pricing', label: 'Pricing Rules', icon: <Tag size={20} />, path: '/reseller/pricing', premium: true },
                { id: 'branding', label: 'Site Branding', icon: <Palette size={20} />, path: '/reseller/branding', premium: true },
                { id: 'content', label: 'Banners & Marquee', icon: <Bell size={20} />, path: '/reseller/content', premium: true },
                { id: 'mobile-app', label: 'Mobile App', icon: <Smartphone size={20} />, path: '/website/mobile-app', premium: true },
                { id: 'email-campaign', label: 'Push Notifications', icon: <Bell size={20} />, path: '/reseller/email-campaigns', premium: true },
                { id: 'premium', label: 'Hosting & Maintenance', icon: <Zap size={20} />, path: '/website/premium' },
                { id: 'platforms', label: 'Website Addons', icon: <LayoutDashboard size={20} />, path: '/reseller/platforms' },
                { id: 'settings', label: 'Website Settings', icon: <Settings size={20} />, path: '/reseller/settings' },
                { id: 'domain', label: 'Domain Management', icon: <Globe size={20} />, path: '/reseller/domain', premium: true },
            ]
        },
        {
            label: "Financials",
            items: [
                { id: 'wallet', label: 'Wallet & Profit', icon: <BarChart2 size={20} />, path: '/reseller/wallet' },
                { id: 'analytics', label: 'Website Analytics', icon: <BarChart2 size={20} />, path: '/reseller/analytics' }
            ]
        },
        {
            label: "System",
            items: [
                { id: 'notifications', label: 'Notifications', icon: <Bell size={20} />, path: '/reseller/notifications' },
                { id: 'security', label: 'Security', icon: <ShieldCheck size={20} />, path: '/reseller/security' },
                { id: 'support', label: 'Support', icon: <Headphones size={20} />, path: '/reseller/support' },
                { id: 'app', label: 'Back to App', icon: <Home size={20} />, path: '/home' },
            ]
        }
    ];

    return (
        <aside className={`reseller-sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-logo">
                <div style={{ width: '32px', height: '32px', background: 'var(--reseller-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <ShieldCheck size={20} />
                </div>
                <h2>WEBSITE ADMIN</h2>
                <button className="res-sidebar-close-btn" onClick={onClose}>
                    <X size={24} />
                </button>
            </div>

            <nav className="sidebar-nav">
                {menuGroups.map((group, idx) => (
                    <div key={idx} className="res-nav-group">
                        <div className="res-nav-label">{group.label}</div>
                        {group.items.map(item => {
                            const isLocked = item.premium && user?.resellerTier !== 'premium';
                            return (
                                <NavLink 
                                    key={item.id} 
                                    to={isLocked ? '/website/premium' : item.path.replace('/reseller', '/website')} 
                                    className={({ isActive }) => `res-nav-item ${isActive ? 'active' : ''} ${isLocked ? 'locked-item' : ''}`}
                                    onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                    {isLocked && <Lock size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
                
                <div className="res-nav-group" style={{ marginTop: 'auto' }}>
                    <a href="https://9jasub.com" target="_blank" rel="noopener noreferrer" className="res-nav-item">
                        <ExternalLink size={20} />
                        <span>Visit Main Site</span>
                    </a>
                </div>
            </nav>

            <div className="sidebar-footer">
                <div className="res-user-profile">
                    <div className="res-avatar">
                        {user?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="user-info-text">
                        <h4>{user?.name || 'Owner'}</h4>
                        <p>{user?.role === 'reseller_admin' ? 'Website Owner' : 'Manager'}</p>
                    </div>
                    <button onClick={logout} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--reseller-danger)', cursor: 'pointer' }}>
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default ResellerSidebar;
