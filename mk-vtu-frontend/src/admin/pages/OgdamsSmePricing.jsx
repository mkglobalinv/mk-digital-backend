import React, { useState, useEffect } from 'react';
import { RefreshCcw, Edit2, Check, X, Info, Percent } from 'lucide-react';
import API from '../../api';
import './DataPlanPricing.css';
import './OgdamsSmePricing.css';

const OGDAMS_RULE_NETWORK = 'MTN';
const OGDAMS_RULE_CATEGORY = 'Gifting';

// Independent pricing page for the 9 confirmed Ogdams MTN Data Gifting plans
// (services/providers/ogdams.js's MTN_DATA_GIFTING_PLAN_IDS). Each row is its
// own DataPlan document (provider: 'ogdams'), completely separate from the
// matching Peyflex plan's DataPlan document -- editing a row here can never
// change a Peyflex price, and editing Peyflex pricing on the "Legacy Data
// Pricing" page can never change what's shown here.
//
// Internally the category stays "Gifting" (Provider Manager routing, the
// admin data-plan sync, and the combine-catalog dedup all key off that
// value); only the customer-facing storefront renders it as "SME".
//
// Pricing here is managed the same way as the rest of the platform's "V3
// Pricing Engine" (Admin -> V3 Pricing Rules): a percentage rule (Retail/
// Basic/VIP % over cost) that gets applied to every matching plan in one
// action, rather than typing raw prices in one at a time. This page's rule
// is scoped to provider: 'ogdams' so saving it only ever recomputes Ogdams'
// own MTN Gifting plans -- it never touches Peyflex's MTN Gifting rule or
// plans, and Peyflex's rule (on "V3 Pricing Rules") never touches Ogdams'.
const OgdamsSmePricing = ({ token }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ api_price: '', selling_price: '', reseller_price: '', vip_price: '', premium_price: '' });

    const [rule, setRule] = useState(null);
    const [ruleForm, setRuleForm] = useState({ retailPercentage: 10, basicPercentage: 8, vipPercentage: 5, isActive: true });
    const [ruleLoading, setRuleLoading] = useState(true);
    const [ruleSaving, setRuleSaving] = useState(false);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/admin/data-plans/ogdams-sme');
            setPlans(res.data.plans || []);
        } catch (err) {
            console.error('Failed to fetch Ogdams SME plans', err);
            alert('Error loading Ogdams SME plans');
        } finally {
            setLoading(false);
        }
    };

    const fetchRule = async () => {
        setRuleLoading(true);
        try {
            const res = await API.get('/api/admin/pricing-rules', {
                params: { network: OGDAMS_RULE_NETWORK, category: OGDAMS_RULE_CATEGORY, provider: 'ogdams' }
            });
            const existing = (res.data || [])[0] || null;
            setRule(existing);
            if (existing) {
                setRuleForm({
                    retailPercentage: existing.retailPercentage,
                    basicPercentage: existing.basicPercentage,
                    vipPercentage: existing.vipPercentage,
                    isActive: existing.isActive
                });
            }
        } catch (err) {
            console.error('Failed to fetch Ogdams pricing rule', err);
        } finally {
            setRuleLoading(false);
        }
    };

    useEffect(() => { fetchPlans(); fetchRule(); }, []);

    const saveRule = async (e) => {
        e.preventDefault();
        setRuleSaving(true);
        try {
            const res = await API.post('/api/admin/pricing-rules', {
                network: OGDAMS_RULE_NETWORK,
                category: OGDAMS_RULE_CATEGORY,
                provider: 'ogdams',
                retailPercentage: Number(ruleForm.retailPercentage),
                basicPercentage: Number(ruleForm.basicPercentage),
                vipPercentage: Number(ruleForm.vipPercentage),
                isActive: ruleForm.isActive
            });
            setRule(res.data.rule);
            alert('Ogdams MTN SME pricing rule saved and applied to all synced Ogdams plans.');
            fetchPlans();
        } catch (err) {
            alert('Failed to save pricing rule: ' + (err.response?.data?.message || err.message));
        } finally {
            setRuleSaving(false);
        }
    };

    const handleSync = async () => {
        if (!window.confirm('This will fetch the latest Ogdams MTN Data Gifting plans (and every other provider\'s plans) from their APIs. Proceed?')) return;
        setSyncing(true);
        try {
            const res = await API.post('/api/admin/data-plans/sync', {});
            const combinedMsg = res.data.combined ? `, Combined (duplicates deactivated): ${res.data.combined}` : '';
            alert(`Sync complete! Added: ${res.data.added}, Updated: ${res.data.updated}${combinedMsg}`);
            fetchPlans();
        } catch (err) {
            alert('Sync failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setSyncing(false);
        }
    };

    const startEdit = (plan) => {
        setEditingId(plan._id);
        setEditData({
            api_price: plan.api_price ?? 0,
            selling_price: plan.selling_price ?? 0,
            reseller_price: plan.reseller_price || plan.selling_price || 0,
            vip_price: plan.vip_price || plan.selling_price || 0,
            premium_price: plan.premium_price || plan.selling_price || 0
        });
    };

    const saveEdit = async (id) => {
        try {
            await API.put(`/api/admin/data-plans/${id}`, editData);
            setEditingId(null);
            fetchPlans();
        } catch (err) {
            alert('Failed to update price: ' + (err.response?.data?.message || err.message));
        }
    };

    const toggleStatus = async (plan) => {
        try {
            await API.put(`/api/admin/data-plans/${plan._id}`, { status: !plan.status });
            fetchPlans();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const activeCount = plans.filter((p) => p.synced && p.status).length;
    const syncedCount = plans.filter((p) => p.synced).length;

    return (
        <div className="data-pricing-container">
            <div className="page-header">
                <div>
                    <h2>Ogdams MTN SME Pricing</h2>
                    <div className="header-stats">
                        <span>Confirmed plans: <b>{plans.length}</b></span>
                        <span>Synced: <b>{syncedCount}</b></span>
                        <span>Active: <b style={{ color: '#10b981' }}>{activeCount}</b></span>
                    </div>
                </div>
                <button className="sync-btn" onClick={handleSync} disabled={syncing}>
                    <RefreshCcw size={18} className={syncing ? 'spin' : ''} />
                    {syncing ? 'Syncing...' : 'Sync Plans'}
                </button>
            </div>

            <div className="ogdams-sme-note">
                <Info size={16} />
                <span>
                    These plans are fulfilled by <b>Ogdams</b> (MTN Data Gifting) and shown to customers under the <b>SME</b> category.
                    Pricing here is completely independent from the Peyflex plans on "Legacy Data Pricing" / "V3 Pricing Rules" --
                    saving the rule below, or editing a price in the table, never changes a Peyflex plan, and vice versa. <b>Retail</b> is
                    what a direct customer pays; <b>Basic</b> and <b>VIP</b> are what a reseller (including white-label reseller websites)
                    pays at each tier, unless that reseller has a specific price override; <b>Premium</b> is the top reseller tier. Use
                    <b> Provider Manager</b> (Manage Categories) to control whether MTN Data transactions actually route to Ogdams or Peyflex.
                </span>
            </div>

            <div className="ogdams-sme-rule-card">
                <h3><Percent size={16} /> V3 Pricing Rule (Ogdams MTN SME)</h3>
                <p className="ogdams-sme-rule-desc">
                    Same engine as "V3 Pricing Rules" for Peyflex, scoped only to Ogdams' MTN SME (Gifting) plans. Set a
                    percentage markup once here and <b>Save &amp; Apply</b> recalculates Retail/Basic/VIP/Premium for every
                    synced Ogdams plan below from its cost -- it never touches Peyflex's MTN Gifting rule or plans.
                </p>
                {ruleLoading ? (
                    <div className="loading-state">Loading rule...</div>
                ) : (
                    <form onSubmit={saveRule} className="ogdams-sme-rule-form">
                        <div className="ogdams-sme-rule-field">
                            <label>Retail %</label>
                            <input
                                type="number" step="0.01" required
                                value={ruleForm.retailPercentage}
                                onChange={(e) => setRuleForm({ ...ruleForm, retailPercentage: e.target.value })}
                            />
                        </div>
                        <div className="ogdams-sme-rule-field">
                            <label>Basic %</label>
                            <input
                                type="number" step="0.01" required
                                value={ruleForm.basicPercentage}
                                onChange={(e) => setRuleForm({ ...ruleForm, basicPercentage: e.target.value })}
                            />
                        </div>
                        <div className="ogdams-sme-rule-field">
                            <label>VIP %</label>
                            <input
                                type="number" step="0.01" required
                                value={ruleForm.vipPercentage}
                                onChange={(e) => setRuleForm({ ...ruleForm, vipPercentage: e.target.value })}
                            />
                        </div>
                        <label className="ogdams-sme-rule-active">
                            <input
                                type="checkbox"
                                checked={ruleForm.isActive}
                                onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.checked })}
                            />
                            Rule Active
                        </label>
                        <button type="submit" className="sync-btn" disabled={ruleSaving}>
                            {ruleSaving ? 'Applying...' : rule ? 'Save & Apply' : 'Create & Apply'}
                        </button>
                    </form>
                )}
            </div>

            <div className="table-responsive">
                {loading ? (
                    <div className="loading-state">Loading plans...</div>
                ) : (
                    <table className="pricing-table">
                        <thead>
                            <tr>
                                <th>Plan</th>
                                <th>Ogdams Plan ID</th>
                                <th>Cost</th>
                                <th>Retail Price</th>
                                <th>Basic Price</th>
                                <th>VIP Price</th>
                                <th>Premium Price</th>
                                <th>Profit</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.map((plan) => (
                                <tr key={plan.plan_id} className={!plan.synced || !plan.status ? 'inactive-row' : ''}>
                                    <td>{plan.plan_name || plan.description}</td>
                                    <td><span className="provider-tag">{plan.plan_id}</span></td>
                                    <td>
                                        {!plan.synced ? (
                                            <span title="Not synced yet">&mdash;</span>
                                        ) : editingId === plan._id ? (
                                            <input
                                                type="number"
                                                style={{ width: '70px', padding: '2px' }}
                                                value={editData.api_price}
                                                onChange={(e) => setEditData({ ...editData, api_price: e.target.value })}
                                            />
                                        ) : (
                                            <span>₦{plan.api_price}</span>
                                        )}
                                    </td>
                                    <td>
                                        {!plan.synced ? (
                                            <span title="Not synced yet">&mdash;</span>
                                        ) : editingId === plan._id ? (
                                            <input
                                                type="number"
                                                style={{ width: '70px', padding: '2px' }}
                                                value={editData.selling_price}
                                                onChange={(e) => setEditData({ ...editData, selling_price: e.target.value })}
                                            />
                                        ) : (
                                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>₦{plan.selling_price}</span>
                                        )}
                                    </td>
                                    <td>
                                        {!plan.synced ? (
                                            <span title="Not synced yet">&mdash;</span>
                                        ) : editingId === plan._id ? (
                                            <input
                                                type="number"
                                                style={{ width: '70px', padding: '2px' }}
                                                value={editData.reseller_price}
                                                onChange={(e) => setEditData({ ...editData, reseller_price: e.target.value })}
                                            />
                                        ) : (
                                            <span>₦{plan.reseller_price || plan.selling_price}</span>
                                        )}
                                    </td>
                                    <td>
                                        {!plan.synced ? (
                                            <span title="Not synced yet">&mdash;</span>
                                        ) : editingId === plan._id ? (
                                            <input
                                                type="number"
                                                style={{ width: '70px', padding: '2px' }}
                                                value={editData.vip_price}
                                                onChange={(e) => setEditData({ ...editData, vip_price: e.target.value })}
                                            />
                                        ) : (
                                            <span>₦{plan.vip_price || plan.selling_price}</span>
                                        )}
                                    </td>
                                    <td>
                                        {!plan.synced ? (
                                            <span title="Not synced yet">&mdash;</span>
                                        ) : editingId === plan._id ? (
                                            <input
                                                type="number"
                                                style={{ width: '70px', padding: '2px' }}
                                                value={editData.premium_price}
                                                onChange={(e) => setEditData({ ...editData, premium_price: e.target.value })}
                                            />
                                        ) : (
                                            <span>₦{plan.premium_price || plan.selling_price}</span>
                                        )}
                                    </td>
                                    <td>
                                        {!plan.synced ? (
                                            <span title="Not synced yet">&mdash;</span>
                                        ) : (
                                            <span className={`profit-badge ${plan.profit > 0 ? 'positive' : plan.profit < 0 ? 'negative' : 'neutral'}`}>
                                                ₦{plan.profit}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {!plan.synced ? (
                                            <span title="Not synced yet">Not synced</span>
                                        ) : (
                                            <label className="switch">
                                                <input type="checkbox" checked={plan.status} onChange={() => toggleStatus(plan)} />
                                                <span className="slider round"></span>
                                            </label>
                                        )}
                                    </td>
                                    <td>
                                        {!plan.synced ? (
                                            <span style={{ color: '#9ca3af', fontSize: '13px' }}>Sync to enable</span>
                                        ) : editingId === plan._id ? (
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button className="save-btn" onClick={() => saveEdit(plan._id)}><Check size={14} /></button>
                                                <button className="cancel-btn" onClick={() => setEditingId(null)}><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <button className="icon-btn edit" onClick={() => startEdit(plan)}><Edit2 size={14} /></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default OgdamsSmePricing;
