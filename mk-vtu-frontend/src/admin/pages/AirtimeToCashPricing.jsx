import React, { useState, useEffect, useMemo } from 'react';
import API from '../../api';
import { useToast } from '../../context/ToastContext';
import './AirtimeToCash.css';

const NETWORKS = ['MTN', 'AIRTEL', 'GLO', '9MOBILE'];
const GLOBAL_KEY = '__global__';

const emptyForm = { tenantId: GLOBAL_KEY, network: 'MTN', conversionPercentage: 80, fixedFee: 0, minAmount: 500, maxAmount: 50000, isEnabled: true };

const AirtimeToCashPricing = () => {
    const { showToast } = useToast();
    const [rows, setRows] = useState([]);
    const [resellers, setResellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [pricingRes, resellersRes] = await Promise.all([
                API.get('/api/admin/airtime-to-cash/pricing'),
                API.get('/api/admin/resellers')
            ]);
            setRows(pricingRes.data.data);
            setResellers(Array.isArray(resellersRes.data) ? resellersRes.data : resellersRes.data.data || []);
        } catch (err) {
            showToast('Failed to load Airtime-to-Cash pricing.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const tenantName = (id) => {
        if (!id) return 'Global Default';
        const r = resellers.find((x) => x._id === id);
        return r ? (r.branding?.siteName || r.name || r.email) : id;
    };

    // Global default row for each network, shown at the top of the table always,
    // even before one has been explicitly configured.
    const globalByNetwork = useMemo(() => {
        const map = {};
        for (const net of NETWORKS) map[net] = rows.find((r) => !r.tenantId && r.network === net);
        return map;
    }, [rows]);

    const tenantOverrides = rows.filter((r) => r.tenantId);

    const submit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                tenantId: form.tenantId === GLOBAL_KEY ? null : form.tenantId,
                network: form.network,
                conversionPercentage: Number(form.conversionPercentage),
                fixedFee: Number(form.fixedFee),
                minAmount: Number(form.minAmount),
                maxAmount: Number(form.maxAmount),
                isEnabled: form.isEnabled
            };
            await API.put('/api/admin/airtime-to-cash/pricing', payload);
            showToast('Pricing saved.', 'success');
            setForm(emptyForm);
            fetchAll();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to save pricing.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const removeOverride = async (id) => {
        if (!window.confirm('Remove this tenant override? The tenant will fall back to the global rate.')) return;
        try {
            await API.delete(`/api/admin/airtime-to-cash/pricing/${id}`);
            showToast('Override removed.', 'success');
            fetchAll();
        } catch (err) {
            showToast('Failed to remove override.', 'error');
        }
    };

    const editRow = (row) => {
        setForm({
            tenantId: row.tenantId || GLOBAL_KEY,
            network: row.network,
            conversionPercentage: row.conversionPercentage,
            fixedFee: row.fixedFee,
            minAmount: row.minAmount,
            maxAmount: row.maxAmount,
            isEnabled: row.isEnabled
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) return <div className="a2c-container">Loading...</div>;

    return (
        <div className="a2c-container">
            <div className="a2c-header">
                <div>
                    <h2>Airtime-to-Cash — Pricing</h2>
                    <p>Set the global default conversion rate per network, and override it for individual tenants/resellers. A tenant with no override uses the global rate automatically.</p>
                </div>
            </div>

            <form className="a2c-card" onSubmit={submit}>
                <h3>Set / Update a Rate</h3>
                <div className="a2c-form-grid">
                    <div className="a2c-field">
                        <label>Tenant</label>
                        <select value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })}>
                            <option value={GLOBAL_KEY}>Global Default (applies to every tenant with no override)</option>
                            {resellers.map((r) => (
                                <option key={r._id} value={r._id}>{r.branding?.siteName || r.name || r.email}</option>
                            ))}
                        </select>
                    </div>
                    <div className="a2c-field">
                        <label>Network</label>
                        <select value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })}>
                            {NETWORKS.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div className="a2c-field">
                        <label>Conversion %</label>
                        <input type="number" min="0" max="100" step="0.1" value={form.conversionPercentage} onChange={(e) => setForm({ ...form, conversionPercentage: e.target.value })} />
                    </div>
                    <div className="a2c-field">
                        <label>Fixed Fee (₦)</label>
                        <input type="number" min="0" value={form.fixedFee} onChange={(e) => setForm({ ...form, fixedFee: e.target.value })} />
                    </div>
                    <div className="a2c-field">
                        <label>Min Amount (₦)</label>
                        <input type="number" min="0" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} />
                    </div>
                    <div className="a2c-field">
                        <label>Max Amount (₦)</label>
                        <input type="number" min="0" value={form.maxAmount} onChange={(e) => setForm({ ...form, maxAmount: e.target.value })} />
                    </div>
                    <div className="a2c-field">
                        <label>Status</label>
                        <select value={form.isEnabled ? '1' : '0'} onChange={(e) => setForm({ ...form, isEnabled: e.target.value === '1' })}>
                            <option value="1">Active</option>
                            <option value="0">Disabled</option>
                        </select>
                    </div>
                </div>
                <button className="a2c-btn primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Rate'}</button>
                {form !== emptyForm && (
                    <button type="button" className="a2c-btn" style={{ marginLeft: 10, background: '#e5e7eb', color: '#111827' }} onClick={() => setForm(emptyForm)}>Cancel</button>
                )}
            </form>

            <div className="a2c-card">
                <h3>Global Defaults</h3>
                <div className="a2c-table-wrap">
                    <table className="a2c-table">
                        <thead>
                            <tr><th>Network</th><th>Conversion %</th><th>Fixed Fee</th><th>Min</th><th>Max</th><th>Status</th><th></th></tr>
                        </thead>
                        <tbody>
                            {NETWORKS.map((net) => {
                                const row = globalByNetwork[net];
                                return (
                                    <tr key={net}>
                                        <td><strong>{net}</strong></td>
                                        <td>{row ? `${row.conversionPercentage}%` : '—'}</td>
                                        <td>{row ? `₦${row.fixedFee}` : '—'}</td>
                                        <td>{row ? `₦${row.minAmount}` : '—'}</td>
                                        <td>{row ? `₦${row.maxAmount}` : '—'}</td>
                                        <td>{row ? <span className={`a2c-badge ${row.isEnabled ? 'enabled' : 'disabled'}`}>{row.isEnabled ? 'Active' : 'Disabled'}</span> : <span className="a2c-badge disabled">Not Set</span>}</td>
                                        <td>{row && <button className="a2c-btn" onClick={() => editRow(row)}>Edit</button>}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="a2c-card">
                <h3>Tenant Overrides</h3>
                {tenantOverrides.length === 0 ? (
                    <div className="a2c-empty">No tenant-specific rates configured yet — every tenant is on the global default.</div>
                ) : (
                    <div className="a2c-table-wrap">
                        <table className="a2c-table">
                            <thead>
                                <tr><th>Tenant</th><th>Network</th><th>Conversion %</th><th>Fixed Fee</th><th>Min</th><th>Max</th><th>Status</th><th></th></tr>
                            </thead>
                            <tbody>
                                {tenantOverrides.map((row) => (
                                    <tr key={row._id}>
                                        <td>{tenantName(row.tenantId)}</td>
                                        <td>{row.network}</td>
                                        <td>{row.conversionPercentage}%</td>
                                        <td>₦{row.fixedFee}</td>
                                        <td>₦{row.minAmount}</td>
                                        <td>₦{row.maxAmount}</td>
                                        <td><span className={`a2c-badge ${row.isEnabled ? 'enabled' : 'disabled'}`}>{row.isEnabled ? 'Active' : 'Disabled'}</span></td>
                                        <td>
                                            <button className="a2c-btn" onClick={() => editRow(row)}>Edit</button>{' '}
                                            <button className="a2c-btn danger" onClick={() => removeOverride(row._id)}>Remove</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AirtimeToCashPricing;
