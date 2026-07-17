import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { Activity, Search, Filter } from "lucide-react";
import API from "../../api";

const ResellerTransactions = ({ user }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!user?._id) return;

        const fetchTransactions = async (isBackground = false) => {
            try {
                if (!isBackground) setLoading(true);
                const res = await API.get('/api/reseller/customers/transactions'); 
                if (res.data.status === 'success') {
                    setTransactions(res.data.data);
                }
            } catch (err) {
                console.error("Failed to load transactions", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();

        // Listen for realtime transaction updates on Supabase
        const channel = supabase.channel(`transactions-reseller-${user._id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions', filter: `reseller_id=eq.${user._id}` },
                (payload) => {
                    console.log('[Transactions] Transaction change detected!', payload);
                    fetchTransactions(true);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?._id]);

    const filteredTransactions = transactions.filter(tx => 
        tx.reference?.toLowerCase().includes(search.toLowerCase()) || 
        tx.description?.toLowerCase().includes(search.toLowerCase()) ||
        tx.phone?.includes(search)
    );

    return (
        <div className="reseller-container animate-fade-in" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <div style={{ background: 'var(--primary-light)', padding: '12px', borderRadius: '16px', color: 'var(--primary)' }}>
                    <Activity size={28} />
                </div>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>Business Transactions</h1>
                    <p style={{ color: 'var(--text-gray)', margin: '4px 0 0', fontSize: '15px' }}>
                        Live feed of your customers' activities
                    </p>
                </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} color="var(--text-gray)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                            type="text" 
                            placeholder="Search reference, phone, description..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px',
                                border: '1px solid var(--border-color)', background: 'var(--bg-color)',
                                color: 'var(--text-dark)', fontSize: '15px', outline: 'none'
                            }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '16px', color: 'var(--text-gray)', fontSize: '14px', fontWeight: '600' }}>Reference</th>
                                <th style={{ padding: '16px', color: 'var(--text-gray)', fontSize: '14px', fontWeight: '600' }}>Customer</th>
                                <th style={{ padding: '16px', color: 'var(--text-gray)', fontSize: '14px', fontWeight: '600' }}>Description</th>
                                <th style={{ padding: '16px', color: 'var(--text-gray)', fontSize: '14px', fontWeight: '600' }}>Amount</th>
                                <th style={{ padding: '16px', color: 'var(--text-gray)', fontSize: '14px', fontWeight: '600' }}>Profit</th>
                                <th style={{ padding: '16px', color: 'var(--text-gray)', fontSize: '14px', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '16px', color: 'var(--text-gray)', fontSize: '14px', fontWeight: '600' }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Loading transactions...</td>
                                </tr>
                            ) : filteredTransactions.length > 0 ? (
                                filteredTransactions.map((tx, idx) => (
                                    <tr key={tx._id || tx.id || idx} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-dark)' }}>{tx.reference}</td>
                                        <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-dark)' }}>{tx.customerName || tx.phone || 'N/A'}</td>
                                        <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-gray)' }}>{tx.description}</td>
                                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>₦{tx.amount}</td>
                                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: '700', color: '#10b981' }}>+₦{tx.profit || 0}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{
                                                padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', textTransform: 'capitalize',
                                                background: tx.status === 'success' ? 'rgba(16, 185, 129, 0.1)' : tx.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: tx.status === 'success' ? '#10b981' : tx.status === 'pending' ? '#f59e0b' : '#ef4444'
                                            }}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-gray)' }}>
                                            {new Date(tx.createdAt || tx.updated_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-gray)' }}>
                                        No transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ResellerTransactions;
