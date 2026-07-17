import React, { useState, useEffect, useRef } from 'react';
import { Layers, Plus, Edit2, Trash2, Globe, MonitorSmartphone, X, Check, EyeOff, Eye, Upload, Image as ImageIcon } from 'lucide-react';
import API from '../../api';
import './AdminDashboard.css';

const AdminFuturePlatforms = () => {
    const [platforms, setPlatforms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [currentId, setCurrentId] = useState(null);
    const fileInputRef = useRef(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        retailDisplayName: '',
        ownerDisplayNameTemplate: '{Brand}',
        logoUrl: '',
        url: '',
        platformType: 'external',
        status: false,
        displayOrder: 0
    });

    useEffect(() => {
        fetchPlatforms();
    }, []);

    const fetchPlatforms = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/admin/future-platforms');
            console.log('Future Platforms API Payload:', res.data);
            if (res.data && res.data.success && res.data.data) {
                setPlatforms(res.data.data);
            } else {
                setPlatforms(res.data);
            }
            setError('');
        } catch (err) {
            setError('Failed to load platforms. Ensure you have the required permissions.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setModalMode('add');
        setFormData({
            name: '',
            retailDisplayName: '',
            ownerDisplayNameTemplate: '{Brand}',
            logoUrl: '',
            url: '',
            platformType: 'external',
            status: false,
            displayOrder: platforms.length + 1
        });
        setShowModal(true);
    };

    const handleOpenEdit = (p) => {
        setModalMode('edit');
        setCurrentId(p._id);
        setFormData({
            name: p.name || '',
            retailDisplayName: p.retailDisplayName || '',
            ownerDisplayNameTemplate: p.ownerDisplayNameTemplate || '',
            logoUrl: p.logoUrl || '',
            url: p.url || '',
            platformType: p.platformType || (p.mode === 'internal' ? 'embedded' : (p.mode === 'external' ? 'external' : 'embedded')),
            status: p.status || false,
            displayOrder: p.displayOrder || 0
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentId(null);
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, logoUrl: reader.result }));
            setUploadingImage(false);
        };
        reader.onerror = () => {
            alert('Failed to read file');
            setUploadingImage(false);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData };
            if (!payload.ownerDisplayNameTemplate?.trim()) {
                payload.ownerDisplayNameTemplate = '{Brand}';
            }
            if (modalMode === 'add') {
                await API.post('/api/admin/future-platforms', payload);
            } else {
                await API.put(`/api/admin/future-platforms/${currentId}`, payload);
            }
            setShowModal(false);
            fetchPlatforms();
        } catch (err) {
            const errDetails = {
                message: err.message,
                status: err.response?.status,
                statusText: err.response?.statusText,
                dataStr: typeof err.response?.data === 'string' ? err.response.data.substring(0, 100) : 'Object',
                data: err.response?.data
            };
            alert(`EXACT ERROR:\n${JSON.stringify(errDetails, null, 2)}`);
            console.error("FULL SAVE ERROR:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete the platform "${name}"? This cannot be undone.`)) return;
        setLoading(true);
        try {
            await API.delete(`/api/admin/future-platforms/${id}`);
            fetchPlatforms();
        } catch (err) {
            alert('Failed to delete platform');
            setLoading(false);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            await API.put(`/api/admin/future-platforms/${id}`, { status: !currentStatus });
            fetchPlatforms();
        } catch (err) {
            alert('Failed to toggle status');
        }
    };

    const safePlatforms = Array.isArray(platforms) ? platforms : [];

    return (
        <div className="admin-dashboard-modern">
            <div className="dashboard-hero-modern">
                <div className="hero-left">
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', padding: '10px', borderRadius: '12px', display: 'inline-flex' }}>
                            <Layers size={28} />
                        </span>
                        Future Platforms
                    </h1>
                    <p>Manage the ecosystem of connected platforms available to resellers and retail customers.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}
                >
                    <Plus size={16} /> Add Platform
                </button>
            </div>

            {error && (
                <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    {error}
                </div>
            )}

            <div className="analytics-widget-card" style={{ padding: '0', overflow: 'hidden' }}>
                {loading && !showModal ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading platforms...</div>
                ) : safePlatforms.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-gray)' }}>
                        <Layers size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-dark)' }}>No Future Platforms Found</h3>
                        <p style={{ margin: 0 }}>Add a platform to expand the ecosystem.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '16px', color: 'var(--text-gray)', fontSize: '12px', textTransform: 'uppercase' }}>Display Order</th>
                                    <th style={{ padding: '16px', color: 'var(--text-gray)', fontSize: '12px', textTransform: 'uppercase' }}>Platform</th>
                                    <th style={{ padding: '16px', color: 'var(--text-gray)', fontSize: '12px', textTransform: 'uppercase' }}>Platform Type</th>
                                    <th style={{ padding: '16px', color: 'var(--text-gray)', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '16px', color: 'var(--text-gray)', fontSize: '12px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {safePlatforms.map((p) => (
                                    <tr key={p._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '16px', fontWeight: 'bold', color: 'var(--text-gray)' }}>#{p.displayOrder}</td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {p.logoUrl ? (
                                                    <img src={p.logoUrl} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', background: '#fff' }} />
                                                ) : (
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-gray)' }}>
                                                        <ImageIcon size={20} />
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: '700', color: 'var(--text-dark)', fontSize: '14px' }}>{p.retailDisplayName}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{p.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', background: p.platformType === 'embedded' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: p.platformType === 'embedded' ? '#8B5CF6' : '#3B82F6' }}>
                                                {p.platformType === 'embedded' ? <MonitorSmartphone size={12} /> : <Globe size={12} />}
                                                {p.platformType}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <button 
                                                onClick={() => toggleStatus(p._id, p.status)}
                                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                                            >
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', background: p.status ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)', color: p.status ? '#10B981' : '#9CA3AF' }}>
                                                    {p.status ? <Check size={12} /> : <EyeOff size={12} />}
                                                    {p.status ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </button>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <button onClick={() => handleOpenEdit(p)} style={{ background: 'transparent', border: 'none', color: '#3B82F6', cursor: 'pointer', marginRight: '16px', padding: '8px' }}>
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(p._id, p.name)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '8px' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* CREATE / EDIT MODAL */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '600px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>
                                {modalMode === 'add' ? 'Add New Platform' : 'Edit Platform'}
                            </h3>
                            <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-gray)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            <form id="platform-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                
                                {/* Logo Upload Row */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '8px' }}>Platform Logo</label>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                        {formData.logoUrl ? (
                                            <img src={formData.logoUrl} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', background: '#fff', border: '1px solid var(--border-color)' }} />
                                        ) : (
                                            <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-gray)', border: '1px dashed var(--border-color)' }}>
                                                <ImageIcon size={32} />
                                            </div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <input 
                                                type="text" 
                                                placeholder="Paste Image URL or upload a file below" 
                                                value={formData.logoUrl} 
                                                onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-dark)', fontSize: '14px', marginBottom: '8px' }}
                                            />
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                ref={fileInputRef} 
                                                onChange={handleLogoUpload} 
                                                style={{ display: 'none' }} 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploadingImage}
                                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-dark)', fontWeight: '600' }}
                                            >
                                                <Upload size={14} /> {uploadingImage ? 'Processing...' : 'Upload Image File'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '8px' }}>Internal Name (System)</label>
                                        <input type="text" required placeholder="e.g. BBCHausa" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-dark)', fontSize: '14px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '8px' }}>Retail Display Name</label>
                                        <input type="text" required placeholder="e.g. BBC Hausa" value={formData.retailDisplayName} onChange={e => setFormData({...formData, retailDisplayName: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-dark)', fontSize: '14px' }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '8px' }}>Reseller Display Name Template</label>
                                    <p style={{ fontSize: '11px', color: 'var(--text-gray)', margin: '0 0 8px 0' }}>Leave blank to use the platform name automatically.</p>
                                    <input type="text" placeholder="Example: MK News, BBC Hausa, Arewa Updates" value={formData.ownerDisplayNameTemplate} onChange={e => setFormData({...formData, ownerDisplayNameTemplate: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-dark)', fontSize: '14px' }} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '8px' }}>Target URL</label>
                                    <p style={{ fontSize: '11px', color: 'var(--text-gray)', margin: '0 0 8px 0' }}>The website users will be sent to (or the internal path).</p>
                                    <input type="url" required placeholder="https://" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-dark)', fontSize: '14px' }} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '8px' }}>Platform Type</label>
                                        <select value={formData.platformType} onChange={e => setFormData({...formData, platformType: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-dark)', fontSize: '14px', appearance: 'none' }}>
                                            <option value="external">External (New Tab)</option>
                                            <option value="embedded">Embedded (In-App WebView)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '8px' }}>Display Order</label>
                                        <input type="number" required min="0" value={formData.displayOrder} onChange={e => setFormData({...formData, displayOrder: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-dark)', fontSize: '14px' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}>
                                        <input type="checkbox" checked={formData.status} onChange={e => setFormData({...formData, status: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }} />
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>Enable Platform</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>If disabled, it won't show up for any users. Defaults to disabled.</div>
                                        </div>
                                    </label>
                                </div>

                            </form>
                        </div>

                        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={handleCloseModal} style={{ padding: '10px 20px', background: 'transparent', color: 'var(--text-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                            <button type="submit" form="platform-form" disabled={loading} style={{ padding: '10px 24px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                                {loading ? 'Saving...' : 'Save Platform'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminFuturePlatforms;
