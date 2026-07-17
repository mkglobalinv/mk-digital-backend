import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit2, Trash2, Zap, Wifi, Smartphone, Monitor, Globe, Link } from 'lucide-react';
import API from '../../../api';
import { useToast } from '../../../context/ToastContext';
import './CampaignManager.css';

const ICONS = { Zap, Wifi, Smartphone, Monitor, Globe, Link };

const CampaignManager = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    campaignType: 'Promotion',
    title: '', subtitle: '', description: '', price: '', badgeText: '',
    bgColor: '#ffffff', gradientColor: '', icon: 'Zap', buttonText: 'View',
    actionType: 'Open Data Page', actionUrl: '', status: 'Active',
    displayMode: 'Dashboard Grid Only', startDate: '', endDate: '', sortOrder: 0,
    content: '', priority: 'Info', featuredImage: '', category: '', author: '', 
    tags: '', seoTitle: '', seoDescription: '', referralBonus: '', 
    termsConditions: '', advertiserName: '', displayPosition: 'Top'
  });

  const fetchCampaigns = async () => {
    try {
      const res = await API.get('/api/marketing/admin/campaigns', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setCampaigns(res.data);
    } catch (err) {
      showToast('Failed to fetch campaigns', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleOpenModal = (campaign = null) => {
    if (campaign) {
      setEditingId(campaign._id);
      setFormData({
        campaignType: campaign.campaignType || 'Promotion',
        targetAudience: campaign.targetAudience || 'All Users',
        title: campaign.title || '', subtitle: campaign.subtitle || '', description: campaign.description || '',
        price: campaign.price || '', badgeText: campaign.badgeText || '', bgColor: campaign.bgColor || '#ffffff',
        gradientColor: campaign.gradientColor || '', icon: campaign.icon || 'Zap', buttonText: campaign.buttonText || 'View',
        actionType: campaign.actionType || 'Open Data Page', actionUrl: campaign.actionUrl || '', status: campaign.status || 'Active',
        displayMode: campaign.displayMode || 'Dashboard Grid Only', 
        startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().slice(0, 16) : '',
        endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().slice(0, 16) : '',
        sortOrder: campaign.sortOrder || 0,
        content: campaign.content || '', priority: campaign.priority || 'Info', 
        featuredImage: campaign.featuredImage || '', category: campaign.category || '', 
        author: campaign.author || '', tags: campaign.tags ? campaign.tags.join(', ') : '', 
        seoTitle: campaign.seoTitle || '', seoDescription: campaign.seoDescription || '', 
        referralBonus: campaign.referralBonus || '', termsConditions: campaign.termsConditions || '', 
        advertiserName: campaign.advertiserName || '', displayPosition: campaign.displayPosition || 'Top'
      });
    } else {
      setEditingId(null);
      setFormData({
        campaignType: 'Promotion',
        targetAudience: 'All Users',
        title: '', subtitle: '', description: '', price: '', badgeText: '',
        bgColor: '#ffffff', gradientColor: '', icon: 'Zap', buttonText: 'View',
        actionType: 'Open Data Page', actionUrl: '', status: 'Active',
        displayMode: 'Dashboard Grid Only', startDate: '', endDate: '', sortOrder: 0,
        content: '', priority: 'Info', featuredImage: '', category: '', author: '', 
        tags: '', seoTitle: '', seoDescription: '', referralBonus: '', 
        termsConditions: '', advertiserName: '', displayPosition: 'Top'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      return showToast('Title is required', 'error');
    }
    if (formData.campaignType === 'Blog' && !formData.content) {
      return showToast('Blog content is required', 'error');
    }

    setIsSaving(true);
    const actionText = editingId ? `Updating ${formData.campaignType.toLowerCase()}` : `Creating ${formData.campaignType.toLowerCase()}`;
    showToast(`⏳ ${actionText}...`, 'info');

    try {
      const payload = { ...formData, tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [] };
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;

      if (editingId) {
        await API.put(`/api/marketing/admin/campaigns/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        showToast('✅ Campaign updated successfully', 'success');
      } else {
        await API.post('/api/marketing/admin/campaigns', payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        showToast('✅ Campaign created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchCampaigns();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Unknown error';
      showToast(`❌ Failed to save campaign: ${errMsg}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    
    setIsDeletingId(id);
    showToast('⏳ Deleting campaign...', 'info');

    try {
      await API.delete(`/api/marketing/admin/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      showToast('✅ Campaign deleted successfully', 'success');
      fetchCampaigns();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Unknown error';
      showToast(`❌ Failed to delete campaign: ${errMsg}`, 'error');
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="promotion-grid-manager animate-fade-in">
      <div className="admin-page-header">
        <div>
          <h2>Campaign Manager</h2>
          <p>Create and manage visual grid and popup campaigns</p>
        </div>
        <button className="create-btn" onClick={() => handleOpenModal()}>
          <PlusCircle size={18} /> Create Campaign
        </button>
      </div>

      <div className="table-container">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
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
              <tr><td colSpan="8" style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : campaigns.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center' }}>No campaigns found.</td></tr>
            ) : campaigns.map(camp => {
              const ctr = camp.views > 0 ? ((camp.clicks / camp.views) * 100).toFixed(1) : '0.0';
              return (
                <tr key={camp._id}>
                  <td>
                    <strong>{camp.title}</strong>
                    {camp.price && <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{camp.price}</div>}
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', padding: '2px 6px', background: '#f1f5f9', borderRadius: '4px' }}>
                      {camp.campaignType}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${camp.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                      {camp.status}
                    </span>
                  </td>
                  <td>{camp.displayMode}</td>
                  <td>{camp.views}</td>
                  <td>{camp.clicks}</td>
                  <td>{ctr}%</td>
                  <td>
                      <div className="action-buttons">
                        <button className="btn-icon edit" onClick={() => handleOpenModal(camp)} disabled={isDeletingId === camp._id}><Edit2 size={16} /></button>
                        <button className="btn-icon delete" onClick={() => handleDelete(camp._id)} disabled={isDeletingId === camp._id}>
                          {isDeletingId === camp._id ? <span className="spinner-mini"></span> : <Trash2 size={16} />}
                        </button>
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
              <h2>{editingId ? 'Edit Campaign' : 'New Campaign'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Campaign Type</label>
                <select value={formData.campaignType} onChange={e => setFormData({...formData, campaignType: e.target.value})}>
                  <option value="Promotion">Promotion</option>
                  <option value="Announcement">Announcement</option>
                  <option value="Blog">Blog</option>
                  <option value="Referral">Referral</option>
                  <option value="Advertisement">Advertisement</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Target Audience</label>
                <select value={formData.targetAudience} onChange={e => setFormData({...formData, targetAudience: e.target.value})}>
                  <option value="All Users">All Users (Everyone)</option>
                  <option value="Retail Users">Retail Users</option>
                  <option value="Resellers">Resellers</option>
                  <option value="Reseller Customers">Reseller Customers</option>
                </select>
                {(formData.targetAudience === 'Resellers' || formData.targetAudience === 'Reseller Customers') && formData.campaignType !== 'Announcement' && (
                   <div style={{ color: '#F59E0B', fontSize: '12px', marginTop: '4px' }}>⚠️ Note: Resellers and their customers only see Announcements. This campaign will be automatically hidden from them unless the type is changed.</div>
                )}
              </div>

              {formData.campaignType === 'Promotion' && (
                <>
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
                      <option value="None">None</option>
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
                </>
              )}

              {formData.campaignType === 'Announcement' && (
                <>
                  <div className="form-group full-width">
                    <label>Announcement Title *</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Scheduled Maintenance" />
                  </div>
                  <div className="form-group full-width">
                    <label>Announcement Content</label>
                    <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Message content..." rows="3" />
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                      <option value="Info">Info</option>
                      <option value="Warning">Warning</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </>
              )}

              {formData.campaignType === 'Blog' && (
                <>
                  <div className="form-group full-width">
                    <label>Blog Title *</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Top 10 Data Saving Tips" />
                  </div>
                  <div className="form-group full-width">
                    <label>Featured Image URL</label>
                    <input type="text" value={formData.featuredImage} onChange={e => setFormData({...formData, featuredImage: e.target.value})} placeholder="https://..." />
                  </div>
                  <div className="form-group full-width">
                    <label>Blog Content *</label>
                    <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Write your blog post..." rows="6" />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g. Tech Tips" />
                  </div>
                  <div className="form-group">
                    <label>Author</label>
                    <input type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} placeholder="e.g. Admin" />
                  </div>
                  <div className="form-group full-width">
                    <label>Tags (Comma separated)</label>
                    <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="e.g. news, update, guide" />
                  </div>
                  <div className="form-group">
                    <label>SEO Title</label>
                    <input type="text" value={formData.seoTitle} onChange={e => setFormData({...formData, seoTitle: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>SEO Description</label>
                    <input type="text" value={formData.seoDescription} onChange={e => setFormData({...formData, seoDescription: e.target.value})} />
                  </div>
                </>
              )}

              {formData.campaignType === 'Referral' && (
                <>
                  <div className="form-group full-width">
                    <label>Campaign Name *</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Refer & Earn" />
                  </div>
                  <div className="form-group">
                    <label>Referral Bonus</label>
                    <input type="text" value={formData.referralBonus} onChange={e => setFormData({...formData, referralBonus: e.target.value})} placeholder="e.g. ₦500" />
                  </div>
                  <div className="form-group">
                    <label>CTA Button Text</label>
                    <input type="text" value={formData.buttonText} onChange={e => setFormData({...formData, buttonText: e.target.value})} placeholder="e.g. Invite Friends" />
                  </div>
                  <div className="form-group full-width">
                    <label>Referral Description</label>
                    <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Invite a friend and earn..." rows="2" />
                  </div>
                  <div className="form-group full-width">
                    <label>Terms & Conditions</label>
                    <textarea value={formData.termsConditions} onChange={e => setFormData({...formData, termsConditions: e.target.value})} placeholder="Valid for new users only..." rows="2" />
                  </div>
                </>
              )}

              {formData.campaignType === 'Advertisement' && (
                <>
                  <div className="form-group">
                    <label>Advertiser Name</label>
                    <input type="text" value={formData.advertiserName} onChange={e => setFormData({...formData, advertiserName: e.target.value})} placeholder="e.g. Coca Cola" />
                  </div>
                  <div className="form-group">
                    <label>Advertisement Title *</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Summer Promo" />
                  </div>
                  <div className="form-group full-width">
                    <label>Banner Image URL</label>
                    <input type="text" value={formData.featuredImage} onChange={e => setFormData({...formData, featuredImage: e.target.value})} placeholder="https://..." />
                  </div>
                  <div className="form-group full-width">
                    <label>Destination URL</label>
                    <input type="text" value={formData.actionUrl} onChange={e => setFormData({...formData, actionUrl: e.target.value})} placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label>Display Position</label>
                    <select value={formData.displayPosition} onChange={e => setFormData({...formData, displayPosition: e.target.value})}>
                      <option value="Top">Top</option>
                      <option value="Middle">Middle</option>
                      <option value="Bottom">Bottom</option>
                      <option value="Sidebar">Sidebar</option>
                    </select>
                  </div>
                </>
              )}
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
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancel</button>
              <button className="btn-save" onClick={handleSave} disabled={isSaving}>
                {isSaving ? '⏳ Saving...' : 'Save Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManager;
