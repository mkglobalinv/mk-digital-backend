import React from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Wifi, Smartphone, Tv, Zap, RefreshCw, LayoutGrid, FileText, Share2, LogOut, Settings, CreditCard, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './FintechComponents.css';

const BottomSheet = ({ show, onClose, user, logout, isReseller = false }) => {
  const navigate = useNavigate();

  if (!show) return null;

  return (
    <>
      <div className="fintech-modal-overlay" onClick={onClose}></div>
      <div className={`fintech-bottom-sheet ${show ? 'open' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-header">
          <h3>More Options</h3>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="sheet-content">
          <div className="sheet-grid">
            <div className="sheet-item" onClick={() => { navigate(isReseller ? '/reseller/wallet' : '/wallet'); onClose(); }}>
              <div className="sheet-icon" style={{ color: '#10B981', background: 'rgba(16, 185, 129, 0.1)' }}><ArrowDownLeft size={24} /></div>
              <span>Fund Wallet</span>
            </div>
            <div className="sheet-item" onClick={() => { navigate(isReseller ? '/reseller/wallet' : '/wallet'); onClose(); }}>
              <div className="sheet-icon" style={{ color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)' }}><ArrowUpRight size={24} /></div>
              <span>Transfer</span>
            </div>
            <div className="sheet-item" onClick={() => { navigate(isReseller ? '/reseller/transactions' : '/transactions'); onClose(); }}>
              <div className="sheet-icon" style={{ color: '#F4B400', background: 'rgba(244, 180, 0, 0.1)' }}><List size={24} /></div>
              <span>History</span>
            </div>
            <div className="sheet-item" onClick={() => { navigate('/profile'); onClose(); }}>
              <div className="sheet-icon" style={{ color: '#8B5CF6', background: 'rgba(139, 92, 246, 0.1)' }}><Settings size={24} /></div>
              <span>Settings</span>
            </div>
          </div>
          
          <div className="sheet-list">
            <div className="sheet-list-item" onClick={() => { navigate(isReseller ? '/reseller/purchase' : '/purchase', { state: { defaultTab: 'data' } }); onClose(); }}>
              <div className="list-icon"><Wifi size={18} /></div>
              <span>Buy Data</span>
            </div>
            <div className="sheet-list-item" onClick={() => { navigate(isReseller ? '/reseller/purchase' : '/purchase', { state: { defaultTab: 'airtime' } }); onClose(); }}>
              <div className="list-icon"><Smartphone size={18} /></div>
              <span>Buy Airtime</span>
            </div>
            <div className="sheet-list-item" onClick={() => { navigate('/profile'); onClose(); }}>
              <div className="list-icon"><CreditCard size={18} /></div>
              <span>Bank Accounts</span>
            </div>
            <div className="sheet-list-item danger" onClick={() => { if(logout) logout(); onClose(); }}>
              <div className="list-icon"><LogOut size={18} /></div>
              <span>Log Out</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BottomSheet;
