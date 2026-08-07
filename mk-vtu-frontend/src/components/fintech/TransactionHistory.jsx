import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Clock, XCircle, Search } from 'lucide-react';
import './FintechComponents.css';

const TransactionHistory = ({ transactions = [], isLoading, isReseller = false }) => {
  const navigate = useNavigate();

  const getStatusIcon = (status, type) => {
    if (status === 'success') {
      return type === 'credit' 
        ? <div className="activity-icon icon-credit"><ArrowDownLeft size={16} /></div>
        : <div className="activity-icon icon-debit"><ArrowUpRight size={16} /></div>;
    }
    if (status === 'pending') return <div className="activity-icon icon-pending"><Clock size={16} /></div>;
    return <div className="activity-icon icon-failed"><XCircle size={16} /></div>;
  };

  return (
    <>
      <div className="section-header" style={{ marginTop: '24px' }}>
        <h3>Recent Activity</h3>
        <span onClick={() => navigate(isReseller ? '/reseller/transactions' : '/transactions')}>View All</span>
      </div>

      <div className="activity-list animate-fade-in">
        {isLoading ? (
          [1,2,3].map(i => (
            <div key={i} className="activity-item skeleton-shimmer" style={{ height: '60px' }}></div>
          ))
        ) : transactions.length > 0 ? (
          transactions.slice(0, 5).map(tx => (
            <div key={tx._id} className="activity-item">
              <div className="activity-left">
                {getStatusIcon(tx.status, tx.type)}
                <div className="activity-details">
                  <h5>{tx.title || tx.description || 'Transaction'}</h5>
                  <p>{new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="activity-right">
                <p className={`activity-amt ${tx.status === 'failed' ? 'amt-failed' : (tx.type === 'credit' ? 'amt-credit' : 'amt-debit')}`}>
                  {tx.type === 'credit' ? '+' : '-'},{tx.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className={`activity-status status-${tx.status}`}>{tx.status}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-activity-card">
            <div className="empty-activity-icon"><Search size={24} /></div>
            <h4>No recent transactions</h4>
            <p>Your latest activity will appear here.</p>
            <button className="fintech-outline-btn empty-activity-btn" onClick={() => navigate(isReseller ? '/reseller/wallet' : '/wallet')}>Fund Wallet</button>
          </div>
        )}
      </div>
    </>
  );
};

export default TransactionHistory;
