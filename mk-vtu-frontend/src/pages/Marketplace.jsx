import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { ArrowLeft, Search, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Home.css'; // Reuse existing styles for cards

const Marketplace = ({ user, siteInfo }) => {
  const navigate = useNavigate();
  const { isLightMode } = useTheme();
  
  const [platforms, setPlatforms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlatforms();
  }, [siteInfo]);

  const fetchPlatforms = () => {
    setIsLoading(true);
    API.get('/api/content/future-platforms')
      .then(res => {
        const allPlatforms = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        let enabledPlatforms = [];
        
        if (siteInfo?.reseller) {
          const enabledIds = siteInfo.reseller.enabledFuturePlatforms || [];
          enabledPlatforms = allPlatforms.filter(p => enabledIds.includes(p._id));
        } else {
          enabledPlatforms = allPlatforms;
        }
        
        setPlatforms(enabledPlatforms);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Marketplace fetch failed:", err);
        setIsLoading(false);
      });
  };

  const handlePlatformClick = (platform) => {
    console.log({ 
      name: platform.displayName, 
      logoUrl: platform.logoUrl, 
      targetUrl: platform.targetUrl,
      platformType: platform.platformType
    });
    
    if (platform.targetUrl) {
      if (platform.platformType === 'external') {
        window.open(platform.targetUrl, '_blank');
      } else {
        navigate('/app-viewer/' + platform._id);
      }
    }
  };

  const filteredPlatforms = platforms.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.displayName && p.displayName.toLowerCase().includes(term)) ||
      (p.name && p.name.toLowerCase().includes(term))
    );
  });

  return (
    <div className={`fintech-app-container ${isLightMode ? 'fintech-light-mode' : ''}`}>
      <div className="fintech-dashboard-container">
        
        {/* Header */}
        <div className="fintech-sticky-dashboard-zone">
          <div className="fintech-header" style={{ padding: '16px 0', marginBottom: '8px' }}>
            <div className="fintech-brand" onClick={() => navigate(-1)}>
              <ArrowLeft size={24} color="var(--app-text-main)" />
              <div className="fintech-brand-name">Apps & Services</div>
            </div>
          </div>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--app-text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search apps..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                borderRadius: '16px',
                border: '1px solid var(--app-border)',
                background: 'var(--app-surface)',
                color: 'var(--app-text-main)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 24px', width: '100%' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--app-text-muted)' }}>
              Loading apps...
            </div>
          ) : filteredPlatforms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--app-text-muted)', background: 'var(--app-surface)', borderRadius: '16px', border: '1px solid var(--app-border)' }}>
              {searchTerm ? "No apps match your search." : "No apps available at the moment."}
            </div>
          ) : (
            <div className="fintech-services-grid animate-fade-in">
              {filteredPlatforms.map(platform => (
                <div key={platform._id} className="fintech-service-card srv-blue" onClick={() => handlePlatformClick(platform)} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    padding: 0,
                    overflow: 'hidden',
                    height: 'auto',
                    aspectRatio: '1 / 1',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: 0,
                    minWidth: 0
                  }}>
                    {platform.logoUrl ? (
                        <img src={platform.logoUrl} alt={platform.displayName} 
                          style={{ 
                            width: '100%', 
                            height: '60%', 
                            objectFit: 'cover', 
                            borderRadius: '12px 12px 0 0',
                            display: 'block'
                          }} />
                    ) : (
                        <div style={{ width: '100%', height: '60%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px 12px 0 0' }}>
                            <Zap size={24} color="#38bdf8" />
                        </div>
                    )}
                    <div style={{ 
                      flex: 1,
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: '0 4px',
                      width: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box'
                    }}>
                        <div style={{ 
                          fontSize: '11px', 
                          fontWeight: '600', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          width: '100%', 
                          textAlign: 'center',
                          color: 'var(--app-text-main)',
                          lineHeight: '1.2'
                        }}>{platform.displayName}</div>
                        <div style={{ 
                          fontSize: '9px', 
                          color: 'var(--text-muted)', 
                          marginTop: '2px',
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          width: '100%', 
                          textAlign: 'center',
                          lineHeight: '1.2'
                        }}>{platform.name}</div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
