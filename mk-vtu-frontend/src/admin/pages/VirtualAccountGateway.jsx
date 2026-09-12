import React, { useState, useEffect } from 'react';
import { CheckCircle2, Landmark, Loader2, Save, ShieldCheck, Info } from 'lucide-react';
import API from '../../api';
import './DataPlanPricing.css';
import './OgdamsSmePricing.css';
import './VirtualAccountGateway.css';

// Admin control for which gateway is used to generate customer wallet
// virtual accounts (temporary + permanent). Backed by a single Setting doc,
// key 'virtualAccountProvider' -- read live on every request by
// services/accountService.js's getVirtualAccountProviderConfig(). Customer
// UX (temporary-by-default, permanent after BVN/NIN verification) is
// untouched by this page; it only decides which provider is tried first,
// and whether the other one is used automatically if the first one fails.
const PROVIDERS = [
    { id: 'paymentpoint', name: 'PaymentPoint', description: 'Reserved (static-capable) virtual accounts. No BVN/NIN required.' },
    { id: 'flutterwave', name: 'Flutterwave', description: 'Established gateway. Requires BVN/NIN for permanent accounts.' }
];

const VirtualAccountGateway = () => {
    const [primary, setPrimary] = useState('paymentpoint');
    const [fallbackEnabled, setFallbackEnabled] = useState(true);
    const [updatedAt, setUpdatedAt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/admin/virtual-account-provider');
            setPrimary(res.data.primary);
            setFallbackEnabled(res.data.fallbackEnabled);
            setUpdatedAt(res.data.updatedAt);
            setDirty(false);
        } catch (err) {
            alert('Failed to load virtual account provider settings: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchConfig(); }, []);

    const fallbackProviderName = PROVIDERS.find((p) => p.id !== primary)?.name;

    const handleSelectPrimary = (id) => {
        if (id === primary) return;
        setPrimary(id);
        setDirty(true);
    };

    const handleToggleFallback = () => {
        setFallbackEnabled((prev) => !prev);
        setDirty(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await API.post('/api/admin/virtual-account-provider', { primary, fallbackEnabled });
            setPrimary(res.data.primary);
            setFallbackEnabled(res.data.fallbackEnabled);
            setUpdatedAt(res.data.updatedAt);
            setDirty(false);
            alert('Virtual account gateway settings saved.');
        } catch (err) {
            alert('Failed to save: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-state">Loading virtual account gateway settings...</div>;

    return (
        <div className="data-pricing-container">
            <div className="page-header">
                <div>
                    <h2>Virtual Account Gateway</h2>
                    <p>Choose which provider generates customer wallet-funding accounts.</p>
                </div>
                <button className="sync-btn" onClick={handleSave} disabled={saving || !dirty}>
                    {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="ogdams-sme-note">
                <Info size={16} />
                <span>
                    <b>Primary</b> is the provider tried first for every temporary and permanent virtual account request
                    (Wallet page "Fund Wallet" and BVN/NIN "Upgrade" flows). If it fails and <b>automatic fallback</b> is on,
                    the other provider is used immediately instead -- the customer never sees the failure. This only changes
                    which gateway issues the account; the customer-facing flow itself is unchanged.
                </span>
            </div>

            <div className="vag-provider-grid">
                {PROVIDERS.map((provider) => {
                    const isSelected = primary === provider.id;
                    return (
                        <button
                            key={provider.id}
                            type="button"
                            className={`vag-provider-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectPrimary(provider.id)}
                        >
                            <div className="vag-provider-card-top">
                                <span className="vag-provider-icon"><Landmark size={20} /></span>
                                {isSelected && <span className="vag-provider-check"><CheckCircle2 size={18} /></span>}
                            </div>
                            <h3>{provider.name}</h3>
                            <p>{provider.description}</p>
                            <span className={`vag-provider-role ${isSelected ? 'primary' : ''}`}>
                                {isSelected ? 'PRIMARY' : 'FALLBACK CANDIDATE'}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="ogdams-sme-rule-card">
                <h3><ShieldCheck size={18} /> Automatic Fallback</h3>
                <p className="ogdams-sme-rule-desc">
                    When enabled, if <b>{PROVIDERS.find((p) => p.id === primary)?.name}</b> is unavailable or returns an
                    error, <b>{fallbackProviderName}</b> is used automatically so account generation still succeeds. When
                    disabled, a failure on the primary provider is returned to the customer as-is.
                </p>
                <label className="switch">
                    <input type="checkbox" checked={fallbackEnabled} onChange={handleToggleFallback} />
                    <span className="slider round"></span>
                </label>
                <span style={{ marginLeft: 10, fontWeight: 600, color: fallbackEnabled ? '#10b981' : '#6b7280' }}>
                    {fallbackEnabled ? `Fallback to ${fallbackProviderName} enabled` : 'Fallback disabled'}
                </span>
            </div>

            {updatedAt && (
                <p className="vag-updated-at">Last saved: {new Date(updatedAt).toLocaleString()}</p>
            )}
        </div>
    );
};

export default VirtualAccountGateway;
