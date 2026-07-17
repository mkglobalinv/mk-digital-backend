import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, Terminal, CloudLightning, ShieldAlert, FileText, LogOut } from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [branding, setBranding] = React.useState(null);

  React.useEffect(() => {
      const stored = sessionStorage.getItem('tenantBranding');
      if (stored) {
          try { setBranding(JSON.parse(stored)); } catch(e){}
      }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  // If this is a reseller's admin portal, we might hide some super-admin-only routes
  // For Phase 11, we assume all routes shown are protected by backend scopes anyway,
  // but let's keep it simple.

  const navItems = [
    { path: '/', label: 'System Health', icon: LayoutDashboard },
    { path: '/monitoring', label: 'Monitoring', icon: Activity },
    { path: '/logs', label: 'Activity Logs', icon: Terminal },
    { path: '/emergency', label: 'Emergency Actions', icon: ShieldAlert },
    { path: '/emergency-data', label: 'Emergency SMS Data', icon: ShieldAlert },
    { path: '/gateways', label: 'Payment Gateways', icon: CloudLightning },
    { path: '/platforms', label: 'Future Platforms', icon: FileText },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', backgroundColor: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #334155' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--primary-color, #38bdf8)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {branding?.logo ? (
                <img src={branding.logo} alt="Logo" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
            ) : (
                <Activity size={24} /> 
            )}
            {branding?.siteName || 'MKOps Center'}
          </h1>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              {branding ? 'Website Admin Portal' : 'Super Admin Management'}
          </div>
        </div>
        
        <nav style={{ flex: 1, padding: '16px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                      textDecoration: 'none', borderRadius: '8px',
                      backgroundColor: isActive ? 'color-mix(in srgb, var(--primary-color, #38bdf8) 20%, transparent)' : 'transparent',
                      color: isActive ? 'var(--primary-color, #38bdf8)' : '#94a3b8',
                      fontWeight: isActive ? '600' : '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid #334155' }}>
          <button 
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
              backgroundColor: 'transparent', border: '1px solid #ef444450', borderRadius: '8px',
              color: '#ef4444', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s'
            }}
          >
            <LogOut size={20} />
            Logout Securely
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
