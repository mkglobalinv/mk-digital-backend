import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import API from '../../api';
import { useToast } from '../components/ResellerToast';
import { supabase } from '../../supabaseClient';
import './Reseller.css';

const ResellerPricing = () => {
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingStates, setSavingStates] = useState({});
    const [isPremium, setIsPremium] = useState(false);
    const activeToastId = React.useRef(null);
    const toast = useToast();

    useEffect(() => {
        fetchPrices();
        
        let subscription = null;
        if (supabase) {
            subscription = supabase
                .channel('reseller-pricing-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'reseller_custom_prices' }, payload => {
                    console.log('Realtime Pricing Change:', payload);
                    // Silently refresh the pricing list to get the joined global_base_prices data correctly
                    API.get('/api/reseller/prices').then(res => {
                        setIsPremium(res.data.isPremium);
                        const pricesData = Array.isArray(res.data.prices) ? res.data.prices : [];
                        setPrices(pricesData.map(p => ({
                            ...p,
                            originalSellingPrice: p.sellingPrice,
                            originalStatus: p.status
                        })));
                    }).catch(console.error);
                })
                .subscribe();
        }

        return () => {
            if (activeToastId.current) toast.dismiss(activeToastId.current);
            if (subscription) supabase.removeChannel(subscription);
        };
    }, []);

    const fetchPrices = async () => {
        activeToastId.current = toast.loading('Loading pricing data...');
        try {
            const res = await API.get('/api/reseller/prices');
            setIsPremium(res.data.isPremium);
            const pricesData = Array.isArray(res.data.prices) ? res.data.prices : [];
            setPrices(pricesData.map(p => ({
                ...p,
                originalSellingPrice: p.sellingPrice,
                originalStatus: p.status
            })));
            toast.success('Pricing data loaded', { id: activeToastId.current });
        } catch (err) {
            console.error("Failed to fetch prices", err);
            toast.error('Failed to load pricing data', { id: activeToastId.current });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (p, index) => {
        // Client-side validation
        if (p.sellingPrice === '' || p.sellingPrice === null || p.sellingPrice === undefined) {
            toast.error(`Please enter a selling price for ${p.network} ${p.plan_name}`);
            return;
        }

        const numericPrice = Number(p.sellingPrice);
        
        if (isNaN(numericPrice) || numericPrice < 0) {
            toast.error(`Invalid price entered for ${p.network} ${p.plan_name}`);
            return;
        }

        if (numericPrice < p.buyingPrice) {
            toast.error(`Selling price (₦${numericPrice}) cannot be lower than your cost (₦${p.buyingPrice}) for ${p.network} ${p.plan_name}`);
            return;
        }

        setSavingStates(prev => ({ ...prev, [p.planId]: true }));
        const toastId = toast.loading(`Saving price for ${p.network} ${p.plan_name}...`);

        try {
            await API.post('/api/reseller/prices', {
                serviceType: p.serviceType,
                network: p.network,
                planId: p.planId,
                sellingPrice: numericPrice,
                status: p.status
            });
            
            // Update original values to mark as clean
            const newPrices = [...prices];
            newPrices[index].originalSellingPrice = numericPrice;
            newPrices[index].originalStatus = p.status;
            newPrices[index].isOverridden = true;
            setPrices(newPrices);
            
            toast.success('Pricing updated successfully', { id: toastId });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update pricing', { id: toastId });
        } finally {
            setSavingStates(prev => ({ ...prev, [p.planId]: false }));
        }
    };

    const isRowDirty = (p) => {
        return Number(p.sellingPrice) !== p.originalSellingPrice || p.status !== p.originalStatus;
    };

    return (
        <div className="reseller-container">
            <header className="reseller-header">
                <h1>Pricing Management</h1>
                <p>Set custom selling prices for your customers</p>
                {!loading && !isPremium && (
                    <div style={{ background: '#fef3c7', color: '#d97706', padding: '12px 16px', borderRadius: '8px', marginTop: '16px', border: '1px solid #fde68a', fontSize: '14px' }}>
                        <strong>Basic Tier:</strong> You are currently using the global reseller prices. Upgrade to Premium to set your own custom pricing and increase your margins.
                    </div>
                )}
            </header>

            <div className="reseller-table-container">
                <table className="reseller-table">
                    <thead>
                        <tr>
                            <th>Network</th>
                            <th>Plan Name</th>
                            <th>Cost to You (₦)</th>
                            <th>Your Selling Price (₦)</th>
                            <th>Your Profit (₦)</th>
                            <th>Status</th>
                            {isPremium && <th>Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                    <Loader2 className="animate-spin" size={32} style={{ color: 'var(--reseller-primary)', margin: '0 auto' }} />
                                    <p style={{ marginTop: '10px', color: 'var(--reseller-text-muted)' }}>Fetching your pricing rules...</p>
                                </td>
                            </tr>
                        ) : prices.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--reseller-text-muted)' }}>
                                    No pricing plans found.
                                </td>
                            </tr>
                        ) : (
                            prices.map((p, i) => {
                                const costPrice = (p.buyingPrice !== undefined && p.buyingPrice !== null) ? Number(p.buyingPrice) : null;
                                const sellingPrice = (p.sellingPrice !== undefined && p.sellingPrice !== null) ? Number(p.sellingPrice) : null;
                                const profit = (sellingPrice !== null && costPrice !== null) ? sellingPrice - costPrice : null;
                                const isSaving = savingStates[p.planId];
                                const isDirty = isRowDirty(p);
                                
                                return (
                                    <tr key={`${p.network}-${p.planId}`} className={p.isOverridden ? 'row-overridden' : ''}>
                                        <td><strong>{p.network}</strong></td>
                                        <td>{p.plan_name}</td>
                                        <td className="text-muted">{costPrice !== null ? `₦${costPrice}` : '--'}</td>
                                        <td>
                                            {isPremium ? (
                                                <input 
                                                    type="number" 
                                                    value={p.sellingPrice}
                                                    onChange={(e) => {
                                                        const newPrices = [...prices];
                                                        newPrices[i].sellingPrice = e.target.value;
                                                        setPrices(newPrices);
                                                    }}
                                                    className="table-input"
                                                    min={p.buyingPrice}
                                                />
                                            ) : (
                                                <span style={{ fontWeight: 'bold' }}>₦{p.sellingPrice}</span>
                                            )}
                                        </td>
                                        <td className={profit > 0 ? 'text-success' : profit < 0 ? 'text-danger' : ''}>
                                            <strong>{profit === null ? '--' : `₦${profit.toFixed(2)}`}</strong>
                                        </td>
                                        <td>
                                            {isPremium ? (
                                                <select 
                                                    value={p.status}
                                                    onChange={(e) => {
                                                        const newPrices = [...prices];
                                                        newPrices[i].status = e.target.value;
                                                        setPrices(newPrices);
                                                    }}
                                                    className="table-select"
                                                >
                                                    <option value="enabled">Enabled</option>
                                                    <option value="disabled">Disabled</option>
                                                </select>
                                            ) : (
                                                <span className={`badge ${p.status === 'enabled' ? 'badge-success' : 'badge-warning'}`}>
                                                    {p.status.toUpperCase()}
                                                </span>
                                            )}
                                        </td>
                                        {isPremium && (
                                            <td>
                                                <button 
                                                    className="small-btn" 
                                                    onClick={() => handleUpdate(p, i)}
                                                    disabled={isSaving || !isDirty}
                                                    style={{ opacity: isDirty ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    {isSaving && <Loader2 size={14} className="animate-spin" />}
                                                    {isSaving ? 'Saving' : 'Save'}
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ResellerPricing;
