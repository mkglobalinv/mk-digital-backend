import React, { useState, useEffect } from 'react';
import { 
    Smartphone, CheckCircle, AlertTriangle, Upload, Save, 
    RefreshCw, User, ExternalLink, Send, Image as ImageIcon, HelpCircle,
    MessageCircle, Search, Filter, Clock, FileText, Maximize2, 
    X, Download, Layers, ShieldCheck, Zap, Sparkles, Copy, Check, ChevronLeft,
    Terminal, Activity, Globe, Box, Layout, ArrowRight
} from 'lucide-react';
import API from '../../api';
import { useToast } from '../../context/ToastContext';
import { io } from 'socket.io-client';
import ErrorBoundary from '../../components/ErrorBoundary';
import './AdminAppRequests.css';

const AdminAppRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const { showToast, updateToast } = useToast();

    // Asset expansion viewer state
    const [previewAsset, setPreviewAsset] = useState(null);

    // Search and Filtering options
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Active edit form payload cache per request ID
    const [editStates, setEditStates] = useState({});

    // Asset Generation animated indicators tracking processing states per ID
    const [generatingAssets, setGeneratingAssets] = useState({});
    
    // APK Upload State per request ID
    const [uploadState, setUploadState] = useState({});

    const [liveLogs, setLiveLogs] = useState({}); // { jobId: [logs] }
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const adminToken = (localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'));
        const newSocket = io(import.meta.env.VITE_API_URL, {
            query: { token: adminToken }
        });

        newSocket.on('connect', () => console.log("[Socket] Connected to backend"));
        
        newSocket.on('build:log', ({ jobId, log }) => {
            setLiveLogs(prev => ({
                ...prev,
                [jobId]: [...(prev[jobId] || []), log].slice(-50)
            }));
        });

        setSocket(newSocket);
        return () => newSocket.close();
    }, []);

    const subscribeToBuild = (jobId) => {
        if (socket) {
            socket.emit('subscribe:build', jobId);
        }
    };

    const [assetsReady, setAssetsReady] = useState({});
    const [copiedField, setCopiedField] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/admin/app-requests');
            const data = res.data || [];
            setRequests(data);
            
            const initialStates = {};
            data.forEach(r => {
                initialStates[r._id] = {
                    status: r.status || 'Pending Review',
                    estimatedDeliveryTime: r.estimatedDeliveryTime || '72 hours',
                    apkUrl: r.apkUrl || '',
                    apkFileSize: r.apkFileSize || '',
                    aabUrl: r.aabUrl || '',
                    aabFileSize: r.aabFileSize || '',
                    adminNotes: r.adminNotes || '',
                    notifyUser: true,
                    screenshots: r.playStoreAssets?.screenshots || []
                };
            });
            setEditStates(initialStates);
        } catch (err) {
            showToast('Failed to load Build Studio operations telemetry.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStateChange = (id, field, value) => {
        setEditStates(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const handleGenerateAssets = async (id) => {
        setGeneratingAssets(prev => ({ ...prev, [id]: true }));
        const toastId = await showToast('Generating assets...', 'loading');
        try {
            await API.post(`/api/admin/app-requests/${id}/assets`);
            updateToast(toastId, { type: 'success', message: 'Branding payload generated successfully. Ready for PWA Builder.' });
            setAssetsReady(prev => ({ ...prev, [id]: true }));
            await fetchRequests();
        } catch (err) {
            updateToast(toastId, { type: 'error', message: err.response?.data?.message || 'Failed to generate assets.' });
        } finally {
            setGeneratingAssets(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleApkUpload = async (e, id) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadState(prev => ({
            ...prev,
            [id]: { isUploading: true, progress: 0, success: false, error: null, filename: file.name, timestamp: null }
        }));

        const formData = new FormData();
        formData.append('file', file);
        const toastId = `apk-upload-${id}`;
        
        try {
            const res = await API.post(`/api/admin/app-requests/${id}/upload/apk`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadState(prev => ({ ...prev, [id]: { ...prev[id], progress: percentCompleted } }));
                }
            });
            const { data } = res.data;
            
            if (!data || !data.apkUrl) {
                throw new Error("Upload failed: No public URL returned or file not saved correctly.");
            }

            const fileSizeFormatted = data.apkFileSize || (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            handleStateChange(id, 'apkUrl', data.apkUrl);
            handleStateChange(id, 'apkFileSize', fileSizeFormatted);
            handleStateChange(id, 'status', data.status);
            
            setUploadState(prev => ({
                ...prev,
                [id]: { isUploading: false, progress: 100, success: true, error: null, filename: file.name, timestamp: new Date().toLocaleTimeString() }
            }));

            showToast('APK uploaded successfully', 'success', { id: toastId });
            setTimeout(() => showToast('File stored securely. Download link generated.', 'success'), 1000);
        } catch (err) {
            setUploadState(prev => ({
                ...prev,
                [id]: { isUploading: false, progress: 0, success: false, error: err?.response?.data?.message || err.message || 'Failed to upload APK', filename: file.name, timestamp: null }
            }));
            showToast('APK upload failed. Please try again', 'error', { id: toastId });
        }
    };

    const handleAabUpload = async (e, id) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        const toastId = await showToast(`Uploading AAB: 0%`, 'loading');
        
        try {
            const res = await API.post(`/api/admin/app-requests/${id}/upload/aab`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    updateToast(toastId, { message: `Uploading AAB: ${percentCompleted}%` });
                }
            });
            const { data } = res.data;
            handleStateChange(id, 'aabUrl', data.aabUrl);
            handleStateChange(id, 'aabFileSize', data.aabFileSize);
            handleStateChange(id, 'status', data.status);
            updateToast(toastId, { type: 'success', message: 'AAB Bundle uploaded successfully.' });
        } catch (err) {
            updateToast(toastId, { type: 'error', message: err?.response?.data?.message || 'Failed to upload AAB.' });
        }
    };

    const commitState = async (id) => {
        setUpdatingId(id);
        const state = editStates[id];
        const toastId = await showToast('Saving operational state...', 'loading');
        try {
            await API.put(`/api/admin/app-requests/${id}`, state);
            updateToast(toastId, { type: 'success', message: 'Operational state committed successfully.' });
            const res = await API.get('/api/admin/app-requests');
            setRequests(res.data || []);
        } catch (err) {
            updateToast(toastId, { type: 'error', message: 'Failed to save state.' });
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusStep = (status) => {
        const steps = ["Pending Review", "Generating Assets", "Building Application", "Testing Application", "Ready for Delivery", "Delivered"];
        const index = steps.indexOf(status);
        return index === -1 ? 0 : index;
    };

    const filteredRequests = requests.filter(req => {
        const matchSearch = req.appName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.resellerId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (filterStatus === 'All') return matchSearch;
        if (filterStatus === 'Pending') return matchSearch && req.status === 'Pending Review';
        if (filterStatus === 'Processing') return matchSearch && !['Pending Review', 'Delivered'].includes(req.status);
        if (filterStatus === 'Completed') return matchSearch && req.status === 'Delivered';
        return matchSearch;
    });

    if (loading) return (
        <div className="studio-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '20px' }}>
                <RefreshCw size={48} />
            </div>
            <h2 style={{ fontWeight: 700 }}>Synchronizing Build Pipelines...</h2>
            <p style={{ color: 'var(--text-gray)' }}>Fetching active operations telemetry.</p>
        </div>
    );

    return (
        <ErrorBoundary>
            <div className="studio-container animate-fade-in">
                
                {/* Header Section */}
                <header className="studio-header">
                    <div>
                        <h1>Build Studio <span style={{ color: 'var(--primary)', opacity: 0.5 }}>/</span> Operations</h1>
                        <p>Managed asset compilation and binary distribution engine.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="premium-glass" style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.3px', fontWeight: 600 }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }}></div>
                            Live Operations
                        </div>
                        <button className="premium-btn premium-btn-secondary" onClick={fetchRequests}>
                            <RefreshCw size={16} /> Sync
                        </button>
                    </div>
                </header>

                {/* Workflow Stepper */}
                <div className="workflow-stepper">
                    {[
                        { label: 'Review', icon: <Search size={14} /> },
                        { label: 'Assets', icon: <ImageIcon size={14} /> },
                        { label: 'PWA Studio', icon: <Globe size={14} /> },
                        { label: 'Compiler', icon: <Box size={14} /> },
                        { label: 'Testing', icon: <Activity size={14} /> },
                        { label: 'Delivery', icon: <Send size={14} /> }
                    ].map((step, i) => (
                        <div key={i} className="workflow-step">
                            <div className="step-number">{i + 1}</div>
                            <span className="step-label">{step.label}</span>
                            {i < 5 && <ArrowRight className="step-arrow" size={14} />}
                        </div>
                    ))}
                </div>

                {/* Stats Grid */}
                <div className="studio-stats-grid">
                    <div className="stat-premium-card">
                        <div className="stat-icon-box" style={{ background: '#DBEAFE', color: '#3B82F6' }}><FileText size={24} /></div>
                        <div>
                            <div className="stat-value">{requests.length}</div>
                            <div className="stat-label">Total Requests</div>
                        </div>
                    </div>
                    <div className="stat-premium-card">
                        <div className="stat-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}><Clock size={24} /></div>
                        <div>
                            <div className="stat-value">{requests.filter(r => r.status === 'Pending Review').length}</div>
                            <div className="stat-label">Pending Review</div>
                        </div>
                    </div>
                    <div className="stat-premium-card">
                        <div className="stat-icon-box" style={{ background: '#F5F3FF', color: '#8B5CF6' }}><Zap size={24} /></div>
                        <div>
                            <div className="stat-value">{requests.filter(r => !['Pending Review', 'Delivered'].includes(r.status)).length}</div>
                            <div className="stat-label">In Production</div>
                        </div>
                    </div>
                    <div className="stat-premium-card">
                        <div className="stat-icon-box" style={{ background: '#D1FAE5', color: '#059669' }}><CheckCircle size={24} /></div>
                        <div>
                            <div className="stat-value">{requests.filter(r => r.status === 'Delivered').length}</div>
                            <div className="stat-label">Ready/Delivered</div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="premium-glass" style={{ padding: '16px 24px', borderRadius: 'var(--radius-lg)', marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} size={18} />
                        <input 
                            type="text" 
                            placeholder="Search app or reseller..." 
                            style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', fontSize: '15.4px' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        style={{ padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', fontSize: '15.4px', background: 'var(--bg-card)' }}
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Pipelines</option>
                        <option value="Pending">Pending Review</option>
                        <option value="Processing">Active Production</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>

                {/* Build Cards */}
                <div className="build-list">
                    {filteredRequests.map(req => {
                        const state = editStates[req._id] || {};
                        const progress = (getStatusStep(state.status) + 1) * 16.6;
                        
                        return (
                            <div key={req._id} className="build-card animate-scale-in">
                                <div className="card-top-bar">
                                    <div className="app-identity">
                                        <div className="app-icon-preview">
                                            {req.logo ? <img src={req.logo} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} /> : (req.appName || 'A')[0]}
                                        </div>
                                        <div className="app-meta">
                                            <h3>{req.appName}</h3>
                                            <div className="reseller-info">
                                                <User size={12} inline /> {req.resellerId?.name} 
                                                <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
                                                <Smartphone size={12} inline /> v{req.appVersion || '1.0.0'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <span className={`badge ${state.status === 'Delivered' ? 'badge-success' : 'badge-warning'}`}>
                                            {state.status}
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="premium-btn premium-btn-secondary" style={{ padding: '8px' }} title="PWA Settings" onClick={() => window.open('https://www.pwabuilder.com/', '_blank')}>
                                                <Globe size={18} />
                                            </button>
                                            <button className="premium-btn premium-btn-secondary" style={{ padding: '8px' }} title="Copy URL" onClick={() => {
                                                navigator.clipboard.writeText(`https://${req.resellerId?.subdomain}.9jasub.com`);
                                                showToast('URL copied!', 'success');
                                            }}>
                                                <Copy size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-grid">
                                    {/* Left: Branding & Assets */}
                                    <div>
                                        <span className="section-label">Branding Assets</span>
                                        <div className="asset-grid">
                                            <div className="asset-box" onClick={() => setPreviewAsset({ url: req.logo, title: 'App Logo' })}>
                                                <img src={req.logo} className="asset-thumb" alt="" />
                                                <div className="asset-info">
                                                    <strong>App Logo</strong>
                                                    <span>512x512 PNG</span>
                                                </div>
                                            </div>
                                            <div className="asset-box" onClick={() => setPreviewAsset({ url: req.splashScreen, title: 'Splash Screen' })}>
                                                <img src={req.splashScreen} className="asset-thumb" alt="" />
                                                <div className="asset-info">
                                                    <strong>Splash</strong>
                                                    <span>2732x2732 PNG</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '24px' }}>
                                            <span className="section-label">Operational Actions</span>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <button className="premium-btn premium-btn-primary" onClick={() => handleGenerateAssets(req._id)} disabled={generatingAssets[req._id]}>
                                                    {generatingAssets[req._id] ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                                    {generatingAssets[req._id] ? 'Computing...' : 'Generate Assets'}
                                                </button>
                                                <a 
                                                    href={`${import.meta.env.VITE_API_URL}/api/admin/app-requests/${req._id}/assets/download?token=${(localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'))}`}
                                                    className="premium-btn premium-btn-secondary"
                                                    style={{ textDecoration: 'none' }}
                                                >
                                                    <Download size={16} /> Download ZIP
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Technical & Binary */}
                                    <div>
                                        <span className="section-label">Binary Distribution</span>
                                        <div className="dropzone-grid">
                                            <div className="modern-dropzone" style={{ position: 'relative' }}>
                                                <input type="file" accept=".apk" onChange={e => handleApkUpload(e, req._id)} disabled={uploadState[req._id]?.isUploading} />
                                                
                                                {uploadState[req._id]?.isUploading ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                                                        <RefreshCw className="animate-spin" size={24} color="var(--primary)" style={{ marginBottom: '8px' }} />
                                                        <div style={{ fontSize: '14.3px', fontWeight: 700, color: 'var(--primary)' }}>Uploading APK... {uploadState[req._id]?.progress}%</div>
                                                        <div style={{ width: '80%', background: '#e2e8f0', height: '6px', borderRadius: '3px', marginTop: '12px' }}>
                                                            <div style={{ width: `${uploadState[req._id]?.progress}%`, background: 'var(--primary)', height: '100%', borderRadius: '3px', transition: 'width 0.3s' }} />
                                                        </div>
                                                    </div>
                                                ) : uploadState[req._id]?.success ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                        <CheckCircle size={24} color="#10B981" style={{ marginBottom: '8px' }} />
                                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#10B981', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadState[req._id]?.filename}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '4px' }}>{state.apkFileSize} • {uploadState[req._id]?.timestamp}</div>
                                                        <span className="badge badge-success" style={{ marginTop: '12px' }}>Uploaded Successfully</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload size={24} color="var(--primary)" style={{ marginBottom: '8px' }} />
                                                        <div style={{ fontSize: '14.3px', fontWeight: 700 }}>{state.apkFileSize ? 'Update APK' : 'Upload APK'}</div>
                                                        <div style={{ fontSize: '12.1px', color: 'var(--text-gray)', marginTop: '4px' }}>{state.apkFileSize || 'v7a/v8a Binary'}</div>
                                                        {uploadState[req._id]?.error && <div style={{ color: 'red', fontSize: '11px', marginTop: '8px', textAlign: 'center' }}>{uploadState[req._id]?.error}</div>}
                                                    </>
                                                )}
                                            </div>
                                            <div className="modern-dropzone">
                                                <input type="file" accept=".aab" onChange={e => handleAabUpload(e, req._id)} />
                                                <Upload size={20} color="#8B5CF6" style={{ marginBottom: '8px' }} />
                                                <div style={{ fontSize: '14.3px', fontWeight: 700 }}>{state.aabFileSize || 'Upload AAB'}</div>
                                                <div style={{ fontSize: '12.1px', color: 'var(--text-gray)' }}>Play Store Bundle</div>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '24px' }}>
                                            <span className="section-label">State Management</span>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                <select 
                                                    className="input-field" 
                                                    style={{ height: '45px' }}
                                                    value={state.status}
                                                    onChange={e => handleStateChange(req._id, 'status', e.target.value)}
                                                >
                                                    {["Pending Review", "Generating Assets", "Building Application", "Testing Application", "Ready for Delivery", "Delivered"].map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                                <button 
                                                    className="premium-btn premium-btn-primary" 
                                                    style={{ height: '45px' }} 
                                                    onClick={() => commitState(req._id)} 
                                                    disabled={updatingId === req._id || uploadState[req._id]?.isUploading}
                                                >
                                                    {updatingId === req._id ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                                                    Commit
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Track */}
                                <div className="progress-container">
                                    <div className="progress-track">
                                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <div className="progress-steps">
                                        {["Draft", "Assets", "Build", "Test", "Ready", "Done"].map((s, i) => (
                                            <div key={i} className={`mini-step ${i <= getStatusStep(state.status) ? 'active' : ''}`}>{s}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Preview Modal */}
                {previewAsset && (
                    <div className="modal-overlay-modern" onClick={() => setPreviewAsset(null)}>
                        <div className="modal-content-modern animate-scale-in" onClick={e => e.stopPropagation()}>
                            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontWeight: 800 }}>{previewAsset.title}</h3>
                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }} onClick={() => setPreviewAsset(null)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-color)' }}>
                                <img src={previewAsset.url} style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '12px', boxShadow: 'var(--premium-shadow)' }} alt="" />
                            </div>
                            <div style={{ padding: '20px', textAlign: 'right' }}>
                                <button className="premium-btn premium-btn-secondary" onClick={() => setPreviewAsset(null)}>Close Preview</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </ErrorBoundary>
    );
};

export default AdminAppRequests;
