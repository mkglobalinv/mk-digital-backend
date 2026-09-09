import React, { useState, useEffect } from 'react';
import API from '../../api';
import { useToast } from '../../context/ToastContext';
import './AirtimeToCash.css';

const STATUSES = ['PENDING', 'OTP_REQUIRED', 'OTP_VERIFIED', 'QUOTA_CHECKING', 'READY_FOR_TRANSFER', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVERSED', 'MANUAL_REVIEW'];

const AirtimeToCashTransactions = () => {
    const { showToast } = useToast();
    const [txs, setTxs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [selected, setSelected] = useState(null);
    const [audit, setAudit] = useState([]);
    const [note, setNote] = useState('');

    const fetchTxs = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/admin/airtime-to-cash/transactions', { params: statusFilter ? { status: statusFilter } : {} });
            setTxs(res.data.data);
        } catch (err) {
            showToast('Failed to load transactions.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTxs(); }, [statusFilter]);

    const openDetail = async (reference) => {
        try {
            const res = await API.get(`/api/admin/airtime-to-cash/transactions/${reference}`);
            setSelected(res.data.data.transaction);
            setAudit(res.data.data.audit);
            setNote('');
        } catch (err) {
            showToast('Failed to load transaction detail.', 'error');
        }
    };

    const resolve = async (decision) => {
        if (!selected) return;
        const confirmMsg = decision === 'credit'
            ? 'Only confirm this if you have independently verified the transfer succeeded with AirtimeBridge. This will credit the customer\'s wallet.'
            : 'Mark this transaction as failed? No wallet credit will occur.';
        if (!window.confirm(confirmMsg)) return;
        try {
            await API.post(`/api/admin/airtime-to-cash/transactions/${selected.reference}/resolve`, { decision, note });
            showToast('Transaction resolved.', 'success');
            setSelected(null);
            fetchTxs();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to resolve transaction.', 'error');
        }
    };

    return (
        <div className="a2c-container">
            <div className="a2c-header">
                <div>
                    <h2>Airtime-to-Cash — Transactions</h2>
                    <p>Full monitoring across every tenant. Click a row for the complete audit trail. OTP and transfer PIN are never shown — they are never stored.</p>
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All statuses</option>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className="a2c-card">
                {loading ? (
                    <div className="a2c-empty">Loading...</div>
                ) : txs.length === 0 ? (
                    <div className="a2c-empty">No transactions yet.</div>
                ) : (
                    <div className="a2c-table-wrap">
                        <table className="a2c-table">
                            <thead>
                                <tr>
                                    <th>Reference</th><th>Network</th><th>Phone</th><th>Airtime</th><th>Payout</th><th>Margin</th><th>Status</th><th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {txs.map((tx) => (
                                    <tr key={tx.id} onClick={() => openDetail(tx.reference)} style={{ cursor: 'pointer' }}>
                                        <td>{tx.reference}</td>
                                        <td>{tx.network}</td>
                                        <td>{tx.senderPhone}</td>
                                        <td>₦{tx.airtimeAmount}</td>
                                        <td>₦{tx.customerPayoutAmount}</td>
                                        <td>₦{tx.platformValue}</td>
                                        <td><span className={`a2c-badge status-${tx.status}`}>{tx.status.replace(/_/g, ' ')}</span></td>
                                        <td>{new Date(tx.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selected && (
                <div className="a2c-modal-backdrop" onClick={() => setSelected(null)}>
                    <div className="a2c-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{selected.reference}</h3>
                        <p><span className={`a2c-badge status-${selected.status}`}>{selected.status.replace(/_/g, ' ')}</span></p>
                        <table className="a2c-table">
                            <tbody>
                                <tr><td>Network</td><td>{selected.network}</td></tr>
                                <tr><td>Phone</td><td>{selected.senderPhone}</td></tr>
                                <tr><td>Airtime Amount</td><td>₦{selected.airtimeAmount}</td></tr>
                                <tr><td>Customer Payout</td><td>₦{selected.customerPayoutAmount}</td></tr>
                                <tr><td>Platform Value</td><td>₦{selected.platformValue}</td></tr>
                                <tr><td>Bank</td><td>{selected.bankName} — {selected.accountNumber}</td></tr>
                                <tr><td>Provider</td><td>{selected.provider} {selected.providerReference ? `(${selected.providerReference})` : ''}</td></tr>
                                <tr><td>Wallet Credited</td><td>{selected.walletCredited ? 'Yes' : 'No'}</td></tr>
                                {selected.failureReason && <tr><td>Failure Reason</td><td>{selected.failureReason}</td></tr>}
                            </tbody>
                        </table>

                        <h4 style={{ marginTop: 16 }}>Audit Trail</h4>
                        <div style={{ maxHeight: 220, overflowY: 'auto', fontSize: 13 }}>
                            {audit.map((a) => (
                                <div key={a._id} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <strong>{a.action}</strong> {a.fromStatus && a.toStatus ? `(${a.fromStatus} → ${a.toStatus})` : ''}
                                    <div style={{ color: '#6b7280' }}>{new Date(a.createdAt).toLocaleString()} — {a.actorType}</div>
                                </div>
                            ))}
                        </div>

                        {selected.status === 'MANUAL_REVIEW' && (
                            <div style={{ marginTop: 16, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
                                <h4>Resolve Manual Review</h4>
                                <textarea
                                    placeholder="Note (e.g. verified via AirtimeBridge dashboard reference #...)"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    style={{ width: '100%', minHeight: 60, marginBottom: 10 }}
                                />
                                <button className="a2c-btn primary" onClick={() => resolve('credit')}>Confirm Success & Credit Wallet</button>{' '}
                                <button className="a2c-btn danger" onClick={() => resolve('fail')}>Mark as Failed</button>
                            </div>
                        )}

                        <button className="a2c-btn" style={{ marginTop: 16, background: '#e5e7eb', color: '#111827' }} onClick={() => setSelected(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AirtimeToCashTransactions;
