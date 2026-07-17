import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit2, Trash2, AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import API from '../../../api';
import { useToast } from '../../../context/ToastContext';
import './AnnouncementManager.css';

const AnnouncementManager = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '', content: '', priority: 'Info', status: 'Active', startDate: '', endDate: '', targetAudience: 'All Users'
  });

  const fetchAnnouncements = async () => {
    try {
      const res = await API.get('/api/marketing/admin/announcements', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setAnnouncements(res.data);
    } catch (err) {
      showToast('Failed to fetch announcements', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingId(item._id);
      setFormData({
        title: item.title || '', content: item.content || '', priority: item.priority || 'Info',
        status: item.status || 'Active', targetAudience: item.targetAudience || 'All Users',
        startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 16) : '',
        endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 16) : ''
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '', content: '', priority: 'Info', status: 'Active', startDate: '', endDate: '', targetAudience: 'All Users'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      return showToast('Title and content are required', 'error');
    }

    setIsSaving(true);
    const actionText = editingId ? 'Updating announcement' : 'Creating announcement';
    showToast(`⏳ ${actionText}...`, 'info');

    try {
      const payload = { ...formData };
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;

      if (editingId) {
        await API.put(`/api/marketing/admin/announcements/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        showToast('✅ Announcement updated successfully', 'success');
      } else {
        await API.post('/api/marketing/admin/announcements', payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        showToast('✅ Announcement created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Unknown error';
      showToast(`❌ Failed to save announcement: ${errMsg}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    
    setIsDeletingId(id);
    showToast('⏳ Deleting announcement...', 'info');

    try {
      await API.delete(`/api/marketing/admin/announcements/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      showToast('✅ Announcement deleted successfully', 'success');
      fetchAnnouncements();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Unknown error';
      showToast(`❌ Failed to delete announcement: ${errMsg}`, 'error');
    } finally {
      setIsDeletingId(null);
    }
  };

  const renderPriorityIcon = (priority) => {
    if (priority === 'Critical') return <AlertOctagon size={16} color="#ef4444" />;
    if (priority === 'Warning') return <AlertTriangle size={16} color="#f59e0b" />;
    return <Info size={16} color="#3b82f6" />;
  };

  return (
    <div className="announcement-manager animate-fade-in">
      <div className="admin-page-header">
        <div>
          <h2>Announcement Manager</h2>
          <p>Create and schedule system-wide notifications</p>
        </div>
        <button className="create-btn" onClick={() => handleOpenModal()}>
          <PlusCircle size={18} /> Create Notice
        </button>
      </div>

      <div className="table-container">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Views</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : announcements.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>No announcements found.</td></tr>
            ) : announcements.map(item => (
              <tr key={item._id}>
                <td>
                  <strong>{item.title}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-gray)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                    {item.content}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {renderPriorityIcon(item.priority)}
                    <span>{item.priority}</span>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${item.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                    {item.status}
                  </span>
                </td>
                <td>{item.startDate ? new Date(item.startDate).toLocaleDateString() : 'Immediate'}</td>
                <td>{item.endDate ? new Date(item.endDate).toLocaleDateString() : 'Never'}</td>
                <td>{item.views}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon edit" onClick={() => handleOpenModal(item)} disabled={isDeletingId === item._id}><Edit2 size={16} /></button>
                    <button className="btn-icon delete" onClick={() => handleDelete(item._id)} disabled={isDeletingId === item._id}>
                      {isDeletingId === item._id ? <span className="spinner-mini"></span> : <Trash2 size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Title *</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Scheduled Maintenance" />
              </div>
              <div className="form-group full-width">
                <label>Content *</label>
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

              <div className="form-group">
                <label>Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
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
                {isSaving ? '⏳ Saving...' : 'Save Notice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementManager;
