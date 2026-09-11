import React, { useState, useEffect } from 'react';
import { RefreshCcw, Edit2, Check, X, Info, Percent } from 'lucide-react';
import API from '../../api';
import './DataPlanPricing.css';
import './OgdamsSmePricing.css';

const SMEPLUG_RULE_NETWORK = 'MTN';
const SMEPLUG_RULE_CATEGORY = 'GiftingXtra';

// Independent pricing page for the 8 user-selected SmePlug MTN Data Gifting
// plans (services/providers/smeplug.js's MTN_DATA_GIFTING_PLAN_IDS). Each row
// is its own DataPlan document (provider: 'smeplug'), completely separate
// from the matching Peyflex/Ogdams plan's DataPlan document -- editing a row
// here can never change a Peyflex or Ogdams price, and vice versa.
//
// Mirrors OgdamsSmePricing.jsx exactly -- same CSS classes, same "sync then
// apply V3 rule" flow -- SmePlug is Ogdams' replacement in this catalog, not
// a second independent thing to relearn.
const SmeplugGiftingPricing = ({ token }) => {
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
            const res = await API.get('/api/admin/data-plans/smeplug-gifting');
            setPlans(res.data.plans || []);
        } catch (err) {
            console.error('Failed to fetch SmePlug Gifting plans', err);
            alert('Error loading SmePlug Gifting plans');
        } finally {
            setLoading(false);
        }
    };

    const fetchRule = async () => {
        setRuleLoading(true);
        try {
            const res = await API.get('/api/admin/pricing-rules', {
                params: { network: SMEPLUG_RULE_NETWORK, category: SMEPLUG_RULE_CATEGORY, provider: 'smeplug' }
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
            console.error('Failed to fetch SmePlug pricing rule', err);
        } finally {
            setRuleLoading(false);
        }
    };

    useEffect(() => { fetchPlans(); fetchRule(); }, []);

    // Fast, SmePlug-only sync (a single call to SmePlug's plan list -- not the
    // slow, multi-provider /data-plans/sync used by "Legacy Data Pricing").
    const syncSmeplug = async () => {
        const res = await API.post('/api/admin/data-plans/smeplug-gifting/sync', {});
        return res.data;
    };

    const saveRule = async (e) => {
        e.preventDefault();
        setRuleSaving(true);
        setSyncing(true);
        try {
            // Sync first so the rule is applied against each plan's latest cost
            // from SmePlug, and any not-yet-synced plan gets created before
            // pricing is computed for it -- one click does both.
            const syncResult = await syncSmeplug();

            const res = await API.post('/api/admin/pricing-rules', {
                network: SMEPLUG_RULE_NETWORK,
                category: SMEPLUG_RULE_CATEGORY,
                provider: 'smeplug',
                retailPercentage: Number(ruleForm.retailPercentage),
                basicPercentage: Number(ruleForm.basicPercentage),
                vipPercentage: Number(ruleForm.vipPercentage),
                isActive: ruleForm.isActive
            });
            setRule(res.data.rule);
            const combinedMsg = syncResult.combined ? `, Combined: ${syncResult.combined}` : '';
            alert(`Synced (Added: ${syncResult.added}, Updated: ${syncResult.updated}${combinedMsg}) and pricing rule applied to all SmePlug plans.`);
            fetchPlans();
        } catch (err) {
            alert('Failed to sync/save pricing rule: ' + (err.response?.data?.message || err.message));
        } finally {
            setRuleSaving(false);
            setSyncing(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await syncSmeplug();
            const combinedMsg = res.combined ? `, Combined (duplicates deactivated): ${res.combined}` : '';
            alert(`Sync complete! Added: ${res.added}, Updated: ${res.updated}${combinedMsg}`);
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
                    <h2>SmePlug MTN Data Gifting Pricing</h2>
                    <div className="header-stats">
                        <span>Confirmed plans: <b>{plans.length}</b></span>
                        <span>Synced: <b>{syncedCount}</b></span>
                        <span>Active: <b style={{ color: '#10b981' }}>{activeCount}</b></span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="sync-btn" onClick={handleSync} disabled={syncing}>
                        <RefreshCcw size={18} className={syncing ? 'spin' : ''} />
                        {syncing ? 'Syncing...' : 'Sync SmePlug Plans'}
                    </button>
                </div>
            </div>

            <div className="ogdams-sme-note">
                <Info size={16} />
                <span>
                    These plans are fulfilled by <b>SmePlug</b> (MTN Data Gifting) and shown to customers under their own
                    <b> "SME Xtra"</b> category -- deliberately separate from the "SME" category (Peyflex/ClubKonnect's Gifting plans)
                    so it's easy to identify and toggle off later without touching anything else. Pricing here is completely independent
                    from the Peyflex plans on "Legacy Data Pricing" / "V3 Pricing Rules" and from the (disabled) Ogdams plans -- saving
                    the rule below, or editing a price in the table, never changes another provider's plan, and vice versa.
                    <b> Retail</b> is what a direct customer pays; <b>Basic</b> and <b>VIP</b> are what a reseller (including white-label
                    reseller websites) pays at each tier, unless that reseller has a specific price override; <b>Premium</b> is the top
                    reseller tier.
                </span>
            </div>

            <div className="ogdams-sme-rule-card">
                <h3><Percent size={16} /> V3 Pricing Rule (SmePlug MTN Data Gifting)</h3>
                <p className="ogdams-sme-rule-desc">
                    Same engine as "V3 Pricing Rules" for Peyflex, scoped only to SmePlug's MTN Data Gifting plans. Set a
                    percentage markup here -- this button syncs SmePlug's plans first (fast, SmePlug-only, unlike the slower
                    button above) and then recalculates Retail/Basic/VIP/Premium for all of them from cost, in one click.
                    Never touches Peyflex's or Ogdams' MTN Gifting rule or plans.
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
                            {ruleSaving ? 'Syncing & Applying...' : rule ? 'Sync & Save' : 'Sync & Create'}
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
                                <th>SmePlug Plan ID</th>
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

export default SmeplugGiftingPricing;
