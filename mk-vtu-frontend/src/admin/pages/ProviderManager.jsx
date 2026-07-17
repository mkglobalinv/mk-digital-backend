import React, { useState, useEffect } from 'react';
import API from '../../api';
import './ProviderManager.css';

const ProviderManager = ({ onManageCategories }) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchProviders();
  }, []);

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
