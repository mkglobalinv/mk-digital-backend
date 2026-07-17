import React, { useState, useEffect } from 'react';
import { ToggleRight, ToggleLeft, DollarSign, Settings, ShieldCheck, Plus, Trash2, AlertTriangle } from 'lucide-react';
import API from '../../api';
import './ServiceManager.css';

const ServiceManager = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = () => {
    API.get('/api/admin/settings')
      .then(res => {
        setSettings(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching settings:", err);
        setLoading(false);
      });
  };

  const handleToggleService = (key, currentValue) => {
    API.post('/api/admin/settings', { key, value: !currentValue })
      .then(() => fetchSettings());
  };

  const handleUpdatePrice = (key, newValue) => {
    API.post('/api/admin/settings', { key, value: Number(newValue) })
      .then(() => fetchSettings());
  };

  // --- SERVICE STATUS PANEL STATES & HANDLERS ---
  const [statuses, setStatuses] = useState([]);
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [newStatus, setNewStatus] = useState({
    serviceName: 'MTN',
    statusType: 'active',
    statusMessage: '',
    severityColor: 'green',
    targetAudience: 'all',
    expiresAt: '',
    isActive: true
  });

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = () => {
    API.get('/api/service-status/admin')
      .then(res => {
        if (res.data && res.data.data) {
          setStatuses(res.data.data);
        }
      })
      .catch(err => console.error("Error fetching statuses:", err));
  };

  const handleStatusTypeChange = (type) => {
    let color = 'green';
    if (type === 'delayed') color = 'yellow';
    else if (type === 'maintenance') color = 'red';
    else if (type === 'informational') color = 'blue';

    setNewStatus(prev => ({
      ...prev,
      statusType: type,
      severityColor: color
    }));
  };

  const handleCreateStatus = (e) => {
    e.preventDefault();
    if (!newStatus.statusMessage) return alert("Please enter a status message");

    API.post('/api/service-status/admin', newStatus)
      .then(() => {
        fetchStatuses();
        setNewStatus({
          serviceName: 'MTN',
          statusType: 'active',
          statusMessage: '',
          severityColor: 'green',
          targetAudience: 'all',
          expiresAt: '',
          isActive: true
        });
        setShowStatusForm(false);
      })
      .catch(err => {
        console.error("Error creating status:", err);
        alert(err.response?.data?.message || "Failed to create status notice");
      });
  };

  const handleToggleStatusActive = (id, currentVal) => {
    API.put(`/api/service-status/admin/${id}`, { isActive: !currentVal })
      .then(() => fetchStatuses())
      .catch(err => console.error("Error toggling status active:", err));
  };

  const handleDeleteStatus = (id) => {
    if (window.confirm("Are you sure you want to delete this status notice?")) {
      API.delete(`/api/service-status/admin/${id}`)
        .then(() => fetchStatuses())
        .catch(err => console.error("Error deleting status:", err));
    }
  };

  const renderServiceCard = (title, key, icon) => {
    const setting = settings.find(s => s.key === key) || { value: true };
    return (
      <div className="service-card">
        <div className="service-icon">{icon}</div>
        <div className="service-info">
          <h3>{title}</h3>
          <p>Global availability of this service</p>
        </div>
        <button 
          className={`toggle-btn ${setting.value ? 'on' : 'off'}`}
          onClick={() => handleToggleService(key, setting.value)}
        >
          {setting.value ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
        </button>
      </div>
    );
  };

  const renderPricingCard = (title, key, type = 'margin') => {
    const setting = settings.find(s => s.key === key) || { value: 0 };
    return (
      <div className="pricing-card">
        <div className="pricing-info">
          <h4>{title}</h4>
          <span>{type === 'margin' ? 'Profit Margin (%)' : 'Fixed Fee (₦)'}</span>
        </div>
        <div className="pricing-input">
          <input 
            type="number" 
            value={setting.value} 
            onChange={(e) => handleUpdatePrice(key, e.target.value)}
            step={type === 'margin' ? '0.01' : '1'}
          />
          <div className="unit">{type === 'margin' ? '%' : '₦'}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="service-manager-wrapper">
      <div className="section-header">
        <h2>Service Control Center</h2>
        <p>Manage app availability and global pricing margins.</p>
      </div>

      <div className="services-grid">
        {renderServiceCard('Airtime Purchase', 'service_airtime', <DollarSign />)}
        {renderServiceCard('Data Purchase', 'service_data', <Settings />)}
        {renderServiceCard('Cable TV', 'service_cable', <Settings />)}
        {renderServiceCard('Electricity', 'service_utility', <ShieldCheck />)}
      </div>

      <div className="section-header mt-40">
        <h2>Global Pricing & Margins</h2>
        <p>Set the percentage of profit you want to earn on each transaction.</p>
      </div>

      <div className="pricing-grid">
        {renderPricingCard('MTN Airtime Margin', 'margin_mtn_airtime')}
        {renderPricingCard('GLO Airtime Margin', 'margin_glo_airtime')}
        {renderPricingCard('AIRTEL Airtime Margin', 'margin_airtel_airtime')}
        {renderPricingCard('MTN Data Margin', 'margin_mtn_data')}
        {renderPricingCard('Dataway Service Fee', 'fee_dataway', 'fixed')}
      </div>

      {/* --- SERVICE STATUS CENTER MANAGEMENT PANEL --- */}
      <div className="admin-status-section">
        <div className="admin-status-header">
          <div>
            <h3>Real-Time Service Status Center</h3>
            <p style={{ margin: 0, fontSize: '13.3px', color: 'var(--text-light)', marginTop: '2px' }}>
              Create, edit, toggle and schedule health status badges displayed live to your users.
            </p>
          </div>
          {!showStatusForm && (
            <button className="btn-add-status" onClick={() => setShowStatusForm(true)}>
              <Plus size={16} />
              <span>Add Status Alert</span>
            </button>
          )}
        </div>

        {showStatusForm && (
          <form className="status-form-card" onSubmit={handleCreateStatus}>
            <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '800', color: 'var(--text-dark)' }}>
              Create New Live Health Notice
            </h4>
            <div className="status-form-grid">
              <div className="form-group">
                <label>Service Target</label>
                <select 
                  value={newStatus.serviceName}
                  onChange={(e) => setNewStatus(prev => ({ ...prev, serviceName: e.target.value }))}
                >
                  <option value="MTN">MTN</option>
                  <option value="Airtel">Airtel</option>
                  <option value="GLO">GLO</option>
                  <option value="9mobile">9mobile</option>
                  <option value="Airtime">Airtime</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Cable">Cable</option>
                  <option value="Exam Pins">Exam Pins</option>
                  <option value="Wallet/Transfer systems">Wallet/Transfer systems</option>
                </select>
              </div>

              <div className="form-group">
                <label>Operational State</label>
                <select 
                  value={newStatus.statusType}
                  onChange={(e) => handleStatusTypeChange(e.target.value)}
                >
                  <option value="active">Active / Stable</option>
                  <option value="delayed">Delayed / Slow</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="informational">Informational</option>
                </select>
              </div>

              <div className="form-group">
                <label>Severity Glow Color</label>
                <select 
                  value={newStatus.severityColor}
                  onChange={(e) => setNewStatus(prev => ({ ...prev, severityColor: e.target.value }))}
                >
                  <option value="green">Green (Normal)</option>
                  <option value="yellow">Yellow / Amber (Warning)</option>
                  <option value="red">Red (Offline/Alert)</option>
                  <option value="blue">Blue (Info)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Audience Tier Filter</label>
                <select 
                  value={newStatus.targetAudience}
                  onChange={(e) => setNewStatus(prev => ({ ...prev, targetAudience: e.target.value }))}
                >
                  <option value="all">All Users (Global)</option>
                  <option value="customer">Customers Only</option>
                  <option value="reseller">Resellers Only</option>
                  <option value="premium_reseller">Premium Resellers Only</option>
                </select>
              </div>

              <div className="form-group">
                <label>Schedule Expiration (Optional)</label>
                <input 
                  type="datetime-local" 
                  value={newStatus.expiresAt}
                  onChange={(e) => setNewStatus(prev => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>

              <div className="form-group form-group-full">
                <label>Status Message / Copy Wording</label>
                <input 
                  type="text" 
                  placeholder="e.g. MTN SME Active, GLO Delayed, Wallet System Maintenance"
                  value={newStatus.statusMessage}
                  onChange={(e) => setNewStatus(prev => ({ ...prev, statusMessage: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowStatusForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-submit">
                Publish Live Status
              </button>
            </div>
          </form>
        )}

        <div className="admin-table-container">
          <table className="admin-status-table">
            <thead>
              <tr>
                <th>Service Target</th>
                <th>Wording / Copy</th>
                <th>Display State</th>
                <th>Audience Filter</th>
                <th>Schedule Expire</th>
                <th>Visibility</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {statuses.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-light)', padding: '24px' }}>
                    No custom status notices created. Displaying default system-seeded indicators on client dashboards.
                  </td>
                </tr>
              ) : (
                statuses.map(item => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{item.serviceName}</td>
                    <td style={{ color: 'var(--text-gray)' }}>{item.statusMessage}</td>
                    <td>
                      <span className={`status-badge ${item.statusType || 'active'}`}>
                        <span className="badge-dot"></span>
                        {item.statusType}
                      </span>
                    </td>
                    <td>
                      <span className="audience-tag">{item.targetAudience.replace('_', ' ')}</span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                      {item.expiresAt ? new Date(item.expiresAt).toLocaleString() : 'Never'}
                    </td>
                    <td>
                      <button 
                        className={`toggle-btn ${item.isActive ? 'on' : 'off'}`}
                        onClick={() => handleToggleStatusActive(item._id, item.isActive)}
                      >
                        {item.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="admin-btn-icon delete" 
                        onClick={() => handleDeleteStatus(item._id)}
                        title="Delete Alert Notice"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ServiceManager;
