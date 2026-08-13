import React, { useState, useEffect, useRef } from 'react';
import { 
    Smartphone, Upload, CheckCircle, AlertTriangle, Shield, 
    Palette, Save, ChevronRight, ChevronLeft, Crown,
    Sparkles, Rocket, Clock, Download, Share2, HelpCircle,
    Check, Loader2, Info, ArrowRight, Layers, Wifi, Zap
} from 'lucide-react';
import { io } from "socket.io-client";
import API from '../../api';
import './ResellerApp.css';

const PREMIUM_PALETTES = [
    { id: 'blue', name: 'Blue Ocean', primary: '#2563EB', accent: '#60A5FA' },
    { id: 'emerald', name: 'Emerald Pro', primary: '#10B981', accent: '#34D399' },
    { id: 'velvet', name: 'Royal Velvet', primary: '#8B5CF6', accent: '#A78BFA' },
    { id: 'gold', name: 'Golden Class', primary: '#F59E0B', accent: '#FBBF24' },
    { id: 'midnight', name: 'Midnight Dark', primary: '#0F172A', accent: '#475569' },
];

const ResellerApp = ({ user, refreshUser }) => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [msg, setMsg] = useState({ type: '', text: '' });
    
    const [requestData, setRequestData] = useState(null);
    const [estimatedTime, setEstimatedTime] = useState("72 hours");
    const [isStudioMode, setIsStudioMode] = useState(false);

    const logoInputRef = useRef(null);
    const splashInputRef = useRef(null);

    const [formData, setFormData] = useState({
        appName: user?.branding?.siteName || '',
        logo: user?.branding?.logo || '',
        primaryColor: user?.branding?.primaryColor || '#2563EB',
        accentColor: '#60A5FA',
        splashScreen: '',
        supportEmail: user?.email || '',
        notes: 'Managed app compilation flow requested via Premium Studio.'
    });

    const [customColorActive, setCustomColorActive] = useState(false);

    useEffect(() => {
        fetchRequestStatus();

        // Real-time websocket synchronization for App Builder
        const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
        const socket = io(socketUrl, { transports: ["websocket"] });

        if (user?._id) {
            socket.emit('subscribe:reseller_app', user._id);
        }

        socket.on('app:sync', (data) => {
            console.log("[AppStudio] Sync Event Received:", data);
            setMsg({ type: 'info', text: data.message || 'Synchronizing configuration with server...' });
            fetchRequestStatus();
        });

        socket.on('app:build-status', (data) => {
            console.log("[AppStudio] Build Status Event Received:", data);
            if (data.status) {
                setRequestData(prev => ({ 
                    ...(prev || {}), 
                    status: data.status,
                    apkUrl: data.apkUrl || prev?.apkUrl,
                    apkFileSize: data.apkFileSize || prev?.apkFileSize,
                    deliveryDate: data.deliveryDate || prev?.deliveryDate
                }));
            }
            if (data.estimatedDeliveryTime) {
                setEstimatedTime(data.estimatedDeliveryTime);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [user?._id]);

    const fetchRequestStatus = async () => {
        setFetching(true);
        try {
            const res = await API.get(`/api/reseller/app-request?t=${Date.now()}`);
            if (res.data?.estimatedDeliveryTime) {
                setEstimatedTime(res.data.estimatedDeliveryTime);
            }
            if (res.data?.request) {
                setRequestData(res.data.request);
                setFormData({
                    appName: res.data.request.appName || user?.branding?.siteName || '',
                    logo: res.data.request.logo || user?.branding?.logo || '',
                    primaryColor: res.data.request.primaryColor || '#2563EB',
                    accentColor: res.data.request.accentColor || '#60A5FA',
                    splashScreen: res.data.request.splashScreen || '',
                    supportEmail: res.data.request.supportEmail || user?.email || '',
                    notes: res.data.request.notes || 'Managed app compilation flow requested via Premium Studio.'
                });
                
                // Match to preset palette if available
                const matched = PREMIUM_PALETTES.find(p => p.primary.toLowerCase() === (res.data.request.primaryColor || '').toLowerCase());
                if (!matched) setCustomColorActive(true);
            } else if (user?.appSettings?.generatedAssets?.isReady) {
                // Compatibility mapping for legacy builds
                setRequestData({
                    status: 'Delivered',
                    appName: user.appSettings.appName || user.branding?.siteName || 'App',
                    apkUrl: user.appSettings.generatedAssets.apkUrl,
                    appVersion: '1.0.0',
                    deliveryDate: user.appSettings.generatedAssets.lastGeneratedAt
                });
            } else {
                // If user has siteName setup, populate appName automatically
                if (user?.branding?.siteName) {
                    setFormData(prev => ({ ...prev, appName: user.branding.siteName }));
                }
                if (user?.branding?.primaryColor) {
                    setFormData(prev => ({ ...prev, primaryColor: user.branding.primaryColor }));
                }
            }
        } catch (err) {
            console.error("Failed to load app request status");
        } finally {
            setFetching(false);
        }
    };

    const handleFileUpload = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setMsg({ type: 'error', text: 'Image size must be under 2MB for optimal performance.' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [field]: reader.result }));
                setMsg({ type: '', text: '' });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSelectPreset = (palette) => {
        setFormData(prev => ({
            ...prev,
            primaryColor: palette.primary,
            accentColor: palette.accent
        }));
        setCustomColorActive(false);
    };

    const handleCustomColorChange = (hex) => {
        setFormData(prev => ({
            ...prev,
            primaryColor: hex,
            accentColor: `${hex}CC` // Soft accent counterpart
        }));
        setCustomColorActive(true);
    };

    const handleSubmitRequest = async () => {
        if (!formData.appName.trim()) {
            setMsg({ type: 'error', text: 'Please enter your App / Brand Name.' });
            return;
        }
        if (!formData.supportEmail.trim()) {
            setMsg({ type: 'error', text: 'Please enter a Support Email.' });
            return;
        }
        if (!formData.logo) {
            setMsg({ type: 'error', text: 'Please upload an App Logo icon.' });
            return;
        }

        setLoading(true);
        setMsg({ type: '', text: '' });
        
        try {
            const res = await API.post('/api/reseller/app-request', formData);
            if (res.data?.request) {
                setRequestData(res.data.request);
            }
            await refreshUser();
            setIsStudioMode(false);
            setMsg({ type: 'success', text: 'App setup submitted successfully! Our team is preparing your package.' });
        } catch (err) {
            const errMsg = err.response?.data?.message || err.message || 'Failed to submit request';
            setMsg({ type: 'error', text: errMsg });
        } finally {
            setLoading(false);
        }
    };

    const handleRetryBuild = async () => {
        setLoading(true);
        setMsg({ type: '', text: '' });
        try {
            const res = await API.post('/api/reseller/generate-assets');
            setMsg({ type: 'success', text: 'Build pipeline retriggered successfully!' });
            await fetchRequestStatus();
        } catch (err) {
            const errMsg = err.response?.data?.message || err.message || 'Failed to retry build';
            setMsg({ type: 'error', text: errMsg });
        } finally {
            setLoading(false);
        }
    };

    const isEnabled = user?.features?.apk_generation;

    // Feature Check
    if (!isEnabled) {
        return (
            <div className="reseller-studio-container animate-fade-in">
                <div className="premium-feature-lock-card">
                    <div className="lock-icon-glow">
                        <Crown size={48} color="#F59E0B" />
                    </div>
                    <span className="premium-tag">Premium Business Feature</span>
                    <h2>Branded Mobile App Studio</h2>
                    <p>
                        Deploy your own fully tailored native Android application directly to your end users. We handle the compiling, signing, and packaging natively with zero technical configuration required on your end.
                    </p>
                    <div className="feature-bullets">
                        <div className="bullet-item"><Check size={16} color="#10B981" /> <span>Custom App Name & Professional Logo Integration</span></div>
                        <div className="bullet-item"><Check size={16} color="#10B981" /> <span>Real-time Dynamic Brand Color Customization</span></div>
                        <div className="bullet-item"><Check size={16} color="#10B981" /> <span>Dedicated Operations Team Assembly Support</span></div>
                    </div>
                    <button className="premium-upgrade-btn" onClick={() => window.location.href = '/reseller/premium'}>
                        Upgrade Plan to Unlock App Studio <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    // Loading State
    if (fetching) {
        return (
            <div className="reseller-studio-container">
                <div className="studio-skeleton-loader">
                    <Loader2 className="animate-spin studio-spinner" size={40} />
                    <p>Loading your branded mobile app profile...</p>
                </div>
            </div>
        );
    }

    // Lifecycle timeline stage calculation
    const currentStatus = requestData?.status || 'Pending Review';
    let activeStageIndex = 0;
    if (currentStatus === 'Building Application') activeStageIndex = 1;
    else if (currentStatus === 'Testing Application') activeStageIndex = 2;
    else if (currentStatus === 'Revision Required') activeStageIndex = 3;
    else if (currentStatus === 'Ready') activeStageIndex = 4;

    const timelineStages = [
        { title: "App Request Submitted", desc: "Pending Review" },
        { title: "Your app is being prepared", desc: "Building Application" },
        { title: "Your app is being tested", desc: "Testing Application" },
        { title: "Your app requires an update before release", desc: "Revision Required" },
        { title: "Your Mobile App is Ready", desc: "Ready" }
    ];

    const isSuccessStatus = currentStatus === 'Ready';
    const isErrorStatus = currentStatus === 'Revision Required';

    const getStatusMessage = (status) => {
        if (status === 'Pending Review') return 'App Request Submitted';
        if (status === 'Building Application') return 'Your app is being prepared';
        if (status === 'Testing Application') return 'Your app is being tested';
        if (status === 'Revision Required') return 'Your app requires an update before release';
        if (status === 'Ready') return 'Your Mobile App is Ready';
        return status || 'App Request Submitted';
    };

    // Core Screen UI Rendering
    return (
        <div className="reseller-studio-container animate-fade-in">
            
            {/* SaaS Top Header Highlight Banner */}
            <div className="studio-top-hero">
                <h1>Simpler. Smarter. Built for Website Owners.</h1>
                <p className="subtitle">We prepare your branded app for you.</p>
                
                <div className="hero-feature-pills">
                    <span className="hero-pill"><Palette size={14} /> Color Picker (Live Preview)</span>
                    <span className="hero-pill"><Sparkles size={14} /> No Technical Confusion</span>
                    <span className="hero-pill"><Rocket size={14} /> Modern Processing Engine</span>
                    <span className="hero-pill"><CheckCircle size={14} /> Simple & Easy Form</span>
                </div>
            </div>

            {/* EMPTY STATE - Professional Welcome Screen if no app request exists */}
            {!requestData && !isStudioMode ? (
                <div className="studio-empty-state-card animate-slide-up">
                    <div className="empty-state-visual">
                        <div className="phone-illustration-ring">
                            <Smartphone size={72} className="phone-floating-icon" />
                        </div>
                    </div>
                    <h2>Launch Your Custom Branded App</h2>
                    <p className="empty-state-desc">
                        Give your business the premier mobile presence it deserves. Upload your logo, select your signature brand colors, and let our dedicated fintech publishing team compile your professional application seamlessly.
                    </p>
                    
                    <div className="simple-steps-row">
                        <div className="step-badge"><span>1</span> Enter Brand Info</div>
                        <div className="step-badge"><span>2</span> Pick Live Colors</div>
                        <div className="step-badge"><span>3</span> We Handle Rest</div>
                    </div>

                    <button className="launch-studio-btn" onClick={() => setIsStudioMode(true)}>
                        Click Build App <ArrowRight size={20} />
                    </button>
                </div>
            ) : null}

            {/* STUDIO CONFIGURATION MODE OR EDITING EXISTING SETUP */}
            {(!requestData && isStudioMode) || (requestData && isStudioMode) ? (
                <div className="studio-workspace-grid animate-fade-in">
                    
                    {/* LEFT COLUMN: Simplified Input Interface */}
                    <div className="studio-form-column">
                        <div className="form-section-card">
                            <div className="card-top-header">
                                <span className="section-step">Step 1 of 2</span>
                                <h3>App Information</h3>
                                <p>Let's start with the basic credentials.</p>
                            </div>

                            <div className="studio-input-group">
                                <label>App / Brand Name</label>
                                <input 
                                    type="text" 
                                    className="studio-text-input"
                                    placeholder="e.g. Datasub Pro"
                                    value={formData.appName}
                                    onChange={(e) => setFormData({...formData, appName: e.target.value})}
                                />
                                <span className="input-hint">This will display directly under your app icon on smartphone screens.</span>
                            </div>

                            <div className="studio-input-group">
                                <label>Support Email</label>
                                <input 
                                    type="email" 
                                    className="studio-text-input"
                                    placeholder="contact@yourbrand.com"
                                    value={formData.supportEmail}
                                    onChange={(e) => setFormData({...formData, supportEmail: e.target.value})}
                                />
                                <span className="input-hint">We use this to notify you as your application clears processing stages.</span>
                            </div>

                            <div className="studio-input-group">
                                <label>Upload App Logo</label>
                                <div className="studio-dropzone" onClick={() => logoInputRef.current.click()}>
                                    <input 
                                        type="file" 
                                        ref={logoInputRef} 
                                        hidden 
                                        accept="image/*" 
                                        onChange={(e) => handleFileUpload(e, 'logo')}
                                    />
                                    {formData.logo ? (
                                        <div className="dropzone-preview">
                                            <img src={formData.logo} alt="Uploaded logo" className="preview-thumb" />
                                            <span className="change-file-text">Click to replace icon image</span>
                                        </div>
                                    ) : (
                                        <div className="dropzone-empty">
                                            <Upload size={32} color="#2563EB" />
                                            <span className="dropzone-title">Upload Logo</span>
                                            <span className="dropzone-specs">PNG • Max 2MB</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="studio-input-group">
                                <label>Opening App Image (Optional)</label>
                                <div className="studio-dropzone small" onClick={() => splashInputRef.current.click()}>
                                    <input 
                                        type="file" 
                                        ref={splashInputRef} 
                                        hidden 
                                        accept="image/*" 
                                        onChange={(e) => handleFileUpload(e, 'splashScreen')}
                                    />
                                    {formData.splashScreen ? (
                                        <div className="dropzone-preview horizontal">
                                            <img src={formData.splashScreen} alt="Opening Screen preview" className="preview-thumb-small" />
                                            <span className="change-file-text">Image selected • Click to change</span>
                                        </div>
                                    ) : (
                                        <div className="dropzone-empty horizontal">
                                            <Upload size={20} color="#10B981" />
                                            <span className="dropzone-title-small">Select launch image</span>
                                        </div>
                                    )}
                                </div>
                                <span className="input-hint">Displays momentarily while loading your platform natively.</span>
                            </div>
                        </div>

                        {/* Premium Preset & Custom Color Picker Card */}
                        <div className="form-section-card">
                            <div className="card-top-header">
                                <span className="section-step">Step 2 of 2</span>
                                <h3>Brand Colors</h3>
                                <p>Choose your brand colors. Preview will update instantly.</p>
                            </div>

                            {/* Live Hex Value Card view */}
                            <div className="selected-color-bar" style={{ borderColor: formData.primaryColor }}>
                                <div className="color-swatch-box" style={{ backgroundColor: formData.primaryColor }}></div>
                                <div className="color-details">
                                    <span className="color-label-text">Primary Accent</span>
                                    <span className="color-hex-text">{formData.primaryColor.toUpperCase()}</span>
                                </div>
                            </div>

                            {/* Preset Options Grid */}
                            <span className="sub-label">Premium Preset Palettes</span>
                            <div className="preset-palettes-list">
                                {PREMIUM_PALETTES.map(p => (
                                    <div 
                                        key={p.id}
                                        className={`palette-preset-card ${formData.primaryColor.toLowerCase() === p.primary.toLowerCase() && !customColorActive ? 'active' : ''}`}
                                        onClick={() => handleSelectPreset(p)}
                                    >
                                        <div className="palette-color-strip">
                                            <div className="strip-main" style={{ backgroundColor: p.primary }}></div>
                                            <div className="strip-sub" style={{ backgroundColor: p.accent }}></div>
                                        </div>
                                        <span className="palette-title">{p.name}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Custom Color Selector */}
                            <div className="custom-color-row">
                                <div className="custom-left">
                                    <span className="custom-title">Custom Brand Color</span>
                                    <span className="custom-desc">Match your precise corporate HEX code</span>
                                </div>
                                <div className="custom-right">
                                    <input 
                                        type="color" 
                                        className="native-color-picker"
                                        value={formData.primaryColor}
                                        onChange={(e) => handleCustomColorChange(e.target.value)}
                                        title="Choose custom brand color"
                                    />
                                </div>
                            </div>

                            {msg.text && (
                                <div className={`studio-alert ${msg.type}`}>
                                    <Info size={16} /> <span>{msg.text}</span>
                                </div>
                            )}

                            {/* Submit Control Row */}
                            <div className="form-action-row">
                                {requestData && (
                                    <button className="studio-btn-cancel" onClick={() => setIsStudioMode(false)}>
                                        Cancel
                                    </button>
                                )}
                                <button 
                                    className="studio-btn-submit" 
                                    onClick={handleSubmitRequest}
                                    disabled={loading}
                                    style={{ backgroundColor: formData.primaryColor }}
                                >
                                    {loading ? <><Loader2 className="animate-spin" size={18} /> Submitting Profile...</> : <>Click Build App <ArrowRight size={18} /></>}
                                </button>
                            </div>
                            
                            <div className="safety-guarantee-box">
                                <Shield size={16} color="#10B981" />
                                <span>Your information is safe and used only for building your app.</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Real-time Live Phone Mockup Preview System */}
                    <div className="studio-preview-column">
                        <div className="sticky-preview-wrapper">
                            <span className="preview-zone-header">Real-time Interface Simulation</span>
                            
                            <div className="live-phone-frame">
                                <div className="phone-speaker-slot"></div>
                                
                                {/* Phone Screen Viewport */}
                                <div className="phone-screen-viewport">
                                    
                                    {/* App Native View Header */}
                                    <div className="mockup-header" style={{ backgroundColor: formData.primaryColor }}>
                                        <div className="mockup-header-left">
                                            {formData.logo ? (
                                                <img src={formData.logo} alt="logo" className="mockup-header-logo" />
                                            ) : (
                                                <div className="mockup-logo-placeholder">D</div>
                                            )}
                                            <span className="mockup-brand-title">{formData.appName || 'Datasub'}</span>
                                        </div>
                                        <div className="mockup-hamburger"></div>
                                    </div>

                                    {/* App Inner Body */}
                                    <div className="mockup-body">
                                        
                                        {/* Greeting block */}
                                        <div className="mockup-greeting">
                                            <h4>Welcome Back 👋</h4>
                                            <p>Great to see you again!</p>
                                        </div>

                                        {/* Wallet Balance Card dynamically taking brand shade */}
                                        <div className="mockup-balance-card" style={{ borderLeftColor: formData.primaryColor }}>
                                            <span className="mockup-bal-label">Wallet Balance</span>
                                            <div className="mockup-bal-row">
                                                <span className="mockup-bal-amt">₦25,680.00</span>
                                                <div className="mockup-eye-icon"></div>
                                            </div>
                                        </div>

                                        {/* Dynamic Quick Actions Grid */}
                                        <span className="mockup-section-title">Quick Services</span>
                                        <div className="mockup-services-grid">
                                            <div className="mockup-service-btn" style={{ backgroundColor: `${formData.primaryColor}15`, color: formData.primaryColor }}>
                                                <Smartphone size={16} />
                                                <span>Airtime</span>
                                            </div>
                                            <div className="mockup-service-btn" style={{ backgroundColor: `${formData.primaryColor}15`, color: formData.primaryColor }}>
                                                <Wifi size={16} />
                                                <span>Data</span>
                                            </div>
                                            <div className="mockup-service-btn" style={{ backgroundColor: `${formData.primaryColor}15`, color: formData.primaryColor }}>
                                                <Zap size={16} />
                                                <span>Utility</span>
                                            </div>
                                            <div className="mockup-service-btn" style={{ backgroundColor: `${formData.primaryColor}15`, color: formData.primaryColor }}>
                                                <Layers size={16} />
                                                <span>Cable</span>
                                            </div>
                                        </div>

                                        {/* Bottom Nav Simulation */}
                                        <div className="mockup-bottom-nav">
                                            <div className="nav-item active" style={{ color: formData.primaryColor }}><span className="nav-dot" style={{ backgroundColor: formData.primaryColor }}></span>Home</div>
                                            <div className="nav-item">History</div>
                                            <div className="nav-item">Profile</div>
                                        </div>
                                    </div>

                                    {/* Optional Splash / Opening Overlay indication preview if uploaded */}
                                    {formData.splashScreen && (
                                        <div className="mockup-splash-indicator">
                                            <span>Includes Custom Opening App Image</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Color preview feedback list below phone */}
                            <div className="preview-footer-swatches">
                                <span className="ideas-label">Selected Theme Integration Status: Active</span>
                                <div className="ideas-circles">
                                    <span className="swatch-circle" style={{ backgroundColor: formData.primaryColor }}>
                                        <Check size={12} color="#fff" />
                                    </span>
                                    <span className="swatch-circle" style={{ backgroundColor: '#10B981' }}></span>
                                    <span className="swatch-circle" style={{ backgroundColor: '#8B5CF6' }}></span>
                                    <span className="swatch-circle" style={{ backgroundColor: '#F59E0B' }}></span>
                                    <span className="swatch-circle" style={{ backgroundColor: '#0F172A' }}></span>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            ) : null}

            {/* LIFECYCLE PROCESSING CENTER - Rendered automatically when user has an active app request */}
            {requestData && !isStudioMode ? (
                <div className="lifecycle-status-engine animate-fade-in">
                    
                    {/* Architectural Abstraction Header guaranteeing managed assembly */}
                    <div className="status-hero-card">
                        
                        {/* Animated processing core graphic */}
                        <div className="futuristic-generator-core">
                            <div className="core-outer-ring"></div>
                            <div className="core-inner-gear animate-spin-slow"></div>
                            <div className="core-center-glow" style={{ backgroundColor: isErrorStatus ? '#EF4444' : isSuccessStatus ? '#10B981' : '#2563EB' }}>
                                <Rocket size={36} color="#ffffff" className="core-rocket-icon" />
                            </div>
                        </div>

                        <h2>Building Your Branded App</h2>
                        <p className="status-hero-sub">We are working on your mobile deployment request.</p>

                        {/* Status Label Pill */}
                        <div className={`lifecycle-status-pill ${isSuccessStatus ? 'success' : isErrorStatus ? 'error' : 'processing'}`}>
                            <span className="status-dot"></span>
                            <strong>Status:</strong> {getStatusMessage(currentStatus)}
                        </div>
                    </div>

                    {/* Central Grid Split: Left Tracking Timeline vs Right Delivery Cards */}
                    <div className="lifecycle-content-grid">
                        
                        {/* Vertical Status Timeline tracking workflow */}
                        <div className="timeline-tracker-card">
                            <h3>Deployment Pipeline Progress</h3>
                            <p className="tracker-context">Real-time autonomous tracking mapping stages natively.</p>

                            <div className="vertical-timeline-flow">
                                {timelineStages.map((stage, idx) => {
                                    const isCompleted = activeStageIndex > idx || isSuccessStatus;
                                    const isCurrent = activeStageIndex === idx && !isSuccessStatus && !isErrorStatus;
                                    const isFailedStage = isErrorStatus && activeStageIndex === idx;

                                    return (
                                        <div key={idx} className={`timeline-node-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isFailedStage ? 'failed' : ''}`}>
                                            
                                            {/* Node line connection */}
                                            {idx < timelineStages.length - 1 && (
                                                <div className={`node-connector ${isCompleted ? 'filled' : ''}`}></div>
                                            )}

                                            {/* Indicator dot */}
                                            <div className="node-indicator-dot">
                                                {isCompleted ? (
                                                    <Check size={12} color="#ffffff" />
                                                ) : isFailedStage ? (
                                                    <AlertTriangle size={12} color="#ffffff" />
                                                ) : (
                                                    <span className="inner-pulse-dot"></span>
                                                )}
                                            </div>

                                            {/* Stage wording */}
                                            <div className="node-stage-info">
                                                <span className="stage-title">{stage.title}</span>
                                                <span className="stage-desc">{stage.desc}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Delivery Timers & Artifact Downloader center */}
                        <div className="lifecycle-side-cards">
                            
                            {/* Estimated Delivery Timer Countdown support */}
                            {!isSuccessStatus && !isErrorStatus && (
                                <div className="countdown-timer-card animate-slide-up">
                                    <div className="timer-header-wrap">
                                        <Clock size={20} color="#2563EB" className="animate-pulse" />
                                        <span>Estimated Target Delivery</span>
                                    </div>
                                    <h3 className="timer-highlight">Within {estimatedTime}</h3>
                                    <p className="timer-expl">
                                        Our mobile optimization crew ensures all high-resolution transparent elements compile seamlessly. Feel free to log out or leave this workspace; background processing persists reliably.
                                    </p>
                                    <div className="progress-bar-thin">
                                        <div className="progress-bar-fill" style={{ width: `${(activeStageIndex + 1) * 16.6}%` }}></div>
                                    </div>
                                </div>
                            )}

                            {/* Operations Message Feedback */}
                            {requestData.adminNotes && (
                                <div className={`operations-notes-card ${isErrorStatus ? 'critical' : 'info'}`}>
                                    <span className="notes-tag">Operations Feedback</span>
                                    <p>{requestData.adminNotes}</p>
                                </div>
                            )}

                            {/* Completed Download Center - Displayed when build ready */}
                            {isSuccessStatus && (
                                <div className="ready-artifact-card animate-bounce-in">
                                    <div className="success-check-badge">
                                        <CheckCircle size={28} color="#10B981" />
                                    </div>
                                    <h3>Your App Package is Ready!</h3>
                                    <p>Official standalone compiled binary artifact configured exactly to your specifications.</p>
                                    
                                    <div className="artifact-meta-box">
                                        <span>Version: <strong>{requestData.appVersion || '1.0.0'}</strong></span>
                                        <span>Size: <strong>{requestData.apkFileSize || '14.2 MB'}</strong></span>
                                    </div>
 
                                    <div className="download-action-stack">
                                        {!requestData.apkUrl ? (
                                            <button className="primary-dl-btn" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                                                <AlertTriangle size={18} /> APK not uploaded yet
                                            </button>
                                        ) : (
                                            <a 
                                                href={requestData.apkUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="primary-dl-btn"
                                            >
                                                <Download size={18} /> Download Mobile App (APK)
                                            </a>
                                        )}
 
                                        <button 
                                            className="secondary-share-btn"
                                            onClick={() => {
                                                const link = `https://${user?.subdomain || 'app'}.9jasub.com/app`;
                                                navigator.clipboard.writeText(link);
                                                setMsg({ type: 'success', text: 'App download link copied directly to clipboard!' });
                                            }}
                                        >
                                            <Share2 size={16} /> Copy Promotional Page Link
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isErrorStatus && (
                                <div className="ready-artifact-card error animate-bounce-in" style={{ borderColor: '#fca5a5' }}>
                                    <div className="success-check-badge" style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5' }}>
                                        <AlertTriangle size={28} color="#EF4444" />
                                    </div>
                                    <h3>Action Required</h3>
                                    <p>Your app requires an update before release.</p>
                                    
                                    {requestData.adminNotes && (
                                        <div className="error-reason-box" style={{ background: '#fef2f2', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #ef4444', margin: '12px 0', fontSize: '0.875rem', color: '#b91c1c', textAlign: 'left' }}>
                                            <strong>Admin Feedback:</strong> {requestData.adminNotes}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Option to modify settings */}
                            <div className="modify-choice-card">
                                <span>Need to re-upload brand image or switch hex choices?</span>
                                <button className="trigger-modify-btn" onClick={() => setIsStudioMode(true)}>
                                    Edit Brand Profile Settings
                                </button>
                            </div>

                        </div>

                    </div>

                </div>
            ) : null}

            {/* HOW IT WORKS: Premium 4-Step Process Explanation Bar */}
            <div className="studio-process-explanation">
                <div className="explanation-header">
                    <h2>How It Works</h2>
                    <p>Simple 4-Step Process</p>
                </div>

                <div className="steps-cards-row">
                    <div className="step-card-box">
                        <div className="step-circle c1">1</div>
                        <h4>1. Tell Us About Your Brand</h4>
                        <p>Enter your app name, upload logo and choose your signature colors.</p>
                    </div>
                    <div className="step-arrow">&rarr;</div>
                    <div className="step-card-box">
                        <div className="step-circle c2">2</div>
                        <h4>2. We Build Your App</h4>
                        <p>Our engineering team builds your customized app with precision.</p>
                    </div>
                    <div className="step-arrow">&rarr;</div>
                    <div className="step-card-box">
                        <div className="step-circle c3">3</div>
                        <h4>3. We Test & Prepare</h4>
                        <p>We test functionality and layouts to ensure seamless speeds.</p>
                    </div>
                    <div className="step-arrow">&rarr;</div>
                    <div className="step-card-box">
                        <div className="step-circle c4">4</div>
                        <h4>4. You Get Your App</h4>
                        <p>We deliver your fully completed app and support distribution.</p>
                    </div>
                </div>

                <div className="trust-footer-banner">
                    <CheckCircle size={16} color="#10B981" />
                    <span><strong>We Make It Simple:</strong> No technical skills needed. No confusing compiler options. Just a direct flow delivering a premium experience.</span>
                </div>
            </div>

            {/* BOTTOM GUARANTEES STRIP */}
            <div className="studio-guarantees-footer">
                <div className="guarantee-col">
                    <div className="g-icon"><Sparkles size={18} color="#10B981" /></div>
                    <div className="g-text">
                        <h5>No Technical Knowledge Needed</h5>
                        <p>We handle everything. You relax and grow.</p>
                    </div>
                </div>
                <div className="guarantee-col">
                    <div className="g-icon"><Clock size={18} color="#8B5CF6" /></div>
                    <div className="g-text">
                        <h5>On-Time Delivery</h5>
                        <p>Fulfillment structured within target timelines.</p>
                    </div>
                </div>
                <div className="guarantee-col">
                    <div className="g-icon"><Crown size={18} color="#F59E0B" /></div>
                    <div className="g-text">
                        <h5>High Quality</h5>
                        <p>Tailored layouts built with native responsiveness.</p>
                    </div>
                </div>
                <div className="guarantee-col">
                    <div className="g-icon"><Shield size={18} color="#2563EB" /></div>
                    <div className="g-text">
                        <h5>Dedicated Support</h5>
                        <p>Our advisory team remains continuously accessible.</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ResellerApp;
