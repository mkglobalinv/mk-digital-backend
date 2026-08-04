import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  ToggleLeft, 
  ToggleRight,
  ShieldAlert,
  Zap,
  Lock
} from 'lucide-react';
import API from '../../api';
import './ResellerContent.css';

const ResellerContent = ({ user }) => {
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        type: 'banner',
        title: '',
        message: '',
        image: '',
        link: '',
        is_active: true
    });

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const res = await API.get('/api/reseller/content');
            setContents(res.data);
        } catch (err) {
            console.error("Failed to fetch content");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await API.post('/api/reseller/content', formData);
            setIsAdding(false);
            setFormData({ type: 'banner', title: '', message: '', image: '', link: '', is_active: true });
            fetchContent();
        } catch (err) {
            alert("Failed to create content");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this content?")) {
            try {
                await API.delete(`/api/reseller/content/${id}`);
                fetchContent();
            } catch (err) {
                alert("Failed to delete content");
            }
        }
    };

    if (user?.resellerTier !== 'premium') {
        return (
            <div className="reseller-premium-lock">
                <div className="lock-card">
                    <div className="lock-icon-box">
                        <Lock size={48} />
                    </div>
                    <h2>Advanced Branding Required</h2>
                    <p>Custom banners and marquees are only available with Active Hosting & Maintenance.</p>
                    <button className="upgrade-btn" onClick={() => window.location.href='/reseller/premium'}>
                        Activate Hosting & Maintenance
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="reseller-content-view">
            <div className="dashboard-section-header">
                <div className="header-top-row">
                    <div>
                        <h1>Banners & Marquee</h1>
                        <p>Manage the visual alerts and promotions on your store front.</p>
                    </div>
                    <button className="add-btn" onClick={() => setIsAdding(!isAdding)}>
                        {isAdding ? <ToggleLeft /> : <Plus />} {isAdding ? 'Cancel' : 'Add Content'}
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="business-card add-form-card">
                    <form onSubmit={handleCreate}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Content Type</label>
                                <select 
                                    value={formData.type} 
                                    onChange={e => setFormData({...formData, type: e.target.value})}
                                >
                                    <option value="banner">Promotional Banner</option>
                                    <option value="marquee">Scrolling Marquee Text</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Title / Heading</label>
                                <input 
                                    type="text" 
                                    value={formData.title} 
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    placeholder="e.g. 50% Off Data Today!"
                                    required
                                />
                            </div>
                            {formData.type === 'banner' && (
                                <div className="form-group">
                                    <label>Message (Subtext)</label>
                                    <input 
                                        type="text" 
                                        value={formData.message} 
                                        onChange={e => setFormData({...formData, message: e.target.value})}
                                        placeholder="Limited time offer..."
                                    />
                                </div>
                            )}
                            {formData.type === 'banner' && (
                                <div className="form-group">
                                    <label>Image URL (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={formData.image} 
                                        onChange={e => setFormData({...formData, image: e.target.value})}
                                        placeholder="https://..."
                                    />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Action Link (Optional)</label>
                                <input 
                                    type="text" 
                                    value={formData.link} 
                                    onChange={e => setFormData({...formData, link: e.target.value})}
                                    placeholder="/purchase or external link"
                                />
                            </div>
                            <div className="form-group toggle-group">
                                <label>Active Status</label>
                                <button 
                                    type="button"
                                    className={`toggle-btn ${formData.is_active ? 'on' : ''}`}
                                    onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                                >
                                    {formData.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                </button>
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="save-btn">Create Content</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="content-list">
                {loading ? (
                    <div className="list-loader">Loading content...</div>
                ) : contents.length === 0 ? (
                    <div className="empty-state">
                        <ImageIcon size={48} />
                        <p>No custom banners or marquees created yet.</p>
                    </div>
                ) : (
                    <div className="content-grid">
                        {contents.map(item => (
                            <div key={item._id} className={`content-card ${item.type}`}>
                                <div className="card-badge">{item.type.toUpperCase()}</div>
                                <div className="card-main">
                                    <h3>{item.title}</h3>
                                    {item.message && <p>{item.message}</p>}
                                    <div className="card-meta">
                                        {item.link && <span className="link-tag"><LinkIcon size={12} /> {item.link}</span>}
                                        <span className={`status-tag ${item.is_active ? 'active' : 'inactive'}`}>
                                            {item.is_active ? 'Live' : 'Hidden'}
                                        </span>
                                    </div>
                                </div>
                                <button className="delete-btn" onClick={() => handleDelete(item._id)}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="info-box">
                <ShieldAlert size={20} />
                <p><strong>Note:</strong> Global system alerts from the main administrator will still appear on your store front even if you have custom banners.</p>
            </div>
        </div>
    );
};

export default ResellerContent;
