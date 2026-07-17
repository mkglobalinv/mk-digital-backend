import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Layout, 
  MessageSquare, 
  Type, 
  CheckCircle, 
  XCircle,
  Image as ImageIcon
} from 'lucide-react';
import API from '../../api';
import './ContentManager.css';

const ContentManager = ({ token }) => {
  const [activeTab, setActiveTab] = useState('banner');
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleting, setDeleting] = useState(null);
  
  const [formData, setFormData] = useState({
    type: 'banner',
    title: '',
    message: '',
    image: '',
    link: '',
    link_type: 'internal',
    is_active: true,
    forceGlobal: false,
    targetAudience: 'public'
  });

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const fetchContent = () => {
    setLoading(true);
    API.get(`/api/content?type=${activeTab}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setContents(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleSave = (e) => {
    e.preventDefault();
    const payload = { ...formData, type: activeTab };
    
    const request = editingItem 
      ? API.put(`/api/content/${editingItem._id}`, payload)
      : API.post('/api/content', payload);

    request.then(() => {
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchContent();
    }).catch(err => alert(err.response?.data?.message || "Save failed"));
  };

  const deleteItem = (id) => {
    setDeleting(id);
    API.delete(`/api/content/${id}`)
      .then(() => fetchContent())
      .catch(err => alert("Delete failed: " + (err.response?.data?.message || err.message)))
      .finally(() => setDeleting(null));
  };

  const resetForm = () => {
    setFormData({
      type: activeTab,
      title: '',
      message: '',
      image: '',
      link: '',
      link_type: 'internal',
      is_active: true,
      forceGlobal: false,
      targetAudience: 'public'
    });
  };

  const toggleStatus = (item) => {
    API.put(`/api/content/${item._id}`, { is_active: !item.is_active }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => fetchContent());
  };

  const tabs = [
    { id: 'banner', name: 'Banners', icon: <Layout size={18} /> },
    { id: 'marquee', name: 'Marquee Text', icon: <Type size={18} /> },
    { id: 'post', name: 'Announcements', icon: <MessageSquare size={18} /> },
  ];

  return (
    <div className="content-manager-wrapper">
      <div className="manager-header">
        <div className="header-info">
          <h1>Content Management</h1>
          <p>Manage dynamic banners, scrolling text, and announcements</p>
        </div>
        <button className="add-content-btn" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={20} />
          <span>Add {tabs.find(t => t.id === activeTab).name}</span>
        </button>
      </div>

      <div className="tabs-navigation">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="manager-loading">Loading content...</div>
      ) : (
        <div className="content-grid">
          {contents.length === 0 ? (
            <div className="empty-state">No {activeTab}s found. Add one to get started!</div>
          ) : (
            contents.map(item => (
              <div key={item._id} className={`content-card ${item.is_active ? 'active' : 'inactive'}`}>
                {activeTab === 'banner' && item.image && (
                  <div className="card-preview" style={{ backgroundImage: `url(${item.image})` }}>
                    {!item.is_active && <div className="status-badge">INACTIVE</div>}
                  </div>
                )}
                <div className="card-body">
                  <div className="card-title-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3>{item.title}</h3>
                      {item.forceGlobal && <span className="global-badge">GLOBAL</span>}
                    </div>
                    <button className="status-toggle" onClick={() => toggleStatus(item)}>
                      {item.is_active ? <CheckCircle size={18} color="#10B981" /> : <XCircle size={18} color="#9CA3AF" />}
                    </button>
                  </div>
                  {item.message && <p className="card-message">{item.message}</p>}
                  {item.link && (
                    <div className="link-indicator">
                      <Plus size={12} />
                      <span>{item.link_type === 'external' ? 'External' : 'Internal'}: {item.link}</span>
                    </div>
                  )}
                  <div className="card-actions">
                    <button className="edit-btn" onClick={() => { setEditingItem(item); setFormData(item); setShowModal(true); }}>
                      <Edit2 size={16} />
                      <span>Edit</span>
                    </button>
                    <button 
                      className="delete-btn" 
                      onClick={() => deleteItem(item._id)}
                    >
                      <Trash2 size={16} />
                      <span>{deleting === item._id ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content-card">
            <h2>{editingItem ? 'Edit' : 'Add New'} {activeTab}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Title / Heading</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="Enter title"
                  required 
                />
              </div>

              <div className="form-group">
                <label>Message / Description</label>
                <textarea 
                  value={formData.message} 
                  onChange={e => setFormData({...formData, message: e.target.value})} 
                  placeholder={activeTab === 'marquee' ? "Enter scrolling message text" : "Enter message content"}
                />
              </div>

              {activeTab === 'banner' && (
                <div className="form-group">
                  <label>Image URL</label>
                  <div className="image-input-group">
                    <ImageIcon size={20} />
                    <input 
                      type="text" 
                      value={formData.image} 
                      onChange={e => setFormData({...formData, image: e.target.value})} 
                      placeholder="https://example.com/image.jpg"
                      required 
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Action Link (Optional)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    style={{ flex: 2 }}
                    value={formData.link} 
                    onChange={e => setFormData({...formData, link: e.target.value})} 
                    placeholder="https://example.com or /purchase"
                  />
                  <select 
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                    value={formData.link_type}
                    onChange={e => setFormData({...formData, link_type: e.target.value})}
                  >
                    <option value="internal">Internal</option>
                    <option value="external">External</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Target Audience</label>
                <select 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', background: 'var(--card-bg)', color: 'var(--text-main)' }}
                  value={formData.targetAudience || 'public'}
                  onChange={e => setFormData({...formData, targetAudience: e.target.value})}
                >
                  <option value="public">Public (Everyone)</option>
                  <option value="customer">Retail Customers Only</option>
                  <option value="reseller">Resellers Only (Basic + Premium)</option>
                  <option value="premium_reseller">Premium Resellers Only</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={formData.is_active} 
                    onChange={e => setFormData({...formData, is_active: e.target.checked})} 
                  />
                  <span>Active & Visible</span>
                </label>
              </div>

              {activeTab !== 'post' && (
                <div className="form-group checkbox-group" style={{ marginTop: '-10px' }}>
                  <label style={{ color: '#6366F1' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.forceGlobal} 
                      onChange={e => setFormData({...formData, forceGlobal: e.target.checked})} 
                    />
                    <strong style={{ marginLeft: '6px' }}>Force Global (Shows on all Reseller Sites)</strong>
                  </label>
                </div>
              )}

              <div className="modal-footer-actions">
                <button type="submit" className="save-btn">Save Content</button>
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManager;
