import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';

const FuturePlatforms = () => {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    retailDisplayName: '',
    ownerDisplayNameTemplate: '{Brand}',
    logoUrl: '',
    url: '',
    mode: 'internal',
    status: false,
    displayOrder: 0
  });

  const fetchPlatforms = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get('/api/admin/future-platforms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Future Platforms payload received:', res.data);
      
      if (res.data && res.data.success && res.data.data) {
        setPlatforms(res.data.data);
      } else {
        setPlatforms(res.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load platforms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const handleOpenModal = (platform = null) => {
    if (platform) {
      setEditingId(platform._id);
      setFormData({
        name: platform.name,
        retailDisplayName: platform.retailDisplayName,
        ownerDisplayNameTemplate: platform.ownerDisplayNameTemplate,
        logoUrl: platform.logoUrl || '',
        url: platform.url,
        mode: platform.mode,
        status: platform.status,
        displayOrder: platform.displayOrder
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        retailDisplayName: '',
        ownerDisplayNameTemplate: '{Brand}',
        logoUrl: '',
        url: '',
        mode: 'internal',
        status: false,
        displayOrder: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.ownerDisplayNameTemplate?.trim()) {
        payload.ownerDisplayNameTemplate = '{Brand}';
      }
      const token = localStorage.getItem('adminToken');
      if (editingId) {
        await axios.put(`/api/admin/future-platforms/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Platform updated successfully');
      } else {
        await axios.post('/api/admin/future-platforms', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Platform created successfully');
      }
      handleCloseModal();
      fetchPlatforms();
    } catch (err) {
      console.error(err);
      alert('Failed to save platform');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this platform?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`/api/admin/future-platforms/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Platform deleted');
      fetchPlatforms();
    } catch (err) {
      console.error(err);
      alert('Failed to delete platform');
    }
  };

  const safePlatforms = Array.isArray(platforms) ? platforms : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Future Platforms</h2>
        <button 
          onClick={() => handleOpenModal()} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#38bdf8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Plus size={18} /> Add Platform
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#334155', color: '#94a3b8' }}>
                <th style={{ padding: '16px' }}>Name</th>
                <th style={{ padding: '16px' }}>Retail Name</th>
                <th style={{ padding: '16px' }}>Mode</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {safePlatforms.map(p => (
                <tr key={p._id} style={{ borderTop: '1px solid #334155' }}>
                  <td style={{ padding: '16px' }}>{p.name}</td>
                  <td style={{ padding: '16px' }}>{p.retailDisplayName}</td>
                  <td style={{ padding: '16px', textTransform: 'capitalize' }}>{p.mode}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', backgroundColor: p.status ? '#10b98120' : '#ef444420', color: p.status ? '#10b981' : '#ef4444' }}>
                      {p.status ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', display: 'flex', gap: '12px' }}>
                    <button onClick={() => handleOpenModal(p)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(p._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {safePlatforms.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No Future Platforms Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit Platform' : 'New Platform'}</h3>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>System Name (e.g. Campus)</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Retail Display Name (e.g. MK Campus)</label>
                <input type="text" name="retailDisplayName" value={formData.retailDisplayName} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Owner Display Template</label>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 8px 0' }}>Leave blank to use the platform name automatically.</p>
                <input type="text" name="ownerDisplayNameTemplate" placeholder="Example: MK News, BBC Hausa, Arewa Updates" value={formData.ownerDisplayNameTemplate} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>URL</label>
                <input type="url" name="url" value={formData.url} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Mode</label>
                <select name="mode" value={formData.mode} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }}>
                  <option value="internal">Internal (WebView)</option>
                  <option value="external">External (Browser)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="status" checked={formData.status} onChange={handleChange} id="status" />
                <label htmlFor="status" style={{ color: '#94a3b8' }}>Enabled for public</label>
              </div>

              <button type="submit" style={{ padding: '12px', backgroundColor: '#38bdf8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <Save size={18} /> Save Platform
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuturePlatforms;
