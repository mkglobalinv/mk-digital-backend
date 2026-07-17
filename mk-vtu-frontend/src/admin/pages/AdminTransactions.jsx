import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpRight, ArrowDownRight, MoreVertical, Eye } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../../api';

const AdminTransactions = ({ token }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Handle smart shortcuts for transaction history
  useEffect(() => {
    if (location.state?.search) {
      setSearch(location.state.search);
      // Clean up the state so it doesn't persist inappropriately on reload
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    fetchTransactions();
  }, [search]);

  const fetchTransactions = () => {
    API.get(`/api/admin/transactions?search=${search}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setTransactions(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleReverse = async (transactionId) => {
    if (!window.confirm("Are you sure you want to reverse this transaction? Funds will be refunded to both customer and reseller.")) return;
    try {
        await API.post('/api/admin/transactions/reverse', { transactionId });
        alert("Transaction reversed and funds refunded.");
        fetchTransactions();
    } catch (err) {
        alert(err.response?.data?.message || "Reversal failed");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#10b981';
      case 'failed': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#64748b';
    }
  };

  return (
    <div className="manager-wrapper">
      <div className="manager-header">
        <div className="header-info">
          <h2>All Transactions</h2>
          <p>Monitor all system-wide financial activities and service purchases.</p>
        </div>
        <div className="search-bar">
          <Search size={18} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Search by ID, email or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID & Date</th>
              <th>User</th>
              <th>Service</th>
              <th>Recipient</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Loading Transactions...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>No transactions found.</td></tr>
            ) : transactions.map(tx => (
              <tr key={tx._id}>
                <td>
                  <div className="tx-id">#{tx._id.slice(-8).toUpperCase()}</div>
                  <div className="tx-date" style={{fontSize: '12.1px', color: 'var(--text-light)'}}>{new Date(tx.createdAt).toLocaleString()}</div>
                </td>
                <td>
                   <div className="user-name" style={{fontWeight: 600}}>{tx.userId?.name || 'User'}</div>
                   <div className="user-email" style={{fontSize: '12.1px', color: 'var(--text-light)'}}>{tx.userId?.email}</div>
                </td>
                <td>
                   <div className="service-tag" style={{fontWeight: 700, fontSize: '14.3px'}}>{tx.description}</div>
                   <div className="network-tag" style={{fontSize: '12.1px', color: '#3b82f6'}}>{tx.network}</div>
                </td>
                <td style={{fontFamily: 'monospace'}}>{tx.phone || 'N/A'}</td>
                <td>
                   <div style={{fontWeight: 800, color: tx.type === 'credit' ? '#10b981' : '#1e293b'}}>
                      {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                   </div>
                </td>
                <td>
                  <span className={`badge`} style={{ 
                    backgroundColor: `${getStatusColor(tx.status)}15`, 
                    color: getStatusColor(tx.status),
                    border: `1px solid ${getStatusColor(tx.status)}30`
                  }}>
                    {tx.status.toUpperCase()}
                  </span>
                </td>
                <td>
                    <div className="action-btns">
                        <button 
                            className="small-btn info" 
                            onClick={() => navigate(`/admin/audit/user/${tx.userId?._id || tx.userId}`)}
                            title="View Audit"
                            style={{ background: '#3b82f6', color: 'white', marginRight: '5px', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                            View Audit
                        </button>
                        {tx.status === 'success' && (
                            <button 
                                className="small-btn error" 
                                onClick={() => handleReverse(tx._id)}
                                title="Reverse Transaction"
                            >
                                Reverse
                            </button>
                        )}
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTransactions;
