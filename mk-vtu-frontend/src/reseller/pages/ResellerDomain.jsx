import React, { useState, useEffect } from 'react';
import { 
    Globe, Shield, CheckCircle, AlertTriangle, ChevronRight, 
    ChevronLeft, Crown, Server, HelpCircle, Save, 
    Smartphone, Mail, MessageSquare, Zap, Activity,
    Lock, Share2, Rocket
} from 'lucide-react';
import API from '../../api';
import './ResellerDomain.css';

const ResellerDomain = ({ user, refreshUser }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [requestData, setRequestData] = useState(null);
    
    // Form State
    const [domainOption, setDomainOption] = useState('subdomain');
    const [websiteName, setWebsiteName] = useState('');
    const [domainName, setDomainName] = useState('');
    const [alternativeDomain, setAlternativeDomain] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [notes, setNotes] = useState('');
    useEffect(() => {
        fetchDomainStatus();
    }, []);

    const fetchDomainStatus = async () => {
        setFetching(true);
        try {
            const res = await API.get('/api/reseller/domain-request');
            if (res.data?.request) {
                const req = res.data.request;
                setRequestData(req);
                setDomainOption(req.domainOption || 'subdomain');
                setDomainName(req.domainName || '');
                setWhatsappNumber(req.whatsappNumber || '');
                setNotes(req.adminNotes || '');
                
                // If already has a request, maybe show status instead of wizard
                if (req.status !== 'Connected Successfully' && req.status !== 'Request Submitted') {
                    // Stay on status view or allow editing? 
                }
            } else {
                setDomainOption('subdomain');
                setDomainName(`${user?.subdomain || 'app'}.9jasub.com`);
            }
        } catch (err) {
            console.error("Failed to load domain configuration state");
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async () => {
        if (!domainName) {
            setMsg({ type: 'error', text: 'Please enter your desired domain name.' });
            return;
        }

        setLoading(true);
        setMsg({ type: '', text: '' });

        try {
            const payload = {
                domainOption,
                domainName: domainOption === 'subdomain' ? `${user?.subdomain || 'app'}.9jasub.com` : domainName,
                registrarProvider: '9JASUB Managed',
                whatsappNumber,
                contactEmail: '',
                adminNotes: domainOption === 'subdomain' ? notes : `Website Name: ${websiteName}\nAlternative Domain: ${alternativeDomain}\nNotes: ${notes}`.trim()
            };

            const res = await API.post('/api/reseller/domain-request', payload);
            if (res.data?.request) {
                setRequestData(res.data.request);
                setStep(4); // Success step
            }
            setMsg({ type: 'success', text: res.data?.message || 'Domain setup updated successfully!' });
            await refreshUser();
        } catch (err) {
            const errMsg = err.response?.data?.message || err.message || 'Failed to request domain mappings';
            setMsg({ type: 'error', text: errMsg });
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="animate-fade-in">
            <div className="wizard-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '26.4px', fontWeight: 900, color: '#1e293b' }}>Select Website Path</h2>
                <p style={{ color: '#64748b' }}>Choose how users will access your professional storefront.</p>
            </div>
            
            <div className="selection-cards">
                <div 
                    className={`selection-card ${domainOption === 'subdomain' ? 'active' : ''}`}
                    onClick={() => {
                        setDomainOption('subdomain');
                        setDomainName(`${user?.subdomain || 'app'}.9jasub.com`);
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ padding: '10px', background: domainOption === 'subdomain' ? 'var(--primary)' : '#f1f5f9', color: domainOption === 'subdomain' ? 'white' : '#64748b', borderRadius: '12px' }}>
                            <Zap size={24} />
                        </div>
                        {domainOption === 'subdomain' && <CheckCircle size={20} color="var(--primary)" />}
                    </div>
                    <h3 style={{ fontSize: '19.8px', fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>Free Business Address</h3>
                    <p style={{ fontSize: '14.3px', color: '#64748b', lineHeight: '1.5' }}>
                        Instant activation using our secure system infrastructure.
                    </p>
                    <div style={{ marginTop: '16px', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '13.2px', color: 'var(--primary)', fontWeight: 700 }}>
                        {user?.subdomain || 'app'}.9jasub.com
                    </div>
                </div>

                <div 
                    className={`selection-card ${domainOption === 'custom_domain' ? 'active' : ''}`}
                    onClick={() => setDomainOption('custom_domain')}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ padding: '10px', background: domainOption === 'custom_domain' ? '#f59e0b' : '#f1f5f9', color: domainOption === 'custom_domain' ? 'white' : '#64748b', borderRadius: '12px' }}>
                            <Crown size={24} />
                        </div>
                        {domainOption === 'custom_domain' && <CheckCircle size={20} color="#f59e0b" />}
                    </div>
                    <h3 style={{ fontSize: '19.8px', fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>Domain Setup Included with Premium</h3>
                    <p style={{ fontSize: '14.3px', color: '#64748b', lineHeight: '1.5' }}>
                        Submit your preferred domain name and our team will handle everything for you. If your preferred domain is unavailable, we'll contact you via WhatsApp with the best alternatives.
                    </p>
                    <div style={{ marginTop: '16px', fontSize: '12.1px', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase' }}>
                        Professional Identity
                    </div>
                </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '20px' }}>
                <button className="wizard-btn primary" onClick={() => setStep(2)}>
                    Continue <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="animate-fade-in">
            <div className="wizard-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '26.4px', fontWeight: 900, color: '#1e293b' }}>Domain Details</h2>
                <p style={{ color: '#64748b' }}>Provide the information for your chosen web address.</p>
            </div>

            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                {domainOption === 'subdomain' ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <Server size={32} />
                        </div>
                        <h3 style={{ fontSize: '19.8px', fontWeight: 800, color: '#1e293b' }}>Subdomain is Ready</h3>
                        <p style={{ color: '#64748b', fontSize: '15.4px' }}>Your free address is pre-configured on our high-speed global network.</p>
                        <div style={{ marginTop: '20px', fontSize: '17.6px', fontWeight: 800, color: 'var(--primary)' }}>{domainName}</div>
                    </div>
                ) : (
                    <>
                        <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #bfdbfe' }}>
                            <h4 style={{ margin: '0 0 12px', color: '#1e40af', fontSize: '14.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Shield size={16} /> Premium Service Includes
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontSize: '13.2px' }}><CheckCircle size={14} color="#3b82f6" /> Domain availability check</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontSize: '13.2px' }}><CheckCircle size={14} color="#3b82f6" /> Domain purchase</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontSize: '13.2px' }}><CheckCircle size={14} color="#3b82f6" /> DNS configuration</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontSize: '13.2px' }}><CheckCircle size={14} color="#3b82f6" /> SSL certificate installation</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontSize: '13.2px' }}><CheckCircle size={14} color="#3b82f6" /> Website connection</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e3a8a', fontSize: '13.2px' }}><CheckCircle size={14} color="#3b82f6" /> Complete technical setup</div>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ fontWeight: 700, color: '#334155', display: 'block', marginBottom: '8px' }}>Website Name</label>
                            <input 
                                type="text" 
                                className="friendly-input" 
                                placeholder="e.g. My VTU Business" 
                                value={websiteName}
                                onChange={(e) => setWebsiteName(e.target.value)}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ fontWeight: 700, color: '#334155', display: 'block', marginBottom: '8px' }}>Preferred Domain Name</label>
                            <div style={{ position: 'relative' }}>
                                <Globe style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                                <input 
                                    type="text" 
                                    className="friendly-input" 
                                    placeholder="e.g. mybrand.com.ng" 
                                    value={domainName}
                                    onChange={(e) => setDomainName(e.target.value)}
                                    style={{ paddingLeft: '40px' }}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ fontWeight: 700, color: '#334155', display: 'block', marginBottom: '8px' }}>Alternative Domain Name (Optional)</label>
                            <div style={{ position: 'relative' }}>
                                <Globe style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                                <input 
                                    type="text" 
                                    className="friendly-input" 
                                    placeholder="e.g. mybrand.com" 
                                    value={alternativeDomain}
                                    onChange={(e) => setAlternativeDomain(e.target.value)}
                                    style={{ paddingLeft: '40px' }}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                <button className="wizard-btn secondary" onClick={() => setStep(1)}>
                    <ChevronLeft size={18} /> Back
                </button>
                <button className="wizard-btn primary" onClick={() => setStep(3)}>
                    Continue <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="animate-fade-in">
            <div className="wizard-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '26.4px', fontWeight: 900, color: '#1e293b' }}>Contact & Confirmation</h2>
                <p style={{ color: '#64748b' }}>Our team will use these details to guide your connection process.</p>
            </div>

            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ fontWeight: 700, color: '#334155', display: 'block', marginBottom: '8px' }}>WhatsApp Number</label>
                    <div style={{ position: 'relative' }}>
                        <Smartphone style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                        <input 
                            type="text" 
                            className="friendly-input" 
                            placeholder="e.g. 09012345678" 
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>
                </div>



                <div className="form-group">
                    <label style={{ fontWeight: 700, color: '#334155', display: 'block', marginBottom: '8px' }}>Additional Notes (Optional)</label>
                    <textarea 
                        className="friendly-input" 
                        placeholder="Any specific requests or timing preferences..." 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ minHeight: '80px', paddingTop: '12px' }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                <button className="wizard-btn secondary" onClick={() => setStep(2)}>
                    <ChevronLeft size={18} /> Back
                </button>
                <button className="wizard-btn primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Submitting...' : <><Rocket size={18} /> Finish Setup</>}
                </button>
            </div>
        </div>
    );

    const renderSuccess = () => (
        <div className="animate-fade-in" style={{ textAlign: 'center', padding: '20px' }}>
            <div className="infra-animation-container">
                <div className="network-nodes">
                    <div className="node active">
                        <Server size={28} />
                        <div className="node-pulse"></div>
                    </div>
                    <div className="connection-line">
                        <div className="data-beam"></div>
                    </div>
                    <div className="node success">
                        <Globe size={28} />
                    </div>
                </div>
                <div className="infra-status-text">
                    <h3>Deploying Managed Infrastructure</h3>
                    <p>Our specialists are securing your connection routes globally.</p>
                </div>
            </div>

            <div style={{ background: '#ecfdf5', padding: '24px', borderRadius: '20px', border: '1px solid #a7f3d0', marginBottom: '24px' }}>
                <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: '24.2px', fontWeight: 900, color: '#065f46', margin: '0 0 8px' }}>Request Received Successfully</h2>
                <p style={{ color: '#065f46', opacity: 0.8, fontSize: '15.4px', lineHeight: '1.6' }}>
                    Your website connection is now in the expert hands of our infrastructure team. 
                    We will notify you via WhatsApp and email once the deployment is complete.
                </p>
            </div>

            <button className="wizard-btn secondary" onClick={() => { fetchDomainStatus(); setStep(1); }}>
                View Current Status
            </button>
        </div>
    );

    const renderStatus = () => {
        const isConnected = requestData?.status === 'Connected Successfully';
        const isFailed = requestData?.status === 'Failed / Needs Correction';
        
        return (
            <div className="animate-fade-in">
                <div className="infra-animation-container">
                    <div className="network-nodes">
                        <div className={`node ${isConnected ? 'success' : 'active'}`}>
                            <Server size={28} />
                            {!isConnected && <div className="node-pulse"></div>}
                        </div>
                        <div className="connection-line">
                            {!isConnected && !isFailed && <div className="data-beam"></div>}
                        </div>
                        <div className={`node ${isConnected ? 'success' : isFailed ? 'failed' : ''}`}>
                            {isConnected ? <CheckCircle size={28} /> : isFailed ? <AlertTriangle size={28} /> : <Globe size={28} />}
                        </div>
                    </div>
                    <div className="infra-status-text">
                        <h3>{isConnected ? 'Infrastructure Fully Connected' : isFailed ? 'Connection Blocked' : 'Securing Cloud Connection'}</h3>
                        <p>{isConnected ? 'Your website is now globally accessible via your chosen domain.' : isFailed ? 'We encountered a technical hurdle with your domain.' : 'Deployment in progress. DNS and SSL layers being applied.'}</p>
                    </div>
                </div>

                <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ padding: '12px', background: isConnected ? '#d1fae5' : isFailed ? '#fee2e2' : '#eff6ff', color: isConnected ? '#10b981' : isFailed ? '#ef4444' : '#3b82f6', borderRadius: '16px' }}>
                            <Activity size={24} />
                        </div>
                        <div>
                            <span style={{ fontSize: '12.1px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px' }}>Current State</span>
                            <h4 style={{ margin: 0, fontSize: '19.8px', fontWeight: 800, color: '#1e293b' }}>{requestData?.status || 'Processing'}</h4>
                        </div>
                    </div>

                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14.3px', marginBottom: '10px' }}>
                            <span style={{ color: '#64748b' }}>Connected Address:</span>
                            <span style={{ fontWeight: 800, color: '#1e293b' }}>{requestData?.domainName}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14.3px', marginBottom: '10px' }}>
                            <span style={{ color: '#64748b' }}>SSL Certificate:</span>
                            <span style={{ color: isConnected ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                                {isConnected ? 'Active & Secure' : 'Pending Activation'}
                            </span>
                        </div>
                        {requestData?.liveUrl && (
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                                <a 
                                    href={requestData.liveUrl.startsWith('http') ? requestData.liveUrl : `https://${requestData.liveUrl}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="wizard-btn primary"
                                    style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                                >
                                    Open Website <Share2 size={18} style={{ marginLeft: '8px' }} />
                                </a>
                            </div>
                        )}
                    </div>

                    {requestData?.adminNotes && (
                        <div style={{ padding: '16px', background: isFailed ? '#fff1f2' : '#f0f9ff', border: `1px solid ${isFailed ? '#fecaca' : '#bae6fd'}`, borderRadius: '16px' }}>
                            <div style={{ display: 'flex', gap: '8px', color: isFailed ? '#e11d48' : '#0369a1', marginBottom: '6px' }}>
                                <MessageSquare size={16} />
                                <span style={{ fontSize: '13.2px', fontWeight: 700 }}>Management Team Update</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '14.3px', color: isFailed ? '#9f1239' : '#0c4a6e', lineHeight: '1.5' }}>
                                {requestData.adminNotes}
                            </p>
                        </div>
                    )}

                    {!isConnected && (
                        <button 
                            className="wizard-btn secondary" 
                            style={{ width: '100%', marginTop: '20px' }}
                            onClick={() => setRequestData(null)}
                        >
                            Modify Request Details
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (fetching) {
        return (
            <div className="reseller-container">
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <Activity className="animate-spin" size={40} color="var(--primary)" style={{ margin: '0 auto 20px' }} />
                    <h3 style={{ fontWeight: 800, color: '#1e293b' }}>Syncing Network Identity...</h3>
                </div>
            </div>
        );
    }

    return (
        <div className="reseller-container">
            <div className="reseller-domain-wizard">
                <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '26.4px', fontWeight: 900, color: '#1e293b', margin: '0 0 4px' }}>Managed Website Infrastructure</h1>
                        <p style={{ color: '#64748b', fontSize: '15.4px' }}>Professional domain deployment with zero technical configuration.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ padding: '8px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', color: '#10b981' }}>
                            <Shield size={20} />
                        </div>
                    </div>
                </header>

                {!requestData || (step < 4 && !requestData?.status) ? (
                    <>
                        <div className="wizard-steps-container">
                            <div className={`wizard-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                                <div className="step-number">{step > 1 ? <CheckCircle size={20} /> : '1'}</div>
                                <span className="step-label">Domain Type</span>
                            </div>
                            <div className={`wizard-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                                <div className="step-number">{step > 2 ? <CheckCircle size={20} /> : '2'}</div>
                                <span className="step-label">Details</span>
                            </div>
                            <div className={`wizard-step ${step >= 3 ? 'active' : ''}`}>
                                <div className="step-number">3</div>
                                <span className="step-label">Contact</span>
                            </div>
                        </div>

                        <div className="wizard-card" style={{ background: 'white', padding: '32px', borderRadius: '32px', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                            {step === 1 && renderStep1()}
                            {step === 2 && renderStep2()}
                            {step === 3 && renderStep3()}
                        </div>
                    </>
                ) : step === 4 ? (
                    renderSuccess()
                ) : (
                    renderStatus()
                )}

                {msg.text && (
                    <div className={`alert ${msg.type}`} style={{ marginTop: '20px', borderRadius: '16px' }}>
                        {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                        <span>{msg.text}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResellerDomain;

