import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, ShieldAlert, CheckCircle, XCircle, Eye } from 'lucide-react';
import API from '../../api';

const KYCManager = ({ token }) => {
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchKYC();
  }, [search]);

  const fetchKYC = () => {
    API.get(`/api/admin/users?kycPending=true&search=${search}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setKycRequests(res.data);
        setLoading(false);
      });
  };

  const handleVerify = (userId, status) => {
    API.post('/api/admin/users/kyc-verify', { userId, status }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => fetchKYC());
  };

  return (
    <div className="manager-wrapper">
      <div className="manager-header">
        <div className="header-info">
          <h2>KYC Management</h2>
          <p>Review and verify identity documents submitted by users.</p>
        </div>
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

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>BVN / ID Number</th>
              <th>Submitted Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Loading KYC Requests...</td></tr>
            ) : kycRequests.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No pending KYC requests.</td></tr>
            ) : kycRequests.map(user => (
              <tr key={user._id}>
                <td>
                  <div className="user-name" style={{fontWeight: 700}}>{user.name}</div>
                  <div className="user-email" style={{fontSize: '13.2px', color: 'var(--text-light)'}}>{user.email}</div>
                </td>
                <td style={{fontFamily: 'monospace', fontWeight: 600}}>{user.bvn || 'N/A'}</td>
                <td style={{fontSize: '14.3px', color: 'var(--text-light)'}}>
                  {user.kycSubmittedAt ? new Date(user.kycSubmittedAt).toLocaleDateString() : 'N/A'}
                </td>
                <td>
                  <span className={`badge`} style={{ 
                    backgroundColor: user.kycVerified ? '#dcfce7' : '#fef3c7', 
                    color: user.kycVerified ? '#166534' : '#92400e'
                  }}>
                    {user.kycVerified ? 'VERIFIED' : 'PENDING'}
                  </span>
                </td>
                <td className="actions-cell">
                   {!user.kycVerified && (
                     <>
                        <button className="action-btn" title="Approve" onClick={() => handleVerify(user._id, true)}>
                           <CheckCircle size={18} color="#10B981" />
                        </button>
                        <button className="action-btn" title="Reject" onClick={() => handleVerify(user._id, false)}>
                           <XCircle size={18} color="#EF4444" />
                        </button>
                     </>
                   )}
                   <button className="action-btn" title="View Profile">
                      <Eye size={18} color="#64748b" />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KYCManager;
