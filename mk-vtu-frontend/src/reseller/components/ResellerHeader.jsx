import React from 'react';
import { Globe, Bell, User, Search, CheckCircle, Menu, ShieldCheck } from 'lucide-react';

const ResellerHeader = ({ user, siteInfo, onToggleSidebar }) => {
    return (
        <header className="reseller-header-new">
            <button className="mobile-menu-btn" onClick={onToggleSidebar}>
                <Menu size={24} />
            </button>
            <div className="header-brand-info">
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {user?.branding?.logo ? (
                        <img src={user.branding.logo} alt="Brand" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <Globe size={24} color="var(--reseller-primary)" />
                    )}
                </div>
                <div className="brand-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="brand-name" style={{ fontSize: '20px', letterSpacing: '-0.3px' }}>{user?.branding?.siteName || 'My VTU Brand'}</span>
                        <ShieldCheck size={18} color="#10b981" />
                    </div>
                    <span className="brand-domain" style={{ fontSize: '13.5px', marginTop: '2px' }}>
                        <div className="status-indicator"></div>
                        {user?.subdomain ? `${user.subdomain}.9jasub.com` : 'No subdomain set'}
                        {user?.customDomain && ` / ${user.customDomain}`}
                    </span>
                </div>
            </div>

            <div className="header-search-container" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 40px' }}>
                <div style={{ width: '100%', maxWidth: '450px', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                        type="text" 
                        placeholder="Search customers, transactions..." 
                        style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: '12px', border: '1px solid rgba(226,232,240,0.8)', background: '#f8fafc', fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' }}
                        onFocus={(e) => { e.target.style.borderColor = 'var(--reseller-primary)'; e.target.style.background = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(226,232,240,0.8)'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.01)'; }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ position: 'relative', cursor: 'pointer', padding: '8px', background: '#f8fafc', borderRadius: '10px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}>
                    <Bell size={20} color="#64748b" />
                    <div style={{ position: 'absolute', top: '6px', right: '8px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid #f8fafc' }}></div>
                </div>
                <div style={{ width: '1px', height: '32px', background: 'rgba(226,232,240,0.8)' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '4px 8px', borderRadius: '12px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{user?.name?.split(' ')[0] || 'User'}</span>
                        <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--reseller-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Platform Owner</span>
                    </div>
                    <div className="res-user-profile">
                        <div className="res-avatar" style={{ width: '38px', height: '38px', fontSize: '16px', boxShadow: '0 4px 10px rgba(99,102,241,0.2)' }}>
                             {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default ResellerHeader;
