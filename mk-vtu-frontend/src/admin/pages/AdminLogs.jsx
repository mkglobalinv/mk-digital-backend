import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  ShieldCheck, 
  Filter, 
  Download, 
  RefreshCw, 
  Calendar,
  User,
  Activity,
  Terminal,
  ExternalLink
} from 'lucide-react';
import API from '../../api';
import { useToast } from '../../context/ToastContext';
import './AdminLogs.css';

const AdminLogs = ({ token }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = () => {
    setLoading(true);
    API.get('/api/admin/logs', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!Array.isArray(res.data)) {
          if (process.env.NODE_ENV === 'development') console.warn("Unexpected logs payload:", res.data);
        }
        setLogs(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(err => {
        showToast("Audit trail sync failed", "error");
        setLoading(false);
      });
  };

  const getActionStyles = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('LOGIN')) return { bg: '#ecfdf5', text: '#059669', border: '#10b981' };
    if (act.includes('DELETE') || act.includes('SUSPEND')) return { bg: '#fef2f2', text: '#dc2626', border: '#ef4444' };
    if (act.includes('UPDATE') || act.includes('SETTING')) return { bg: '#eff6ff', text: '#2563eb', border: '#3b82f6' };
    if (act.includes('WALLET')) return { bg: '#fffbeb', text: '#d97706', border: '#f59e0b' };
    return { bg: '#f8fafc', text: '#475569', border: '#94a3b8' };
  };

  const filteredLogs = (logs || []).filter(log => 
    log?.action?.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    log?.adminId?.name?.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    log?.adminId?.email?.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div className="admin-logs-modern animate-fade-in">
      <div className="logs-header-modern">
        <div className="header-left">
          <div className="header-icon"><Terminal size={24} /></div>
          <div className="header-text">
            <h1>System Audit Logs</h1>
            <p>Immutable record of all administrative operations and security events.</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="log-action-btn secondary" onClick={fetchLogs} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
          <button className="log-action-btn primary">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="logs-controls">
        <div className="search-box-modern">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by admin name, email, or action type..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group-modern">
          <button className="filter-pill active"><Activity size={14} /> All Activity</button>
          <button className="filter-pill"><ShieldCheck size={14} /> Security</button>
          <button className="filter-pill"><Calendar size={14} /> Date Range</button>
        </div>
      </div>

      <div className="logs-table-container custom-scrollbar">
        {loading ? (
          <div className="logs-loading">
            <div className="premium-loader-small"></div>
            <span>Fetching audit trail...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="logs-empty">
            <History size={48} />
            <h3>No logs found</h3>
            <p>Try adjusting your search or filter parameters.</p>
          </div>
        ) : (
          <table className="modern-admin-table">
            <thead>
              <tr>
                <th>ADMINISTRATOR</th>
                <th>ACTION EVENT</th>
                <th>METADATA</th>
                <th>TIMESTAMP</th>
                <th>IP & ORIGIN</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => {
                const styles = getActionStyles(log.action);
                return (
                  <tr key={log._id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-avatar-mini">{log.adminId?.name?.charAt(0) || 'A'}</div>
                        <div className="admin-meta">
                          <span className="admin-name">{log.adminId?.name || 'Super Admin'}</span>
                          <span className="admin-email">{log.adminId?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="action-badge" style={{ backgroundColor: styles.bg, color: styles.text, borderLeft: `3px solid ${styles.border}` }}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="metadata-cell" onClick={() => setSelectedLog(log)}>
                        <Terminal size={12} />
                        <span>{log?.details ? (typeof log.details === 'object' ? JSON.stringify(log.details) : log.details) : 'No payload'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="timestamp-cell">
                        <div className="date">{log?.createdAt ? new Date(log.createdAt).toLocaleDateString() : 'N/A'}</div>
                        <div className="time">{log?.createdAt ? new Date(log.createdAt).toLocaleTimeString() : 'N/A'}</div>
                      </div>
                    </td>
                    <td>
                      <div className="origin-cell">
                        <span className="ip">{log?.ipAddress || '127.0.0.1'}</span>
                        <span className="origin">{log?.userAgent?.includes('Mobile') ? 'Mobile App' : 'Desktop Browser'}</span>
                      </div>
                    </td>
                    <td className="actions-cell">
                      <button className="view-details-btn" onClick={() => setSelectedLog(log)}>
                        <ExternalLink size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="log-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="log-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Event Details</h3>
              <button onClick={() => setSelectedLog(null)}>&times;</button>
            </div>
            <div className="modal-body custom-scrollbar">
              <div className="detail-row">
                <label>Admin:</label>
                <span>{selectedLog?.adminId?.name || 'Unknown'} ({selectedLog?.adminId?.email || 'N/A'})</span>
              </div>
              <div className="detail-row">
                <label>Action:</label>
                <span className="action-badge-large">{selectedLog?.action || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Time:</label>
                <span>{selectedLog?.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>IP Address:</label>
                <span>{selectedLog?.ipAddress || 'N/A'}</span>
              </div>
              <div className="detail-payload">
                <label>Full Payload JSON:</label>
                <pre>{JSON.stringify(selectedLog?.details || {}, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
