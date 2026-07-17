import React, { useState, useEffect } from 'react';
import { RefreshCcw, Search, Filter, Edit2, Save, X, Check, CheckSquare, Square, AlertTriangle, TrendingUp } from 'lucide-react';
import API from '../../api';
import './DataPlanPricing.css';

const DataPlanPricing = ({ token }) => {
    const [plans, setPlans] = useState([]);
    const [total, setTotal] = useState(0);
    const [activeCount, setActiveCount] = useState(0);
    const [totalProfit, setTotalProfit] = useState(0);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    
    // Filters
    const [network, setNetwork] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    
    // Editing state
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ selling_price: '', reseller_price: '', vip_price: '', premium_price: '' });
    
    // Bulk selection
    const [selectedIds, setSelectedIds] = useState([]);
    
    const fetchPlans = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page, limit: 50
            });
            if (network) query.append('network', network);
            if (category) query.append('category', category);
            if (status !== '') query.append('status', status);
            if (search) query.append('search', search);

            const res = await API.get(`/api/admin/data-plans?${query.toString()}`);
            setPlans(res.data.plans);
            setTotal(res.data.total);
            setActiveCount(res.data.activeCount);
            setTotalProfit(res.data.totalProfit);
        } catch (err) {
            console.error("Failed to fetch plans", err);
            alert("Error loading data plans");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchPlans();
        }, 300); // Debounce search
        return () => clearTimeout(delayDebounceFn);
    }, [page, network, category, status, search]);

    const handleSync = async () => {
        if (!window.confirm("This will fetch the latest plans from providers. Proceed?")) return;
        setSyncing(true);
        try {
            const res = await API.post('/api/admin/data-plans/sync', {});
            alert(`Sync complete! Added: ${res.data.added}, Updated: ${res.data.updated}`);
            fetchPlans();
        } catch (err) {
            alert("Sync failed: " + (err.response?.data?.message || err.message));
        } finally {
            setSyncing(false);
        }
    };

    const startEdit = (plan) => {
        setEditingId(plan._id);
        setEditData({
            selling_price: plan.selling_price || 0,
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
            alert("Failed to update price");
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            await API.put(`/api/admin/data-plans/${id}`, { status: !currentStatus });
            fetchPlans();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const toggleSelection = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === plans.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(plans.map(p => p._id));
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedIds.length === 0) return alert("Select plans first");
        let value = null;
        
        if (action === 'increase_flat') {
            value = prompt("Enter amount to add to selling price (e.g., 20 for ₦20):");
            if (!value || isNaN(value)) return;
        } else if (action === 'increase_percent') {
            value = prompt("Enter percentage to increase by (e.g., 10 for 10%):");
            if (!value || isNaN(value)) return;
        } else {
            if (!window.confirm(`Are you sure you want to ${action} selected plans?`)) return;
        }

        try {
            await API.post('/api/admin/data-plans/bulk', { ids: selectedIds, action, value });
            setSelectedIds([]);
            fetchPlans();
        } catch (err) {
            alert("Bulk action failed");
        }
    };

    return (
        <div className="data-pricing-container">
            <div className="page-header">
                <div>
                    <h2>Data Plan Pricing</h2>
                    <div className="header-stats">
                        <span>Total: <b>{total}</b></span>
                        <span>Active: <b style={{color: '#10b981'}}>{activeCount}</b></span>
                        <span>Profit Preview: <b style={{color: '#3b82f6'}}>₦{totalProfit.toLocaleString()}</b></span>
                    </div>
                </div>
                <button 
                    className="sync-btn" 
                    onClick={handleSync} 
                    disabled={syncing}
                >
                    <RefreshCcw size={18} className={syncing ? 'spin' : ''} />
                    {syncing ? 'Syncing...' : 'Sync Plans'}
                </button>
            </div>

            <div className="filters-section">
                <div className="search-box">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search plans (e.g. 1GB, MTN SME)" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select value={network} onChange={e => setNetwork(e.target.value)}>
                    <option value="">All Networks</option>
                    <option value="MTN">MTN</option>
                    <option value="AIRTEL">Airtel</option>
                    <option value="GLO">Glo</option>
                    <option value="9MOBILE">9Mobile</option>
                </select>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    <option value="SME">SME</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Gifting">Gifting</option>
                    <option value="Direct">Direct</option>
                </select>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
            </div>

            {selectedIds.length > 0 && (
                <div className="bulk-actions-bar">
                    <span>{selectedIds.length} plans selected</span>
                    <div className="bulk-buttons">
                        <button onClick={() => handleBulkAction('enable')} className="bulk-btn enable">Enable All</button>
                        <button onClick={() => handleBulkAction('disable')} className="bulk-btn disable">Disable All</button>
                        <button onClick={() => handleBulkAction('increase_flat')} className="bulk-btn neutral">+₦ Flat</button>
                        <button onClick={() => handleBulkAction('increase_percent')} className="bulk-btn neutral">+% Percent</button>
                    </div>
                </div>
            )}

            <div className="table-responsive">
                {loading ? (
                    <div className="loading-state">Loading plans...</div>
                ) : plans.length === 0 ? (
                    <div className="empty-state">No data plans found. Try syncing or change filters.</div>
                ) : (
                    <table className="pricing-table">
                        <thead>
                            <tr>
                                <th>
                                    <div onClick={toggleSelectAll} style={{cursor: 'pointer'}}>
                                        {selectedIds.length === plans.length ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </div>
                                </th>
                                <th>Network</th>
                                <th>Plan Name</th>
                                <th>Category</th>
                                <th>API Price</th>
                                <th>Retail Price</th>
                                <th>Basic Price</th>
                                <th>VIP Price</th>
                                <th>Premium Price</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.map(plan => (
                                <tr key={plan._id} className={!plan.status ? 'inactive-row' : ''}>
                                    <td>
                                        <div onClick={() => toggleSelection(plan._id)} style={{cursor: 'pointer'}}>
                                            {selectedIds.includes(plan._id) ? <CheckSquare size={18} className="selected-icon" /> : <Square size={18} className="unselected-icon" />}
                                        </div>
                                    </td>
                                    <td><span className={`network-badge ${plan.network.toLowerCase()}`}>{plan.network}</span></td>
                                    <td>{plan.plan_name}</td>
                                    <td>{plan.category}</td>
                                    <td>₦{plan.api_price}</td>
                                    <td>
                                        {editingId === plan._id ? (
                                            <input 
                                                type="number" 
                                                style={{width: '60px', padding: '2px'}}
                                                value={editData.selling_price} 
                                                onChange={(e) => setEditData({...editData, selling_price: e.target.value})}
                                            />
                                        ) : (
                                            <span style={{color: '#10b981', fontWeight: 'bold'}}>₦{plan.selling_price}</span>
                                        )}
                                    </td>
                                    <td>
                                        {editingId === plan._id ? (
                                            <input 
                                                type="number" 
                                                style={{width: '60px', padding: '2px'}}
                                                value={editData.reseller_price} 
                                                onChange={(e) => setEditData({...editData, reseller_price: e.target.value})}
                                            />
                                        ) : (
                                            <span>₦{plan.reseller_price || plan.selling_price}</span>
                                        )}
                                    </td>
                                    <td>
                                        {editingId === plan._id ? (
                                            <input 
                                                type="number" 
                                                style={{width: '60px', padding: '2px'}}
                                                value={editData.vip_price} 
                                                onChange={(e) => setEditData({...editData, vip_price: e.target.value})}
                                            />
                                        ) : (
                                            <span>₦{plan.vip_price || plan.selling_price}</span>
                                        )}
                                    </td>
                                    <td>
                                        {editingId === plan._id ? (
                                            <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                                                <input 
                                                    type="number" 
                                                    style={{width: '60px', padding: '2px'}}
                                                    value={editData.premium_price} 
                                                    onChange={(e) => setEditData({...editData, premium_price: e.target.value})}
                                                />
                                                <button className="save-btn" onClick={() => saveEdit(plan._id)}><Check size={14} /></button>
                                                <button className="cancel-btn" onClick={() => setEditingId(null)}><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <div className="price-display">
                                                <span>₦{plan.premium_price || plan.selling_price}</span>
                                                <button className="icon-btn edit" onClick={() => startEdit(plan)}><Edit2 size={14} /></button>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <label className="switch">
                                            <input 
                                                type="checkbox" 
                                                checked={plan.status} 
                                                onChange={() => toggleStatus(plan._id, plan.status)} 
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                    </td>
                                    <td>
                                        <span className="provider-tag">{plan.provider}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            
            <div className="pagination">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
                <span>Page {page}</span>
                <button disabled={plans.length < 50} onClick={() => setPage(page + 1)}>Next</button>
            </div>
        </div>
    );
};

export default DataPlanPricing;
