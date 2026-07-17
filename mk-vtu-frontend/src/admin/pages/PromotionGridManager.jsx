import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit2, Trash2, Zap, Wifi, Smartphone, Monitor, Globe, Link } from 'lucide-react';
import API from '../../api';
import { useToast } from '../../context/ToastContext';
import './PromotionGridManager.css';

const ICONS = { Zap, Wifi, Smartphone, Monitor, Globe, Link };

const PromotionGridManager = () => {
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    title: '', subtitle: '', description: '', price: '', badgeText: '',
    bgColor: '#ffffff', gradientColor: '', icon: 'Zap', buttonText: 'View',
    actionType: 'Open Data Page', actionUrl: '', status: 'Active',
    displayMode: 'Dashboard Grid Only', startDate: '', endDate: '', sortOrder: 0
  });

  const fetchPromotions = async () => {
    try {
      const res = await API.get('/api/promotions/admin', {
        headers: { Authorization: `Bearer ${(localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'))}` }
      });
      setPromotions(res.data);
    } catch (err) {
      addToast('Failed to fetch promotions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleOpenModal = (promo = null) => {
    if (promo) {
      setEditingId(promo._id);
      setFormData({
        title: promo.title || '', subtitle: promo.subtitle || '', description: promo.description || '',
        price: promo.price || '', badgeText: promo.badgeText || '', bgColor: promo.bgColor || '#ffffff',
        gradientColor: promo.gradientColor || '', icon: promo.icon || 'Zap', buttonText: promo.buttonText || 'View',
        actionType: promo.actionType || 'Open Data Page', actionUrl: promo.actionUrl || '', status: promo.status || 'Active',
        displayMode: promo.displayMode || 'Dashboard Grid Only', 
        startDate: promo.startDate ? new Date(promo.startDate).toISOString().slice(0, 16) : '',
        endDate: promo.endDate ? new Date(promo.endDate).toISOString().slice(0, 16) : '',
        sortOrder: promo.sortOrder || 0
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '', subtitle: '', description: '', price: '', badgeText: '',
        bgColor: '#ffffff', gradientColor: '', icon: 'Zap', buttonText: 'View',
        actionType: 'Open Data Page', actionUrl: '', status: 'Active',
        displayMode: 'Dashboard Grid Only', startDate: '', endDate: '', sortOrder: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      return addToast('Title is required', 'error');
    }

    try {
      const payload = { ...formData };
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;

      if (editingId) {
        await API.put(`/api/promotions/admin/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${(localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'))}` }
        });
        addToast('Promotion updated', 'success');
      } else {
        await API.post('/api/promotions/admin', payload, {
          headers: { Authorization: `Bearer ${(localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'))}` }
        });
        addToast('Promotion created', 'success');
      }
      setIsModalOpen(false);
      fetchPromotions();
    } catch (err) {
      addToast('Failed to save promotion', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) return;
    try {
      await API.delete(`/api/promotions/admin/${id}`, {
        headers: { Authorization: `Bearer ${(localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'))}` }
      });
      addToast('Promotion deleted', 'success');
      fetchPromotions();
    } catch (err) {
      addToast('Failed to delete promotion', 'error');
    }
  };

  return (
    <div className="promotion-grid-manager animate-fade-in">
      <div className="admin-page-header">
        <div>
          <h2>Promotion Grid Manager</h2>
          <p>Manage the dynamic 2x2 fintech promotion grid</p>
        </div>
        <button className="create-btn" onClick={() => handleOpenModal()}>
          <PlusCircle size={18} /> Create Promotion
        </button>
      </div>

      <div className="table-container">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Display Mode</th>
              <th>Views</th>
              <th>Clicks</th>
              <th>CTR</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : promotions.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>No promotions found.</td></tr>
            ) : promotions.map(promo => {
              const ctr = promo.views > 0 ? ((promo.clicks / promo.views) * 100).toFixed(1) : '0.0';
              return (
                <tr key={promo._id}>
                  <td>
                    <strong>{promo.title}</strong>
                    {promo.price && <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{promo.price}</div>}
                  </td>
                  <td>
                    <span className={`status-badge ${promo.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                      {promo.status}
                    </span>
                  </td>
                  <td>{promo.displayMode}</td>
                  <td>{promo.views}</td>
                  <td>{promo.clicks}</td>
                  <td>{ctr}%</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon edit" onClick={() => handleOpenModal(promo)}><Edit2 size={16} /></button>
                      <button className="btn-icon delete" onClick={() => handleDelete(promo._id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Promotion' : 'New Promotion'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Title *</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. MTN 1GB" />
              </div>
              <div className="form-group">
                <label>Subtitle / Description</label>
                <input type="text" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} placeholder="e.g. Limited Offer" />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input type="text" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="e.g. ₦400" />
              </div>
              <div className="form-group">
                <label>Badge Text</label>
                <input type="text" value={formData.badgeText} onChange={e => setFormData({...formData, badgeText: e.target.value})} placeholder="e.g. Hot" />
              </div>

              <div className="form-group">
                <label>Background Color</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="text" value={formData.bgColor} onChange={e => setFormData({...formData, bgColor: e.target.value})} placeholder="#ffffff or rgba(..)" />
                  <div className="color-preview" style={{ background: formData.bgColor }}></div>
                </div>
              </div>
              <div className="form-group">
                <label>Gradient Color (Optional)</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="text" value={formData.gradientColor} onChange={e => setFormData({...formData, gradientColor: e.target.value})} placeholder="e.g. #f3f4f6" />
                  <div className="color-preview" style={{ background: formData.gradientColor || formData.bgColor }}></div>
                </div>
              </div>

              <div className="form-group">
                <label>Icon</label>
                <select value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})}>
                  {Object.keys(ICONS).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Action Type</label>
                <select value={formData.actionType} onChange={e => setFormData({...formData, actionType: e.target.value})}>
                  <option value="Open Data Page">Open Data Page</option>
                  <option value="Open Airtime Page">Open Airtime Page</option>
                  <option value="Open Cable TV Page">Open Cable TV Page</option>
                  <option value="Open Electricity Page">Open Electricity Page</option>
                  <option value="Open Registration Page">Open Registration Page</option>
                  <option value="Open WhatsApp">Open WhatsApp</option>
                  <option value="Open Service Category">Open Service Category</option>
                  <option value="Open External Link">Open External Link</option>
                  <option value="Open Internal Route">Open Internal Route</option>
                  <option value="Custom URL">Custom URL</option>
                </select>
              </div>

              {['Open External Link', 'Open Internal Route', 'Custom URL'].includes(formData.actionType) && (
                <div className="form-group full-width">
                  <label>Action URL</label>
                  <input type="text" value={formData.actionUrl} onChange={e => setFormData({...formData, actionUrl: e.target.value})} placeholder="https://..." />
                </div>
              )}

              <div className="form-group">
                <label>Button Text</label>
                <input type="text" value={formData.buttonText} onChange={e => setFormData({...formData, buttonText: e.target.value})} placeholder="View" />
              </div>
              <div className="form-group">
                <label>Sort Order</label>
                <input type="number" value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: Number(e.target.value)})} />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group">
                <label>Display Mode</label>
                <select value={formData.displayMode} onChange={e => setFormData({...formData, displayMode: e.target.value})}>
                  <option value="Dashboard Grid Only">Dashboard Grid Only</option>
                  <option value="Popup Only">Popup Only</option>
                  <option value="Both">Both</option>
                  <option value="Hidden">Hidden</option>
                </select>
              </div>

              <div className="form-group">
                <label>Start Date (Optional)</label>
                <input type="datetime-local" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label>End Date (Optional)</label>
                <input type="datetime-local" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSave}>Save Promotion</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionGridManager;
