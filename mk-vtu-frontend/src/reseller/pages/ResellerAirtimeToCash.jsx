import React, { useState, useEffect } from 'react';
import API from '../../api';
import '../../admin/pages/AirtimeToCash.css';
import './Reseller.css';

const NETWORKS = ['MTN', 'AIRTEL', 'GLO', '9MOBILE'];

// Read-only for the reseller: rate-setting is a main-platform-admin-only action
// (see routes/admin/airtimeCashAdminRoutes.js) -- this page never sends a write.
const ResellerAirtimeToCash = () => {
    const [pricing, setPricing] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([
            API.get('/api/reseller/airtime-to-cash/pricing'),
            API.get('/api/reseller/airtime-to-cash/transactions')
        ])
            .then(([pricingRes, txRes]) => {
                setPricing(pricingRes.data.data);
                setTransactions(txRes.data.data);
            })
            .catch(() => setError('Failed to load Airtime-to-Cash data.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="a2c-container">Loading...</div>;

    return (
        <div className="a2c-container">
            <div className="a2c-header">
                <div>
                    <h2>Airtime to Cash</h2>
                    <p>Your effective conversion rates and your customers' Airtime-to-Cash transactions. Rates are set by the platform admin.</p>
                </div>
            </div>

            {error && <div className="a2c-empty">{error}</div>}

            <div className="a2c-card">
                <h3>Your Rates</h3>
                <div className="a2c-table-wrap">
                    <table className="a2c-table">
                        <thead>
                            <tr><th>Network</th><th>Conversion %</th><th>Fixed Fee</th><th>Min</th><th>Max</th><th>Source</th></tr>
                        </thead>
                        <tbody>
                            {NETWORKS.map((net) => {
                                const row = pricing?.[net];
                                return (
                                    <tr key={net}>
                                        <td><strong>{net}</strong></td>
                                        <td>{row ? `${row.conversionPercentage}%` : '—'}</td>
                                        <td>{row ? `₦${row.fixedFee}` : '—'}</td>
                                        <td>{row ? `₦${row.minAmount}` : '—'}</td>
                                        <td>{row ? `₦${row.maxAmount}` : '—'}</td>
                                        <td>
                                            {row ? (
                                                <span className={`a2c-badge ${row.source === 'tenant' ? 'enabled' : 'disabled'}`}>
                                                    {row.source === 'tenant' ? 'Your Rate' : 'Platform Default'}
                                                </span>
                                            ) : (
                                                <span className="a2c-badge disabled">Not Available</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="a2c-card">
                <h3>Your Customers' Transactions</h3>
                {transactions.length === 0 ? (
                    <div className="a2c-empty">No Airtime-to-Cash transactions yet.</div>
                ) : (
                    <div className="a2c-table-wrap">
                        <table className="a2c-table">
                            <thead>
                                <tr><th>Reference</th><th>Network</th><th>Phone</th><th>Airtime</th><th>Payout</th><th>Status</th><th>Created</th></tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td>{tx.reference}</td>
                                        <td>{tx.network}</td>
                                        <td>{tx.senderPhone}</td>
                                        <td>₦{tx.airtimeAmount}</td>
                                        <td>₦{tx.customerPayoutAmount}</td>
                                        <td><span className={`a2c-badge status-${tx.status}`}>{tx.status.replace(/_/g, ' ')}</span></td>
                                        <td>{new Date(tx.createdAt).toLocaleString()}</td>
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

export default ResellerAirtimeToCash;
