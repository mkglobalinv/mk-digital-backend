import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, AlertOctagon, X } from 'lucide-react';
import API from '../../api';
import './AnnouncementBanner.css';

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [visibleIndexes, setVisibleIndexes] = useState(new Set());

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await API.get('/api/marketing/announcements/active');
        if (res.data && res.data.length > 0) {
          setAnnouncements(res.data);
          setVisibleIndexes(new Set(res.data.map((_, i) => i)));

          // Log views for active announcements
          res.data.forEach(ann => {
             API.post('/api/marketing/analytics/view', { announcementId: ann._id }).catch(console.error);
          });
        }
      } catch (err) {
        console.error('Failed to load announcements', err);
      }
    };
    fetchAnnouncements();
  }, []);

  const dismiss = (index) => {
    setVisibleIndexes(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  if (announcements.length === 0 || visibleIndexes.size === 0) return null;

  return (
    <div className="announcement-banner-container">
      {announcements.map((ann, index) => {
        if (!visibleIndexes.has(index)) return null;

        let icon = <Info size={18} />;
        let bannerClass = "ann-banner-info";

        if (ann.priority === 'Warning') {
          icon = <AlertTriangle size={18} />;
          bannerClass = "ann-banner-warning";
        } else if (ann.priority === 'Critical') {
          icon = <AlertOctagon size={18} />;
          bannerClass = "ann-banner-critical";
        }

        return (
          <div key={ann._id} className={`announcement-banner ${bannerClass}`}>
            <div className="ann-banner-icon">{icon}</div>
            <div className="ann-banner-content">
              <strong>{ann.title}</strong>
              <span className="ann-banner-text">{ann.content}</span>
            </div>
            <button className="ann-banner-close" onClick={() => dismiss(index)}>
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AnnouncementBanner;
