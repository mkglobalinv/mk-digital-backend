import React, { useState, useEffect } from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const Notifications = ({ token }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  const [error, setError] = useState(null);

  const fetchNotifications = () => {
    setError(null);
    API.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setNotifications(res.data);
        setLoading(false);
        // Automatically mark all as read when opening the page
        if (res.data.some(n => !n.isRead)) {
            API.post('/api/notifications/mark-all-read', {}, { headers: { Authorization: `Bearer ${token}` } })
               .catch(err => console.error("Failed to mark all read", err));
        }
      })
      .catch(err => {
        console.error("Fetch Notifications Error:", err);
        setError("Failed to load notifications. Please check your connection.");
        setLoading(false);
      });
  };

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={20} color="#f59e0b" />;
      case 'success': return <CheckCircle size={20} color="#10b981" />;
      case 'transaction': return <Info size={20} color="#3b82f6" />;
      default: return <Bell size={20} color="#64748b" />;
    }
  };

  return (
    <div className="page-container premium-theme">
      <div className="home-top-bar" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
         <div className="logo-container" onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>
            <ArrowLeft size={24} />
            <span className="logo-text">Notifications</span>
         </div>
      </div>

      <div className="home-content" style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading notifications...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
             <AlertTriangle size={64} color="#fee2e2" style={{ marginBottom: '20px' }} />
             <h3 style={{ color: '#ef4444', marginBottom: '10px' }}>{error}</h3>
             <button onClick={fetchNotifications} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', marginTop: '10px' }}>Try Again</button>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
             <Bell size={64} color="#e2e8f0" style={{ marginBottom: '20px' }} />
             <h3 style={{ color: '#1e293b', marginBottom: '10px' }}>No Notifications Yet</h3>
             <p style={{ color: '#64748b' }}>We'll notify you here when there's an update on your account or services.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notifications.map((notif, idx) => (
              <div 
                key={notif._id || idx} 
                style={{ 
                  background: 'var(--card-bg)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '16px', 
                  padding: '16px',
                  display: 'flex',
                  gap: '16px',
                  position: 'relative',
                  animation: 'fadeInUp 0.4s ease forwards',
                  animationDelay: `${idx * 0.05}s`
                }}
              >
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '12px', 
                  background: 'rgba(0,0,0,0.03)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {getIcon(notif.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontSize: '16.5px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-color)' }}>{notif.title}</h4>
                    {!notif.isRead && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div>}
                  </div>
                  <p style={{ fontSize: '14.3px', color: '#64748b', lineHeight: '1.5' }}>{notif.message}</p>
                  <span style={{ fontSize: '12.1px', color: '#94a3b8', marginTop: '8px', display: 'block' }}>
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>
                {notif.type === 'system' && (
                  <span style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    right: '12px', 
                    fontSize: '9.9px', 
                    fontWeight: '800', 
                    background: 'rgba(59, 130, 246, 0.1)', 
                    color: '#3b82f6', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}>SYSTEM</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
