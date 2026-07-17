import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, ExternalLink, X, AlertTriangle } from 'lucide-react';

const FuturePlatformViewer = ({ platform, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // URL Sanitization
  const getSanitizedUrl = (url) => {
    if (!url) return '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const sanitizedUrl = getSanitizedUrl(platform?.url);

  // Error Timeout Fallback
  useEffect(() => {
    if (!platform || platform.mode === 'external') return;

    setLoading(true);
    setHasError(false);

    const timeout = setTimeout(() => {
      setLoading((prevLoading) => {
        if (prevLoading) {
          setHasError(true);
          return false;
        }
        return prevLoading;
      });
    }, 10000); // 10s timeout

    return () => clearTimeout(timeout);
  }, [platform]);

  if (!platform) return null;

  if (platform.mode === 'external') {
    window.open(sanitizedUrl, '_blank');
    onClose();
    return null;
  }

  const handleRefresh = () => {
    setLoading(true);
    setHasError(false);
    const iframe = document.getElementById('platform-iframe');
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#0f172a', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      {/* Top Action Bar */}
      <div style={{ 
        padding: '16px 24px', 
        backgroundColor: '#1e293b', 
        borderBottom: '1px solid #334155', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
            <ArrowLeft size={20} /> <span className="hidden sm:inline">Back to Dashboard</span>
          </button>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
            {platform.displayName}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleRefresh} 
            style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={18} /> <span className="hidden sm:inline">Refresh</span>
          </button>
          
          <button 
            onClick={() => window.open(sanitizedUrl, '_blank')} 
            style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ExternalLink size={18} /> <span className="hidden sm:inline">Open in Browser</span>
          </button>
          
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: 'auto' }}>
            <X size={24} />
          </button>
        </div>
      </div>

      {/* WebView Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && !hasError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', backgroundColor: '#0f172a', zIndex: 10 }}>
            <RefreshCw size={32} className="animate-spin" />
            <span style={{ marginLeft: '12px', fontSize: '16px', fontWeight: '500' }}>Loading {platform.displayName}...</span>
          </div>
        )}

        {hasError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ef4444', backgroundColor: '#0f172a', padding: '24px', textAlign: 'center', zIndex: 10 }}>
            <AlertTriangle size={48} style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '8px' }}>Connection Timeout</h3>
            <p style={{ color: '#94a3b8', maxWidth: '400px', marginBottom: '24px', lineHeight: '1.5' }}>
              The platform took too long to load or refused to connect. It might block being embedded securely inside another dashboard.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button 
                onClick={() => window.open(sanitizedUrl, '_blank')}
                style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <ExternalLink size={18} /> Open in Browser
              </button>
              <button 
                onClick={handleRefresh}
                style={{ padding: '10px 20px', backgroundColor: 'transparent', color: '#38bdf8', border: '1px solid #38bdf8', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <RefreshCw size={18} /> Retry
              </button>
              <button 
                onClick={onClose}
                style={{ padding: '10px 20px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <ArrowLeft size={18} /> Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {!hasError && (
          <iframe
            id="platform-iframe"
            src={sanitizedUrl}
            title={platform.displayName}
            style={{ width: '100%', height: '100%', border: 'none', opacity: loading ? 0 : 1, transition: 'opacity 0.3s ease-in-out' }}
            onLoad={() => {
              setLoading(false);
              setHasError(false);
            }}
            onError={() => {
              setLoading(false);
              setHasError(true);
            }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}
      </div>
    </div>
  );
};

export default FuturePlatformViewer;
