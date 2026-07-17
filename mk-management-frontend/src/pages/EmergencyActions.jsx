import React, { useState } from 'react';
import API from '../api';
import { ShieldAlert, Power, RotateCcw, AlertTriangle } from 'lucide-react';

const EmergencyActions = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleMaintenance = async (enable) => {
    if (!window.confirm(`Are you sure you want to ${enable ? 'ENABLE' : 'DISABLE'} Global Maintenance Mode?`)) return;
    setLoading(true);
    try {
      const res = await API.post('/api/management/emergency/maintenance', { isEnabled: enable });
      setMessage(res.data.message);
    } catch (err) {
      setMessage('Failed to toggle maintenance mode.');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderToggle = async (provider, enable) => {
    if (!window.confirm(`Are you sure you want to ${enable ? 'ENABLE' : 'DISABLE'} ${provider}?`)) return;
    setLoading(true);
    try {
      const res = await API.post('/api/management/emergency/provider', { provider, isEnabled: enable });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(`Failed to toggle ${provider}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!window.confirm(`DANGER: Are you sure you want to rollback the configuration to the last stable snapshot?`)) return;
    setLoading(true);
    try {
      const res = await API.post('/api/management/emergency/rollback');
      setMessage(res.data.message);
    } catch (err) {
      setMessage('Failed to trigger rollback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={32} />
            Emergency Actions
          </h1>
          <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>High-stakes system overrides. Use with caution.</p>
        </div>
      </div>

      {message && (
        <div style={{ padding: '16px', backgroundColor: '#38bdf820', color: '#38bdf8', border: '1px solid #38bdf850', borderRadius: '8px', marginBottom: '24px' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* Maintenance Mode */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #ef444450', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle color="#ef4444" /> Global Maintenance Mode
          </h3>
          <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
            Instantly blocks all user access to the frontend application. Use during critical database migrations or severe outages.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              disabled={loading}
              onClick={() => handleMaintenance(true)}
              style={{ padding: '12px 24px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Enable Maintenance
            </button>
            <button 
              disabled={loading}
              onClick={() => handleMaintenance(false)}
              style={{ padding: '12px 24px', backgroundColor: 'transparent', color: '#10b981', border: '1px solid #10b981', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Disable Maintenance
            </button>
          </div>
        </div>

        {/* Provider Controls */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #eab30850', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Power color="#eab308" /> Provider Overrides
          </h3>
          <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
            Manually disable failing providers to prevent transaction failures.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {['clubkonnect', 'reloadly', 'flutterwave', 'peyflex'].map(provider => (
              <div key={provider} style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#cbd5e1', fontWeight: '500', textTransform: 'capitalize' }}>{provider}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                   <button onClick={() => handleProviderToggle(provider, true)} disabled={loading} style={{ padding: '6px 12px', backgroundColor: '#10b98120', color: '#10b981', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Enable</button>
                   <button onClick={() => handleProviderToggle(provider, false)} disabled={loading} style={{ padding: '6px 12px', backgroundColor: '#ef444420', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Disable</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rollback */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #3b82f650', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RotateCcw color="#3b82f6" /> Configuration Rollback
          </h3>
          <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
            Revert system settings and provider configurations to the last known stable snapshot.
          </p>
          <button 
            disabled={loading}
            onClick={handleRollback}
            style={{ padding: '12px 24px', backgroundColor: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Trigger Snapshot Rollback
          </button>
        </div>

      </div>
    </div>
  );
};

export default EmergencyActions;
