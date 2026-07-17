import React, { useEffect, useState } from 'react';
import API from '../api';
import { Terminal, Search } from 'lucide-react';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await API.get('/api/management/logs');
        setLogs(res.data.data);
      } catch (err) {
        console.error("Failed to load logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filterType === 'ALL') return true;
    return log.action === filterType;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Terminal size={32} color="#38bdf8" />
            Activity Logs
          </h1>
          <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>Real-time Super Admin operation tracking</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: '12px 16px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', outline: 'none' }}
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN">Logins</option>
            <option value="SETTINGS_CHANGE">Settings Changes</option>
            <option value="PROVIDER_CHANGE">Provider Changes</option>
            <option value="DEPLOYMENT_ACTION">Deployments</option>
            <option value="MAINTENANCE_ACTION">Maintenance</option>
            <option value="ROLLBACK_ACTION">Rollbacks</option>
          </select>
          <div style={{ position: 'relative', width: '250px' }}>
            <input 
              type="text" 
              placeholder="Search logs..." 
              style={{ width: '100%', padding: '12px 16px 12px 40px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
            />
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
              <th style={{ padding: '16px', fontWeight: '500' }}>Timestamp</th>
              <th style={{ padding: '16px', fontWeight: '500' }}>Action</th>
              <th style={{ padding: '16px', fontWeight: '500' }}>Admin</th>
              <th style={{ padding: '16px', fontWeight: '500' }}>Status</th>
              <th style={{ padding: '16px', fontWeight: '500' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Loading logs...</td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No logs found for this filter.</td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log._id} style={{ borderBottom: '1px solid #334155', transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '16px', color: '#cbd5e1', fontSize: '14px', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ padding: '4px 8px', backgroundColor: '#38bdf820', color: '#38bdf8', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: '#cbd5e1', fontSize: '14px' }}>
                    {log.adminId?.email || 'Unknown'}
                  </td>
                  <td style={{ padding: '16px' }}>
                     <span style={{ 
                        padding: '4px 8px', 
                        backgroundColor: log.status === 'SUCCESS' ? '#10b98120' : '#ef444420', 
                        color: log.status === 'SUCCESS' ? '#10b981' : '#ef4444', 
                        borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' 
                     }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Logs;
