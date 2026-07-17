import React, { useState, useEffect } from 'react';
import { Database, Plus, Save, AlertCircle, Eye, EyeOff, Power, PowerOff, Trash2, Edit3, CheckCircle2 } from 'lucide-react';
import API from '../../api';
import './DataCategoryManager.css';

const DataCategoryManager = ({ token, providerName, onBack }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [detectedCategories, setDetectedCategories] = useState([]);
  const [detecting, setDetecting] = useState(false);
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [newCatStatus, setNewCatStatus] = useState('ACTIVE');
  const [saving, setSaving] = useState(false);

  // Edit Message state
  const [editingId, setEditingId] = useState(null);
  const [editMessage, setEditMessage] = useState('');

  useEffect(() => {
    if (providerName) fetchCategories();
  }, [providerName]);

  const fetchCategories = () => {
    setLoading(true);
    API.get(`/api/data-categories/admin/${providerName}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setCategories(res.data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching categories:", err);
        setLoading(false);
      });
  };

  const openAddModal = () => {
    setShowAddModal(true);
    setDetecting(true);
    setSelectedDetection(null);
    setNewCatStatus('ACTIVE');
    
    API.get(`/api/data-categories/admin/${providerName}/auto-detect`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setDetectedCategories(res.data.data || []);
        setDetecting(false);
      })
      .catch(err => {
        console.error("Error auto-detecting:", err);
        setDetecting(false);
      });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!selectedDetection) return alert("Please select a category to add");

    setSaving(true);
    API.post('/api/data-categories/admin', {
      provider_name: providerName,
      category_name: selectedDetection.category_name,
      status: newCatStatus,
      visibility: 'VISIBLE',
      maintenance_message: ''
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setSaving(false);
        setShowAddModal(false);
        fetchCategories();
      })
      .catch(err => {
        console.error("Error creating category:", err);
        alert(err.response?.data?.message || "Failed to create category");
        setSaving(false);
      });
  };

  const handleToggleStatus = (id) => {
    API.patch(`/api/data-categories/admin/${id}/toggle-status`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => fetchCategories())
      .catch(err => alert("Failed to toggle status"));
  };

  const handleToggleVisibility = (id) => {
    API.patch(`/api/data-categories/admin/${id}/toggle-visibility`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => fetchCategories())
      .catch(err => alert("Failed to toggle visibility"));
  };

  const saveMessage = (id) => {
    API.put(`/api/data-categories/admin/${id}`, {
      maintenance_message: editMessage
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setEditingId(null);
        fetchCategories();
      })
      .catch(err => alert("Failed to save message"));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this category control? Plans will still exist but won't be managed.")) return;
    
    // Deleting usually goes via DELETE route. We didn't build one, so let's just 
    // fetch, we can add a delete route in controller if needed, but for now
    // let's assume it's just disabled visually. Wait, user specifically requested Delete.
    // I will use an API call for it. I need to make sure I add DELETE endpoint.
    API.delete(`/api/data-categories/admin/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => fetchCategories())
      .catch(err => alert("Failed to delete category"));
  };

  return (
    <div className="data-category-wrapper animate-fade-in">
      <div className="category-header">
        <div>
          <button className="icon-btn" onClick={onBack} style={{ marginBottom: '16px' }}>
            <i className="fi fi-rr-arrow-left"></i> Back to Providers
          </button>
          <h2>{providerName.toUpperCase()} Categories</h2>
          <p>Visually manage network categories specifically for {providerName.toUpperCase()}.</p>
        </div>
      </div>

      <div className="category-actions">
        <button className="premium-btn premium-btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Add Category
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-gray)' }}>Loading Categories...</div>
        ) : (
          <table className="category-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Status (Lock)</th>
                <th>Visibility (UI)</th>
                <th>Total Plans</th>
                <th>Maintenance Message</th>
                <th>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat._id}>
                  <td style={{ fontWeight: '700', fontSize: '15px' }}>{cat.category_name}</td>
                  
                  <td>
                    <span className={`status-badge ${cat.status.toLowerCase()}`}>
                      {cat.status === 'ACTIVE' ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                      {cat.status}
                    </span>
                  </td>
                  
                  <td>
                    <span className={`status-badge ${cat.visibility.toLowerCase()}`}>
                      {cat.visibility === 'VISIBLE' ? <Eye size={12}/> : <EyeOff size={12}/>}
                      {cat.visibility}
                    </span>
                  </td>
                  
                  <td>
                    <span className="plan-count">{cat.total_plans || 0} Plans</span>
                  </td>
                  
                  <td>
                    {editingId === cat._id ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          className="message-input"
                          autoFocus
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveMessage(cat._id)}
                        />
                        <button className="icon-btn primary" onClick={() => saveMessage(cat._id)} title="Save"><Save size={16}/></button>
                      </div>
                    ) : (
                      <div style={{ color: cat.maintenance_message ? 'var(--text-dark)' : 'var(--text-muted)', fontSize: '14px', fontStyle: cat.maintenance_message ? 'normal' : 'italic' }}>
                        {cat.maintenance_message || "No alert message set"}
                      </div>
                    )}
                  </td>
                  
                  <td>
                    <div className="action-btn-group">
                      {/* Toggle Visibility (Show/Hide) */}
                      <button 
                        className={`icon-btn ${cat.visibility === 'VISIBLE' ? 'danger' : 'success'}`} 
                        onClick={() => handleToggleVisibility(cat._id)}
                        title={cat.visibility === 'VISIBLE' ? 'Hide Category' : 'Show Category'}
                      >
                        {cat.visibility === 'VISIBLE' ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      
                      {/* Toggle Status (Enable/Maintenance) */}
                      <button 
                        className={`icon-btn ${cat.status === 'ACTIVE' ? 'warning' : 'success'}`} 
                        onClick={() => handleToggleStatus(cat._id)}
                        title={cat.status === 'ACTIVE' ? 'Set Maintenance' : 'Enable Category'}
                      >
                        {cat.status === 'ACTIVE' ? <PowerOff size={16} /> : <Power size={16} />}
                      </button>
                      
                      {/* Edit Message */}
                      <button 
                        className="icon-btn primary" 
                        onClick={() => { setEditingId(cat._id); setEditMessage(cat.maintenance_message); }}
                        title="Edit Message"
                      >
                        <Edit3 size={16} />
                      </button>

                      {/* Delete */}
                      <button 
                        className="icon-btn danger" 
                        onClick={() => handleDelete(cat._id)}
                        title="Delete Category"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>
                    No categories configured. Click "Add Category" to auto-detect from your plans.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-scale-in">
            <h3>Add New Category</h3>
            <p>Auto-detected categories from your existing data plans.</p>
            
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Detected Categories (Unmanaged)</label>
                {detecting ? (
                  <div style={{ padding: '12px', background: 'var(--bg-color)', borderRadius: '8px', color: 'var(--text-gray)', textAlign: 'center' }}>
                    Scanning database...
                  </div>
                ) : detectedCategories.length > 0 ? (
                  <div className="detection-list">
                    {detectedCategories.map((det, idx) => (
                      <div 
                        key={idx} 
                        className={`detection-item ${selectedDetection?.category_name === det.category_name ? 'selected' : ''}`}
                        onClick={() => setSelectedDetection(det)}
                      >
                        <span style={{ fontWeight: '600' }}>{det.category_name}</span>
                        <span className="plan-count" style={{ fontSize: '12px' }}>{det.total_plans} Plans</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '12px', background: 'var(--bg-color)', borderRadius: '8px', color: 'var(--text-gray)', textAlign: 'center' }}>
                    All data plan categories are already managed!
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Initial Status</label>
                <select 
                  className="select-dropdown"
                  value={newCatStatus}
                  onChange={(e) => setNewCatStatus(e.target.value)}
                  disabled={detectedCategories.length === 0}
                >
                  <option value="ACTIVE">ACTIVE (Working Normally)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Locked)</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" className="premium-btn premium-btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="premium-btn premium-btn-primary" disabled={saving || detectedCategories.length === 0}>
                  {saving ? 'Creating...' : 'Add Selected Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataCategoryManager;
