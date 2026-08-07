import React from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './FintechComponents.css';

const FintechHeader = ({ user, greeting: propGreeting, unreadCount = 0 }) => {
  const navigate = useNavigate();

  const greeting = propGreeting || (() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning ☀️";
    if (hr < 17) return "Good Afternoon 🌤️";
    return "Good Evening 🌙";
  })();

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="fintech-top-nav">
      <div className="nav-profile-group" onClick={() => navigate('/profile')}>
        <div className="nav-avatar">{getUserInitials()}</div>
        <div className="nav-greeting">
          <span className="greeting-text">{greeting},</span>
          <span className="user-name">{user?.name?.split(' ')[0] || user?.username || 'Member'}</span>
        </div>
      </div>
      <div className="nav-actions">
        <button className="icon-btn" onClick={() => navigate('/notifications')}>
          <Bell size={16} />
          {unreadCount > 0 && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>
      </div>
    </header>
  );
};

export default FintechHeader;
