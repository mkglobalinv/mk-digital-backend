import React, { useState, useEffect } from 'react';
import { CheckCircle2, Landmark, Loader2, Save, ShieldCheck, Info, ArrowUp, ArrowDown } from 'lucide-react';
import API from '../../api';
import './DataPlanPricing.css';
import './OgdamsSmePricing.css';
import './VirtualAccountGateway.css';

const DEFAULT_PROVIDERS = [
    { id: 'wittypay', name: 'Wittypay', description: 'Temporary virtual accounts with automated payment webhook settlement.' },
    { id: 'flutterwave', name: 'Flutterwave', description: 'Established gateway. Requires BVN/NIN for permanent accounts.' },
    { id: 'paymentpoint', name: 'PaymentPoint', description: 'Reserved (static-capable) virtual accounts. No BVN/NIN required.' }
];

const DEFAULT_PRIORITY = ['wittypay', 'flutterwave', 'paymentpoint'];
const DEFAULT_ENABLED = { wittypay: true, flutterwave: true, paymentpoint: true };

const VirtualAccountGateway = () => {
    const [priority, setPriority] = useState(DEFAULT_PRIORITY);
    const [enabled, setEnabled] = useState(DEFAULT_ENABLED);
    const [updatedAt, setUpdatedAt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/admin/virtual-account-provider');
            const data = res.data || {};

            let loadedPriority = Array.isArray(data.priority) && data.priority.length > 0
                ? data.priority.filter(p => DEFAULT_PRIORITY.includes(p))
                : null;

            if (!loadedPriority || loadedPriority.length === 0) {
                if (data.primary && DEFAULT_PRIORITY.includes(data.primary)) {
                    const others = DEFAULT_PRIORITY.filter(p => p !== data.primary);
                    loadedPriority = [data.primary, ...others];
                } else {
                    loadedPriority = [...DEFAULT_PRIORITY];
                }
            }

            // Ensure all providers exist in priority array
            DEFAULT_PRIORITY.forEach(p => {
                if (!loadedPriority.includes(p)) loadedPriority.push(p);
            });

            const loadedEnabled = {
                wittypay: data.enabled?.wittypay !== undefined ? Boolean(data.enabled.wittypay) : true,
                flutterwave: data.enabled?.flutterwave !== undefined ? Boolean(data.enabled.flutterwave) : (data.primary === 'flutterwave' || data.fallbackEnabled !== false),
                paymentpoint: data.enabled?.paymentpoint !== undefined ? Boolean(data.enabled.paymentpoint) : (data.primary === 'paymentpoint' || data.fallbackEnabled !== false)
            };

            setPriority(loadedPriority);
            setEnabled(loadedEnabled);
            setUpdatedAt(data.updatedAt || null);
            setDirty(false);
        } catch (err) {
            alert('Failed to load virtual account provider settings: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchConfig(); }, []);

    const activeProviders = priority.filter(id => enabled[id] !== false);

    const handleToggleEnabled = (id, e) => {
        e.stopPropagation();
        setEnabled(prev => ({ ...prev, [id]: !prev[id] }));
        setDirty(true);
    };

    const handleMovePriority = (id, direction, e) => {
        e.stopPropagation();
        const index = priority.indexOf(id);
        if (index === -1) return;
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= priority.length) return;

        const newPriority = [...priority];
        const [moved] = newPriority.splice(index, 1);
        newPriority.splice(newIndex, 0, moved);

        setPriority(newPriority);
        setDirty(true);
    };

    const handleSetPrimary = (id) => {
        if (priority[0] === id) return;
        const newPriority = [id, ...priority.filter(p => p !== id)];
        setPriority(newPriority);
        setDirty(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                primary: activeProviders[0] || priority[0],
                fallbackEnabled: activeProviders.length > 1,
                priority,
                enabled
            };
            const res = await API.post('/api/admin/virtual-account-provider', payload);
            setUpdatedAt(res.data.updatedAt || new Date().toISOString());
            setDirty(false);
            alert('Virtual account gateway settings saved successfully.');
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
                    <p>Configure wallet funding providers, priorities, and automatic failover.</p>
                </div>
                <button className="sync-btn" onClick={handleSave} disabled={saving || !dirty}>
                    {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="ogdams-sme-note">
                <Info size={16} />
                <span>
                    Automatic fallback uses the next enabled provider according to the configured priority order.
                    If the primary provider fails during account creation, the next available provider is tried automatically.
                </span>
            </div>

            <div className="vag-provider-grid">
                {DEFAULT_PROVIDERS.map((provider) => {
                    const isEnabled = enabled[provider.id] !== false;
                    const activeIndex = activeProviders.indexOf(provider.id);
                    const isPrimary = activeIndex === 0;
                    const priorityIndex = priority.indexOf(provider.id);

                    return (
                        <div
                            key={provider.id}
                            className={`vag-provider-card ${isPrimary ? 'selected' : ''} ${!isEnabled ? 'disabled' : ''}`}
                            onClick={() => handleSetPrimary(provider.id)}
                        >
                            <div className="vag-provider-card-top">
                                <span className="vag-provider-icon"><Landmark size={20} /></span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {priorityIndex > 0 && (
                                        <button
                                            type="button"
                                            className="vag-priority-btn"
                                            title="Move Up Priority"
                                            onClick={(e) => handleMovePriority(provider.id, 'up', e)}
                                        >
                                            <ArrowUp size={14} />
                                        </button>
                                    )}
                                    {priorityIndex < priority.length - 1 && (
                                        <button
                                            type="button"
                                            className="vag-priority-btn"
                                            title="Move Down Priority"
                                            onClick={(e) => handleMovePriority(provider.id, 'down', e)}
                                        >
                                            <ArrowDown size={14} />
                                        </button>
                                    )}
                                    {isPrimary && <span className="vag-provider-check"><CheckCircle2 size={18} /></span>}
                                </div>
                            </div>

                            <h3>{provider.name}</h3>
                            <p>{provider.description}</p>

                            <div className="vag-card-footer">
                                <span className={`vag-provider-role ${!isEnabled ? 'disabled' : (isPrimary ? 'primary' : 'fallback')}`}>
                                    {!isEnabled ? 'DISABLED' : (isPrimary ? 'PRIMARY' : 'FALLBACK CANDIDATE')}
                                </span>
                                {isEnabled && (
                                    <span className="vag-priority-badge">Priority {activeIndex + 1}</span>
                                )}
                                <div className="vag-toggle-wrap" onClick={(e) => e.stopPropagation()}>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={isEnabled}
                                            onChange={(e) => handleToggleEnabled(provider.id, e)}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="ogdams-sme-rule-card">
                <h3><ShieldCheck size={18} /> Active Failover Sequence</h3>
                <p className="ogdams-sme-rule-desc">
                    Current active provider order: <b>{activeProviders.length > 0 ? activeProviders.map(id => DEFAULT_PROVIDERS.find(p => p.id === id)?.name).join(' → ') : 'None (All Providers Disabled)'}</b>
                </p>
                <p className="ogdams-sme-rule-desc" style={{ marginTop: 6, fontSize: 13, color: '#6b7280' }}>
                    Click any provider card to set it as Primary (Priority 1), or use the toggle switches to enable/disable specific providers.
                </p>
            </div>

            {updatedAt && (
                <p className="vag-updated-at">Last saved: {new Date(updatedAt).toLocaleString()}</p>
            )}
        </div>
    );
};

export default VirtualAccountGateway;
