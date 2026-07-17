import React, { useState, useEffect } from 'react';
import { CreditCard, Save, RefreshCw, AlertCircle, Search, Filter } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import API from '../../api';
import './ResellerManager.css';

const CentralPricingManager = ({ tier = 'retail' }) => {
    const [networks, setNetworks] = useState(['MTN', 'AIRTEL', 'GLO', '9MOBILE']);
    const [activeNetwork, setActiveNetwork] = useState('MTN');
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState({});
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const { showToast } = useToast();

    let tableName;
    let pageTitle;
    let pageColor;

    switch(tier) {
        case 'vip':
            tableName = 'vip_prices';
            pageTitle = 'VIP Reseller Pricing';
            pageColor = '#fbbf24'; // amber
            break;
        case 'basic':
            tableName = 'basic_prices';
            pageTitle = 'Basic Reseller Pricing';
            pageColor = '#38bdf8'; // light blue
            break;
        case 'retail':
        default:
            tableName = 'retail_prices';
            pageTitle = 'Retail Customer Pricing';
            pageColor = '#10b981'; // emerald
            break;
    }

    useEffect(() => {
        fetchPricingData();
    }, [tier]);

    const fetchPricingData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const res = await API.get(`/api/admin/pricing/${tier}`);
            const data = res.data.plans;

            // Map data correctly
            const mappedPlans = data.map(p => {
                let tierRecord = null;
                if (p[tableName]) {
                    if (Array.isArray(p[tableName])) {
                        tierRecord = p[tableName].length > 0 ? p[tableName][0] : null;
                    } else {
                        tierRecord = p[tableName];
                    }
                }
                
                const sp = tierRecord && tierRecord.selling_price !== undefined 
                    ? Number(tierRecord.selling_price) 
                    : Number(p.api_price || 0) + 20;

                const rc = tierRecord && tierRecord.reseller_cost !== undefined 
                    ? Number(tierRecord.reseller_cost) 
                    : Number(p.api_price || 0) + 10;

                const rsp = tierRecord && tierRecord.reseller_selling_price !== undefined 
                    ? Number(tierRecord.reseller_selling_price) 
                    : sp;

                return {
                    id: p.id, // Master plan ID
                    network: p.network,
                    provider_plan_id: p.provider_plan_id,
                    plan_name: p.plan_name,
                    category: p.category || 'Direct',
                    api_price: Number(p.api_price || 0),
                    selling_price: sp,
                    reseller_cost: (tier === 'basic' || tier === 'vip') ? rc : null,
                    reseller_selling_price: (tier === 'basic' || tier === 'vip') ? rsp : null,
                    updated_at: p.updated_at
                };
            });

            setPlans(mappedPlans);
        } catch (err) {
            console.error("Failed to load pricing data from Supabase:", err);
            setError(err.message || "Failed to load pricing data");
            showToast("Failed to fetch data plans. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handlePriceChange = (id, field, value) => {
        setPlans(prev => prev.map(p => 
            p.id === id 
                ? { ...p, [field]: value } 
                : p
        ));
    };

    const handleSave = async (plan) => {
        try {
            setSaving({ ...saving, [plan.id]: true });
            
            const payload = {
                plan_id: plan.id,
                selling_price: Number(plan.selling_price)
            };
            if (tier === 'basic' || tier === 'vip') {
                payload.reseller_cost = Number(plan.reseller_cost);
                payload.reseller_selling_price = Number(plan.reseller_selling_price);
            }
            
            await API.post(`/api/admin/pricing/${tier}`, payload);
            
            showToast("Price updated successfully", "success");
        } catch (err) {
            console.error("Save failed:", err);
            showToast("Failed to save price", "error");
        } finally {
            setSaving({ ...saving, [plan.id]: false });
        }
    };

    const filteredPlans = plans.filter(p => {
        const matchNetwork = p.network === activeNetwork;
        const matchSearch = p.plan_name.toLowerCase().includes(search.toLowerCase()) || p.provider_plan_id.toLowerCase().includes(search.toLowerCase());
        const matchCategory = categoryFilter ? p.category === categoryFilter : true;
        return matchNetwork && matchSearch && matchCategory;
    });

    const categories = [...new Set(plans.map(p => p.category))];

    return (
        <div className="reseller-manager-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CreditCard size={24} color={pageColor} />
                        {pageTitle}
                    </h2>
                    <p style={{ margin: 0, color: 'var(--text-gray)' }}>Centralized master pricing configuration. Synced directly with Supabase.</p>
                </div>
                <button 
                    onClick={fetchPricingData} 
                    className="premium-btn" 
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                    Refresh Plans
                </button>
            </div>

            {error ? (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
                    <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
                    <h3 style={{ margin: '0 0 8px', color: '#ef4444' }}>Database Connection Error</h3>
                    <p style={{ color: 'var(--text-gray)', marginBottom: '16px' }}>{error}</p>
                    <button onClick={fetchPricingData} className="premium-btn" style={{ background: '#ef4444' }}>Retry Connection</button>
                </div>
            ) : (
                <div className="premium-sidebar" style={{ background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    
                    {/* Filters & Tabs */}
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', background: 'var(--sidebar-bg)' }}>
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                            {networks.map(net => (
                                <button 
                                    key={net}
                                    onClick={() => setActiveNetwork(net)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                                        background: activeNetwork === net ? 'var(--primary)' : 'transparent',
                                        color: activeNetwork === net ? 'white' : 'var(--text-gray)',
                                        transition: 'all 0.2s',
                                        boxShadow: activeNetwork === net ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >
                                    {net}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', borderRadius: '8px', padding: '0 12px', border: '1px solid var(--border-color)' }}>
                                <Search size={16} color="var(--text-gray)" />
                                <input 
                                    type="text" 
                                    placeholder="Search plans..." 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', color: 'var(--text-color)', padding: '8px', outline: 'none', width: '150px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', borderRadius: '8px', padding: '0 12px', border: '1px solid var(--border-color)' }}>
                                <Filter size={16} color="var(--text-gray)" style={{ marginRight: '8px' }} />
                                <select 
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', color: 'var(--text-color)', padding: '8px 0', outline: 'none', cursor: 'pointer' }}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table className="premium-table" style={{ width: '100%', minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '16px 24px', textAlign: 'left' }}>Plan Name</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left' }}>Category</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left' }}>API Cost (₦)</th>
                                    {tier === 'basic' ? (
                                        <>
                                            <th style={{ padding: '16px 24px', textAlign: 'left' }}>Reseller Cost (₦)</th>
                                            <th style={{ padding: '16px 24px', textAlign: 'left' }}>Reseller Selling Price (₦)</th>
                                            <th style={{ padding: '16px 24px', textAlign: 'left' }}>Admin Profit</th>
                                            <th style={{ padding: '16px 24px', textAlign: 'left' }}>Reseller Profit</th>
                                        </>
                                    ) : (
                                        <>
                                            <th style={{ padding: '16px 24px', textAlign: 'left' }}>Selling Price (₦)</th>
                                            <th style={{ padding: '16px 24px', textAlign: 'left' }}>Profit Margin</th>
                                        </>
                                    )}
                                    <th style={{ padding: '16px 24px', textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td style={{ padding: '16px 24px' }}><div className="skeleton" style={{ width: '150px', height: '20px', borderRadius: '4px' }}></div></td>
                                            <td style={{ padding: '16px 24px' }}><div className="skeleton" style={{ width: '80px', height: '20px', borderRadius: '4px' }}></div></td>
                                            <td style={{ padding: '16px 24px' }}><div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '4px' }}></div></td>
                                            <td style={{ padding: '16px 24px' }}><div className="skeleton" style={{ width: '120px', height: '36px', borderRadius: '8px' }}></div></td>
                                            <td style={{ padding: '16px 24px' }}><div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '4px' }}></div></td>
                                            <td style={{ padding: '16px 24px', textAlign: 'right' }}><div className="skeleton" style={{ width: '80px', height: '36px', borderRadius: '8px', marginLeft: 'auto' }}></div></td>
                                        </tr>
                                    ))
                                ) : filteredPlans.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-gray)' }}>
                                            No plans found. Ensure the master database is synced.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPlans.map(plan => {
                                        let adminProfit = 0;
                                        let resellerProfit = 0;
                                        let standardProfit = 0;

                                        if (tier === 'basic') {
                                            adminProfit = Number(plan.reseller_cost) - plan.api_price;
                                            resellerProfit = Number(plan.reseller_selling_price) - Number(plan.reseller_cost);
                                        } else {
                                            standardProfit = Number(plan.selling_price) - plan.api_price;
                                        }

                                        return (
                                        <tr key={plan.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '16px 24px', fontWeight: 600 }}>{plan.plan_name}</td>
                                            <td style={{ padding: '16px 24px' }}><span style={{ background: 'var(--bg-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{plan.category}</span></td>
                                            <td style={{ padding: '16px 24px', color: 'var(--text-gray)' }}>₦{plan.api_price}</td>
                                            
                                            {(tier === 'basic' || tier === 'vip') ? (
                                                <>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <input 
                                                            type="number" 
                                                            className="input-field" 
                                                            style={{ width: '100px', padding: '8px 12px', margin: 0, borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
                                                            value={plan.reseller_cost || ''}
                                                            onChange={(e) => handlePriceChange(plan.id, 'reseller_cost', e.target.value)}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <input 
                                                            type="number" 
                                                            className="input-field" 
                                                            style={{ width: '100px', padding: '8px 12px', margin: 0, borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
                                                            value={plan.reseller_selling_price || ''}
                                                            onChange={(e) => handlePriceChange(plan.id, 'reseller_selling_price', e.target.value)}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '16px 24px', color: adminProfit > 0 ? '#10b981' : (adminProfit < 0 ? '#ef4444' : 'var(--text-gray)'), fontWeight: 600 }}>
                                                        {adminProfit > 0 ? '+' : ''}₦{adminProfit.toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '16px 24px', color: resellerProfit > 0 ? '#10b981' : (resellerProfit < 0 ? '#ef4444' : 'var(--text-gray)'), fontWeight: 600 }}>
                                                        {resellerProfit > 0 ? '+' : ''}₦{resellerProfit.toFixed(2)}
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <input 
                                                            type="number" 
                                                            className="input-field" 
                                                            style={{ width: '120px', padding: '8px 12px', margin: 0, borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
                                                            value={plan.selling_price}
                                                            onChange={(e) => handlePriceChange(plan.id, 'selling_price', e.target.value)}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '16px 24px', color: standardProfit > 0 ? '#10b981' : (standardProfit < 0 ? '#ef4444' : 'var(--text-gray)'), fontWeight: 600 }}>
                                                        {standardProfit > 0 ? '+' : ''}₦{standardProfit.toFixed(2)}
                                                    </td>
                                                </>
                                            )}
                                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                <button 
                                                    className="premium-btn"
                                                    onClick={() => handleSave(plan)}
                                                    disabled={saving[plan.id]}
                                                    style={{ 
                                                        padding: '8px 16px', 
                                                        borderRadius: '8px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        background: 'var(--primary)',
                                                        opacity: saving[plan.id] ? 0.7 : 1
                                                    }}
                                                >
                                                    <Save size={16} />
                                                    {saving[plan.id] ? 'Saving...' : 'Save'}
                                                </button>
                                            </td>
                                        </tr>
                                    )})
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <style dangerouslySetInnerHTML={{__html: `
                .skeleton {
                    background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s infinite;
                }
                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    100% { transform: rotate(360deg); }
                }
            `}} />
        </div>
    );
};

export default CentralPricingManager;
