import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldCheck, Download, Eye, FileText, CheckCircle, Clock } from 'lucide-react';
import './AdminDashboard.css';

export default function IdentityServiceRequests() {
  const [activeTab, setActiveTab] = useState('nin');
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('identity_requests');
    if (saved) {
      setRequests(JSON.parse(saved));
    }
  }, []);

  const TABS = [
    { id: 'nin', label: 'NIN Modify' },
    { id: 'vbn', label: 'VBN Modify' },
    { id: 'cac', label: 'CAC Reg' }
  ];

  const filteredRequests = requests.filter(req => {
    if (activeTab === 'nin' && req.type?.includes('Modification')) return true;
    if (activeTab === 'vbn' && req.type?.includes('VBN')) return true;
    if (activeTab === 'cac' && req.type?.includes('CAC')) return true;
    return false;
  });

  return (
    <div className="admin-page-container fade-in">
      <div className="admin-page-header">
        <div>
          <h1>Identity Service Requests</h1>
          <p>Manage submissions for NIN, BVN, and CAC modifications</p>
        </div>
        <button className="admin-btn-primary">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="admin-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-card">
        <div className="admin-table-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div className="admin-search-box">
            <Search size={18} />
            <input type="text" placeholder="Search serial, email or phone..." />
          </div>
          <button className="admin-btn-secondary">
            <Filter size={16} /> Filter
          </button>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: 'var(--text-dark)' }}>
            <thead style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-gray)' }}>
              <tr>
                <th style={{ padding: '16px' }}>Serial No.</th>
                <th style={{ padding: '16px' }}>Service Type</th>
                <th style={{ padding: '16px' }}>WhatsApp</th>
                <th style={{ padding: '16px' }}>Price Paid</th>
                <th style={{ padding: '16px' }}>Date</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ color: 'var(--text-light)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <FileText size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                      <p>No requests found in this category.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '16px', fontWeight: '600' }}>{req.id}</td>
                    <td style={{ padding: '16px' }}>{req.type}</td>
                    <td style={{ padding: '16px' }}>{req.formData?.whatsapp || 'N/A'}</td>
                    <td style={{ padding: '16px' }}>₦{req.price.toLocaleString()}</td>
                    <td style={{ padding: '16px' }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '16px' }}>
                      <span className={`status-badge pending`}>
                        <Clock size={12} /> {req.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button className="action-btn" onClick={() => setSelectedRequest(req)}>
                        <Eye size={16} /> View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRequest && (
        <div className="modal-overlay-modern" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content-modern animate-scale-in" onClick={e => e.stopPropagation()} style={{ padding: '24px', maxWidth: '600px', width: '90%' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              Request Details: {selectedRequest.id}
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {Object.entries(selectedRequest.formData).map(([key, value]) => {
                if (key === 'pin') return null;
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return (
                  <div key={key} style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '4px' }}>{formattedKey}</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)' }}>{value || 'N/A'}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="admin-btn-secondary" onClick={() => setSelectedRequest(null)}>Close</button>
              <button className="admin-btn-primary" onClick={() => {
                const num = selectedRequest.formData.whatsapp || '';
                window.open(`https://wa.me/234${num.replace(/^0+/, '')}`, '_blank');
              }}>
                Message on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
