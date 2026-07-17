import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, CheckCircle, XCircle, Clock, Banknote, 
    User, Calendar, Activity, DollarSign, ArrowUpRight,
    ArrowDownRight, Check
} from 'lucide-react';
import API from '../../api';
import './WithdrawalManager.css';
import './ResellerManager.css'; // For common badges/tables

const WithdrawalManager = ({ token }) => {
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);

  const handleVerify = async (id) => {
    setVerifyingId(id);
    try {
      const res = await API.get(`/api/admin/audit/withdrawal-verification/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.data || typeof res.data !== 'object') {
        if (process.env.NODE_ENV === 'development') console.warn("Unexpected withdrawal verification payload:", res.data);
        throw new Error("Invalid response format");
      }
      setVerificationData(res.data);
      setShowVerificationModal(true);
    } catch (err) {
      alert("Failed to load verification data");
    } finally {
      setVerifyingId(null);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/admin/withdrawals');
      if (!Array.isArray(res.data)) {
        if (process.env.NODE_ENV === 'development') console.warn("Unexpected withdrawals payload:", res.data);
      }
      setWithdrawals(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch withdrawals error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Confirm you have manually sent this payment?")) return;
    setProcessingId(id);
    try {
      await API.post('/api/admin/withdrawals/approve', { withdrawalId: id });
      fetchWithdrawals();
    } catch (err) {
      alert("Approve failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Reason for rejection?");
    if (reason === null) return;
    setProcessingId(id);
    try {
      await API.post('/api/admin/withdrawals/reject', { withdrawalId: id, reason });
      fetchWithdrawals();
    } catch (err) {
      alert("Reject failed");
    } finally {
      setProcessingId(null);
    }
  };

  const pending = (withdrawals || []).filter(w => w?.status === 'pending');
  const history = (withdrawals || []).filter(w => w?.status !== 'pending');

  const filteredPending = pending.filter(w => 
    w?.userId?.name?.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    w?.userId?.email?.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  if (loading) return (
    <div className="withdrawal-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Activity className="animate-spin" size={48} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
        <h2 style={{ fontWeight: 700 }}>Loading Payout Requests...</h2>
    </div>
  );

  return (
    <div className="withdrawal-container animate-fade-in">
      <header className="withdrawal-header-row">
        <div>
          <h1>Payout Liquidity</h1>
          <p style={{ color: 'var(--text-gray)', marginTop: '4px' }}>Review and fulfill manual withdrawal requests from partners.</p>
        </div>
        <div className="premium-glass" style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.3px', fontWeight: 600 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }}></div>
            Managed Settlement
        </div>
      </header>

      <div className="summary-grid">
        <div className="stat-premium-card">
            <div className="stat-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}><Clock size={24} /></div>
            <div>
                <div className="stat-value">{pending.length}</div>
                <div className="stat-label">Pending Payouts</div>
            </div>
        </div>
        <div className="stat-premium-card">
            <div className="stat-icon-box" style={{ background: '#D1FAE5', color: '#059669' }}><Check size={24} /></div>
            <div>
                <div className="stat-value">₦{history.filter(h => h.status === 'approved').reduce((acc, h) => acc + h.amount, 0).toLocaleString()}</div>
                <div className="stat-label">Total Settled</div>
            </div>
        </div>
        <div className="stat-premium-card">
            <div className="stat-icon-box" style={{ background: '#FEE2E2', color: '#EF4444' }}><XCircle size={24} /></div>
            <div>
                <div className="stat-value">{history.filter(h => h.status === 'rejected').length}</div>
                <div className="stat-label">Rejected Requests</div>
            </div>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Banknote size={24} color="var(--primary)" />
            <h2 style={{ fontSize: '22.0px', fontWeight: 800, margin: 0 }}>Active Requests</h2>
            <span className="badge">{filteredPending.length} Awaiting Transfer</span>
        </div>
        <div className="request-grid">
            {filteredPending.map(w => (
                <div key={w._id} className="request-card">
                    <div className="request-user">
                        <div className="request-avatar">{(w?.userId?.name || 'U')[0]}</div>
                        <div>
                            <strong style={{ display: 'block', fontSize: '17.6px' }}>{w?.userId?.name || 'Unknown'}</strong>
                            <span style={{ fontSize: '14.3px', color: 'var(--text-gray)' }}>{w?.userId?.email || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="request-amount">₦{(w?.amount || 0).toLocaleString()}</div>
                    <div className="bank-box">
                        <div className="bank-detail"><span>Bank</span><strong>{w?.bankName || 'N/A'}</strong></div>
                        <div className="bank-detail"><span>Account</span><strong>{w?.accountNumber || 'N/A'}</strong></div>
                        <div className="bank-detail"><span>Name</span><strong>{w?.accountName || 'N/A'}</strong></div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="premium-btn" style={{ flex: 1, background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} onClick={() => handleVerify(w._id)} disabled={verifyingId === w._id}>
                            {verifyingId === w._id ? <Activity className="animate-spin" size={16} /> : <Search size={16} />} Verify
                        </button>
                        <button className="premium-btn premium-btn-primary" style={{ flex: 1 }} onClick={() => handleApprove(w._id)} disabled={processingId === w._id}>
                            {processingId === w._id ? <Activity className="animate-spin" size={16} /> : <Check size={16} />}
                            Approve Payout
                        </button>
                        <button className="premium-btn premium-btn-secondary" onClick={() => handleReject(w._id)} disabled={processingId === w._id}>
                            <XCircle size={16} />
                        </button>
                    </div>
                </div>
            ))}
            {(!filteredPending || filteredPending.length === 0) && (
                <div className="request-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', opacity: 0.6 }}>
                    <CheckCircle size={48} style={{ color: '#10B981', margin: '0 auto 16px' }} />
                    <h3>Ecosystem Settlement Complete</h3>
                    <p>No withdrawals to display.</p>
                </div>
            )}
        </div>
      </div>

      <div className="premium-table-wrapper">
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Settlement History</h3>
            <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} size={16} />
                <input 
                    type="text" 
                    placeholder="Search history..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14.3px' }}
                />
            </div>
        </div>
        <table className="premium-table">
            <thead>
                <tr>
                    <th>Settlement Date</th>
                    <th>Partner / Admin</th>
                    <th>Payout Amount</th>
                    <th>Bank Target</th>
                    <th>Resolution</th>
                </tr>
            </thead>
            <tbody>
                {(history || []).map(h => (
                    <tr key={h._id}>
                        <td style={{ fontSize: '14.3px', color: 'var(--text-gray)' }}>{h?.createdAt ? new Date(h.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <strong style={{ color: 'var(--text-dark)' }}>{h?.userId?.name || 'Unknown'}</strong>
                                <span style={{ fontSize: '13.2px', color: 'var(--text-gray)' }}>{h?.userId?.email || 'N/A'}</span>
                            </div>
                        </td>
                        <td><strong>₦{(h?.amount || 0).toLocaleString()}</strong></td>
                        <td style={{ fontSize: '14.3px' }}>{h?.bankName || 'N/A'} - {h?.accountNumber || 'N/A'}</td>
                        <td>
                            <span className={`badge ${h?.status === 'approved' ? 'badge-success' : 'badge-danger'}`}>
                                {h?.status?.toUpperCase() || 'UNKNOWN'}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && verificationData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}><CheckCircle color="#10b981" /> Withdrawal Verification</h2>
                
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Request Details</h3>
                    <p><strong>Amount Requested:</strong> ₦{(verificationData?.withdrawal?.amount || 0).toLocaleString()}</p>
                    <p><strong>Bank:</strong> {verificationData?.withdrawal?.bankName || 'N/A'} - {verificationData?.withdrawal?.accountNumber || 'N/A'}</p>
                </div>

                <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                    <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Wallet Balance Check</h3>
                    <p><strong>Current Main Balance:</strong> ₦{(verificationData?.userBalances?.balance1 || 0).toLocaleString()}</p>
                    <p><strong>Current Earnings Balance:</strong> ₦{(verificationData?.userBalances?.earningsBalance || 0).toLocaleString()}</p>
                </div>

                <div style={{ marginBottom: '20px', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px' }}>
                    <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Profit Integrity</h3>
                    <p><strong>Total Calculated Profit (All Time):</strong> ₦{(verificationData?.profitIntegrity?.totalCalculatedProfit || 0).toLocaleString()}</p>
                    <p><strong>Total Previously Withdrawn:</strong> ₦{(verificationData?.profitIntegrity?.totalPreviousWithdrawals || 0).toLocaleString()}</p>
                    <div style={{ marginTop: '10px', padding: '10px', background: verificationData?.profitIntegrity?.isAmountValid ? '#d1fae5' : '#fee2e2', borderRadius: '4px' }}>
                        <strong>Available For Withdrawal (Calculated):</strong> ₦{(verificationData?.profitIntegrity?.maxWithdrawableAmount || 0).toLocaleString()}
                        {!verificationData?.profitIntegrity?.isAmountValid && (
                            <p style={{ color: 'red', margin: '5px 0 0 0' }}>⚠️ WARNING: Requested amount exceeds mathematically verified profit.</p>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button className="premium-btn" style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => navigate(`/admin/audit/user/${verificationData?.withdrawal?.userId}`)}>Open Full User Audit</button>
                    <button className="premium-btn" style={{ padding: '10px 20px', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setShowVerificationModal(false)}>Close Audit</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalManager;
