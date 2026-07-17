import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReconciliationPanel.css';

const parseInconsistency = (str) => {
    try {
        const emailMatch = str.match(/User\s+([^\s]+)/);
        const walletMatch = str.match(/(Normal|VIP|Earnings)\s+Balance/);
        const mongoMatch = str.match(/Mongo:\s*₦?(-?[\d,.]+)/);
        const ledgerMatch = str.match(/Ledger:\s*₦?(-?[\d,.]+)/);
        const diffMatch = str.match(/Diff:\s*₦?(-?[\d,.]+)/);
        
        if (emailMatch && walletMatch) {
            const email = emailMatch[1];
            const walletLabel = walletMatch[1];
            const walletType = walletLabel.toLowerCase();
            const mongo = mongoMatch ? parseFloat(mongoMatch[1].replace(/,/g, '')) : 0;
            const ledger = ledgerMatch ? parseFloat(ledgerMatch[1].replace(/,/g, '')) : 0;
            const diff = diffMatch ? parseFloat(diffMatch[1].replace(/,/g, '')) : (mongo - ledger);
            return {
                email,
                name: 'System User',
                walletType,
                mongoBalance: mongo,
                ledgerBalance: ledger,
                difference: diff,
                recommendedRepair: `Insert ledger ${diff > 0 ? 'credit' : 'debit'} of ₦${Math.abs(diff).toFixed(2)} to ${walletLabel} wallet`
            };
        }
    } catch (e) {
        console.error("Failed to parse inconsistency string:", e);
    }
    return null;
};

const getMismatchesList = (report) => {
    if (!report) return [];
    if (report.mismatches && report.mismatches.length > 0) {
        return report.mismatches;
    }
    if (report.inconsistencies && report.inconsistencies.length > 0) {
        return report.inconsistencies.map(parseInconsistency).filter(Boolean);
    }
    return [];
};

const ReconciliationPanel = ({ token }) => {
    const [reports, setReports] = useState([]);
    const [backups, setBackups] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    // Modal state for Repair Tool
    const [showRepairModal, setShowRepairModal] = useState(false);
    const [repairTargets, setRepairTargets] = useState([]);
    const [repairMode, setRepairMode] = useState('single'); // 'single' or 'all'

    const headers = { Authorization: `Bearer ${token}` };
    const API_URL = '/api/admin';

    useEffect(() => {
        fetchReports();
        fetchBackups();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await axios.get(`${API_URL}/reconciliation`, { headers });
            if (!res.data || typeof res.data !== 'object') {
                if (process.env.NODE_ENV === 'development') console.warn("Unexpected reconciliation payload:", res.data);
                throw new Error("Invalid response format");
            }
            if (res.data.status === 'success') {
                setReports(Array.isArray(res.data.reports) ? res.data.reports : []);
            }
        } catch (err) {
            console.error("Failed to fetch reports:", err);
        }
    };

    const fetchBackups = async () => {
        try {
            const res = await axios.get(`${API_URL}/backups`, { headers });
            if (!res.data || typeof res.data !== 'object') {
                if (process.env.NODE_ENV === 'development') console.warn("Unexpected backups payload:", res.data);
                throw new Error("Invalid response format");
            }
            if (res.data.status === 'success') {
                setBackups(Array.isArray(res.data.backups) ? res.data.backups : []);
            }
        } catch (err) {
            console.error("Failed to fetch backups:", err);
        }
    };

    const handleRunAudit = async () => {
        setLoading(true);
        setMsg(null);
        try {
            const res = await axios.post(`${API_URL}/reconciliation/run`, {}, { headers });
            if (!res.data || typeof res.data !== 'object') {
                if (process.env.NODE_ENV === 'development') console.warn("Unexpected reconciliation run payload:", res.data);
                throw new Error("Invalid response format");
            }
            if (res.data.status === 'success') {
                setMsg({ type: 'success', text: 'Reconciliation audit completed successfully.' });
                fetchReports();
                setSelectedReport(res.data.report || null);
            }
        } catch (err) {
            const backendError = err.response?.data?.message || err.message;
            setMsg({ type: 'error', text: `Failed to run reconciliation: ${backendError}` });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        setLoading(true);
        setMsg(null);
        try {
            const res = await axios.post(`${API_URL}/backups/create`, {}, { headers });
            if (res.data.status === 'success') {
                setMsg({ type: 'success', text: 'Database backup compiled and verified successfully.' });
                fetchBackups();
            }
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create backup.' });
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreBackup = async (filename) => {
        if (!window.confirm(`Are you absolutely sure you want to rollback the database and uploads to: ${filename}? This action will overwrite existing records!`)) {
            return;
        }
        setLoading(true);
        setMsg(null);
        try {
            const res = await axios.post(`${API_URL}/backups/restore`, { filename }, { headers });
            if (res.data.status === 'success') {
                setMsg({ type: 'success', text: `Rollback completed. Duration: ${res.data.result.durationMs}ms.` });
            }
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Database rollback failed.' });
        } finally {
            setLoading(false);
        }
    };

    const handleTestRestore = async (filename) => {
        setLoading(true);
        setMsg(null);
        try {
            const res = await axios.post(`${API_URL}/operations/test-restore`, { filename, dryRun: true }, { headers });
            if (res.data.status === 'success') {
                setMsg({ 
                    type: 'success', 
                    text: `✅ Restore Successful (Dry Run Validation Passed: ${res.data.result.durationMs}ms)` 
                });
            }
        } catch (err) {
            const backendError = err.response?.data?.message || err.message;
            setMsg({ 
                type: 'error', 
                text: `❌ Restore Failed (Dry Run Validation Failed: ${backendError})` 
            });
        } finally {
            setLoading(false);
        }
    };

    // Open Modal for Single row repair
    const initiateSingleRepair = (mismatch) => {
        setRepairTargets([mismatch]);
        setRepairMode('single');
        setShowRepairModal(true);
    };

    // Open Modal for All mismatches repair
    const initiateAllRepairs = () => {
        const mismatchesList = getMismatchesList(selectedReport);
        setRepairTargets(mismatchesList);
        setRepairMode('all');
        setShowRepairModal(true);
    };

    // Confirm and Execute the repair from Modal preview
    const executeRepair = async () => {
        setLoading(true);
        setMsg(null);
        setShowRepairModal(false);
        try {
            let res;
            if (repairMode === 'single') {
                const target = repairTargets[0];
                res = await axios.post(`${API_URL}/operations/reconciliation-repair`, { 
                    userId: target.userId, 
                    email: target.email, 
                    walletType: target.walletType 
                }, { headers });
            } else {
                // Repair all (empty body triggers performReconciliationAudit for all mismatches)
                res = await axios.post(`${API_URL}/operations/reconciliation-repair`, {}, { headers });
            }

            if (res.data.status === 'success') {
                setMsg({ 
                    type: 'success', 
                    text: repairMode === 'single' 
                        ? `Successfully repaired mismatch for ${repairTargets[0].email}.` 
                        : `Successfully repaired all ${repairTargets.length} mismatches.`
                });
                
                // AUTOMATICALLY RUN RECONCILIATION AUDIT AFTER REPAIR
                const auditRes = await axios.post(`${API_URL}/reconciliation/run`, {}, { headers });
                if (auditRes.data.status === 'success') {
                    fetchReports();
                    setSelectedReport(auditRes.data.report);
                }
            }
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to execute repair.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reconciliation-panel">
            <div className="panel-header">
                <h2>🛡️ Infrastructure Protection & Audit Dashboard</h2>
                <p>Monitor wallet ledgers, trace financial mismatches, and manage system database backups.</p>
            </div>

            {msg && (
                <div className={`panel-message ${msg.type}`}>
                    {msg.text}
                </div>
            )}

            <div className="panel-actions">
                <button className="btn-audit" onClick={handleRunAudit} disabled={loading}>
                    {loading ? 'Processing...' : '⚡ Run Instant Audit'}
                </button>
                <button className="btn-backup" onClick={handleCreateBackup} disabled={loading}>
                    {loading ? 'Processing...' : '💾 Compile Full Backup'}
                </button>
            </div>

            <div className="panel-grid">
                <div className="card audit-history">
                    <h3>📊 Daily Reconciliation Audits</h3>
                    <div className="reports-list">
                        {reports.length === 0 ? (
                            <p className="no-data">No reconciliation reports found.</p>
                        ) : (
                            (reports || []).map(r => (
                                <div 
                                    key={r._id} 
                                    className={`report-item ${r?.status} ${selectedReport?._id === r?._id ? 'active' : ''}`}
                                    onClick={() => setSelectedReport(r)}
                                >
                                    <div className="report-info">
                                        <span className="report-date">{r?.date ? new Date(r.date).toLocaleDateString() : 'N/A'}</span>
                                        <span className="report-users">{r?.totalUsersAudited || 0} accounts audited</span>
                                    </div>
                                    <div className="report-status">
                                        <span className={`badge ${r?.status === 'healthy' || r?.status === 'MATCH' ? 'healthy' : 'unbalanced'}`}>
                                            {r?.status === 'healthy' || r?.status === 'MATCH' ? '🟢 MATCH' : '🔴 MISMATCH'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="card report-details">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, border: 'none', padding: 0 }}>🔍 Selected Audit Details</h3>
                        {selectedReport && getMismatchesList(selectedReport).length > 0 && (
                            <button 
                                className="btn-repair-all-header"
                                disabled={loading}
                                onClick={initiateAllRepairs}
                            >
                                🔧 Repair All Mismatches
                            </button>
                        )}
                    </div>
                    {selectedReport ? (
                        <div className="details-content">
                            <div className="summary-stats">
                                <div className="stat-box">
                                    <label>Audit Date</label>
                                    <value>{selectedReport?.date ? new Date(selectedReport.date).toLocaleDateString() : 'N/A'}</value>
                                </div>
                                <div className="stat-box">
                                    <label>Accounts Audited</label>
                                    <value>{selectedReport?.totalUsersAudited || 0}</value>
                                </div>
                                <div className="stat-box">
                                    <label>Accounts Mismatched</label>
                                    <value>{getMismatchesList(selectedReport).length}</value>
                                </div>
                                <div className="stat-box">
                                    <label>Total Difference</label>
                                    <value style={{ color: getMismatchesList(selectedReport).length > 0 ? '#b91c1c' : '#15803d' }}>
                                        ₦{getMismatchesList(selectedReport).reduce((sum, m) => sum + Math.abs(m?.difference || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </value>
                                </div>
                            </div>

                            <div className="summary-stats">
                                <div className="stat-box">
                                    <label>Cumulative Balances</label>
                                    <value>₦{(selectedReport?.totalBalances || 0).toLocaleString()}</value>
                                </div>
                                <div className="stat-box">
                                    <label>Gateway Funding</label>
                                    <value>₦{(selectedReport?.totalGatewayFunding || 0).toLocaleString()}</value>
                                </div>
                                <div className="stat-box">
                                    <label>Customer Purchases</label>
                                    <value>₦{(selectedReport?.totalCustomerPurchases || 0).toLocaleString()}</value>
                                </div>
                                <div className="stat-box">
                                    <label>Provider Debits (Cost)</label>
                                    <value>₦{(selectedReport?.totalProviderDebits || 0).toLocaleString()}</value>
                                </div>
                            </div>

                            <h4>Detailed Mismatch Records ({getMismatchesList(selectedReport).length})</h4>
                            {getMismatchesList(selectedReport).length === 0 ? (
                                <p className="success-txt">🟢 No ledger inconsistencies detected for this date range.</p>
                            ) : (
                                <div className="mismatches-table-wrapper">
                                    <table className="mismatches-table">
                                        <thead>
                                            <tr>
                                                <th>User</th>
                                                <th>Wallet</th>
                                                <th>Mongo Bal</th>
                                                <th>Ledger Bal</th>
                                                <th>Difference</th>
                                                <th>Recommended Repair</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getMismatchesList(selectedReport).map((m, i) => (
                                                <tr key={i}>
                                                    <td>
                                                        <div className="user-info">
                                                            <span className="user-name">{m?.name || 'System User'}</span>
                                                            <span className="user-email">{m?.email || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`wallet-type ${m?.walletType || ''}`}>
                                                            {m?.walletType || 'Unknown'}
                                                        </span>
                                                    </td>
                                                    <td>₦{(m?.mongoBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td>₦{(m?.ledgerBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td>
                                                        <span className={`diff-val ${(m?.difference || 0) > 0 ? 'positive' : 'negative'}`}>
                                                            {(m?.difference || 0) > 0 ? '+' : ''}₦{(m?.difference || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontSize: '11px', color: 'var(--text-gray)' }}>
                                                            {m?.recommendedRepair || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button 
                                                            className="btn-repair-row"
                                                            disabled={loading}
                                                            onClick={() => initiateSingleRepair(m)}
                                                        >
                                                            Repair Ledger
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="no-data">Select a reconciliation report on the left to view details.</p>
                    )}
                </div>

                <div className="card backups-manager">
                    <h3>💾 System Backups & Recovery</h3>
                    <div className="backups-list">
                        {backups.length === 0 ? (
                            <p className="no-data">No backups found.</p>
                        ) : (
                            (backups || []).map(b => {
                                const isValid = b?.status === 'success' || b?.status === 'valid' || b?.status === 'verified';
                                return (
                                    <div key={b?.filename} className="backup-item-wrapper" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                        <div className="backup-item" style={{ borderBottom: 'none', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
                                            <div className="backup-info">
                                                <div className="backup-header-row">
                                                    <span className="backup-name">{b?.filename || 'Unknown'}</span>
                                                    <span className={`backup-status-badge ${b?.status || 'success'}`}>
                                                        {b?.status === 'verified' ? 'VERIFIED' : (b?.status === 'success' || b?.status === 'valid') ? 'VALID' : 'INVALID'}
                                                    </span>
                                                </div>
                                                <span className="backup-meta">{b?.size || '0B'} • {b?.createdAt ? new Date(b.createdAt).toLocaleString() : 'N/A'}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    className="btn-restore" 
                                                    onClick={() => handleTestRestore(b.filename)}
                                                    disabled={loading || !isValid}
                                                    style={{ 
                                                        opacity: isValid ? 1 : 0.5,
                                                        borderColor: '#3b82f6',
                                                        color: '#1d4ed8',
                                                        backgroundColor: '#f0f9ff'
                                                    }}
                                                >
                                                    🧪 Test Restore
                                                </button>
                                                <button 
                                                    className="btn-restore" 
                                                    onClick={() => handleRestoreBackup(b.filename)}
                                                    disabled={loading || !isValid}
                                                    style={{ opacity: isValid ? 1 : 0.5 }}
                                                >
                                                    {isValid ? 'Rollback' : 'Invalid Backup'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="backup-diagnostics" style={{
                                            border: '1px solid #e2e8f0',
                                            borderTop: 'none',
                                            borderBottomLeftRadius: '12px',
                                            borderBottomRightRadius: '12px',
                                            backgroundColor: 'var(--bg-color)',
                                            padding: '12px 18px',
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(5, 1fr)',
                                            gap: '8px',
                                            marginTop: 0
                                        }}>
                                            <div className="diagnostic-item">
                                                <label>Files Exported</label>
                                                <span>{b?.fileCount || 0}</span>
                                            </div>
                                            <div className="diagnostic-item">
                                                <label>Records Exported</label>
                                                <span>{b?.dbRecordsCount || 0}</span>
                                            </div>
                                            <div className="diagnostic-item">
                                                <label>ZIP Size</label>
                                                <span>{b?.size || '0B'}</span>
                                            </div>
                                            <div className="diagnostic-item">
                                                <label>Storage Location</label>
                                                <span title={b?.storageLocation || ''}>{b?.storageLocation ? b.storageLocation.split(/[\\/]/).pop() : 'Local backups/'}</span>
                                            </div>
                                            <div className="diagnostic-item">
                                                <label>Checksum</label>
                                                <span title={b?.checksum || ''}>{b?.checksum ? b.checksum.substring(0, 10) + '...' : 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '14px' }} />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Repair Tool Modal */}
            {showRepairModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>🔧 Ledger Repair Preview & Confirmation</h3>
                            <button className="btn-close-modal" onClick={() => setShowRepairModal(false)}>×</button>
                        </div>
                        
                        <div className="modal-warning-box">
                            <strong>⚠️ Warning</strong>: This corrective action will insert ledger records into the Supabase database to synchronize the wallet ledger balances with MongoDB (which acts as the source of truth). MongoDB balances will **not** be modified. All alignments are tagged as <strong>"HISTORICAL TEST DATA CORRECTION"</strong> for auditing trails.
                        </div>

                        <h4>Proposed Adjustments ({repairTargets.length})</h4>
                        <div className="mismatches-table-wrapper" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                            <table className="mismatches-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Wallet</th>
                                        <th>Current Mongo</th>
                                        <th>Current Ledger</th>
                                        <th>Difference</th>
                                        <th>Repair Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {repairTargets.map((m, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <div className="user-info">
                                                    <span className="user-name">{m?.name || 'System User'}</span>
                                                    <span className="user-email">{m?.email || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`wallet-type ${m?.walletType || ''}`}>
                                                    {m?.walletType || 'Unknown'}
                                                </span>
                                            </td>
                                            <td>₦{(m?.mongoBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td>₦{(m?.ledgerBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td>
                                                <span className={`diff-val ${(m?.difference || 0) > 0 ? 'positive' : 'negative'}`}>
                                                    {(m?.difference || 0) > 0 ? '+' : ''}₦{(m?.difference || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold' }}>
                                                {(m?.difference || 0) > 0 ? 'Credit' : 'Debit'} ₦{Math.abs(m?.difference || 0).toFixed(2)} to {m?.walletType || 'wallet'} ledger
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-modal-cancel" onClick={() => setShowRepairModal(false)} disabled={loading}>
                                Cancel
                            </button>
                            <button className="btn-modal-confirm" onClick={executeRepair} disabled={loading}>
                                {loading ? 'Processing...' : 'Confirm & Execute Repair'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReconciliationPanel;
