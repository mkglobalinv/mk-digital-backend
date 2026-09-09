import React, { useState, useEffect } from 'react';
import API from '../../api';
import { useToast } from '../../context/ToastContext';
import './AirtimeToCash.css';

const NETWORKS = ['MTN', 'AIRTEL', 'GLO', '9MOBILE'];

const AirtimeToCashSettings = () => {
    const { showToast } = useToast();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [apiToken, setApiToken] = useState('');
    const [apiBaseUrl, setApiBaseUrl] = useState('');
    const [isTestMode, setIsTestMode] = useState(true);
    const [minAmount, setMinAmount] = useState(500);
    const [maxAmount, setMaxAmount] = useState(50000);
    const [networks, setNetworks] = useState({});

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/admin/airtime-to-cash/config');
            const data = res.data.data;
            setConfig(data);
            setApiBaseUrl(data.apiBaseUrl || '');
            setIsTestMode(data.isTestMode);
            setMinAmount(data.limits?.minAmount ?? 500);
            setMaxAmount(data.limits?.maxAmount ?? 50000);
            setNetworks(data.networks || {});
        } catch (err) {
            showToast('Failed to load Airtime-to-Cash settings.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchConfig(); }, []);

    const saveField = async (patch) => {
        try {
            setSaving(true);
            await API.put('/api/admin/airtime-to-cash/config', patch);
            await fetchConfig();
            showToast('Settings updated.', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update settings.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggleMaster = () => {
        if (!config) return;
        if (!config.isActive && !config.hasApiToken) {
            showToast('Set an API token before enabling Airtime-to-Cash.', 'error');
            return;
        }
        const confirmed = config.isActive
            ? window.confirm('Disable Airtime-to-Cash globally? No tenant will be able to start a new transaction.')
            : window.confirm('Enable Airtime-to-Cash globally? Only do this after the AirtimeBridge API contract has been verified in test mode.');
        if (!confirmed) return;
        saveField({ isActive: !config.isActive });
    };

    const toggleNetwork = (net) => {
        const next = { ...networks, [net]: !networks[net] };
        setNetworks(next);
        saveField({ networks: { [net]: next[net] } });
    };

    const saveCredentials = () => {
        const patch = { apiBaseUrl, isTestMode, limits: { minAmount: Number(minAmount), maxAmount: Number(maxAmount) } };
        if (apiToken) patch.apiToken = apiToken;
        saveField(patch).then(() => setApiToken(''));
    };

    if (loading) return <div className="a2c-container">Loading...</div>;

    return (
        <div className="a2c-container">
            <div className="a2c-header">
                <div>
                    <h2>Airtime-to-Cash — Provider Settings</h2>
                    <p>Controls the AirtimeBridge connection, the global on/off switch, and per-network availability.</p>
                </div>
            </div>

            <div className={`a2c-master-switch ${config?.isActive ? 'is-active' : ''}`}>
                <div>
                    <strong>{config?.isActive ? 'Airtime-to-Cash is LIVE' : 'Airtime-to-Cash is OFF'}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
                        Production activation requires this to be explicitly enabled after the provider API contract is verified. It defaults to OFF.
                    </p>
                </div>
                <button className={`a2c-toggle ${config?.isActive ? 'on' : ''}`} onClick={toggleMaster} disabled={saving} aria-label="Toggle Airtime-to-Cash globally" />
            </div>

            <div className="a2c-card">
                <h3>Networks</h3>
                <div className="a2c-network-grid">
                    {NETWORKS.map((net) => (
                        <div className="a2c-network-toggle" key={net}>
                            <span>{net}</span>
                            <button className={`a2c-toggle ${networks[net] ? 'on' : ''}`} onClick={() => toggleNetwork(net)} disabled={saving} aria-label={`Toggle ${net}`} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="a2c-card">
                <h3>AirtimeBridge Credentials</h3>
                <div className="a2c-form-grid">
                    <div className="a2c-field">
                        <label>API Token {config?.hasApiToken ? '(set — leave blank to keep)' : '(not set)'}</label>
                        <input type="password" value={apiToken} onChange={(e) => setApiToken(e.target.value)} placeholder="••••••••••••" />
                    </div>
                    <div className="a2c-field">
                        <label>API Base URL</label>
                        <input value={apiBaseUrl} onChange={(e) => setApiBaseUrl(e.target.value)} />
                    </div>
                    <div className="a2c-field">
                        <label>Mode</label>
                        <select value={isTestMode ? 'test' : 'live'} onChange={(e) => setIsTestMode(e.target.value === 'test')}>
                            <option value="test">Sandbox / Mock (safe — uses the mock provider)</option>
                            <option value="live">Live (real AirtimeBridge — requires verified API contract)</option>
                        </select>
                    </div>
                    <div className="a2c-field">
                        <label>Min Amount (₦)</label>
                        <input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
                    </div>
                    <div className="a2c-field">
                        <label>Max Amount (₦)</label>
                        <input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
                    </div>
                </div>
                <button className="a2c-btn primary" onClick={saveCredentials} disabled={saving}>Save</button>
            </div>

            <div className="a2c-card" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                <h3>Before enabling Live mode</h3>
                <p style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
                    OTP, quota-check, and transfer are implemented against AirtimeBridge's documented API. One gap
                    remains: no transaction-status-by-reference endpoint is documented, so a MANUAL_REVIEW
                    transaction from an ambiguous transfer response must be resolved by hand under
                    Airtime-to-Cash → Transactions, not automatically. Test with a small real transfer in Live mode
                    before wider rollout.
                </p>
            </div>
        </div>
    );
};

export default AirtimeToCashSettings;
