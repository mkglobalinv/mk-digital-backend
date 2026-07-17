import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Wallet, Activity, Search, Shield, DollarSign, Download } from 'lucide-react';
import API from '../../api';
import './ResellerManager.css';
import './AdminDashboard.css';

const UserAudit = ({ token }) => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [auditData, setAuditData] = useState(null);
  
  // Reseller specific data
  const [activeTab, setActiveTab] = useState('retail'); // 'retail', 'own_tx', 'customers', 'profit'
  const [resellerCustomers, setResellerCustomers] = useState([]);
  const [profitLedger, setProfitLedger] = useState({ transactions: [], summary: {} });
  
  useEffect(() => {
    fetchMainAudit();
  }, [userId]);

  const fetchMainAudit = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/admin/audit/user/${userId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (!res.data || typeof res.data !== 'object') {
        if (process.env.NODE_ENV === 'development') console.warn("Unexpected audit payload:", res.data);
        throw new Error("Invalid response format");
      }
      setAuditData({
        user: res.data.user || {},
        transactions: Array.isArray(res.data.transactions) ? res.data.transactions : []
      });
      
      if (res.data.user?.role === 'reseller_admin') {
        fetchResellerData();
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load user audit data');
      setLoading(false);
    }
  };

  const fetchResellerData = async () => {
    try {
      const [custRes, profitRes] = await Promise.all([
        API.get(`/api/admin/audit/reseller-customers/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
        API.get(`/api/admin/audit/profit-ledger/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (!custRes.data || !profitRes.data) {
        if (process.env.NODE_ENV === 'development') console.warn("Unexpected reseller audit payload");
      }
      
      setResellerCustomers(Array.isArray(custRes.data?.transactions) ? custRes.data.transactions : []);
      setProfitLedger({
        ledger: Array.isArray(profitRes.data?.ledger) ? profitRes.data.ledger : [],
        pagination: profitRes.data?.pagination || {},
        summary: profitRes.data?.summary || {
          totalEarned: 0,
          totalWithdrawn: 0
        }
      });
    } catch (err) {
      console.error("Failed to load reseller sub-data", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = (data, filename) => {
    if (!data || !data.length) return alert("No data to export");
    const headers = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + data.map(row => headers.map(h => JSON.stringify(row[h] || "")).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    if (activeTab === 'retail' || activeTab === 'own_tx') {
      downloadCsv(recentTransactions, 'transactions.csv');
    } else if (activeTab === 'customers') {
      downloadCsv(resellerCustomers, 'customer_transactions.csv');
    } else if (activeTab === 'profit') {
      downloadCsv(profitLedger.ledger, 'profit_ledger.csv');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Audit Data...</div>;
  if (error) return <div style={{ padding: '40px', color: 'red', textAlign: 'center' }}>{error}</div>;
  if (!auditData) return null;

  const user = auditData.user || {};
  const recentTransactions = Array.isArray(auditData.transactions) ? auditData.transactions : [];
  const isReseller = user?.role === 'reseller_admin';

  return (
    <div className="partners-container animate-fade-in">
      <div className="partners-header" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-dark)', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}>
            <ArrowLeft size={24} />
            </button>
            <div className="header-info">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, fontSize: '28px' }}>
                <Shield size={28} color="var(--primary)" /> User Audit 
                {isReseller && <span className="badge badge-success" style={{ fontSize: '12px', padding: '4px 10px' }}>RESELLER</span>}
            </h1>
            <p style={{ color: 'var(--text-gray)', margin: '4px 0 0 0' }}>Forensic read-only investigation view.</p>
            </div>
        </div>
      </div>

      {/* User Information Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="premium-card" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}><User size={18} /> User Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-dark)' }}>
            <p><strong>Name:</strong> <span style={{ color: 'var(--text-light)' }}>{user?.name || 'Unknown'}</span></p>
            <p><strong>Email:</strong> <span style={{ color: 'var(--text-light)' }}>{user?.email || 'N/A'}</span></p>
            <p><strong>Phone:</strong> <span style={{ color: 'var(--text-light)' }}>{user?.phone || 'N/A'}</span></p>
            <p><strong>Status:</strong> <span className={`badge ${user?.isSuspended ? 'badge-danger' : 'badge-success'}`}>{user?.isSuspended ? 'Suspended' : 'Active'}</span></p>
            <p><strong>Joined:</strong> <span style={{ color: 'var(--text-light)' }}>{user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</span></p>
          </div>
        </div>
        
        <div className="premium-card" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}><Wallet size={18} /> Wallet Balance Overview</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '12px' }}>
                <span style={{ display: 'block', color: 'var(--text-gray)', fontSize: '13px', marginBottom: '4px' }}>Main Balance</span>
                <strong style={{ fontSize: '24px', color: 'var(--text-dark)' }}>₦{(user?.balance1 || 0).toLocaleString()}</strong>
            </div>
            {isReseller && (
                <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '12px' }}>
                    <span style={{ display: 'block', color: 'var(--text-gray)', fontSize: '13px', marginBottom: '4px' }}>Profit/Earnings Balance</span>
                    <strong style={{ fontSize: '24px', color: '#10B981' }}>₦{(user?.earningsBalance || 0).toLocaleString()}</strong>
                </div>
            )}
          </div>
        </div>

        <div className="premium-card" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}><Activity size={18} /> Transaction Totals</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-dark)' }}>
            <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Deposits:</span> <strong>₦{(user?.totalFunded || 0).toLocaleString()}</strong></p>
            <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Purchases:</span> <strong>₦{(user?.totalSpent || 0).toLocaleString()}</strong></p>
            <div style={{ borderTop: '1px dashed var(--border-color)', margin: '4px 0' }}></div>
            <p style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', fontSize: '18px' }}><span>Net Balance Sync:</span> <strong>₦{((user?.totalFunded || 0) - (user?.totalSpent || 0)).toLocaleString()}</strong></p>
          </div>
        </div>
        
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><Wallet size={18} /> Wallet Balance Overview</h3>
          <p><strong>Main Balance:</strong> ₦{(user?.balance1 || 0).toLocaleString()}</p>
          {isReseller && <p><strong>Profit/Earnings Balance:</strong> ₦{(user?.earningsBalance || 0).toLocaleString()}</p>}
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} /> Transaction Totals</h3>
          <p><strong>Total Deposits:</strong> ₦{(user?.totalFunded || 0).toLocaleString()}</p>
          <p><strong>Total Purchases (Cost):</strong> ₦{(user?.totalSpent || 0).toLocaleString()}</p>
          <p><strong>Net Balance Sync:</strong> ₦{((user?.totalFunded || 0) - (user?.totalSpent || 0)).toLocaleString()}</p>
        </div>
      </div>

      {/* Reseller Tabs */}
      {isReseller && (
        <div className="timeframe-pill-container" style={{ marginBottom: '24px', display: 'inline-flex', padding: '4px' }}>
          <button 
            className={`timeframe-btn ${activeTab === 'retail' ? 'active' : ''}`}
            onClick={() => setActiveTab('retail')}
          >Retail View</button>
          <button 
            className={`timeframe-btn ${activeTab === 'own_tx' ? 'active' : ''}`}
            onClick={() => setActiveTab('own_tx')}
          >Reseller's Own Tx</button>
          <button 
            className={`timeframe-btn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >Customer Transactions</button>
          <button 
            className={`timeframe-btn ${activeTab === 'profit' ? 'active' : ''}`}
            onClick={() => setActiveTab('profit')}
          >Profit Ledger</button>
        </div>
      )}

      {/* Content Area */}
      <div className="premium-table-wrapper" style={{ padding: '24px', position: 'relative' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '20px' }}>
                {activeTab === 'own_tx' ? "Reseller's Direct Transactions" : 
                 activeTab === 'retail' ? "Recent Transactions" :
                 activeTab === 'customers' ? "Customer Activities" : "Profit Ledger"}
            </h3>
            <button 
                onClick={handleExport}
                className="premium-btn premium-btn-primary"
            >
            <Download size={16} /> Export CSV
            </button>
        </div>

        {(activeTab === 'retail' || activeTab === 'own_tx') && (
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(recentTransactions || []).map(tx => (
                  <tr key={tx._id}>
                    <td style={{ color: 'var(--text-gray)', fontSize: '14px' }}>#{tx?._id?.slice(-8) || 'N/A'}</td>
                    <td style={{ color: 'var(--text-gray)', fontSize: '14px' }}>{tx?.createdAt ? new Date(tx.createdAt).toLocaleDateString() + ' ' + new Date(tx.createdAt).toLocaleTimeString() : 'N/A'}</td>
                    <td style={{ color: 'var(--text-dark)' }}>{tx?.description || 'N/A'}</td>
                    <td>
                        <span className={`badge ${tx?.type === 'credit' ? 'badge-success' : 'badge-warning'}`}>{tx?.type?.toUpperCase() || 'UNKNOWN'}</span>
                    </td>
                    <td><strong style={{ color: 'var(--text-dark)' }}>₦{(tx?.amount || 0).toLocaleString()}</strong></td>
                    <td>
                        <span className={`badge ${tx?.status === 'success' ? 'badge-success' : tx?.status === 'pending' ? 'badge-warning' : tx?.status === 'failed' ? 'badge-danger' : ''}`}>{tx?.status?.toUpperCase() || 'UNKNOWN'}</span>
                    </td>
                  </tr>
                ))}
                {(!recentTransactions || recentTransactions.length === 0) && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-gray)' }}>No customer transactions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'customers' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Tx ID</th>
                  <th>Customer Name</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Profit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(resellerCustomers || []).map(tx => (
                  <tr key={tx._id}>
                    <td style={{ color: 'var(--text-gray)', fontSize: '14px' }}>#{tx?._id?.slice(-8) || 'N/A'}</td>
                    <td style={{ color: 'var(--text-dark)' }}><strong>{tx?.userId?.name || 'Unknown'}</strong></td>
                    <td style={{ color: 'var(--text-gray)', fontSize: '14px' }}>{tx?.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ color: 'var(--text-dark)' }}>{tx?.description || 'N/A'}</td>
                    <td><strong style={{ color: 'var(--text-dark)' }}>₦{(tx?.amount || 0).toLocaleString()}</strong></td>
                    <td><strong style={{ color: '#10B981' }}>₦{(tx?.profit || 0).toLocaleString()}</strong></td>
                    <td>
                        <span className={`badge ${tx?.status === 'success' ? 'badge-success' : tx?.status === 'pending' ? 'badge-warning' : tx?.status === 'failed' ? 'badge-danger' : ''}`}>{tx?.status?.toUpperCase() || 'UNKNOWN'}</span>
                    </td>
                  </tr>
                ))}
                {(!resellerCustomers || resellerCustomers.length === 0) && (
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-gray)' }}>No customer transactions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'profit' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #10B981' }}>
                  <span style={{ color: 'var(--text-gray)', fontSize: '13px', textTransform: 'uppercase' }}>Total Earned Profit</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '8px' }}>₦{(profitLedger?.summary?.totalEarned || 0).toLocaleString()}</div>
              </div>
              <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #EF4444' }}>
                  <span style={{ color: 'var(--text-gray)', fontSize: '13px', textTransform: 'uppercase' }}>Total Withdrawn</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '8px' }}>₦{(profitLedger?.summary?.totalWithdrawn || 0).toLocaleString()}</div>
              </div>
              <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                  <span style={{ color: 'var(--text-gray)', fontSize: '13px', textTransform: 'uppercase' }}>Available Calculated</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', marginTop: '8px' }}>₦{((profitLedger?.summary?.totalEarned || 0) - (profitLedger?.summary?.totalWithdrawn || 0)).toLocaleString()}</div>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table className="premium-table">
                <thead>
                    <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Profit Earned</th>
                    </tr>
                </thead>
                <tbody>
                    {(profitLedger?.ledger || []).map(tx => (
                    <tr key={tx._id}>
                        <td style={{ color: 'var(--text-gray)', fontSize: '14px' }}>#{tx?._id?.slice(-8) || 'N/A'}</td>
                        <td style={{ color: 'var(--text-gray)', fontSize: '14px' }}>{tx?.date ? new Date(tx.date).toLocaleDateString() : 'N/A'}</td>
                        <td style={{ color: 'var(--text-dark)' }}>{tx?.servicePurchased || 'N/A'}</td>
                        <td><strong style={{ color: '#10B981' }}>+ ₦{(tx?.resellerProfit || 0).toLocaleString()}</strong></td>
                    </tr>
                    ))}
                    {(!profitLedger?.ledger || profitLedger.ledger.length === 0) && (
                        <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-gray)' }}>No profit records available.</td></tr>
                    )}
                </tbody>
                </table>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default UserAudit;
