import React, { useState, useEffect } from 'react';
import { Search, UserMinus, UserCheck, Wallet, Mail, Globe, Shield, ExternalLink, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import { useToast } from '../../context/ToastContext';
import './UserManager.css';
import './UserManager.css';

const RetailCustomerManager = ({ token }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // Wallet state
  const [walletStep, setWalletStep] = useState(1);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletReason, setWalletReason] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [intentToken, setIntentToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [walletAction, setWalletAction] = useState('credit');
  
  // Resend OTP state
  const [resendTimer, setResendTimer] = useState(0);
  const [resending, setResending] = useState(false);
  
  // Config state
  const [apiLevel, setApiLevel] = useState('');
  const [wlStatus, setWlStatus] = useState('');
  
  // Title mapping
  const titleMap = {
    'retail': 'Retail Customers',
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const fetchUsers = () => {
    setLoading(true);
    API.get(`/api/admin/users?search=${search}&type=retail`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setUsers(res.data);
      })
      .catch(err => {
        console.error("Failed to fetch users", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleToggleStatus = (userId, currentStatus) => {
    showToast(`${currentStatus ? "Unsuspending" : "Suspending"} user account...`, "info");
    API.post('/api/admin/users/status', { userId, isSuspended: !currentStatus }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        showToast(`User account status updated successfully.`, "success");
        fetchUsers();
      })
      .catch(err => {
        showToast(err.response?.data?.message || "Failed to update account status", "error");
      });
  };

  const handleInitiateWallet = (action) => {
    const amt = Number(walletAmount);
    if (isNaN(amt) || amt <= 0) return showToast("Please enter a valid positive amount.", "error");
    if (!walletReason || walletReason.trim().length < 5) return showToast("A detailed reason (min 5 characters) is required.", "error");
    if (!adminPassword) return showToast("Please enter your secure admin funding password.", "error");

    setProcessing(true);
    API.post('/api/admin/users/wallet/initiate', 
      { userId: selectedUser._id, amount: amt, action, fundingPassword: adminPassword, reason: walletReason }, 
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(res => {
        setIntentToken(res.data.intentToken);
        setWalletAction(action);
        setWalletStep(2);
        setResendTimer(60); // Start 60s countdown
        showToast("Secure verification OTP has been emailed to you.", "success");
      })
      .catch(err => {
        showToast(err.response?.data?.message || "Failed to initiate wallet action", "error");
      })
      .finally(() => {
        setProcessing(false);
      });
  };

  const handleConfirmWallet = () => {
    if (!otpCode || otpCode.trim().length < 6) return showToast("Please enter the 6-digit OTP code.", "error");

    setProcessing(true);
    API.post('/api/admin/users/wallet/confirm', 
      { intentToken, otp: otpCode }, 
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(res => {
        showToast(res.data?.message || "Wallet updated successfully!", "success");
        setShowWalletModal(false);
        setWalletAmount('');
        setAdminPassword('');
        setWalletReason('');
        setOtpCode('');
        setIntentToken('');
        setWalletStep(1);
        fetchUsers();
      })
      .catch(err => {
        showToast(err.response?.data?.message || "Verification failed.", "error");
      })
      .finally(() => {
        setProcessing(false);
      });
  };

  const handleResendOTP = () => {
    if (resendTimer > 0) return;
    setResending(true);
    const amt = Number(walletAmount);
    API.post('/api/admin/users/wallet/initiate', 
      { userId: selectedUser._id, amount: amt, action: walletAction, fundingPassword: adminPassword, reason: walletReason }, 
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(res => {
        setIntentToken(res.data.intentToken);
        setResendTimer(60); // Start 60s countdown
        showToast("A new OTP has been sent to your email.", "success");
      })
      .catch(err => {
        showToast(err.response?.data?.message || "Failed to resend OTP", "error");
      })
      .finally(() => {
        setResending(false);
      });
  };

  const handleUpdateConfig = () => {
    setLoading(true);
    const promises = [];
    
    // Update API Level
    promises.push(API.post('/api/admin/users/api-config', 
      { userId: selectedUser._id, apiLevel }, 
      { headers: { Authorization: `Bearer ${token}` } }
    ));

    // Update White Label Status
    promises.push(API.post('/api/admin/users/white-label-approve', 
      { userId: selectedUser._id, status: wlStatus }, 
      { headers: { Authorization: `Bearer ${token}` } }
    ));

    Promise.all(promises)
      .then(() => {
        showToast("Configuration updated successfully", "success");
        setShowConfigModal(false);
        fetchUsers();
      })
      .catch(err => showToast(err.response?.data?.message || err.message || "Failed to update configuration", "error"))
      .finally(() => setLoading(false));
  };

  const openConfig = (user) => {
    setSelectedUser(user);
    setApiLevel(user.apiLevel || 'normal');
    setWlStatus(user.whiteLabelStatus || 'pending');
    setShowConfigModal(true);
  };

  return (
    <div className="manager-wrapper">
      <div className="manager-header">
        <h2>Retail Customer Control Center</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {!type && (
            <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15.4px', background: 'var(--bg-color)', padding: '8px 12px', borderRadius: '8px' }}>
              <input 
                  type="checkbox" 
                  id="resellerFilter"
                  checked={users.length > 0 && users.every(u => u.role === 'reseller_admin')}
                  onChange={(e) => {
                      if (e.target.checked) {
                          setUsers(users.filter(u => u.role === 'reseller_admin'));
                      } else {
                          fetchUsers();
                      }
                  }}
              />
              <label htmlFor="resellerFilter" style={{ cursor: 'pointer', fontWeight: 600 }}>Resellers Only</label>
            </div>
          )}
          <div className="search-bar">
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Retail Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Loading Retail Users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No retail users found.</td></tr>
            ) : users.map(user => (
              <tr key={user._id}>
                <td>
                  <div className="user-brief">
                    <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                    <div className="user-name-wrapper">
                      <span className="user-name">{user.name}</span>
                      <span className="user-id">ID: {user._id.slice(-6)}</span>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <strong>₦{user.balance1?.toLocaleString() || 0}</strong>
                </td>
                <td>
                  <span className={`status-pill ${user.isSuspended ? 'suspended' : 'active'}`}>
                    {user.isSuspended ? 'Suspended' : 'Active'}
                  </span>
                </td>
                <td className="actions-cell">
                   <button className="action-btn config" title="API & White Label Config" onClick={() => openConfig(user)}>
                      <Settings size={16} color="#6366F1" />
                   </button>
                   <button className="action-btn wallet" title="Manage Wallet" onClick={() => { setSelectedUser(user); setShowWalletModal(true); }}>
                      <Wallet size={16} />
                   </button>
                   <button 
                      className="action-btn message" 
                      title="Send Email / Notification" 
                      onClick={() => navigate('/admin/notifications', { state: { userId: user._id } })}
                   >
                      <Mail size={16} color="#3B82F6" />
                   </button>
                   <button className="action-btn toggle" title={user.isSuspended ? "Unsuspend" : "Suspend"} onClick={() => handleToggleStatus(user._id, user.isSuspended)}>
                      {user.isSuspended ? <UserCheck size={16} color="#10B981" /> : <UserMinus size={16} color="#EF4444" />}
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Manage Wallet: {selectedUser.name}</h3>
            <p style={{ fontSize: '14px', marginBottom: '20px' }}>Current Balance: ₦{selectedUser.totalBalance?.toLocaleString()}</p>
            
            {walletStep === 1 ? (
              <>
                <div className="config-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--text-light)' }}>Adjustment Amount (₦)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 5000" 
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    disabled={processing}
                    className="modal-input"
                    style={{ marginBottom: 0 }}
                  />
                </div>

                <div className="config-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--text-light)' }}>Audit Tracking Reason</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Refund for failed payment" 
                    value={walletReason}
                    onChange={(e) => setWalletReason(e.target.value)}
                    disabled={processing}
                    className="modal-input"
                    style={{ marginBottom: 0 }}
                  />
                </div>

                <div className="config-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--text-light)' }}>Admin Funding Password</label>
                  <input 
                    type="password" 
                    placeholder="Secure Funding Password" 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    disabled={processing}
                    className="modal-input"
                    style={{ marginBottom: 0 }}
                  />
                </div>

                <div className="modal-actions">
                  <button className="credit-btn" onClick={() => handleInitiateWallet('credit')} disabled={processing}>
                    {processing && walletAction === 'credit' ? <div className="btn-spinner" style={{ marginRight: '8px' }}></div> : null}
                    Credit
                  </button>
                  <button className="debit-btn" onClick={() => handleInitiateWallet('debit')} disabled={processing}>
                    {processing && walletAction === 'debit' ? <div className="btn-spinner" style={{ marginRight: '8px' }}></div> : null}
                    Debit
                  </button>
                  <button className="cancel-btn" onClick={() => setShowWalletModal(false)} disabled={processing}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ background: 'var(--primary-glow)', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--primary)' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dark)', fontWeight: 600 }}>
                    A secure 6-digit OTP verification code has been dispatched to your email. Please input it below to complete this transaction.
                  </p>
                </div>

                <div className="config-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--text-light)' }}>Enter 6-Digit OTP</label>
                  <input 
                    type="text" 
                    maxLength="6"
                    placeholder="0 0 0 0 0 0" 
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    disabled={processing}
                    className="modal-input"
                    style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', marginBottom: '10px' }}
                  />
                  <div style={{ textAlign: 'right' }}>
                    <button 
                      onClick={handleResendOTP} 
                      disabled={resendTimer > 0 || resending}
                      style={{ 
                        background: 'none', border: 'none', color: resendTimer > 0 ? 'var(--text-light)' : 'var(--primary)', 
                        fontWeight: 700, fontSize: '13px', cursor: resendTimer > 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {resending ? 'Resending...' : resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>

                <div className="modal-actions">
                  <button className="credit-btn" style={{ gridColumn: 'span 2', background: 'var(--primary)' }} onClick={handleConfirmWallet} disabled={processing}>
                    {processing ? <div className="btn-spinner" style={{ marginRight: '8px' }}></div> : null}
                    Verify & Confirm Transaction
                  </button>
                  <button className="cancel-btn" style={{ gridColumn: 'span 2', marginTop: '4px' }} onClick={() => setWalletStep(1)} disabled={processing}>Back to Step 1</button>
                  <button className="cancel-btn" style={{ gridColumn: 'span 2', marginTop: '4px', background: 'none', border: 'none', color: 'var(--text-light)' }} onClick={() => setShowWalletModal(false)} disabled={processing}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <div className="modal-overlay">
          <div className="modal-card enterprise-modal">
            <div className="modal-header">
                <Shield size={24} color="#6366F1" />
                <h3>Enterprise Configuration: {selectedUser.name}</h3>
            </div>
            
            <div className="modal-body">
                <div className="config-group">
                    <label>API Pricing Level</label>
                    <select value={apiLevel} onChange={e => setApiLevel(e.target.value)} className="modal-select">
                        <option value="normal">Normal (Retail)</option>
                        <option value="reseller">Reseller (API Discount)</option>
                        <option value="premium">Premium (Enterprise API)</option>
                    </select>
                </div>

                <div className="config-group">
                    <label>White Label Approval</label>
                    <div className="wl-preview">
                        <Globe size={16} />
                        <span>Domain: {selectedUser.subdomain ? `${selectedUser.subdomain}.9jasub.com` : (selectedUser.customDomain || 'Not set')}</span>
                    </div>
                    <select value={wlStatus} onChange={e => setWlStatus(e.target.value)} className="modal-select">
                        <option value="pending">Pending Review</option>
                        <option value="active">Active (Site Live)</option>
                        <option value="suspended">Suspended / Blocked</option>
                    </select>
                </div>
            </div>

            <div className="modal-actions">
              <button className="save-btn" onClick={handleUpdateConfig}>Save Changes</button>
              <button className="cancel-btn" onClick={() => setShowConfigModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetailCustomerManager;
