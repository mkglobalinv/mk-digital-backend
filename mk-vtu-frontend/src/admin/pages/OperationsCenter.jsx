import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import axios from 'axios';
import { 
  Activity, 
  ShieldAlert, 
  Zap, 
  AlertTriangle, 
  Server,
  RefreshCw,
  Search,
  Database,
  Mail,
  HardDrive,
  CheckCircle,
  XCircle,
  Play,
  Hammer
} from 'lucide-react';
import './OperationsCenter.css';

const OperationsCenter = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterService, setFilterService] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [logsPage, setLogsPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reconciliation States
  const [reconDryRunResult, setReconDryRunResult] = useState(null);
  const [reconLoading, setReconLoading] = useState(false);
  const [reconMessage, setReconMessage] = useState('');

  // Diagnostic Test States
  const [diagAction, setDiagAction] = useState('');
  const [diagMessage, setDiagMessage] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [backupFilename, setBackupFilename] = useState('');
  const [availableBackups, setAvailableBackups] = useState([]);

  const fetchStats = async () => {
    try {
      const token = (localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'));
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/operations/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching operations stats:", err);
    }
  };

  const fetchLogs = async (page = 1) => {
    try {
      const token = (localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'));
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/operations/logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: 30,
          severity: filterSeverity,
          service: filterService,
          search: searchTerm
        }
      });
      if (res.data.status === 'success') {
        setLogs(res.data.logs);
        setTotalPages(res.data.pages);
        setLogsPage(res.data.currentPage);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

  const loadAllLogs = async () => {
    setFilterSeverity('');
    setFilterService('');
    setSearchTerm('');
    try {
      const token = (localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'));
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/operations/logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: 1,
          limit: 100,
          severity: '',
          service: '',
          search: ''
        }
      });
      if (res.data.status === 'success') {
        setLogs(res.data.logs);
        setTotalPages(res.data.pages);
        setLogsPage(res.data.currentPage);
      }
    } catch (err) {
      console.error("Error fetching all logs:", err);
    }
  };

  const fetchBackupsList = async () => {
    try {
      const token = (localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'));
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/get-available-backups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        setAvailableBackups(res.data.backups || []);
      }
    } catch (err) {
      console.error("Error listing backups:", err);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    const toastId = await showToast('Fetching operations telemetry...', 'loading');
    try {
      await Promise.all([fetchStats(), fetchLogs(1), fetchBackupsList()]);
      updateToast(toastId, { type: 'success', message: 'Telemetry updated successfully.', duration: 2000 });
    } catch (err) {
      updateToast(toastId, { type: 'error', message: 'Failed to update telemetry.' });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchLogs(1), fetchBackupsList()]);
      setLoading(false);
    };
    init();

    // Set up auto-refresh for system health telemetry (every 10 seconds, lightweight)
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [filterSeverity, filterService, logsPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  // Reconciliation Controls
  const triggerReconDryRun = async () => {
    setReconLoading(true);
    setReconMessage('');
    const toastId = await showToast('Running reconciliation dry run...', 'loading');
    try {
      const token = (localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'));
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/operations/reconciliation-dry-run`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        setReconDryRunResult(res.data.audit);
        setReconMessage(`Audit complete. Found ${res.data.audit.mismatchesFound} mismatching account ledger balances.`);
        updateToast(toastId, { type: 'success', message: 'Reconciliation dry run completed successfully.' });
      }
    } catch (err) {
      setReconMessage("Dry run failed: " + (err.response?.data?.message || err.message));
      updateToast(toastId, { type: 'error', message: 'Reconciliation dry run failed.' });
    } finally {
      setReconLoading(false);
    }
  };

  const executeReconRepair = async () => {
    if (!window.confirm("Are you sure you want to write reconciliation records to fix the Supabase wallets ledger to match MongoDB balances?")) return;
    setReconLoading(true);
    setReconMessage('');
    const toastId = await showToast('Executing reconciliation repair...', 'loading');
    try {
      const token = (localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'));
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/operations/reconciliation-repair`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        setReconMessage(`Reconciliation repair successfully completed. Created ${res.data.audit.repairsCreated.length} ledger adjustments.`);
        setReconDryRunResult(res.data.audit);
        fetchStats();
        updateToast(toastId, { type: 'success', message: 'Reconciliation repair completed.' });
      }
    } catch (err) {
      setReconMessage("Repair execution failed: " + (err.response?.data?.message || err.message));
      updateToast(toastId, { type: 'error', message: 'Reconciliation repair failed.' });
    } finally {
      setReconLoading(false);
    }
  };

  // Diagnostic Test Actions
  const runEmailTest = async () => {
    setDiagAction('email');
    setDiagMessage('');
    const toastId = await showToast('Running email delivery test...', 'loading');
    try {
      const token = (localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'));
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/operations/test-email`, { email: emailInput }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDiagMessage(res.data.message);
      fetchStats();
      updateToast(toastId, { type: 'success', message: 'Email delivery test succeeded.' });
    } catch (err) {
      setDiagMessage("Email test failed: " + (err.response?.data?.message || err.message));
      updateToast(toastId, { type: 'error', message: 'Email delivery test failed.' });
    } finally {
      setDiagAction('');
    }
  };

  const runBackupTest = async () => {
    setDiagAction('backup');
    setDiagMessage('');
    const toastId = await showToast('Creating disaster recovery snapshot...', 'loading');
    try {
      const token = (localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'));
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/operations/test-backup`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDiagMessage(`Backup test complete. Created file: ${res.data.backup.filename} (${res.data.backup.size}) with SHA-256 integrity hash.`);
      fetchStats();
      fetchBackupsList();
      updateToast(toastId, { type: 'success', message: 'Snapshot created successfully.' });
    } catch (err) {
      setDiagMessage("Backup test failed: " + (err.response?.data?.message || err.message));
      updateToast(toastId, { type: 'error', message: 'Snapshot creation failed.' });
    } finally {
      setDiagAction('');
    }
  };

  const runRestoreTest = async () => {
    if (!backupFilename) {
      alert("Please select or type a backup filename for restoration test.");
      return;
    }
    if (!window.confirm("WARNING: This will replace your current MongoDB collections and media with the selected backup. Proceed?")) return;
    setDiagAction('restore');
    setDiagMessage('');
    const toastId = await showToast('Executing system rollback...', 'loading');
    try {
      const token = (localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken'));
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/operations/test-restore`, { filename: backupFilename }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDiagMessage(`Restore test completed successfully in ${res.data.result.durationMs}ms.`);
      fetchStats();
      updateToast(toastId, { type: 'success', message: 'System restored successfully.' });
    } catch (err) {
      setDiagMessage("Restore test failed: " + (err.response?.data?.message || err.message));
      updateToast(toastId, { type: 'error', message: 'System rollback failed.' });
    } finally {
      setDiagAction('');
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'healthy') return <CheckCircle className="text-success" size={16} />;
    if (status === 'warning') return <AlertTriangle className="text-warning" size={16} />;
    return <XCircle className="text-danger" size={16} />;
  };

  const location = useLocation();
  const isSnapshots = location.pathname.includes('/snapshots');
  const isRollback = location.pathname.includes('/rollback');
  const isInfrastructure = location.pathname.includes('/infrastructure') || (!isSnapshots && !isRollback);

  if (loading) {
    return (
      <div className="operations-loading">
        <RefreshCw className="spinner" />
        <p>Loading Operations Center Infrastructure...</p>
      </div>
    );
  }

  return (
    <div className="operations-container">
      <div className="operations-header">
        <div>
          <h1>{isSnapshots ? 'Snapshots' : isRollback ? 'Rollback Center' : 'Operations Center'}</h1>
          <p className="subtitle">
            {isSnapshots ? 'Disaster Recovery & Data Backups' : 
             isRollback ? 'System Restoration from Snapshots' : 
             'Platform Diagnostics, Observability & Infrastructure Logs'}
          </p>
        </div>
        <button 
          onClick={refreshData} 
          disabled={refreshing} 
          className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
        >
          <RefreshCw size={18} />
          {refreshing ? 'Refreshing...' : 'Refresh Telemetry'}
        </button>
      </div>

      {stats && (
        <>
          {isInfrastructure && (
            <div className="operations-grid">
              {/* Card 1: System Telemetry */}
            <div className="op-card">
              <div className="card-header">
                <Server className="icon" />
                <h3>System Telemetry</h3>
              </div>
              <div className="metrics-list">
                <div className="metric-row">
                  <span>CPU Load</span>
                  <span className="metric-val">{stats.system.cpuUsage}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar" style={{ width: `${stats.system.cpuUsage}%`, backgroundColor: stats.system.cpuUsage > 80 ? '#ef4444' : '#10b981' }}></div>
                </div>

                <div className="metric-row">
                  <span>RAM Usage</span>
                  <span className="metric-val">{stats.system.memoryUsage}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar" style={{ width: `${stats.system.memoryUsage}%`, backgroundColor: stats.system.memoryUsage > 80 ? '#ef4444' : '#10b981' }}></div>
                </div>

                <div className="metric-row">
                  <span>Database Latency</span>
                  <span className={`metric-val ${stats.system.dbLatency > 100 ? 'text-warning' : 'text-success'}`}>{stats.system.dbLatency}ms</span>
                </div>

                <div className="metric-row">
                  <span>Uptime</span>
                  <span className="metric-val">{(stats.system.uptime / 3600).toFixed(1)} hrs</span>
                </div>
              </div>
            </div>

            {/* Card 2: Infrastructure Health Section */}
            <div className="op-card">
              <div className="card-header">
                <Activity className="icon" />
                <h3>Infrastructure Health</h3>
              </div>
              <div className="health-list">
                <div className="health-row">
                  <span>Database Connection</span>
                  <div className="health-status">
                    {getStatusIcon(stats.infrastructureHealth.db.status)}
                    <span className="details">({stats.infrastructureHealth.db.details})</span>
                  </div>
                </div>
                <div className="health-row">
                  <span>Ledger Reconciliation</span>
                  <div className="health-status">
                    {getStatusIcon(stats.infrastructureHealth.ledger.status)}
                    <span className="details">({stats.infrastructureHealth.ledger.details})</span>
                  </div>
                </div>
                <div className="health-row">
                  <span>Backup Storage</span>
                  <div className="health-status">
                    {getStatusIcon(stats.infrastructureHealth.backup.status)}
                    <span className="details">({stats.infrastructureHealth.backup.details})</span>
                  </div>
                </div>
                <div className="health-row">
                  <span>Flutterwave Gateway</span>
                  <div className="health-status">
                    {getStatusIcon(stats.infrastructureHealth.flutterwave.status)}
                    <span className="details">({stats.infrastructureHealth.flutterwave.details})</span>
                  </div>
                </div>
                <div className="health-row">
                  <span>Email System</span>
                  <div className="health-status">
                    {getStatusIcon(stats.infrastructureHealth.email.status)}
                    <span className="details">({stats.infrastructureHealth.email.details})</span>
                  </div>
                </div>
                <div className="health-row">
                  <span>Job Queue Engine</span>
                  <div className="health-status">
                    {getStatusIcon(stats.infrastructureHealth.queue.status)}
                    <span className="details">({stats.infrastructureHealth.queue.details})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: API Providers & Transaction Health */}
            <div className="op-card">
              <div className="card-header">
                <Zap className="icon" />
                <h3>Providers & Transactions (24h)</h3>
              </div>
              <div className="metrics-list">
                <div className="metric-row">
                  <span>Transaction Success Rate</span>
                  <span className="metric-val">{stats.transactionHealth.successRate}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar" style={{ width: `${stats.transactionHealth.successRate}%`, backgroundColor: stats.transactionHealth.successRate < 90 ? '#f59e0b' : '#10b981' }}></div>
                </div>

                <div className="stats-box-grid" style={{ marginBottom: 12 }}>
                  <div className="stat-box success">
                    <span className="stat-num">{stats.transactionHealth.successCount24h}</span>
                    <span className="stat-lbl">Success</span>
                  </div>
                  <div className="stat-box pending">
                    <span className="stat-num">{stats.transactionHealth.pendingCount}</span>
                    <span className="stat-lbl">Pending</span>
                  </div>
                  <div className="stat-box failed">
                    <span className="stat-num">{stats.transactionHealth.failedCount24h}</span>
                    <span className="stat-lbl">Failed</span>
                  </div>
                </div>

                <div className="provider-tiny-list">
                  {stats.apiHealth.map((p) => {
                    const isHealthy = p.apiStatus === 'online' && p.isAvailable;
                    return (
                      <div key={p.providerName} className="provider-tiny-row">
                        <span className={`dot ${isHealthy ? 'green' : 'red'}`}>●</span>
                        <strong className="name">{p.providerName.toUpperCase()}</strong>
                        <span className="val">₦{p.balance.toLocaleString()} ({p.latency}ms)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Infrastructure Maintenance Panel */}
          {isInfrastructure && (
            <div className="maintenance-section">
            <div className="section-title-wrapper">
              <Database className="icon" />
              <h2>Ledger Reconciliation Controls</h2>
            </div>
            <div className="recon-controls">
              <p className="recon-desc">
                Analyze and fix differences between user MongoDB wallets and ledger records on Supabase.
                Mongo balances serve as the source of truth, and corrections are made by writing balancing entries.
              </p>
              <div className="action-buttons-row">
                <button 
                  onClick={triggerReconDryRun} 
                  disabled={reconLoading} 
                  className="recon-btn dry-run"
                >
                  <Play size={16} />
                  {reconLoading ? 'Auditing...' : 'Run Ledger Audit (Dry Run)'}
                </button>
                <button 
                  onClick={executeReconRepair} 
                  disabled={reconLoading} 
                  className="recon-btn repair"
                >
                  <Hammer size={16} />
                  {reconLoading ? 'Repairing...' : 'Fix & Reconcile Ledger'}
                </button>
              </div>

              {reconMessage && <div className="recon-message-box">{reconMessage}</div>}

              {reconDryRunResult && reconDryRunResult.mismatches && (
                <div className="recon-results-wrapper">
                  <h3>Audit Details ({reconDryRunResult.mismatchesFound} mismatches found)</h3>
                  {reconDryRunResult.mismatches.length > 0 ? (
                    <table className="recon-table">
                      <thead>
                        <tr>
                          <th>User Email</th>
                          <th>Mongo Balance</th>
                          <th>Ledger Balance</th>
                          <th>Difference</th>
                          <th>Proposed Correction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reconDryRunResult.mismatches.map((m) => (
                          <tr key={m.userId} className="recon-row">
                            <td>
                              <strong>{m.name}</strong>
                              <span className="sub">{m.email}</span>
                            </td>
                            <td>
                              Normal: ₦{m.mongoBalances.normal.toFixed(2)}<br/>
                              VIP: ₦{m.mongoBalances.vip.toFixed(2)}<br/>
                              Earn: ₦{m.mongoBalances.earnings.toFixed(2)}
                            </td>
                            <td>
                              Normal: ₦{m.ledgerBalances.normal.toFixed(2)}<br/>
                              VIP: ₦{m.ledgerBalances.vip.toFixed(2)}<br/>
                              Earn: ₦{m.ledgerBalances.earnings.toFixed(2)}
                            </td>
                            <td>
                              Normal: <span className={Math.abs(m.differences.normal) > 0.01 ? 'text-warning' : ''}>₦{m.differences.normal.toFixed(2)}</span><br/>
                              VIP: <span className={Math.abs(m.differences.vip) > 0.01 ? 'text-warning' : ''}>₦{m.differences.vip.toFixed(2)}</span><br/>
                              Earn: <span className={Math.abs(m.differences.earnings) > 0.01 ? 'text-warning' : ''}>₦{m.differences.earnings.toFixed(2)}</span>
                            </td>
                            <td>
                              <ul className="fixes-list">
                                {m.proposedFixes.map((f, idx) => (
                                  <li key={idx}>
                                    Fix {f.walletType}: {f.actionType.toUpperCase()} of ₦{f.amount.toFixed(2)}
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="recon-success-state">
                      🟢 All user balances are perfectly balanced with Supabase ledger entries.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Infrastructure Diagnostic Center */}
          {(isSnapshots || isRollback) && (
            <div className="maintenance-section">
              <div className="section-title-wrapper">
                <HardDrive className="icon" />
                <h2>Infrastructure Diagnostics Center</h2>
              </div>
              <div className="diag-grid">
                {/* Box 1: Email SMTP Test */}
                <div className="diag-box">
                  <div className="diag-box-header">
                    <Mail size={18} />
                    <h3>SMTP Email Dispatch Test</h3>
                  </div>
                  <p>Send a live system check test email to verify SMTP configuration.</p>
                  <div className="diag-input-row">
                    <input 
                      type="email" 
                      placeholder="recipient@example.com" 
                      value={emailInput} 
                      onChange={(e) => setEmailInput(e.target.value)} 
                    />
                    <button 
                      onClick={runEmailTest} 
                      disabled={diagAction !== ''}
                      className="diag-action-btn"
                    >
                      {diagAction === 'email' ? 'Testing...' : 'Send Test'}
                    </button>
                  </div>
                </div>

                {/* Box 2: Backup System Test */}
                <div className="diag-box">
                  <div className="diag-box-header">
                    <Database size={18} />
                    <h3>Verify & Create Full Backup</h3>
                  </div>
                  <p>Compile database JSON exports, assets directories, compute checksums, and check files size.</p>
                  <button 
                    onClick={runBackupTest} 
                    disabled={diagAction !== ''}
                    className="diag-action-btn full-btn"
                  >
                    {diagAction === 'backup' ? 'Backing Up...' : 'Run Backup Verification Test'}
                  </button>
                </div>

                {/* Box 3: Restore System Test */}
                <div className="diag-box">
                  <div className="diag-box-header">
                    <RefreshCw size={18} />
                    <h3>Rollback & Restore Verification</h3>
                  </div>
                  <p>Select a backup configuration file to test restore process flow.</p>
                  <div className="diag-input-row">
                    <select 
                      value={backupFilename} 
                      onChange={(e) => setBackupFilename(e.target.value)}
                    >
                      <option value="">Select backup file...</option>
                      {availableBackups.map((b) => (
                        <option key={b.filename} value={b.filename}>
                          {b.filename} ({b.size})
                        </option>
                      ))}
                    </select>
                    <button 
                      onClick={runRestoreTest} 
                      disabled={diagAction !== '' || !backupFilename}
                      className="diag-action-btn danger-btn"
                    >
                      {diagAction === 'restore' ? 'Restoring...' : 'Test Restore'}
                    </button>
                  </div>
                </div>
              </div>

              {diagMessage && (
                <div className="diag-message-banner">
                  <strong>Diagnostic Result:</strong> {diagMessage}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Filter and Live Log Stream Area */}
      {isInfrastructure && (
        <div className="logs-section">
        <div className="logs-header-bar">
          <h2>Live Log Stream</h2>
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-wrapper">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search logs..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
              <option value="">All Severities</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
            <select value={filterService} onChange={(e) => setFilterService(e.target.value)}>
              <option value="">All Services</option>
              <option value="provider_api">Provider API</option>
              <option value="payment_gateway">Payment Gateway</option>
              <option value="system_engine">System Engine</option>
              <option value="auth_service">Auth Service</option>
              <option value="reseller_service">Reseller Service</option>
            </select>
            <button type="submit" className="search-btn">Search</button>
            <button type="button" onClick={loadAllLogs} className="search-btn" style={{marginLeft: 8, backgroundcolor: 'var(--text-light)'}}>Load All Logs</button>
          </form>
        </div>

        <div className="logs-table-wrapper">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Severity</th>
                <th>Service/Module</th>
                <th>Message</th>
                <th>Diagnostics / Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => {
                  const sevClass = log.severity ? log.severity.toLowerCase() : 'info';
                  return (
                    <tr key={log._id} className={`log-row severity-${sevClass}`}>
                      <td className="timestamp">
                        {new Date(log.timestamp).toLocaleTimeString()}
                        <span className="date">{new Date(log.timestamp).toLocaleDateString()}</span>
                      </td>
                      <td className="severity">
                        <span className={`badge ${sevClass}`}>
                          {log.severity === 'CRITICAL' && <ShieldAlert size={12} style={{ marginRight: 4 }} />}
                          {log.severity === 'ERROR' && <AlertTriangle size={12} style={{ marginRight: 4 }} />}
                          {log.severity}
                        </span>
                      </td>
                      <td className="service">
                        <strong>{log.service}</strong>
                        {log.module && <span className="module">/ {log.module}</span>}
                      </td>
                      <td className="message-cell">
                        <p className="message">{log.message}</p>
                        {log.stack_trace && (
                          <details className="stack-details">
                            <summary>View Stack Trace</summary>
                            <pre className="stack">{log.stack_trace}</pre>
                          </details>
                        )}
                      </td>
                      <td className="action-cell">
                        {log.recommended_action ? (
                          <div className="action-bubble">
                            <span className="bubble-title">Recommended Action:</span>
                            <p>{log.recommended_action}</p>
                          </div>
                        ) : (
                          <span className="no-action">None required</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="empty-logs" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                    {(filterSeverity || filterService || searchTerm) 
                      ? "No logs match the selected filters."
                      : "No logs exist yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button 
              disabled={logsPage === 1} 
              onClick={() => setLogsPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <span className="page-info">Page {logsPage} of {totalPages}</span>
            <button 
              disabled={logsPage === totalPages} 
              onClick={() => setLogsPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OperationsCenter;
