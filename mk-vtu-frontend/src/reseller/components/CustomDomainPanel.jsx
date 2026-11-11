import React, { useEffect, useState } from 'react';
import { Globe, CheckCircle2, Clock, ShieldCheck, ShieldAlert, AlertTriangle, ExternalLink, RefreshCw, Unplug } from 'lucide-react';
import API from '../../api';
import { DnsRecordsTable } from '../../admin/pages/AdminDomains';
import '../../admin/pages/AdminDomains.css';

// Reseller's own custom domain (set up by the admin): progress, DNS records,
// SSL and website status, and a disconnection request.

const STEPS = [
    { key: 'dns', label: 'DNS records' },
    { key: 'verify', label: 'Verification' },
    { key: 'ssl', label: 'HTTPS certificate' },
    { key: 'live', label: 'Website live' }
];
const STEP_INDEX = { pending_dns: 0, verifying: 1, pending_ssl: 2, active: 4, ssl_renewal_required: 4, failed: -1, suspended: -1 };

const HEADLINE = {
    pending_dns: 'Waiting for your DNS records',
    verifying: 'Verifying your domain',
    pending_ssl: 'Securing your website with HTTPS',
    active: 'Your website is live',
    ssl_renewal_required: 'Your website is live — certificate renewal pending',
    failed: 'Setup needs attention',
    suspended: 'Your custom domain is suspended'
};

const CustomDomainPanel = ({ domain, allowDisconnect, onRefresh }) => {
    const [reason, setReason] = useState('');
    const [showDisconnect, setShowDisconnect] = useState(false);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);
    const stepAt = STEP_INDEX[domain.state] ?? 0;
    const live = ['active', 'ssl_renewal_required'].includes(domain.state);

    const requestDisconnect = async () => {
        setBusy(true); setMsg(null);
        try {
            await API.post('/api/reseller/custom-domain/disconnect-request', { reason });
            setMsg({ type: 'success', text: 'Request sent. The administrator will review it.' });
            setShowDisconnect(false);
            onRefresh();
        } catch (err) {
            setMsg({ type: 'error', text: err?.response?.data?.message || 'Could not send the request.' });
        } finally { setBusy(false); }
    };

    return (
        <div className="dm-row open dm-scope" style={{ marginBottom: 24 }}>
            <div className="dm-detail" style={{ borderTop: 0 }}>
                <div className="dm-row-between">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Globe size={22} className="dm-globe" />
                        <div>
                            <div className="dm-domain" style={{ fontSize: 18 }}>{domain.domain}</div>
                            <div className="dm-muted">{HEADLINE[domain.state] || domain.state}</div>
                        </div>
                    </div>
                    <button className="admin-btn secondary dm-btn" onClick={onRefresh}><RefreshCw size={14} /> Refresh</button>
                </div>

                {live && domain.liveUrl && <a className="dm-live" style={{ marginTop: 12 }} href={domain.liveUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> {domain.liveUrl}</a>}

                {stepAt >= 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, margin: '16px 0' }}>
                        {STEPS.map((s, i) => {
                            const done = i < stepAt;
                            const current = i === stepAt;
                            return (
                                <div key={s.key} className={`dm-badge ${done ? 'dm-green' : current ? 'dm-blue' : 'dm-gray'}`} style={{ justifyContent: 'center', padding: '8px 10px' }}>
                                    {done ? <CheckCircle2 size={14} /> : <Clock size={14} />} {s.label}
                                </div>
                            );
                        })}
                    </div>
                )}

                {domain.lastError && !live && <div className="dm-note"><AlertTriangle size={14} /> {domain.lastError}</div>}
                {domain.state === 'failed' && <div className="dm-note">Fix the DNS records below, then ask the administrator to retry verification.</div>}

                <div className="dm-grid">
                    <div><span className="dm-k">Website</span><span>{live ? 'Active' : domain.state === 'suspended' ? 'Suspended' : 'Not live yet'}</span></div>
                    <div><span className="dm-k">SSL certificate</span><span>{live ? <><ShieldCheck size={14} /> Active until {domain.ssl?.expiresAt ? new Date(domain.ssl.expiresAt).toLocaleDateString() : '—'}</> : domain.state === 'pending_ssl' ? 'Being issued' : <><ShieldAlert size={14} /> Not issued yet</>}</span></div>
                    <div><span className="dm-k">Last DNS check</span><span>{domain.dns?.lastCheckedAt ? new Date(domain.dns.lastCheckedAt).toLocaleString() : '—'}</span></div>
                </div>

                <h4 className="dm-subhead">DNS records to add at your domain registrar</h4>
                <DnsRecordsTable domain={domain} />

                {msg && <div className={msg.type === 'success' ? 'dm-success' : 'dm-error'} style={{ marginTop: 12 }}>{msg.text}</div>}

                {domain.disconnectRequest?.status === 'pending' ? (
                    <div className="dm-note" style={{ marginTop: 16 }}>Disconnection requested on {new Date(domain.disconnectRequest.requestedAt).toLocaleString()}. Waiting for the administrator.</div>
                ) : allowDisconnect && (
                    <div style={{ marginTop: 16 }}>
                        {!showDisconnect ? (
                            <button className="admin-btn secondary dm-btn" onClick={() => setShowDisconnect(true)}><Unplug size={14} /> Request disconnection</button>
                        ) : (
                            <div className="dm-form">
                                <label className="dm-label">Why do you want to disconnect {domain.domain}? (optional)</label>
                                <textarea className="dm-input" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
                                <div className="dm-actions">
                                    <button className="admin-btn secondary dm-btn" onClick={() => setShowDisconnect(false)}>Cancel</button>
                                    <button className="admin-btn primary dm-btn" disabled={busy} onClick={requestDisconnect}>{busy ? 'Sending…' : 'Send request'}</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

/** Loads the reseller's VPS domain; renders nothing when they have none. */
export const useResellerCustomDomain = () => {
    const [state, setState] = useState({ loading: true, domain: null, allowDisconnect: false });
    const load = async () => {
        try {
            const res = await API.get('/api/reseller/custom-domain');
            setState({ loading: false, domain: res.data?.domain || null, allowDisconnect: !!res.data?.allowDisconnectRequests });
        } catch {
            setState({ loading: false, domain: null, allowDisconnect: false });
        }
    };
    useEffect(() => {
        load();
    }, []);
    useEffect(() => {
        if (!state.domain || ['active', 'failed', 'suspended'].includes(state.domain.state)) return undefined;
        const t = setInterval(load, 30000);
        return () => clearInterval(t);
    }, [state.domain]);
    return { ...state, reload: load };
};

export default CustomDomainPanel;
