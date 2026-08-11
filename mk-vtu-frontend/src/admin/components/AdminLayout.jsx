import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import PageTransitionMonitor from './PageTransitionMonitor';
import { 
  Server,
  Activity,
  HardDrive,
  LayoutDashboard, 
  Layout,
  Users, 
  History, 
  Settings, 
  TrendingUp, 
  ShieldCheck, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  CreditCard,
  Banknote,
  ImageIcon,
  Globe,
  Smartphone,
  ChevronRight,
  Database,
  Megaphone,
  Sparkles,
  Share2,
  Layers,
  FileText
} from 'lucide-react';
import './AdminLayout.css';

const AdminLayout = ({ children, admin, logout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth <= 1024) setIsSidebarOpen(false);
  }, [location.pathname]);

  const menuGroups = [
    {
      title: 'CORE OPERATIONS',
      items: [
        { name: 'Admin Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'Profit Analytics', path: '/admin/profit', icon: <TrendingUp size={18} /> },
        { name: 'Referral Analytics', path: '/admin/referrals', icon: <Share2 size={18} />, badge: 'NEW' },
        { name: 'Withdrawal Requests', path: '/admin/withdrawals', icon: <Banknote size={18} /> },
        { name: 'Service Requests', path: '/admin/service-requests', icon: <FileText size={18} /> },
        { name: 'Identity Requests', path: '/admin/identity-requests', icon: <ShieldCheck size={18} />, badge: 'NEW' },
        { name: 'Manual Identity Apps', path: '/admin/manual-applications', icon: <FileText size={18} /> },
        { name: 'Global Transactions', path: '/admin/transactions', icon: <History size={18} /> },
      ]
    },
    {
      title: 'PARTNER ECOSYSTEM',
      items: [
        { name: 'Reseller Partners', path: '/admin/resellers', icon: <Globe size={18} />, badge: 'VIP' },
        { name: 'Domain Requests', path: '/admin/domain-requests', icon: <Globe size={18} /> },
        { name: 'Retail Customers', path: '/admin/users/retail', icon: <Users size={18} /> },
        { name: 'Reseller Customers', path: '/admin/users/reseller-customers', icon: <Users size={18} /> },
        { name: 'Identity (KYC) Review', path: '/admin/kyc', icon: <ShieldCheck size={18} /> },
      ]
    },
    {
      title: 'FINANCIAL CONTROL CENTER',
      items: [
        { name: 'Wallet Manager', path: '/admin/resellers/wallets', icon: <Banknote size={18} />, badge: 'NEW' },
        { name: 'Retail Pricing', path: '/admin/pricing/retail', icon: <CreditCard size={18} /> },
        { name: 'Basic Pricing', path: '/admin/pricing/basic', icon: <CreditCard size={18} /> },
        { name: 'VIP Pricing', path: '/admin/pricing/vip', icon: <TrendingUp size={18} /> },
      ]
    },
    {
      title: 'BUILD & INFRASTRUCTURE',
      items: [
        { name: 'Future Platforms', path: '/admin/future-platforms', icon: <Layers size={18} /> },
        { name: 'Service Control', path: '/admin/services', icon: <Settings size={18} /> },
        { name: 'Manage Categories', path: '/admin/data-categories', icon: <Database size={18} /> },
        { name: 'V3 Pricing Rules', path: '/admin/pricing-rules', icon: <CreditCard size={18} /> },
        { name: 'Legacy Data Pricing', path: '/admin/data-pricing', icon: <CreditCard size={18} /> },
        { name: 'Tier Margins', path: '/admin/tier-margins', icon: <CreditCard size={18} /> },
      ]
    },
    {
      title: 'MARKETING CENTER',
      items: [
        { name: 'Marketing Dashboard', path: '/admin/marketing/campaigns', icon: <Megaphone size={18} />, badge: 'V2' }
      ]
    },
    {
      title: 'SYSTEM & MAINTENANCE',
      items: [
        { name: 'Broadcast Center', path: '/admin/notifications', icon: <Bell size={18} /> },
        { name: 'Content Management', path: '/admin/content', icon: <Layout size={18} /> },
        { name: 'News & Blog', path: '/admin/blog', icon: <ImageIcon size={18} /> },
      ]
    }
  ];

  // Dynamically inject Super Admin Control Center if the owner is logged in
  const userEmail = admin?.email || (() => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.email;
    } catch(e) { return null; }
  })();

  if (userEmail === 'unuktar1@gmail.com') {
    menuGroups.push({
      title: 'SUPER ADMIN CONTROL CENTER',
      items: [
        { name: 'Deployment Center', path: '/admin/deployment', icon: <Layout size={18} />, badge: 'ROOT' },
        { name: 'Snapshots', path: '/admin/snapshots', icon: <Database size={18} /> },
        { name: 'Rollback', path: '/admin/rollback', icon: <History size={18} /> },
        { name: 'System Health', path: '/admin/system-health', icon: <Activity size={18} /> },
        { name: 'Infrastructure', path: '/admin/infrastructure', icon: <Server size={18} /> },
        { name: 'Audit Logs', path: '/admin/audit-logs', icon: <History size={18} /> },
        { name: 'Maintenance', path: '/admin/maintenance', icon: <Settings size={18} /> },
        { name: 'AI Assistant Control', path: '/admin/ai-assistant', icon: <Sparkles size={18} /> },
        { name: 'Provider Monitoring', path: '/admin/provider-monitoring', icon: <ShieldCheck size={18} /> },
        { name: 'Master Settings', path: '/admin/master-settings', icon: <Settings size={18} /> },
      ]
    });
  }

  const findCurrentPage = () => {
    for (const group of menuGroups) {
      const item = group.items.find(i => location.pathname.includes(i.path));
      if (item) return item.name;
    }
    return 'Dashboard';
  };

  const currentPageName = findCurrentPage();

  return (
    <div className="admin-container">
      {isSidebarOpen && window.innerWidth <= 1024 && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-area">
            <div className="logo-hex">MK</div>
            <span className="logo-text">ADMIN <span>PRO</span></span>
          </div>
          <button className="sidebar-close-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', display: window.innerWidth <= 1024 ? 'block' : 'none' }} onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="nav-group">
              <h3 className="nav-group-title">{group.title}</h3>
              {group.items.map((item) => (
                <NavLink 
                  key={item.path} 
                  to={item.path} 
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <div className="nav-item-content">
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </NavLink>
              ))}
            </div>
          ))}

        </nav>

        <div className="sidebar-footer">
          <div className="admin-mini-profile">
            <div className="admin-avatar-gradient">{admin?.name?.charAt(0) || 'A'}</div>
            <div className="admin-meta">
              <span className="admin-name">{admin?.name || 'Administrator'}</span>
              <span className="admin-role">Super Admin</span>
            </div>
          </div>
          <button className="modern-logout-btn" onClick={logout} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Modern Main Content Area */}
      <PageTransitionMonitor />
      <main className="admin-main">
        <header className="admin-header-modern">
          <div className="header-left">
            <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={22} />
            </button>
            <div className="breadcrumb">
              <span className="bc-parent" style={{ opacity: 0.5 }}>Admin</span>
              <ChevronRight size={14} style={{ opacity: 0.3 }} />
              <span className="bc-current">{currentPageName}</span>
            </div>
          </div>
          <div className="header-right">
             <div className="system-status-pill">
               <div className="status-dot-pulse"></div>
               <span>Secure Infrastructure</span>
             </div>
             <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }}></div>
             <div className="admin-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <button className="premium-btn" style={{ padding: '8px', background: 'transparent' }}><Bell size={20} /></button>
               <div className="admin-avatar-small">{admin?.name?.charAt(0) || 'A'}</div>
             </div>
          </div>
        </header>

        <section className="admin-content-area custom-scrollbar">
          <div className="content-inner-modern">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminLayout;
