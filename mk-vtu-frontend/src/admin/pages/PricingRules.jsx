import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import './AdminDashboard.css';

const PricingRules = ({ token }) => {
    const { showToast, updateToast } = useToast();
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('single'); // single, bulk, clone

    // Single Edit State
    const [formData, setFormData] = useState({
        network: 'MTN',
        category: 'SME',
        retailPercentage: 10,
        basicPercentage: 8,
        vipPercentage: 5,
        isActive: true
    });

    // Bulk Generator State
    const [bulkData, setBulkData] = useState({
        network: 'MTN',
        retailPercentage: 10,
        basicPercentage: 8,
        vipPercentage: 5,
        categories: []
    });

    // Clone Generator State
    const [cloneData, setCloneData] = useState({
        sourceNetwork: 'MTN',
        destinationNetwork: 'AIRTEL'
    });

    const networks = ['MTN', 'AIRTEL', 'GLO', '9MOBILE'];
    const allCategories = ['SME', 'Gifting', 'Corporate', 'Awoof', 'Direct'];

    const fetchRules = async () => {
        let loadingToast;
        try {
            loadingToast = await showToast("Loading pricing rules...", "loading");
            setLoading(true);
            const res = await axios.get('/api/admin/pricing-rules', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRules(res.data);
            updateToast(loadingToast, { message: "Rules loaded successfully", type: "success" });
        } catch (err) {
            if (loadingToast) updateToast(loadingToast, { message: "Failed to fetch pricing rules", type: "error" });
            else showToast("Failed to fetch pricing rules", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchRules();
    }, [token]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleBulkInputChange = (e) => {
        const { name, value } = e.target;
        setBulkData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBulkCategoryChange = (category) => {
        setBulkData(prev => {
            const categories = prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category];
            return { ...prev, categories };
        });
    };

    const handleBulkSelectAll = () => {
        setBulkData(prev => ({
            ...prev,
            categories: prev.categories.length === allCategories.length ? [] : [...allCategories]
        }));
    };

    const handleCloneInputChange = (e) => {
        const { name, value } = e.target;
        setCloneData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveRule = async (e) => {
        e.preventDefault();
        let toastId;
        try {
            toastId = await showToast("Saving pricing rule...", "loading");
            await axios.post('/api/admin/pricing-rules', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            updateToast(toastId, { message: "Pricing rule saved successfully!", type: "success" });
            fetchRules();
        } catch (err) {
            if (toastId) updateToast(toastId, { message: err.response?.data?.message || "Failed to save rule", type: "error" });
            else showToast(err.response?.data?.message || "Failed to save rule", "error");
        }
    };

    const handleBulkGenerate = async (e) => {
        e.preventDefault();
        if (bulkData.categories.length === 0) return showToast("Select at least one category.", "error");
        if (!window.confirm(`You are about to modify or create ${bulkData.categories.length} pricing rules for ${bulkData.network}. Continue?`)) return;
        
        let toastId;
        try {
            toastId = await showToast("Generating bulk rules...", "loading");
            const res = await axios.post('/api/admin/pricing-rules/bulk', bulkData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            updateToast(toastId, { message: `Updated Successfully. Created: ${res.data.created}, Updated: ${res.data.updated}, Failed: ${res.data.failed}`, type: "success", duration: 6000 });
            fetchRules();
        } catch (err) {
            if (toastId) updateToast(toastId, { message: err.response?.data?.message || "Failed to bulk generate rules", type: "error" });
            else showToast(err.response?.data?.message || "Failed to bulk generate rules", "error");
        }
    };

    const handleCloneGenerate = async (e) => {
        e.preventDefault();
        if (cloneData.sourceNetwork === cloneData.destinationNetwork) return showToast("Source and destination must be different.", "error");
        if (!window.confirm(`You are about to clone ALL active rules from ${cloneData.sourceNetwork} to ${cloneData.destinationNetwork}. Continue?`)) return;
        
        let toastId;
        try {
            toastId = await showToast("Cloning rules...", "loading");
            const res = await axios.post('/api/admin/pricing-rules/clone', cloneData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            updateToast(toastId, { message: `Cloned Successfully. Created: ${res.data.created}, Updated: ${res.data.updated}, Failed: ${res.data.failed}`, type: "success", duration: 6000 });
            fetchRules();
        } catch (err) {
            if (toastId) updateToast(toastId, { message: err.response?.data?.message || "Failed to clone rules", type: "error" });
            else showToast(err.response?.data?.message || "Failed to clone rules", "error");
        }
    };

    const handleDeleteRule = async (id) => {
        if (!window.confirm("Are you sure you want to delete this pricing rule? Transactions relying on it may fail!")) return;
        let toastId;
        try {
            toastId = await showToast("Deleting rule...", "loading");
            await axios.delete(`/api/admin/pricing-rules/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            updateToast(toastId, { message: "Pricing rule deleted.", type: "success" });
            fetchRules();
        } catch (err) {
            if (toastId) updateToast(toastId, { message: "Failed to delete rule", type: "error" });
            else showToast("Failed to delete rule", "error");
        }
    };

    const handleEditRule = (rule) => {
        setActiveTab('single');
        setFormData({
            network: rule.network,
            category: rule.category,
            retailPercentage: rule.retailPercentage,
            basicPercentage: rule.basicPercentage,
            vipPercentage: rule.vipPercentage,
            isActive: rule.isActive
        });
        window.scrollTo(0, 0);
    };

    return (
        <div className="admin-page-container">
            <div className="admin-header-row">
                <h2>Pricing Rules Management (V3 Engine)</h2>
                <p>Configure percentage-based markups dynamically derived from provider cost.</p>
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                    <button 
                        className={`admin-btn-secondary ${activeTab === 'single' ? 'active-tab-btn' : ''}`} 
                        onClick={() => setActiveTab('single')}
                        style={activeTab === 'single' ? { background: '#0f172a', color: '#fff' } : {}}
                    >
                        Single Rule
                    </button>
                    <button 
                        className={`admin-btn-secondary ${activeTab === 'bulk' ? 'active-tab-btn' : ''}`} 
                        onClick={() => setActiveTab('bulk')}
                        style={activeTab === 'bulk' ? { background: '#0f172a', color: '#fff' } : {}}
                    >
                        Bulk Generator
                    </button>
                    <button 
                        className={`admin-btn-secondary ${activeTab === 'clone' ? 'active-tab-btn' : ''}`} 
                        onClick={() => setActiveTab('clone')}
                        style={activeTab === 'clone' ? { background: '#0f172a', color: '#fff' } : {}}
                    >
                        Clone Network
                    </button>
                </div>

                {activeTab === 'single' && (
                    <div>
                        <h3>Add / Edit Single Pricing Rule</h3>
                        <form onSubmit={handleSaveRule} className="settings-form">
                            <div className="form-group-row">
                                <div className="form-group">
                                    <label>Network</label>
                                    <select name="network" value={formData.network} onChange={handleInputChange}>
                                        {networks.map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select name="category" value={formData.category} onChange={handleInputChange}>
                                        {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group-row">
                                <div className="form-group">
                                    <label>Retail Percentage (%)</label>
                                    <input type="number" step="0.01" name="retailPercentage" value={formData.retailPercentage} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Basic Percentage (%)</label>
                                    <input type="number" step="0.01" name="basicPercentage" value={formData.basicPercentage} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label>VIP Percentage (%)</label>
                                    <input type="number" step="0.01" name="vipPercentage" value={formData.vipPercentage} onChange={handleInputChange} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>
                                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                                    Rule is Active
                                </label>
                            </div>

                            <button type="submit" className="admin-btn-primary">Save Pricing Rule</button>
                        </form>
                    </div>
                )}

                {activeTab === 'bulk' && (
                    <div>
                        <h3>Bulk Pricing Generator</h3>
                        <p style={{fontSize: '13px', color: '#666', marginBottom: '15px'}}>Quickly generate or update rules for multiple categories in a specific network.</p>
                        <form onSubmit={handleBulkGenerate} className="settings-form">
                            <div className="form-group">
                                <label>Target Network</label>
                                <select name="network" value={bulkData.network} onChange={handleBulkInputChange}>
                                    {networks.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Select Categories</label>
                                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', background: '#f8fafc', padding: '10px', borderRadius: '5px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={bulkData.categories.length === allCategories.length}
                                            onChange={handleBulkSelectAll}
                                        /> 
                                        Select All
                                    </label>
                                    <span style={{ borderLeft: '1px solid #ccc', margin: '0 5px' }}></span>
                                    {allCategories.map(c => (
                                        <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={bulkData.categories.includes(c)}
                                                onChange={() => handleBulkCategoryChange(c)}
                                            /> 
                                            {c}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group-row">
                                <div className="form-group">
                                    <label>Retail Percentage (%)</label>
                                    <input type="number" step="0.01" name="retailPercentage" value={bulkData.retailPercentage} onChange={handleBulkInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Basic Percentage (%)</label>
                                    <input type="number" step="0.01" name="basicPercentage" value={bulkData.basicPercentage} onChange={handleBulkInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label>VIP Percentage (%)</label>
                                    <input type="number" step="0.01" name="vipPercentage" value={bulkData.vipPercentage} onChange={handleBulkInputChange} required />
                                </div>
                            </div>

                            <button type="submit" className="admin-btn-primary" style={{ background: '#10b981' }}>Generate Pricing Rules</button>
                        </form>
                    </div>
                )}

                {activeTab === 'clone' && (
                    <div>
                        <h3>Clone Network Rules</h3>
                        <p style={{fontSize: '13px', color: '#666', marginBottom: '15px'}}>Copy all active pricing rules from a source network to a destination network exactly.</p>
                        <form onSubmit={handleCloneGenerate} className="settings-form">
                            <div className="form-group-row">
                                <div className="form-group">
                                    <label>Source Network</label>
                                    <select name="sourceNetwork" value={cloneData.sourceNetwork} onChange={handleCloneInputChange}>
                                        {networks.map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '24px', paddingBottom: '10px' }}>&rarr;</span>
                                </div>
                                <div className="form-group">
                                    <label>Destination Network</label>
                                    <select name="destinationNetwork" value={cloneData.destinationNetwork} onChange={handleCloneInputChange}>
                                        {networks.map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="admin-btn-primary" style={{ background: '#3b82f6' }}>Clone Existing Network</button>
                        </form>
                    </div>
                )}
            </div>

            <div className="admin-card mt-20">
                <h3>Active Pricing Rules</h3>
                {loading ? <p>Loading...</p> : (
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Network</th>
                                    <th>Category</th>
                                    <th>Retail %</th>
                                    <th>Basic %</th>
                                    <th>VIP %</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rules.length === 0 ? <tr><td colSpan="7">No rules configured.</td></tr> : rules.map(rule => (
                                    <tr key={rule._id}>
                                        <td><strong>{rule.network}</strong></td>
                                        <td>{rule.category}</td>
                                        <td>{rule.retailPercentage}%</td>
                                        <td>{rule.basicPercentage}%</td>
                                        <td>{rule.vipPercentage}%</td>
                                        <td>
                                            <span className={`status-badge ${rule.isActive ? 'active' : 'inactive'}`}>
                                                {rule.isActive ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="admin-btn-secondary btn-small" onClick={() => handleEditRule(rule)}>Edit</button>
                                            <button className="admin-btn-danger btn-small" style={{marginLeft:'5px'}} onClick={() => handleDeleteRule(rule._id)}>Delete</button>
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

export default PricingRules;
