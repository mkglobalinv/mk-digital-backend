import React, { useState, useEffect } from 'react';
import { 
    Globe, Users, ShieldAlert, CheckCircle, XCircle, 
    ChevronRight, Search, ShieldOff, Phone, Mail, 
    Edit, Megaphone, ExternalLink, TrendingUp, 
    CreditCard, History, MoreHorizontal, Crown, 
    Filter, ArrowUpRight, ArrowDownRight, Lock, Unlock, MessageCircle,
    Zap, ShieldCheck, Activity, Trash2, ArrowLeft, Copy, X, Smartphone, RefreshCw
} from 'lucide-react';
import API from '../../api';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import './ResellerManager.css';

const getWhatsAppUrl = (phone) => {
    if (!phone) return null;
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) {
        digits = '234' + digits.substring(1);
    } else if (!digits.startsWith('234') && digits.length === 10) {
        digits = '234' + digits;
    }
    return `https://wa.me/${digits}`;
};

const ResellerManager = () => {
    const navigate = useNavigate();
    const [resellers, setResellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedReseller, setSelectedReseller] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [savingBranding, setSavingBranding] = useState(false);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [adjustData, setAdjustData] = useState({
        wallet: 'normal',
        type: 'credit',
        amount: '',
        reason: '',
        fundingPassword: ''
    });
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otpData, setOtpData] = useState({ intentToken: '', otp: '' });
    const [adjusting, setAdjusting] = useState(false);
    const [editData, setEditData] = useState(null);
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [broadcastTarget, setBroadcastTarget] = useState({ type: 'all', id: null, name: '' });
    const [broadcastContent, setBroadcastContent] = useState({ title: '', message: '' });
    const [sendingBroadcast, setSendingBroadcast] = useState(false);
    const [showFeatureModal, setShowFeatureModal] = useState(false);
    const [featureData, setFeatureData] = useState(null);
    const [savingFeatures, setSavingFeatures] = useState(false);

    // Tier filter
    const [tierFilter, setTierFilter] = useState('all');

    // Admin Pricing Modal
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [pricingData, setPricingData] = useState([]);
    const [loadingPricing, setLoadingPricing] = useState(false);
    const [pricingReseller, setPricingReseller] = useState(null);
    const [pricingNetworkFilter, setPricingNetworkFilter] = useState('all');
    const [pricingCategoryFilter, setPricingCategoryFilter] = useState('all');
    const [savingPricingId, setSavingPricingId] = useState(null);
    const [localPrices, setLocalPrices] = useState({});
    const [localAdminPrices, setLocalAdminPrices] = useState({});


    

    
    useEffect(() => {
        fetchResellers();
        fetchRequests();

        const channel = supabase.channel('admin-wallets-manager')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'wallets' },
                (payload) => {
                    console.log('[Admin] Realtime wallet update:', payload.new);
                    setResellers(prev => prev.map(r => {
                        if (r._id === payload.new.user_id) {
                            return {
                                ...r,
                                balance1: payload.new.balance1,
                                balance2: payload.new.balance2,
                                earningsBalance: payload.new.earnings_balance
                            };
                        }
                        return r;
                    }));
                    setSelectedReseller(prev => {
                        if (prev && prev._id === payload.new.user_id) {
                            return {
                                ...prev,
                                balance1: payload.new.balance1,
                                balance2: payload.new.balance2,
                                earningsBalance: payload.new.earnings_balance
                            };
                        }
                        return prev;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchRequests = async () => {
        setLoadingRequests(true);
        try {
            const res = await API.get('/api/admin/reseller-requests');
            setRequests(res.data || []);
        } catch (err) {
            console.error("Failed to fetch requests");
        } finally {
            setLoadingRequests(false);
        }
    };

    const fetchResellers = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/admin/resellers');
            setResellers(res.data || []);
        } catch (err) {
            showToast("Failed to sync partners", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleApproveRequest = async (requestId) => {
        if (!window.confirm("Approve this reseller activation?")) return;
        setProcessingId(`${requestId}-approve`);
        try {
            const res = await API.post(`/api/admin/reseller-requests/${requestId}/approve`);
            showToast(res.data?.message || "Partner activated successfully", "success");
            await Promise.all([fetchRequests(), fetchResellers()]);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Activation sequence failed";
            showToast(errorMsg, "error");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectRequest = async (requestId) => {
        const reason = prompt("Enter reason for rejection:");
        if (reason === null) return;
        setProcessingId(`${requestId}-reject`);
        try {
            const res = await API.post(`/api/admin/reseller-requests/${requestId}/reject`, { reason });
            showToast(res.data?.message || "Partner request declined", "info");
            await fetchRequests();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Rejection failed";
            showToast(errorMsg, "error");
        } finally {
            setProcessingId(null);
        }
    };

    const viewProfile = (reseller) => {
        setSelectedReseller(reseller);
        setFeatureData(reseller.features || {
            custom_domain: false,
            apk_generation: false,
            pwa_enabled: true,
            push_notifications: false,
            premium_analytics: false,
            ai_tools: false,
            playstore_publish: false,
            ios_app: false,
            premium_branding: false,
            dedicated_support: false
        });
        API.get(`/api/admin/resellers/${reseller._id}/customers`)
            .then(res => setCustomers(res.data || []));
    };
    
    const handleSaveBranding = async (e) => {
        if (e) e.preventDefault();
        setSavingBranding(true);
        try {
            await API.post(`/api/admin/resellers/${editData._id}/branding`, { branding: editData.branding });
            showToast("Branding configuration updated successfully", "success");
            setShowEditModal(false);
            fetchResellers();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to update branding", "error");
        } finally {
            setSavingBranding(false);
        }
    };

    const handleAdjustWallet = async (e) => {
        e.preventDefault();
        const amt = Number(adjustData.amount);
        if (isNaN(amt) || amt <= 0) return showToast("Please enter a valid positive amount.", "warning");
        if (!adjustData.reason || adjustData.reason.trim().length < 4) return showToast("A specific tracking reason (min 4 characters) is required.", "warning");
        if (!adjustData.fundingPassword) return showToast("Admin funding password is required.", "warning");

        const confirmMsg = `Are you absolutely sure you want to manually ${adjustData.type.toUpperCase()} the reseller's ${adjustData.wallet.toUpperCase()} wallet with ₦${amt.toLocaleString()}?\n\nReason: ${adjustData.reason}`;
        if (!window.confirm(confirmMsg)) return;

        setAdjusting(true);
        try {
            const res = await API.post(`/api/admin/resellers/${selectedReseller._id}/wallet/initiate`, {
                amount: amt,
                type: adjustData.type,
                wallet: adjustData.wallet,
                reason: adjustData.reason,
                fundingPassword: adjustData.fundingPassword
            });
            
            if (res.data?.intentToken) {
                setOtpData({ intentToken: res.data.intentToken, otp: '' });
                setShowAdjustModal(false);
                setShowOTPModal(true);
                showToast(res.data.message || "OTP Sent to Admin Email", "info");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to initiate wallet adjustment.";
            showToast(msg, "error");
        } finally {
            setAdjusting(false);
        }
    };

    const handleConfirmOTP = async (e) => {
        e.preventDefault();
        if (!otpData.otp || otpData.otp.trim().length < 6) return showToast("Please enter the 6-digit OTP.", "warning");
        
        setAdjusting(true);
        try {
            const res = await API.post(`/api/admin/resellers/${selectedReseller._id}/wallet/confirm`, {
                intentToken: otpData.intentToken,
                otp: otpData.otp
            });
            
            showToast(res.data?.message || "Wallet adjusted successfully", "success");
            
            setSelectedReseller(prev => ({
                ...prev,
                balance1: res.data?.user?.balance1 !== undefined ? res.data.user.balance1 : prev.balance1,
                balance2: res.data?.user?.balance2 !== undefined ? res.data.user.balance2 : prev.balance2,
                earningsBalance: res.data?.user?.earningsBalance !== undefined ? res.data.user.earningsBalance : prev.earningsBalance
            }));

            fetchResellers();
            setShowOTPModal(false);
            setOtpData({ intentToken: '', otp: '' });
            setAdjustData({ wallet: 'normal', type: 'credit', amount: '', reason: '', fundingPassword: '' });
        } catch (err) {
            const msg = err.response?.data?.message || "OTP Verification failed.";
            showToast(msg, "error");
        } finally {
            setAdjusting(false);
        }
    };

    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        if (!broadcastContent.title || !broadcastContent.message) {
            return alert("Please fill in both title and message.");
        }
        setSendingBroadcast(true);
        try {
            let res;
            if (broadcastTarget.type === 'resellers') {
                res = await API.post('/api/admin/resellers/broadcast', {
                    title: broadcastContent.title,
                    message: broadcastContent.message
                });
            } else {
                res = await API.post(`/api/admin/resellers/${broadcastTarget.id}/customers/broadcast`, {
                    title: broadcastContent.title,
                    message: broadcastContent.message
                });
            }
            showToast(res.data?.message || "Broadcast sent successfully", "success");
            setShowBroadcastModal(false);
            setBroadcastContent({ title: '', message: '' });
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to send broadcast", "error");
        } finally {
            setSendingBroadcast(false);
        }
    };

    const handleSaveFeatures = async () => {
        setSavingFeatures(true);
        try {
            const res = await API.post(`/api/admin/resellers/${selectedReseller._id}/features`, {
                features: featureData
            });
            showToast("Partner feature flags updated successfully", "success");
            setSelectedReseller(prev => ({
                ...prev,
                features: res.data?.user?.features || featureData
            }));
            fetchResellers();
            setShowFeatureModal(false);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to update feature flags", "error");
        } finally {
            setSavingFeatures(false);
        }
    };

    const openPricingModal = async (reseller) => {
        setPricingReseller(reseller);
        setShowPricingModal(true);
        setLoadingPricing(true);
        setLocalPrices({});
        setLocalAdminPrices({});
        try {
            const res = await API.get(`/api/admin/resellers/${reseller._id}/pricing`);
            setPricingData(res.data?.pricing || []);
        } catch (err) {
            showToast("Failed to load reseller pricing", "error");
        } finally {
            setLoadingPricing(false);
        }
    };

    const handleSavePriceOverride = async (plan) => {
        const newPrice = localPrices[plan.planId];
        if (!newPrice || isNaN(Number(newPrice))) return showToast("Enter a valid price", "warning");
        setSavingPricingId(plan.planId);
        try {
            await API.post(`/api/admin/resellers/${pricingReseller._id}/pricing`, {
                planId: plan.planId,
                network: plan.network,
                sellingPrice: Number(newPrice)
            });
            showToast(`Price for ${plan.planName} updated`, "success");
            // Refresh
            const res = await API.get(`/api/admin/resellers/${pricingReseller._id}/pricing`);
            setPricingData(res.data?.pricing || []);
            setLocalPrices(prev => { const n = {...prev}; delete n[plan.planId]; return n; });
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to save price", "error");
        } finally {
            setSavingPricingId(null);
        }
    };

    const handleSaveAdminPriceOverride = async (plan) => {
        const newBuyingPrice = localAdminPrices[plan.planId];
        if (!newBuyingPrice || isNaN(Number(newBuyingPrice))) return showToast("Enter a valid admin buying price", "warning");
        setSavingPricingId(plan.planId + '_admin');
        try {
            await API.post(`/api/admin/resellers/${pricingReseller._id}/admin-override`, {
                serviceType: 'data',
                planId: plan.planId,
                network: plan.network,
                buyingPrice: Number(newBuyingPrice)
            });
            showToast(`Admin buying price for ${plan.planName} updated`, "success");
            // Refresh
            const res = await API.get(`/api/admin/resellers/${pricingReseller._id}/pricing`);
            setPricingData(res.data?.pricing || []);
            setLocalAdminPrices(prev => { const n = {...prev}; delete n[plan.planId]; return n; });
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to save price", "error");
        } finally {
            setSavingPricingId(null);
        }
    };

    const handleResetAllPricing = async () => {
        if (!window.confirm(`Reset ALL price overrides for ${pricingReseller?.name}? They will revert to default admin prices.`)) return;
        try {
            const res = await API.delete(`/api/admin/resellers/${pricingReseller._id}/pricing`);
            showToast(res.data?.message || "All prices reset", "success");
            const fresh = await API.get(`/api/admin/resellers/${pricingReseller._id}/pricing`);
            setPricingData(fresh.data?.pricing || []);
            setLocalPrices({});
        } catch (err) {
            showToast("Failed to reset pricing", "error");
        }
    };

    const handleResetSinglePrice = async (plan) => {
        try {
            await API.delete(`/api/admin/resellers/${pricingReseller._id}/pricing`, {
                data: { planId: plan.planId, network: plan.network }
            });
            showToast(`${plan.planName} reset to default`, "success");
            const res = await API.get(`/api/admin/resellers/${pricingReseller._id}/pricing`);
            setPricingData(res.data?.pricing || []);
        } catch (err) {
            showToast("Failed to reset price", "error");
        }
    };


    const filtered = resellers.filter(r => {
        const matchesSearch = 
            (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
            (r.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.subdomain || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || r.whiteLabelStatus === statusFilter;
        const matchesTier = tierFilter === 'all' || r.resellerTier === tierFilter;
        return matchesSearch && matchesStatus && matchesTier;
    });


    if (loading) return (
        <div className="partners-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <Activity className="animate-spin" size={48} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
            <h2 style={{ fontWeight: 700 }}>Synchronizing Partner Ecosystem...</h2>
        </div>
    );

    if (selectedReseller) return (
        <div className="partners-container animate-fade-in">
            <button className="premium-btn premium-btn-secondary" style={{ marginBottom: '32px' }} onClick={() => setSelectedReseller(null)}>
                <ArrowLeft size={16} /> Back to Partners
            </button>

            <div className="profile-hero">
                <div className="profile-brand">
                    <div className="profile-logo-large">
                        {selectedReseller.logo ? <img src={selectedReseller.logo} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} /> : (selectedReseller.name || 'A')[0]}
                    </div>
                    <div className="profile-info">
                        <h1>{selectedReseller.branding?.siteName || selectedReseller.name}</h1>
                        <p>{selectedReseller.email} <span style={{ margin: '0 12px', opacity: 0.3 }}>|</span> {selectedReseller.subdomain}.9jasub.com</p>
                        
                        {selectedReseller.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-color)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-color)', fontSize: '13.2px' }}>
                                    <Phone size={13} style={{ color: 'var(--text-gray)' }} />
                                    <span style={{ fontWeight: 700, color: 'var(--text-light)' }}>{selectedReseller.phone}</span>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(selectedReseller.phone);
                                            showToast("Phone number copied to clipboard", "success");
                                        }}
                                        style={{ background: 'none', border: 'none', padding: 0, marginLeft: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--primary)' }}
                                        title="Copy Phone Number"
                                    >
                                        <Copy size={13} />
                                    </button>
                                </div>
                                <a 
                                    href={getWhatsAppUrl(selectedReseller.phone)} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '6px', 
                                        background: '#10B981', 
                                        color: '#ffffff', 
                                        padding: '6px 14px', 
                                        borderRadius: '20px', 
                                        fontWeight: 800,
                                        fontSize: '12.5px',
                                        textDecoration: 'none',
                                        boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)',
                                        transition: 'transform 0.2s ease'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <MessageCircle size={14} />
                                    <span>WhatsApp Contact</span>
                                </a>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <span className={`badge ${selectedReseller.whiteLabelStatus === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                {selectedReseller.whiteLabelStatus?.toUpperCase()}
                            </span>
                            {selectedReseller.resellerTier === 'premium' && (
                                <span className="badge" style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}>
                                    <Crown size={12} /> PREMIUM PARTNER
                                </span>
                            )}
                            {selectedReseller.resellerTier === 'basic' && (
                                <span className="badge" style={{ background: 'var(--bg-color)', color: 'var(--text-light)', border: '1px solid #E2E8F0' }}>
                                    BASIC TIER
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="profile-actions">
                    <button className="premium-btn premium-btn-primary" onClick={() => { setEditData(selectedReseller); setShowEditModal(true); }}>
                        <Edit size={16} /> Edit Branding
                    </button>
                    <button className="premium-btn premium-btn-secondary" onClick={() => { setBroadcastTarget({ type: 'customers', id: selectedReseller._id, name: selectedReseller.name }); setShowBroadcastModal(true); }}>
                        <Megaphone size={16} /> Broadcast
                    </button>
                </div>
            </div>

            <div className="reseller-profile-grid">
                {/* Left Col: Analytics & Ops */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div className="premium-card">
                        <h3 style={{ fontSize: '15.4px', fontWeight: 800, marginBottom: '20px', color: 'var(--text-light)' }}>BUSINESS ANALYTICS</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '12px' }}>
                                <div style={{ fontSize: '12.1px', fontWeight: 700, color: 'var(--text-gray)' }}>CUSTOMERS</div>
                                <div style={{ fontSize: '22.0px', fontWeight: 800 }}>{customers.length}</div>
                            </div>
                            <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '12px' }}>
                                <div style={{ fontSize: '12.1px', fontWeight: 700, color: 'var(--text-gray)' }}>NORMAL WALLET</div>
                                <div style={{ fontSize: '22.0px', fontWeight: 800 }}>₦{selectedReseller.balance1?.toLocaleString()}</div>
                            </div>
                            <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '12px' }}>
                                <div style={{ fontSize: '12.1px', fontWeight: 700, color: 'var(--text-gray)' }}>VIP WALLET</div>
                                <div style={{ fontSize: '22.0px', fontWeight: 800, color: '#D97706' }}>₦{(selectedReseller.balance2 || 0).toLocaleString()}</div>
                            </div>
                            <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '12px' }}>
                                <div style={{ fontSize: '12.1px', fontWeight: 700, color: 'var(--text-gray)' }}>PROFIT EARNINGS</div>
                                <div style={{ fontSize: '22.0px', fontWeight: 800, color: '#10B981' }}>₦{(selectedReseller.earningsBalance || 0).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card">
                        <h3 style={{ fontSize: '15.4px', fontWeight: 800, marginBottom: '20px', color: 'var(--text-light)' }}>QUICK OPERATIONS</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button className="premium-btn premium-btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => {
                                const currentTier = selectedReseller.resellerTier || 'basic';
                                const nextTier = currentTier === 'premium' ? 'basic' : currentTier === 'basic' ? 'vip' : 'premium';
                                if (window.confirm(`Change tier to ${nextTier.toUpperCase()}?`)) {
                                    API.post(`/api/admin/resellers/${selectedReseller._id}/tier`, { tier: nextTier }).then(() => {
                                        fetchResellers();
                                        setSelectedReseller({ ...selectedReseller, resellerTier: nextTier });
                                        showToast(`Tier updated to ${nextTier}`, "success");
                                    });
                                }
                            }}>
                                {selectedReseller.resellerTier === 'premium' ? <Crown size={18} color="#F59E0B" /> : selectedReseller.resellerTier === 'vip' ? <Crown size={18} color="#8B5CF6" /> : <ShieldOff size={18} />}
                                Change Tier (Current: {selectedReseller.resellerTier?.toUpperCase() || 'BASIC'})
                            </button>
                            <button className="premium-btn premium-btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => setShowFeatureModal(true)}>
                                <ShieldCheck size={18} /> Manage Feature Flags
                            </button>
                            <button className="premium-btn premium-btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => {
                                const newPass = prompt("Enter new password:");
                                if (newPass) API.post('/api/admin/users/reset-password', { userId: selectedReseller._id, newPassword: newPass }).then(() => showToast("Password updated", "success"));
                            }}>
                                <Lock size={18} /> Force Password Reset
                            </button>
                            <button className="premium-btn premium-btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', background: 'rgba(37, 99, 235, 0.05)', borderColor: 'rgba(37, 99, 235, 0.15)' }} onClick={() => setShowAdjustModal(true)}>
                                <CreditCard size={18} style={{ color: 'var(--primary)' }} />
                                <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Adjust Reseller Wallets</span>
                            </button>
                            <button 
                                className="premium-btn premium-btn-secondary" 
                                style={{ width: '100%', justifyContent: 'flex-start', background: 'rgba(124, 58, 237, 0.05)', borderColor: 'rgba(124, 58, 237, 0.15)' }} 
                                onClick={() => {
                                    showToast("Login token generated", "success");
                                }}
                            >
                                <ArrowUpRight size={18} style={{ color: 'var(--accent)' }} /> 
                                <span style={{ color: 'var(--accent)', fontWeight: 800 }}>Direct Login Access</span>
                            </button>

                            <button className="premium-btn premium-btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', marginTop: '10px' }} onClick={async () => {
                                try {
                                    showToast("Triggering app rebuild...", "info");
                                    await API.post(`/api/admin/resellers/${selectedReseller._id}/app-rebuild`);
                                    showToast("App rebuild triggered successfully", "success");
                                } catch(err) {
                                    showToast(err.response?.data?.message || "Failed to trigger app rebuild", "error");
                                }
                            }}>
                                <Smartphone size={18} style={{ color: 'var(--primary)' }} /> 
                                <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Force App Rebuild</span>
                            </button>

                            <button className="premium-btn premium-btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={async () => {
                                try {
                                    showToast("Sending sync command...", "info");
                                    await API.post(`/api/admin/resellers/${selectedReseller._id}/app-sync`);
                                    showToast("Sync command sent to reseller", "success");
                                } catch(err) {
                                    showToast(err.response?.data?.message || "Failed to sync configuration", "error");
                                }
                            }}>
                                <RefreshCw size={18} /> 
                                <span>Force Sync Configuration</span>
                            </button>
                            <button 
                                className="premium-btn premium-btn-secondary" 
                                style={{ width: '100%', justifyContent: 'flex-start', background: 'rgba(124, 58, 237, 0.05)', borderColor: 'rgba(124, 58, 237, 0.15)' }} 
                                onClick={() => openPricingModal(selectedReseller)}
                            >
                                <TrendingUp size={18} style={{ color: '#7C3AED' }} />
                                <span style={{ color: '#7C3AED', fontWeight: 800 }}>Manage Custom Pricing</span>
                            </button>
                        </div>
                    </div>

                    {/* Direct Communication Hub */}
                    <div className="premium-card" style={{ background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.05), rgba(37, 211, 102, 0.02))', border: '1px solid rgba(37, 211, 102, 0.2)' }}>
                        <h3 style={{ fontSize: '15.4px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MessageCircle size={16} style={{ color: '#25D366' }} /> DIRECT COMMUNICATION HUB
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Phone display */}
                            <div style={{ background: 'var(--bg-color)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Phone size={16} style={{ color: 'var(--text-gray)' }} />
                                    <span style={{ fontWeight: 700, fontSize: '15px' }}>
                                        {selectedReseller.phone || selectedReseller.onboardingData?.whatsapp || 'No phone registered'}
                                    </span>
                                </div>
                                {(selectedReseller.phone || selectedReseller.onboardingData?.whatsapp) && (
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(selectedReseller.phone || selectedReseller.onboardingData?.whatsapp);
                                            showToast("Phone number copied!", "success");
                                        }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '13px' }}
                                    >
                                        <Copy size={14} /> Copy
                                    </button>
                                )}
                            </div>
                            {/* WhatsApp Button */}
                            <a
                                href={getWhatsAppUrl(selectedReseller.phone || selectedReseller.onboardingData?.whatsapp)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    background: '#25D366', color: '#fff', padding: '12px 20px',
                                    borderRadius: '12px', fontWeight: 800, fontSize: '15px',
                                    textDecoration: 'none', boxShadow: '0 4px 16px rgba(37, 211, 102, 0.3)',
                                    transition: 'transform 0.2s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <MessageCircle size={18} /> Open WhatsApp Chat
                            </a>
                            {/* Broadcast Button */}
                            <button
                                className="premium-btn premium-btn-secondary"
                                style={{ width: '100%', justifyContent: 'center' }}
                                onClick={() => { setBroadcastTarget({ type: 'customers', id: selectedReseller._id, name: selectedReseller.name }); setShowBroadcastModal(true); }}
                            >
                                <Megaphone size={16} /> Send Broadcast Message
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Col: Customers */}
                <div className="premium-table-wrapper">
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>Customer Base</h3>
                        <span className="badge">{customers.length} Accounts</span>
                    </div>
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Name / Email</th>
                                <th>Combined Balance</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.slice(0, 8).map(c => (
                                <tr key={c._id}>
                                    <td>
                                        <div className="partner-meta">
                                            <strong>{c.name}</strong>
                                            <span>{c.email}</span>
                                        </div>
                                    </td>
                                    <td><strong>₦{((c.balance1 || 0) + (c.balance2 || 0)).toLocaleString()}</strong></td>
                                    <td>
                                        <span className={`badge ${c.isSuspended ? 'badge-warning' : 'badge-success'}`}>
                                            {c.isSuspended ? 'Suspended' : 'Active'}
                                        </span>
                                    </td>

                                    <td>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            <button 
                                                type="button"
                                                onClick={(e) => { 
                                                    e.preventDefault(); e.stopPropagation();
                                                    navigate('/admin/users/reseller-customers', { state: { openWalletFor: c, walletAction: 'credit' } });
                                                }}
                                                style={{ padding: '6px 10px', fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', flex: 1, minWidth: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', zIndex: 50 }}
                                                title="Credit Wallet"
                                            >
                                                <ArrowUpRight size={14} style={{ marginRight: '4px', pointerEvents: 'none' }} /> Credit
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={(e) => { 
                                                    e.preventDefault(); e.stopPropagation();
                                                    navigate('/admin/users/reseller-customers', { state: { openWalletFor: c, walletAction: 'debit' } });
                                                }}
                                                style={{ padding: '6px 10px', fontSize: '11px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', flex: 1, minWidth: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', zIndex: 50 }}
                                                title="Debit Wallet"
                                            >
                                                <ArrowDownRight size={14} style={{ marginRight: '4px', pointerEvents: 'none' }} /> Debit
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={(e) => { 
                                                    e.preventDefault(); e.stopPropagation(); 
                                                    navigate('/admin/notifications', { state: { userId: c._id } }); 
                                                }}
                                                style={{ padding: '6px 10px', fontSize: '11px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '6px', flex: 1, minWidth: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', zIndex: 50 }}
                                                title="Send Notification"
                                            >
                                                <Mail size={14} style={{ marginRight: '4px', pointerEvents: 'none' }} /> Notify
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={(e) => { 
                                                    e.preventDefault(); e.stopPropagation(); 
                                                    navigate('/admin/transactions', { state: { search: c.email } }); 
                                                }}
                                                style={{ padding: '6px 10px', fontSize: '11px', background: 'var(--bg-color)', color: 'var(--text-light)', border: '1px solid var(--border-color)', borderRadius: '6px', flex: 1, minWidth: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', zIndex: 50 }}
                                                title="View History"
                                            >
                                                <History size={14} style={{ marginRight: '4px', pointerEvents: 'none' }} /> History
                                            </button>
                                        </div>
                                    </td>

                                </tr>
                            ))}
                            {customers.length === 0 && (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-light)' }}>No customers found for this partner.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="partners-container animate-fade-in">
            <header className="partners-header">
                <div>
                    <h1>Partner Ecosystem</h1>
                    <p>Manage white-label resellers and managed infrastructure nodes.</p>
                </div>
                <button className="premium-btn premium-btn-primary" onClick={() => { setBroadcastTarget({ type: 'resellers', id: null, name: 'All Partners' }); setShowBroadcastModal(true); }}>
                    <Megaphone size={18} /> Global Broadcast
                </button>
            </header>

            {/* Pending Activations Section */}
            {requests.length > 0 && (
                <section style={{ marginBottom: '48px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <ShieldAlert size={24} color="#F59E0B" />
                        <h2 style={{ fontSize: '22.0px', fontWeight: 800, margin: 0 }}>Pending Activations</h2>
                        <span className="badge" style={{ background: '#FEF3C7', color: '#D97706' }}>{requests.length} Awaiting Review</span>
                    </div>
                    <div className="pending-activations">
                        {requests.map(req => (
                            <div key={req._id} className="pending-card">
                                <div className="pending-card-header">
                                    <div className="pending-brand">
                                        <h3>{req.brandName}</h3>
                                        <p>{req.userId?.name} ({req.userId?.email})</p>
                                    </div>
                                    <div className="infra-tag"><Globe size={12} /> {req.requestedDomain}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                    <button 
                                        className="premium-btn premium-btn-primary" 
                                        style={{ flex: 1 }} 
                                        onClick={() => handleApproveRequest(req._id)}
                                        disabled={processingId !== null}
                                    >
                                        {processingId === `${req._id}-approve` ? (
                                            <>
                                                <Activity className="animate-spin" size={16} /> Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={16} /> Approve
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        className="premium-btn premium-btn-secondary" 
                                        style={{ flex: 1 }} 
                                        onClick={() => handleRejectRequest(req._id)}
                                        disabled={processingId !== null}
                                    >
                                        {processingId === `${req._id}-reject` ? (
                                            <>
                                                <Activity className="animate-spin" size={16} /> Processing...
                                            </>
                                        ) : (
                                            <>
                                                <XCircle size={16} /> Decline
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        className="premium-btn" 
                                        style={{ padding: '10px' }} 
                                        onClick={() => window.open(`https://wa.me/${req.whatsapp}`, '_blank')}
                                        disabled={processingId !== null}
                                    >
                                        <MessageCircle size={18} color="#10B981" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Active Partners List */}
            <div className="premium-glass" style={{ padding: '16px 24px', borderRadius: 'var(--radius-lg)', marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} size={18} />
                    <input 
                        type="text" 
                        placeholder="Search partners by name, email or domain..." 
                        style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', fontSize: '15.4px' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select 
                    style={{ padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', fontSize: '15.4px', background: 'var(--bg-card)' }}
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="all">All Partners</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                </select>
                <select 
                    style={{ padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', fontSize: '15.4px', background: 'var(--bg-card)' }}
                    value={tierFilter}
                    onChange={e => setTierFilter(e.target.value)}
                >
                    <option value="all">All Tiers</option>
                    <option value="basic">Basic</option>
                    <option value="premium">⭐ Premium</option>
                </select>
            </div>

            <div className="premium-table-wrapper">
                <table className="premium-table">
                    <thead>
                        <tr>
                            <th>Brand / Partner</th>
                            <th>Infrastructure</th>
                            <th>Financials</th>
                            <th>Status</th>
                            <th>Management</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(r => (
                            <tr key={r._id}>
                                <td>
                                    <div className="partner-cell">
                                        <div className="partner-logo-mini">{(r.branding?.siteName || r.name)[0]}</div>
                                        <div className="partner-meta">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <strong>{r.branding?.siteName || r.name}</strong>
                                                {r.resellerTier === 'premium' && <Crown size={12} color="#F59E0B" />}
                                            </div>
                                            <span>{r.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div className="infra-tag">{r.subdomain}.9jasub.com</div>
                                        {r.customDomain && <div className="infra-tag" style={{ background: '#E0F2FE', color: '#0369A1' }}><Globe size={10} /> {r.customDomain}</div>}
                                    </div>
                                </td>
                                <td>
                                    <div className="partner-meta">
                                        <strong>₦{((r.balance1 || 0) + (r.balance2 || 0)).toLocaleString()}</strong>
                                        <span style={{ color: '#10B981' }}>Profit: ₦{(r.earningsBalance || 0).toLocaleString()}</span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span className={`badge ${r.whiteLabelStatus === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                            {r.whiteLabelStatus?.toUpperCase()}
                                        </span>
                                        {r.isFrozen && <span className="badge badge-danger" style={{ fontSize: '11.0px' }}><Lock size={10} /> FROZEN</span>}
                                    </div>
                                </td>
                                <td>
                                    <div className="action-row">
                                        <button className="premium-btn" style={{ padding: '8px' }} onClick={() => viewProfile(r)} title="Profile"><ExternalLink size={18} /></button>
                                        <button className="premium-btn" style={{ padding: '8px' }} onClick={() => { setEditData(r); setShowEditModal(true); }} title="Branding"><Edit size={18} /></button>
                                        <button className="premium-btn" style={{ padding: '8px', color: '#10B981' }} onClick={() => { setSelectedReseller(r); setAdjustData({ wallet: 'normal', type: 'credit', amount: '', reason: '' }); setShowAdjustModal(true); }} title="Credit Wallet"><ArrowUpRight size={18} /></button>
                                        <button className="premium-btn" style={{ padding: '8px', color: '#ef4444' }} onClick={() => { setSelectedReseller(r); setAdjustData({ wallet: 'normal', type: 'debit', amount: '', reason: '' }); setShowAdjustModal(true); }} title="Debit Wallet"><ArrowDownRight size={18} /></button>
                                        <button className="premium-btn" style={{ padding: '8px', color: '#25D366' }} onClick={() => {
                                            const phoneNum = r.onboardingData?.whatsapp || r.whatsappNumber || r.phone || (r.kycData && r.kycData.phone);
                                            const url = getWhatsAppUrl(phoneNum);
                                            if (url) window.open(url, '_blank');
                                            else showToast("No phone number registered for WhatsApp.", "warning");
                                        }} title="WhatsApp Contact"><MessageCircle size={18} /></button>
                                        <button className={`premium-btn ${r.isFrozen ? 'premium-btn-danger' : ''}`} style={{ padding: '8px' }} onClick={() => {
                                            if (window.confirm(`${r.isFrozen ? 'Unfreeze' : 'Freeze'} wallet?`)) API.post('/api/admin/users/freeze', { userId: r._id, isFrozen: !r.isFrozen }).then(() => fetchResellers());
                                        }} title={r.isFrozen ? "Unfreeze" : "Freeze"}>
                                            {r.isFrozen ? <Unlock size={18} /> : <Lock size={18} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {showEditModal && editData && (
                <div className="modal-overlay-modern" onClick={() => !savingBranding && setShowEditModal(false)}>
                    <div className="modal-content-modern animate-scale-in" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleSaveBranding}>
                            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontWeight: 800 }}>Branding: {editData.name}</h3>
                                <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }} onClick={() => !savingBranding && setShowEditModal(false)}>
                                    <XCircle size={24} />
                                </button>
                            </div>
                            <div style={{ padding: '24px' }}>
                                <div className="input-group" style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Site Name</label>
                                    <input type="text" className="input-field" disabled={savingBranding} value={editData.branding?.siteName || ''} onChange={e => setEditData({...editData, branding: { ...editData.branding, siteName: e.target.value }})} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="input-group">
                                        <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Support Email</label>
                                        <input type="text" className="input-field" disabled={savingBranding} value={editData.branding?.contactEmail || ''} onChange={e => setEditData({...editData, branding: { ...editData.branding, contactEmail: e.target.value }})} required />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ display: 'block', fontSize: '13.2px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Brand Color</label>
                                        <input type="color" className="input-field" disabled={savingBranding} style={{ height: '48px', padding: '4px' }} value={editData.branding?.primaryColor || '#3B82F6'} onChange={e => setEditData({...editData, branding: { ...editData.branding, primaryColor: e.target.value }})} required />
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', textAlign: 'right', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="premium-btn premium-btn-secondary" disabled={savingBranding} onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="premium-btn premium-btn-primary" disabled={savingBranding}>
                                    {savingBranding ? <div className="btn-spinner" style={{ marginRight: '8px' }}></div> : null}
                                    Save Branding
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAdjustModal && selectedReseller && (() => {
                const currentBalance = adjustData.wallet === 'vip'
                    ? (selectedReseller.balance2 || 0)
                    : adjustData.wallet === 'earnings'
                    ? (selectedReseller.earningsBalance || 0)
                    : (selectedReseller.balance1 || 0);
                const walletLabel = adjustData.wallet === 'vip' ? 'VIP Wallet' : adjustData.wallet === 'earnings' ? 'Earnings Balance' : 'Normal Wallet';
                const isCredit = adjustData.type === 'credit';
                const previewAmount = Number(adjustData.amount) || 0;
                const previewBalance = isCredit ? currentBalance + previewAmount : Math.max(0, currentBalance - previewAmount);

                return (
                <div className="modal-overlay-modern" onClick={() => !adjusting && setShowAdjustModal(false)}>
                    <div className="modal-content-modern animate-scale-in" style={{ maxWidth: '480px', borderRadius: '20px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div style={{ 
                            background: isCredit ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                            padding: '20px 24px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <CreditCard size={18} color="white" />
                                    <h3 style={{ margin: 0, fontWeight: 800, color: '#fff', fontSize: '16px' }}>
                                        {isCredit ? 'Credit Wallet' : 'Debit Wallet'}
                                    </h3>
                                </div>
                                <p style={{ margin: 0, fontSize: '12.5px', color: 'rgba(255,255,255,0.8)' }}>
                                    {selectedReseller.branding?.siteName || selectedReseller.name} · {selectedReseller.email}
                                </p>
                            </div>
                            <button type="button" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => !adjusting && setShowAdjustModal(false)}>
                                <XCircle size={18} />
                            </button>
                        </div>

                        {/* Live Balance Preview */}
                        <div style={{ background: 'var(--bg-color)', padding: '16px 24px', display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ flex: 1, textAlign: 'center', background: 'var(--bg-card)', borderRadius: '12px', padding: '12px 8px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', marginBottom: '4px' }}>Current</div>
                                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)' }}>₦{currentBalance.toLocaleString()}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-gray)', marginTop: '2px' }}>{walletLabel}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-gray)', fontWeight: 800, fontSize: '18px' }}>→</div>
                            <div style={{ flex: 1, textAlign: 'center', background: isCredit ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: '12px', padding: '12px 8px', border: `1px solid ${isCredit ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: isCredit ? '#10b981' : '#ef4444', textTransform: 'uppercase', marginBottom: '4px' }}>After Adjustment</div>
                                <div style={{ fontSize: '18px', fontWeight: 800, color: isCredit ? '#10b981' : '#ef4444' }}>₦{previewBalance.toLocaleString()}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-gray)', marginTop: '2px' }}>
                                    {previewAmount > 0 ? `${isCredit ? '+' : '-'}₦${previewAmount.toLocaleString()}` : 'Enter amount'}
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleAdjustWallet}>
                            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                {/* Type Toggle */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Operation Type</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {['credit', 'debit'].map(t => (
                                            <button key={t} type="button" disabled={adjusting} onClick={() => setAdjustData({ ...adjustData, type: t })} style={{
                                                padding: '10px',
                                                borderRadius: '10px',
                                                border: `2px solid ${adjustData.type === t ? (t === 'credit' ? '#10b981' : '#ef4444') : 'var(--border-color)'}`,
                                                background: adjustData.type === t ? (t === 'credit' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)') : 'var(--bg-card)',
                                                cursor: 'pointer',
                                                fontWeight: 700,
                                                fontSize: '13px',
                                                color: adjustData.type === t ? (t === 'credit' ? '#10b981' : '#ef4444') : 'var(--text-gray)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                transition: 'all 0.2s ease'
                                            }}>
                                                {t === 'credit' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                                {t === 'credit' ? 'Credit (Add)' : 'Debit (Deduct)'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Wallet Selector */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Target Wallet</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                        {[
                                            { key: 'normal', label: 'Normal', bal: selectedReseller.balance1 || 0, color: '#3b82f6' },
                                            { key: 'vip', label: 'VIP', bal: selectedReseller.balance2 || 0, color: '#d97706' },
                                            { key: 'earnings', label: 'Earnings', bal: selectedReseller.earningsBalance || 0, color: '#10b981' },
                                        ].map(w => (
                                            <button key={w.key} type="button" disabled={adjusting} onClick={() => setAdjustData({ ...adjustData, wallet: w.key })} style={{
                                                padding: '10px 8px',
                                                borderRadius: '10px',
                                                border: `2px solid ${adjustData.wallet === w.key ? w.color : 'var(--border-color)'}`,
                                                background: adjustData.wallet === w.key ? `${w.color}15` : 'var(--bg-card)',
                                                cursor: 'pointer',
                                                textAlign: 'center',
                                                transition: 'all 0.2s ease'
                                            }}>
                                                <div style={{ fontSize: '10px', fontWeight: 700, color: adjustData.wallet === w.key ? w.color : 'var(--text-gray)', marginBottom: '3px' }}>{w.label}</div>
                                                <div style={{ fontSize: '12px', fontWeight: 800, color: adjustData.wallet === w.key ? w.color : 'var(--text-dark)' }}>₦{w.bal.toLocaleString()}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Amount */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Amount (₦)</label>
                                    <input 
                                        type="number" 
                                        className="input-field"
                                        placeholder="e.g. 5000"
                                        required min="1"
                                        disabled={adjusting}
                                        value={adjustData.amount}
                                        onChange={e => setAdjustData({ ...adjustData, amount: e.target.value })}
                                        style={{ fontSize: '20px', fontWeight: 800, textAlign: 'center', letterSpacing: '-0.5px' }}
                                    />
                                </div>

                                {/* Reason */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Reason / Audit Note</label>
                                    <input 
                                        type="text" 
                                        className="input-field"
                                        placeholder="e.g. VIP Upgrade Bonus, Balance correction for TX#192"
                                        required
                                        disabled={adjusting}
                                        value={adjustData.reason}
                                        onChange={e => setAdjustData({ ...adjustData, reason: e.target.value })}
                                    />
                                </div>

                                {/* Admin Funding Password */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Admin Funding Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-gray)' }} />
                                        <input 
                                            type="password" 
                                            className="input-field"
                                            placeholder="Enter Admin Funding Password"
                                            required
                                            disabled={adjusting}
                                            value={adjustData.fundingPassword}
                                            onChange={e => setAdjustData({ ...adjustData, fundingPassword: e.target.value })}
                                            style={{ paddingLeft: '38px' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" className="premium-btn premium-btn-secondary" disabled={adjusting} onClick={() => setShowAdjustModal(false)}>Cancel</button>
                                <button 
                                    type="submit" 
                                    className="premium-btn"
                                    style={{ 
                                        background: isCredit ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)',
                                        color: '#fff', border: 'none', minWidth: '160px',
                                        boxShadow: isCredit ? '0 4px 12px rgba(16,185,129,0.3)' : '0 4px 12px rgba(239,68,68,0.3)'
                                    }}
                                    disabled={adjusting}
                                >
                                    {adjusting ? <><div className="btn-spinner" style={{ marginRight: '8px' }}></div>Processing...</> 
                                    : `Confirm ${isCredit ? 'Credit' : 'Debit'} ₦${previewAmount > 0 ? previewAmount.toLocaleString() : '—'}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                );
            })()}

            {/* OTP Verification Modal */}
            {showOTPModal && (
                <div className="modal-overlay-modern" onClick={() => !adjusting && setShowOTPModal(false)}>
                    <div className="modal-content-modern animate-scale-in" style={{ maxWidth: '420px', borderRadius: '20px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ background: 'var(--bg-card)', padding: '24px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ background: 'rgba(37, 99, 235, 0.1)', width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ShieldCheck size={32} style={{ color: 'var(--primary)' }} />
                            </div>
                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '18px', color: 'var(--text-dark)' }}>Security Verification</h3>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-gray)' }}>Enter the 6-digit OTP sent to your admin email to confirm this wallet adjustment.</p>
                        </div>
                        <form onSubmit={handleConfirmOTP}>
                            <div style={{ padding: '24px' }}>
                                <input 
                                    type="text" 
                                    className="input-field"
                                    placeholder="Enter 6-digit OTP"
                                    maxLength="6"
                                    required
                                    disabled={adjusting}
                                    value={otpData.otp}
                                    onChange={e => setOtpData({ ...otpData, otp: e.target.value })}
                                    style={{ fontSize: '24px', fontWeight: 800, textAlign: 'center', letterSpacing: '8px', padding: '16px' }}
                                />
                            </div>
                            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'var(--bg-color)' }}>
                                <button type="button" className="premium-btn premium-btn-secondary" disabled={adjusting} onClick={() => setShowOTPModal(false)}>Cancel</button>
                                <button type="submit" className="premium-btn premium-btn-primary" disabled={adjusting || otpData.otp.length < 6}>
                                    {adjusting ? <><div className="btn-spinner" style={{ marginRight: '8px' }}></div>Verifying...</> : 'Confirm Adjustment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* Broadcast Modal */}
            {showBroadcastModal && (
                <div className="modal-overlay-modern" onClick={() => !sendingBroadcast && setShowBroadcastModal(false)}>
                    <div className="modal-content-modern animate-scale-in" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Megaphone size={20} color="var(--primary)" /> 
                                    Send Push Broadcast
                                </h3>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-gray)' }}>
                                    Target: <strong style={{ color: 'var(--primary)' }}>{broadcastTarget.name || 'All Partners'}</strong>
                                </p>
                            </div>
                            <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }} onClick={() => !sendingBroadcast && setShowBroadcastModal(false)}>
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSendBroadcast}>
                            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Broadcast Title / Header</label>
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        placeholder="e.g. Critical Gateway Maintenance" 
                                        required
                                        disabled={sendingBroadcast}
                                        value={broadcastContent.title}
                                        onChange={e => setBroadcastContent({ ...broadcastContent, title: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Alert Message Body</label>
                                    <textarea 
                                        className="input-field" 
                                        rows="5"
                                        style={{ resize: 'none', height: '120px' }}
                                        placeholder="Type the message that will be broadcasted to all users under this target..." 
                                        required
                                        disabled={sendingBroadcast}
                                        value={broadcastContent.message}
                                        onChange={e => setBroadcastContent({ ...broadcastContent, message: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', textAlign: 'right', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="premium-btn premium-btn-secondary" disabled={sendingBroadcast} onClick={() => setShowBroadcastModal(false)}>Cancel</button>
                                <button type="submit" className="premium-btn premium-btn-primary" disabled={sendingBroadcast}>
                                    {sendingBroadcast ? <div className="btn-spinner" style={{ marginRight: '8px' }}></div> : null}
                                    {sendingBroadcast ? 'Broadcasting...' : 'Dispatch Broadcast Alert'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Feature Flags Modal */}
            {showFeatureModal && featureData && (
                <div className="modal-overlay-modern" onClick={() => setShowFeatureModal(false)}>
                    <div className="modal-content-modern animate-scale-in" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ShieldCheck size={20} color="var(--primary)" />
                                    Partner Feature Access Control
                                </h3>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-gray)' }}>
                                    Manage active features for <strong>{selectedReseller.branding?.siteName || selectedReseller.name}</strong>
                                </p>
                            </div>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }} onClick={() => setShowFeatureModal(false)}>
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div style={{ padding: '24px', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {Object.keys(featureData).map(featureKey => {
                                const labelMap = {
                                    custom_domain: 'Custom Domain Connection',
                                    apk_generation: 'Native APK Build Generation',
                                    pwa_enabled: 'Progressive Web App (PWA)',
                                    push_notifications: 'Web Push Notifications',
                                    premium_analytics: 'Advanced Business Analytics',
                                    ai_tools: 'AI-Powered Margin Recommender',
                                    playstore_publish: 'Google Play Store Publishing Assistant',
                                    ios_app: 'Apple App Store iOS App',
                                    premium_branding: 'Premium Theme Customizations',
                                    dedicated_support: '24/7 SLA Priority Support'
                                };
                                return (
                                    <div key={featureKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-color)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                        <div>
                                            <strong style={{ display: 'block', fontSize: '14.5px', color: 'var(--text-dark)' }}>{labelMap[featureKey] || featureKey}</strong>
                                            <span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>API Tag: {featureKey}</span>
                                        </div>
                                        <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={!!featureData[featureKey]} 
                                                onChange={e => setFeatureData({ ...featureData, [featureKey]: e.target.checked })}
                                                style={{ opacity: 0, width: 0, height: 0 }}
                                            />
                                            <span style={{
                                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                                backgroundColor: featureData[featureKey] ? 'var(--primary)' : '#cbd5e1',
                                                transition: '.3s', borderRadius: '24px'
                                            }}>
                                                <span style={{
                                                    position: 'absolute', content: '""', height: '18px', width: '18px', left: featureData[featureKey] ? '22px' : '3px', bottom: '3px',
                                                    backgroundColor: 'var(--bg-card)', transition: '.3s', borderRadius: '50%'
                                                }}></span>
                                            </span>
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', textAlign: 'right', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button type="button" className="premium-btn premium-btn-secondary" onClick={() => setShowFeatureModal(false)}>Cancel</button>
                            <button 
                                type="button" 
                                className="premium-btn premium-btn-primary" 
                                onClick={handleSaveFeatures}
                                disabled={savingFeatures}
                            >
                                {savingFeatures ? 'Saving Changes...' : 'Persist Feature Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* === ADMIN CUSTOM PRICING MODAL === */}
            {showPricingModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
                    <div style={{ background: 'var(--bg-card)', borderRadius: '20px', width: '100%', maxWidth: '900px', boxShadow: '0 24px 80px rgba(0,0,0,0.3)', marginTop: '20px' }}>
                        {/* Header */}
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontWeight: 800, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <TrendingUp size={20} style={{ color: '#7C3AED' }} />
                                    Custom Pricing — {pricingReseller?.branding?.siteName || pricingReseller?.name}
                                </h2>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-gray)' }}>
                                    {pricingReseller?.resellerTier === 'premium' ? '⭐ Premium Reseller — can use custom prices' : '🔒 Basic Reseller — prices are admin-controlled'}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="premium-btn" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }} onClick={handleResetAllPricing}>
                                    <Trash2 size={15} /> Reset All
                                </button>
                                <button className="premium-btn premium-btn-secondary" onClick={() => setShowPricingModal(false)}>
                                    <X size={16} /> Close
                                </button>
                            </div>
                        </div>
                        {/* Filters */}
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <select
                                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '14px', background: 'var(--bg-card)' }}
                                value={pricingNetworkFilter}
                                onChange={e => setPricingNetworkFilter(e.target.value)}
                            >
                                <option value="all">All Networks</option>
                                <option value="MTN">MTN</option>
                                <option value="GLO">GLO</option>
                                <option value="AIRTEL">AIRTEL</option>
                                <option value="9MOBILE">9MOBILE</option>
                            </select>
                            <select
                                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '14px', background: 'var(--bg-card)' }}
                                value={pricingCategoryFilter}
                                onChange={e => setPricingCategoryFilter(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                <option value="SME">SME</option>
                                <option value="Corporate">Corporate</option>
                                <option value="Gifting">Gifting</option>
                                <option value="Direct">Direct</option>
                            </select>
                            <div style={{ fontSize: '13px', color: 'var(--text-gray)', display: 'flex', alignItems: 'center' }}>
                                {pricingData.filter(p =>
                                    (pricingNetworkFilter === 'all' || p.network === pricingNetworkFilter) &&
                                    (pricingCategoryFilter === 'all' || p.category === pricingCategoryFilter)
                                ).length} plans shown &bull; {pricingData.filter(p => p.isOverridden).length} overridden
                            </div>
                        </div>
                        {/* Table */}
                        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {loadingPricing ? (
                                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-gray)' }}>
                                    <Activity className="animate-spin" size={32} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
                                    <p>Loading pricing data...</p>
                                </div>
                            ) : (
                                <table className="premium-table">
                                    <thead>
                                        <tr>
                                            <th>Plan</th>
                                            <th>Network</th>
                                            <th>Category</th>
                                            <th>Default Price</th>
                                            <th>Admin Buying Price</th>
                                            <th>Reseller Selling Price</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pricingData
                                            .filter(p =>
                                                (pricingNetworkFilter === 'all' || p.network === pricingNetworkFilter) &&
                                                (pricingCategoryFilter === 'all' || p.category === pricingCategoryFilter)
                                            )
                                            .map(plan => (
                                            <tr key={plan.planId} style={{ background: plan.isOverridden ? 'rgba(124, 58, 237, 0.03)' : undefined }}>
                                                <td>
                                                    <div>
                                                        <strong style={{ fontSize: '13px' }}>{plan.planSize || plan.planName}</strong>
                                                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-gray)' }}>{plan.planName}</span>
                                                    </div>
                                                </td>
                                                <td><span className="badge">{plan.network}</span></td>
                                                <td><span style={{ fontSize: '12px', fontWeight: 600 }}>{plan.category}</span></td>
                                                <td><strong style={{ color: 'var(--text-dark)' }}>₦{plan.basePrice?.toLocaleString()}</strong></td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <input
                                                            type="number"
                                                            placeholder={plan.basePrice}
                                                            value={localAdminPrices[plan.planId] !== undefined ? localAdminPrices[plan.planId] : (plan.isAdminOverridden ? plan.basePrice : '')}
                                                            onChange={e => setLocalAdminPrices(prev => ({ ...prev, [plan.planId]: e.target.value }))}
                                                            style={{ width: '80px', padding: '6px 10px', borderRadius: '8px', border: `1px solid ${plan.isAdminOverridden ? '#EF4444' : 'var(--border-color)'}`, outline: 'none', fontSize: '13px', fontWeight: 700 }}
                                                        />
                                                        {plan.isAdminOverridden && <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 700 }}>ADMIN</span>}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <input
                                                            type="number"
                                                            placeholder={plan.sellingPrice}
                                                            value={localPrices[plan.planId] !== undefined ? localPrices[plan.planId] : (plan.isOverridden ? plan.sellingPrice : '')}
                                                            onChange={e => setLocalPrices(prev => ({ ...prev, [plan.planId]: e.target.value }))}
                                                            style={{ width: '80px', padding: '6px 10px', borderRadius: '8px', border: `1px solid ${plan.isOverridden ? '#7C3AED' : 'var(--border-color)'}`, outline: 'none', fontSize: '13px', fontWeight: 700 }}
                                                        />
                                                        {plan.isOverridden && <span style={{ fontSize: '11px', color: '#7C3AED', fontWeight: 700 }}>RESELLER</span>}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <span className={`badge ${plan.isAdminOverridden ? '' : 'badge-success'}`} style={plan.isAdminOverridden ? { background: '#FEE2E2', color: '#EF4444', fontSize: '10px' } : { fontSize: '10px' }}>
                                                            {plan.isAdminOverridden ? 'Admin Buy' : 'Default Buy'}
                                                        </span>
                                                        <span className={`badge ${plan.isOverridden ? '' : 'badge-success'}`} style={plan.isOverridden ? { background: '#EDE9FE', color: '#7C3AED', fontSize: '10px' } : { fontSize: '10px' }}>
                                                            {plan.isOverridden ? 'Custom Sell' : 'Default Sell'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <button
                                                                className="premium-btn premium-btn-primary"
                                                                style={{ padding: '4px 8px', fontSize: '11px', background: '#EF4444' }}
                                                                onClick={() => handleSaveAdminPriceOverride(plan)}
                                                                disabled={savingPricingId === plan.planId + '_admin' || !localAdminPrices[plan.planId]}
                                                                title="Save Admin Buying Price"
                                                            >
                                                                {savingPricingId === plan.planId + '_admin' ? <Activity className="animate-spin" size={12} /> : 'Save Buy'}
                                                            </button>
                                                            {plan.isAdminOverridden && (
                                                                <button
                                                                    className="premium-btn"
                                                                    style={{ padding: '4px 8px', fontSize: '11px', color: '#ef4444' }}
                                                                    onClick={async () => {
                                                                        if(window.confirm('Reset Admin Buying Price?')) {
                                                                            await API.delete(`/api/admin/resellers/${pricingReseller._id}/admin-override`, { data: { serviceType: 'data', planId: plan.planId, network: plan.network }});
                                                                            const res = await API.get(`/api/admin/resellers/${pricingReseller._id}/pricing`);
                                                                            setPricingData(res.data?.pricing || []);
                                                                        }
                                                                    }}
                                                                >
                                                                    Reset Buy
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <button
                                                                className="premium-btn premium-btn-primary"
                                                                style={{ padding: '4px 8px', fontSize: '11px' }}
                                                                onClick={() => handleSavePriceOverride(plan)}
                                                                disabled={savingPricingId === plan.planId || !localPrices[plan.planId]}
                                                                title="Save Reseller Selling Price"
                                                            >
                                                                {savingPricingId === plan.planId ? <Activity className="animate-spin" size={12} /> : 'Save Sell'}
                                                            </button>
                                                            {plan.isOverridden && (
                                                                <button
                                                                    className="premium-btn"
                                                                    style={{ padding: '4px 8px', fontSize: '11px', color: '#ef4444' }}
                                                                    onClick={() => handleResetSinglePrice(plan)}
                                                                >
                                                                    Reset Sell
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}



        </div>
    );
};

export default ResellerManager;
