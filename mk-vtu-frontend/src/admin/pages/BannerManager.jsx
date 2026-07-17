import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import API from '../../api';
import './BannerManager.css';

const BannerManager = ({ token }) => {
  const [banners, setBanners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    imageUrl: '',
    title: '',
    subtitle: '',
    buttonText: '',
    buttonLink: '',
    isActive: true
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = () => {
    API.get('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const bannerSetting = res.data.find(s => s.key === 'app_banners');
        setBanners(bannerSetting?.value || []);
      });
  };

  const handleSave = (e) => {
    e.preventDefault();
    let updatedBanners = [...banners];
    if (editingBanner) {
       const index = banners.findIndex(b => b.id === editingBanner.id);
       updatedBanners[index] = { ...formData, id: editingBanner.id };
    } else {
       updatedBanners.push({ ...formData, id: Date.now() });
    }

    API.post('/api/admin/settings', { key: 'app_banners', value: updatedBanners }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        setShowModal(false);
        setEditingBanner(null);
        setFormData({ imageUrl: '', title: '', subtitle: '', buttonText: '', buttonLink: '', isActive: true });
        fetchBanners();
      });
  };

  const deleteBanner = (id) => {
    const updatedBanners = banners.filter(b => b.id !== id);
    API.post('/admin/settings', { key: 'app_banners', value: updatedBanners }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => fetchBanners());
  };

  return (
    <div className="banner-wrapper">
      <div className="banner-header">
        <h2>Banner Management</h2>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          <span>Add New Banner</span>
        </button>
      </div>

      <div className="banner-grid">
        {banners.map(banner => (
          <div key={banner.id} className="banner-item">
            <div className="banner-preview" style={{ backgroundImage: `url(${banner.imageUrl})` }}>
               {!banner.isActive && <div className="inactive-overlay">INACTIVE</div>}
            </div>
            <div className="banner-info">
               <h3>{banner.title}</h3>
               <p>{banner.subtitle}</p>
               <div className="banner-actions">
                  <button onClick={() => { setEditingBanner(banner); setFormData(banner); setShowModal(true); }}>
                     <Edit2 size={16} />
                  </button>
                  <button onClick={() => deleteBanner(banner.id)}>
                     <Trash2 size={16} color="#EF4444" />
                  </button>
               </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card banner-modal">
            <h3>{editingBanner ? 'Edit Banner' : 'New Banner'}</h3>
            <form onSubmit={handleSave}>
               <input type="text" placeholder="Image URL" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} required />
               <input type="text" placeholder="Main Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
               <input type="text" placeholder="Subtitle / Subtext" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} />
               <input type="text" placeholder="Button Text" value={formData.buttonText} onChange={e => setFormData({...formData, buttonText: e.target.value})} />
               <input type="text" placeholder="Button Link (e.g., /purchase)" value={formData.buttonLink} onChange={e => setFormData({...formData, buttonLink: e.target.value})} />
               
               <label className="toggle-label">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                  <span>Active & Visible</span>
               </label>

               <div className="modal-actions">
                  <button type="submit" className="save-btn">Save Banner</button>
                  <button type="button" className="cancel-btn" onClick={() => { setShowModal(false); setEditingBanner(null); }}>Cancel</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerManager;
