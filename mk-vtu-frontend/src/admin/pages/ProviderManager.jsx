import React, { useState, useEffect } from 'react';
import API from '../../api';
import './ProviderManager.css';

const ProviderManager = ({ onManageCategories }) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ogdamsDetail, setOgdamsDetail] = useState(null);
  const [routing, setRouting] = useState(null);
  const [routingBusy, setRoutingBusy] = useState('');

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/admin/providers');
      setProviders(res.data.data);
    } catch (error) {
      alert('Failed to load providers.');
    } finally {
      setLoading(false);
    }
  };

  // Ogdams-specific detail (configured state, live balances, transaction
  // counts) -- the generic ProviderStatus card above doesn't carry this, so
  // it's fetched separately and rendered only inside the 'ogdams' card.
  const fetchOgdamsDetail = async () => {
    try {
      const res = await API.get('/api/admin/providers/ogdams/status');
      setOgdamsDetail(res.data.data);
    } catch (error) {
      setOgdamsDetail(null);
    }
  };

  // Service+network routing (currently DATA only): which provider is
  // currently active for each network. Built on the existing ProviderCategory
  // visibility mechanism, not a new config system -- see services/
  // providerRouting.js.
  const fetchRouting = async () => {
    try {
      const res = await API.get('/api/admin/provider-routing');
      setRouting(res.data.data);
    } catch (error) {
      setRouting(null);
    }
  };

  useEffect(() => {
    fetchProviders();
    fetchOgdamsDetail();
    fetchRouting();
  }, []);

  const handleRoutingChange = async (network, provider) => {
    setRoutingBusy(network);
    try {
      await API.post('/api/admin/provider-routing', { service: 'data', network, provider });
      await fetchRouting();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update routing.');
    } finally {
      setRoutingBusy('');
    }
  };

  const handleToggleMaintenance = async (id, isUnderMaintenance) => {
    try {
      await API.put(`/api/admin/providers/${id}`, {
        isUnderMaintenance: !isUnderMaintenance
      });
      alert(`Provider maintenance mode ${!isUnderMaintenance ? 'enabled' : 'disabled'}`);
      fetchProviders();
    } catch (error) {
      alert('Failed to update provider status.');
    }
  };

  const handleToggleDisable = async (id, manualDisabled) => {
    try {
      await API.put(`/api/admin/providers/${id}`, {
        manualDisabled: !manualDisabled
      });
      alert(`Provider ${!manualDisabled ? 'disabled' : 'enabled'}`);
      fetchProviders();
    } catch (error) {
      alert('Failed to update provider status.');
    }
  };

  if (loading) return <div className="loading-spinner">Loading Providers...</div>;

  return (
    <div className="provider-manager-container">
      <div className="pm-header">
        <div>
          <h2>Data Provider Management</h2>
          <p>Select a provider to manage its data categories and routing logic.</p>
        </div>
      </div>

      {routing && (
        <div className="pm-card" style={{ marginBottom: 20 }}>
          <div className="pm-card-header">
            <h3>Service + Network Routing</h3>
          </div>
          <div className="pm-card-body" style={{ display: 'block' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: '6px 8px' }}>Service</th>
                  <th style={{ padding: '6px 8px' }}>Network</th>
                  <th style={{ padding: '6px 8px' }}>Provider</th>
                </tr>
              </thead>
              <tbody>
                {routing.data.map((row) => (
                  <tr key={`data-${row.network}`} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '6px 8px' }}>DATA</td>
                    <td style={{ padding: '6px 8px' }}>{row.network}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <select
                        value={row.provider || ''}
                        disabled={routingBusy === row.network}
                        onChange={(e) => handleRoutingChange(row.network, e.target.value)}
                      >
                        <option value="" disabled>{row.provider ? row.provider : 'Default / Mixed'}</option>
                        {row.availableProviders.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {routing.airtime.map((row) => (
                  <tr key={`airtime-${row.network}`} style={{ borderBottom: '1px solid #f5f5f5', opacity: 0.7 }}>
                    <td style={{ padding: '6px 8px' }}>AIRTIME</td>
                    <td style={{ padding: '6px 8px' }}>{row.network}</td>
                    <td style={{ padding: '6px 8px' }}>{row.provider} (fixed, not configurable here)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="pm-grid">
        {providers.map((provider) => {
          const isMaintenance = provider.isUnderMaintenance;
          const isDisabled = provider.manualDisabled;
          
          let statusLabel = 'ACTIVE';
          let statusClass = 'status-active';
          if (isDisabled) {
            statusLabel = 'DISABLED';
            statusClass = 'status-disabled';
          } else if (isMaintenance) {
            statusLabel = 'MAINTENANCE';
            statusClass = 'status-maintenance';
          }

          return (
            <div key={provider._id} className={`pm-card ${statusClass}`}>
              <div className="pm-card-header">
                <h3>{provider.providerName.toUpperCase()}</h3>
                <span className={`pm-badge ${statusClass}`}>{statusLabel}</span>
              </div>
              
              <div className="pm-card-body">
                <div className="pm-stat">
                  <span>API Status:</span>
                  <strong>{provider.apiStatus || 'Online'}</strong>
                </div>
                <div className="pm-stat">
                  <span>Failures:</span>
                  <strong>{provider.failureCount || 0}</strong>
                </div>
              </div>

              {provider.providerName === 'ogdams' && (
                <div className="pm-card-body" style={{ borderTop: '1px solid #eee', marginTop: 8, paddingTop: 8 }}>
                  <div className="pm-stat">
                    <span>Credentials:</span>
                    <strong>{ogdamsDetail ? (ogdamsDetail.configured ? 'Configured' : 'Not configured') : '—'}</strong>
                  </div>
                  {ogdamsDetail?.balances && (
                    <div className="pm-stat">
                      <span>Wallet Balance:</span>
                      <strong>₦{ogdamsDetail.balances.mainBalance ?? '0.00'}</strong>
                    </div>
                  )}
                  {ogdamsDetail?.stats && (
                    <>
                      <div className="pm-stat"><span>Successful:</span><strong>{ogdamsDetail.stats.success}</strong></div>
                      <div className="pm-stat"><span>Failed:</span><strong>{ogdamsDetail.stats.failed}</strong></div>
                      <div className="pm-stat"><span>Pending/Unknown:</span><strong>{ogdamsDetail.stats.pending + ogdamsDetail.stats.unknown}</strong></div>
                    </>
                  )}
                  {ogdamsDetail?.lastSuccessfulTransaction && (
                    <div className="pm-stat">
                      <span>Last Success:</span>
                      <strong>{new Date(ogdamsDetail.lastSuccessfulTransaction.at).toLocaleString()}</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="pm-card-actions">
                <button 
                  className="pm-btn-primary"
                  onClick={() => onManageCategories(provider.providerName)}
                >
                  <i className="fi fi-rr-settings-sliders"></i> Manage Categories
                </button>
                
                <div className="pm-toggles">
                  <button 
                    className={`pm-btn-icon ${isMaintenance ? 'active-warning' : ''}`}
                    onClick={() => handleToggleMaintenance(provider._id, provider.isUnderMaintenance)}
                    title="Toggle Maintenance"
                  >
                    <i className="fi fi-rr-wrench"></i>
                  </button>
                  <button 
                    className={`pm-btn-icon ${isDisabled ? 'active-danger' : ''}`}
                    onClick={() => handleToggleDisable(provider._id, provider.manualDisabled)}
                    title="Enable/Disable Provider"
                  >
                    <i className="fi fi-rr-power"></i>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProviderManager;
