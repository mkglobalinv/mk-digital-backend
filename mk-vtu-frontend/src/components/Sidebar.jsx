import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
    Home, 
    Wallet, 
    LayoutGrid, 
    User, 
    Headphones, 
    Settings, 
    LogOut,
    ShieldCheck,
    Terminal,
    Globe,
    Smartphone,
    Wifi,
    Zap,
    History,
    Users
} from 'lucide-react';
import './Sidebar.css';
import BrandLogo from './BrandLogo';

const Sidebar = ({ user, logout, siteInfo }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { name: 'Dashboard', path: '/home', icon: <Home size={20} /> },
        { name: 'Buy Data', path: '/purchase/data', icon: <Wifi size={20} /> },
        { name: 'Airtime', path: '/purchase/airtime', icon: <Smartphone size={20} /> },
        { name: 'Electricity', path: '/purchase/electricity', icon: <Zap size={20} /> },
        { name: 'Cable TV', path: '/purchase/cable', icon: <LayoutGrid size={20} /> },
        { name: 'My Wallet', path: '/wallet', icon: <Wallet size={20} /> },
        { name: 'Transactions', path: '/transactions', icon: <History size={20} /> },
        ...(user?.apiKey || user?.apiLevel !== 'normal' || user?.apiSubscriptionTier === 'pro' || user?.apiSubscriptionTier === 'enterprise'
            ? [{ name: 'Developer API', path: '/developer', icon: <Terminal size={20} /> }] 
            : []),
        { name: 'Offline Data', path: '/offline-data', icon: <Wifi size={20} /> },
        { name: 'Referral Center', path: '/referrals', icon: <Users size={20} /> },
        { name: 'Profile', path: '/profile', icon: <User size={20} /> },
    ];

    // Admin/Reseller Specific Links
    const isAdmin = user?.role === 'admin';
    const isReseller = user?.role === 'reseller_admin';

    return (
        <aside className="desktop-sidebar">
            <div className="sidebar-header" style={{ gap: '10px' }}>
                <BrandLogo siteInfo={siteInfo} />
                <span style={{ fontSize: '16.5px', fontWeight: 900, color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {siteInfo?.branding?.siteName || "9JASUB"}
                </span>
            </div>

            <div className="sidebar-search">
                <input type="text" placeholder="Search services..." />
            </div>

            <nav className="sidebar-nav">
                <div className="nav-group">
                    <span className="group-label">Main Menu</span>
                    {menuItems.map(item => (
                        <NavLink 
                            key={item.path} 
                            to={item.path} 
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </div>

                {/* System Management (Admin Only) */}
                {isAdmin && (
                    <div className="nav-group">
                        <span className="group-label">System Administration</span>
                        <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <ShieldCheck size={20} />
                            <span>Super Admin Panel</span>
                        </NavLink>
                    </div>
                )}

                {/* Reseller Console (Owner Only) */}
                {isReseller && (
                    <div className="nav-group">
                        <span className="group-label">Business Control</span>
                        <NavLink to="/reseller" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <Globe size={20} />
                            <span>Reseller Dashboard</span>
                        </NavLink>
                    </div>
                )}

                {/* Reseller Upgrade (Only for Main App Customers - Isolated) */}
                {!isAdmin && !isReseller && !siteInfo && (
                    <div className="nav-group">
                        <span className="group-label">Opportunities</span>
                        <NavLink to="/reseller/onboarding" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <Globe size={20} />
                            <span>Become a Reseller</span>
                        </NavLink>
                    </div>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="user-avatar">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">{user?.role?.replace('_', ' ')}</span>
                        {user && (
                            <div 
                                onClick={() => navigate('/verify-email', { state: { email: user.email } })}
                                style={{
                                    fontSize: '11px',
                                    marginTop: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    color: user.isEmailVerified ? '#10b981' : '#ef4444',
                                    background: user.isEmailVerified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    display: 'inline-block',
                                    border: user.isEmailVerified ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                                }}
                            >
                                {user.isEmailVerified ? '🟢 Email Verified' : '🔴 Email Not Verified'}
                            </div>
                        )}
                    </div>
                </div>
                <button className="sidebar-logout" onClick={logout}>
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
