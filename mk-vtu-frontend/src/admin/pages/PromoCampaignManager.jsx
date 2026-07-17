import React, { useState, useEffect } from 'react';
import API from '../../api';
import { Megaphone, Plus, Trash2, Edit2, Play, Square, Eye, MousePointerClick } from 'lucide-react';
import './PromoCampaignManager.css';

const PromoCampaignManager = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  const initialFormState = {
    name: '',
    activeStatus: false,
    startDate: '',
    endDate: '',
    displayFrequency: 'once',
    ctaText: 'Buy Now',
    ctaUrl: '/purchase',
    cards: [
      { title: 'MTN 1GB', subtitle: '', price: '₦400', color: 'purple', icon: 'Network' },
      { title: 'MTN 3GB Weekly', subtitle: '', price: '₦1,300', color: 'blue', icon: 'Calendar' },
      { title: 'MTN 5GB Monthly', subtitle: '', price: '₦2,000', color: 'green', icon: 'Calendar' },
      { title: 'Start Your VTU Business', subtitle: 'Become a reseller today', price: 'From ₦5,000', color: 'orange', icon: 'Store' }
    ]
  };

  const [formData, setFormData] = useState({ ...initialFormState });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const res = await API.get('/api/promo-campaigns/admin');
      if (res.data.success) {
        setCampaigns(res.data.campaigns);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ ...initialFormState });
    setIsModalOpen(true);
  };

  const openEditModal = (camp) => {
    setEditingId(camp._id);
    setFormData({
      name: camp.name,
      activeStatus: camp.activeStatus,
      startDate: camp.startDate ? camp.startDate.substring(0, 10) : '',
      endDate: camp.endDate ? camp.endDate.substring(0, 10) : '',
      displayFrequency: camp.displayFrequency,
      ctaText: camp.ctaText,
      ctaUrl: camp.ctaUrl,
      cards: camp.cards.map(c => ({ title: c.title, subtitle: c.subtitle || '', price: c.price, color: c.color, icon: c.icon || '' }))
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/api/promo-campaigns/admin/${editingId}`, formData);
      } else {
        await API.post('/api/promo-campaigns/admin', formData);
      }
      setIsModalOpen(false);
      fetchCampaigns();
    } catch (err) {
      alert('Error saving campaign');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign completely?')) return;
    try {
      await API.delete(`/api/promo-campaigns/admin/${id}`);
      fetchCampaigns();
    } catch (err) {
      alert('Error deleting campaign');
    }
  };

  const toggleStatus = async (camp) => {
    try {
      await API.put(`/api/promo-campaigns/admin/${camp._id}`, { ...camp, activeStatus: !camp.activeStatus });
      fetchCampaigns();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const updateCard = (index, field, value) => {
    const newCards = [...formData.cards];
    newCards[index][field] = value;
    setFormData({ ...formData, cards: newCards });
  };

  const addCard = () => {
    setFormData({ ...formData, cards: [...formData.cards, { title: '', subtitle: '', price: '', color: 'blue', icon: '' }]});
  };

  const removeCard = (index) => {
    const newCards = formData.cards.filter((_, i) => i !== index);
    setFormData({ ...formData, cards: newCards });
  };

  return (
    <div className="promo-campaign-manager animate-fade-in">
      <div className="admin-page-header">
        <div>
          <h2><Megaphone size={24} style={{ display: 'inline', marginRight: '10px', verticalAlign: 'middle', color: 'var(--primary)' }} /> Promotional Campaigns</h2>
          <p>Manage popup modals and floating cards shown to users</p>
        </div>
        <button className="create-btn" onClick={openNewModal}>
          <Plus size={18} /> New Campaign
        </button>
      </div>

      {loading ? <div className="loading-spinner">Loading...</div> : (
        <div className="campaign-grid">
          {campaigns.length === 0 && <p className="no-data">No promotional campaigns found.</p>}
          {campaigns.map(camp => (
            <div className={`campaign-card ${camp.activeStatus ? 'active' : ''}`} key={camp._id}>
              <div className="camp-header">
                <h3>{camp.name}</h3>
                <span className={`status-badge ${camp.activeStatus ? 'badge-active' : 'badge-inactive'}`}>
                  {camp.activeStatus ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="camp-stats">
                <div className="stat">
                  <Eye size={16} /> {camp.viewsCount || 0} Views
                </div>
                <div className="stat">
                  <MousePointerClick size={16} /> {camp.clicksCount || 0} Clicks
                </div>
              </div>
              <div className="camp-info">
                <p><strong>Cards:</strong> {camp.cards?.length || 0}</p>
                <p><strong>CTA:</strong> {camp.ctaText}</p>
                <p><strong>Frequency:</strong> {camp.displayFrequency}</p>
              </div>
              <div className="camp-actions">
                <button onClick={() => toggleStatus(camp)} className={camp.activeStatus ? 'btn-stop' : 'btn-start'} title={camp.activeStatus ? 'Deactivate' : 'Activate'}>
                  {camp.activeStatus ? <Square size={16} /> : <Play size={16} />}
                </button>
                <button onClick={() => openEditModal(camp)} className="btn-edit" title="Edit">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(camp._id)} className="btn-delete" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content custom-scrollbar">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Campaign' : 'Create Campaign'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="form-section">
                <h3>General Settings</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Campaign Name</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Display Frequency</label>
                    <select value={formData.displayFrequency} onChange={e => setFormData({...formData, displayFrequency: e.target.value})}>
                      <option value="once">Once Per User</option>
                      <option value="always">Always Display</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Start Date (Optional)</label>
                    <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>End Date (Optional)</label>
                    <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Call-to-Action Text</label>
                    <input type="text" required value={formData.ctaText} onChange={e => setFormData({...formData, ctaText: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Call-to-Action URL</label>
                    <input type="text" required value={formData.ctaUrl} onChange={e => setFormData({...formData, ctaUrl: e.target.value})} />
                  </div>
                  <div className="form-group full-width" style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px'}}>
                    <input type="checkbox" id="activeStatus" checked={formData.activeStatus} onChange={e => setFormData({...formData, activeStatus: e.target.checked})} />
                    <label htmlFor="activeStatus" style={{margin: 0}}>Set as Active Immediately</label>
                  </div>
                </div>
              </div>

              <div className="form-section cards-section">
                <div className="cards-header">
                  <h3>Floating Cards</h3>
                  <button type="button" onClick={addCard} className="add-card-btn"><Plus size={14} /> Add Card</button>
                </div>
                
                {formData.cards.map((card, index) => (
                  <div className="card-editor" key={index}>
                    <div className="card-editor-header">
                      <h4>Card {index + 1}</h4>
                      <button type="button" onClick={() => removeCard(index)} className="remove-card-btn"><Trash2 size={14} /></button>
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Title</label>
                        <input type="text" required value={card.title} onChange={e => updateCard(index, 'title', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Subtitle (Optional)</label>
                        <input type="text" value={card.subtitle} onChange={e => updateCard(index, 'subtitle', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Price</label>
                        <input type="text" required value={card.price} onChange={e => updateCard(index, 'price', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Gradient Color</label>
                        <select value={card.color} onChange={e => updateCard(index, 'color', e.target.value)}>
                          <option value="purple">Purple</option>
                          <option value="blue">Blue</option>
                          <option value="green">Green</option>
                          <option value="orange">Orange</option>
                          <option value="red">Red</option>
                          <option value="pink">Pink</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Icon Identifier</label>
                        <input type="text" value={card.icon} onChange={e => updateCard(index, 'icon', e.target.value)} placeholder="e.g. Calendar, Network, Store" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-save">Save Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCampaignManager;
