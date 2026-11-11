import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Globe, Plus, RefreshCw, Sparkles, ShieldCheck, ShieldAlert, Shield, CheckCircle2, XCircle,
    Clock, ChevronDown, ChevronRight, Copy, Check, ExternalLink, Trash2, PauseCircle, PlayCircle,
    RotateCcw, Search, X, AlertTriangle, Server, Inbox
} from 'lucide-react';
import API from '../../api';
import './AdminDomains.css';

const STATE_META = {
    pending_dns: { label: 'Pending DNS', tone: 'amber' },
    verifying: { label: 'Verifying', tone: 'blue' },
    pending_ssl: { label: 'Pending SSL', tone: 'blue' },
    active: { label: 'Active', tone: 'green' },
    ssl_renewal_required: { label: 'SSL Renewal Required', tone: 'amber' },
    failed: { label: 'Failed', tone: 'red' },
    suspended: { label: 'Suspended', tone: 'gray' }
};

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'connected', label: 'Connected' },
    { key: 'pending', label: 'Pending' },
    { key: 'failed', label: 'Failed' },
    { key: 'requests', label: 'Reseller Requests' }
];

const errMsg = (err, fallback) => err?.response?.data?.message || fallback;
const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');
const daysLeft = (d) => (d ? Math.floor((new Date(d) - Date.now()) / 86400000) : null);

const Badge = ({ tone, children, title }) => <span className={`dm-badge dm-${tone}`} title={title}>{children}</span>;

const StateBadge = ({ state }) => {
    const m = STATE_META[state] || { label: state || 'Unknown', tone: 'gray' };
    return <Badge tone={m.tone}><span className="dm-dot" />{m.label}</Badge>;
};

const dnsVerified = (d) => ['active', 'ssl_renewal_required', 'pending_ssl', 'verifying'].includes(d.state)
    || (d.dns?.apexOk && d.dns?.txtOk !== false && (!d.includeWww || d.dns?.wwwOk));

const DnsBadge = ({ d }) => {
    if (dnsVerified(d)) return <Badge tone="green"><CheckCircle2 size={12} /> DNS verified</Badge>;
    if (!d.dns?.lastCheckedAt) return <Badge tone="gray"><Clock size={12} /> Not checked</Badge>;
    return <Badge tone="amber"><XCircle size={12} /> DNS not ready</Badge>;
};

const SslBadge = ({ d }) => {
    const left = daysLeft(d.ssl?.expiresAt);
    if (d.state === 'active') return <Badge tone="green" title={`Expires ${fmtDate(d.ssl.expiresAt)}`}><ShieldCheck size={12} /> SSL{left !== null ? ` · ${left}d left` : ''}</Badge>;
    if (d.state === 'ssl_renewal_required') return <Badge tone="amber" title={`Expires ${fmtDate(d.ssl.expiresAt)}`}><ShieldAlert size={12} /> Renew{left !== null ? ` · ${Math.max(0, left)}d` : ''}</Badge>;
    if (d.state === 'pending_ssl') return <Badge tone="blue"><Shield size={12} /> Issuing{d.ssl?.attempts ? ` · try ${d.ssl.attempts}` : ''}</Badge>;
    return <Badge tone="gray"><Shield size={12} /> No SSL</Badge>;
};

const CopyButton = ({ value }) => {
    const [done, setDone] = useState(false);
    return (
        <button type="button" className="dm-icon-btn" title="Copy" onClick={() => {
            navigator.clipboard?.writeText(value).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); });
        }}>{done ? <Check size={14} /> : <Copy size={14} />}</button>
    );
};

export const DnsRecordsTable = ({ domain }) => {
    const verified = (r) => {
        if (['verifying', 'pending_ssl', 'active', 'ssl_renewal_required'].includes(domain.state)) return true;
        if (r.type === 'TXT') return domain.dns?.txtOk;
        return r.host === 'www' ? domain.dns?.wwwOk : domain.dns?.apexOk;
    };
    return (
        <div className="dm-records">
            <div className="dm-records-head"><span>Type</span><span>Name</span><span>Value</span><span>Status</span></div>
            {domain.requiredRecords.map((r) => (
                <div className="dm-records-row" key={`${r.type}-${r.host}`}>
                    <span className="dm-mono dm-strong" data-label="Type">{r.type}</span>
                    <span className="dm-mono" data-label="Name">{r.host} <CopyButton value={r.host} /></span>
                    <span className="dm-mono dm-break" data-label="Value">{r.value} <CopyButton value={r.value} /></span>
                    <span data-label="Status">{verified(r) ? <Badge tone="green"><CheckCircle2 size={12} /> Found</Badge> : <Badge tone="amber"><Clock size={12} /> Waiting</Badge>}</span>
                </div>
            ))}
            <p className="dm-hint">Add these at your domain registrar (Hostinger, Namecheap, GoDaddy, Whogohost, …). Do not change nameservers. Remove any other A or AAAA records for these names. DNS changes can take a few minutes to a few hours.</p>
        </div>
    );
};

const ResellerPicker = ({ value, onChange }) => {
    const [q, setQ] = useState('');
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const t = setTimeout(async () => {
            setLoading(true);
            try { setList((await API.get('/api/admin/domains/resellers', { params: { q } })).data || []); } catch { setList([]); } finally { setLoading(false); }
        }, 250);
        return () => clearTimeout(t);
    }, [q]);
    if (value) {
        return (
            <div className="dm-picked">
                <div><strong>{value.name}</strong><div className="dm-muted">{value.email}{value.subdomain ? ` · ${value.subdomain}` : ''}</div></div>
                <button type="button" className="dm-icon-btn" onClick={() => onChange(null)} title="Change"><X size={16} /></button>
            </div>
        );
    }
    return (
        <div>
            <div className="dm-search"><Search size={16} /><input autoFocus placeholder="Search reseller by name, email or subdomain" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <div className="dm-picker-list">
                {loading && <div className="dm-muted dm-pad">Searching…</div>}
                {!loading && list.length === 0 && <div className="dm-muted dm-pad">No resellers found.</div>}
                {list.map((r) => (
                    <button type="button" key={r.id} className="dm-picker-item" onClick={() => onChange(r)}>
                        <div><strong>{r.name}</strong><div className="dm-muted">{r.email}{r.subdomain ? ` · ${r.subdomain}` : ''}</div></div>
                        {r.hasCustomDomain && <Badge tone="gray">Has domain</Badge>}
                    </button>
                ))}
            </div>
        </div>
    );
};

const Modal = ({ title, onClose, children }) => (
    <div className="dm-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="dm-modal" role="dialog" aria-modal="true" aria-label={title}>
            <div className="dm-modal-head"><h3>{title}</h3><button className="dm-icon-btn" onClick={onClose} title="Close"><X size={18} /></button></div>
            <div className="dm-modal-body">{children}</div>
        </div>
    </div>
);

const AddDomainModal = ({ onClose, onAdded, initial }) => {
    const [reseller, setReseller] = useState(initial?.reseller || null);
    const [domain, setDomain] = useState(initial?.domain || '');
    const [includeWww, setIncludeWww] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [created, setCreated] = useState(null);

    useEffect(() => {
        if (!created || ['active', 'failed', 'suspended'].includes(created.state)) return undefined;
        const t = setInterval(async () => {
            try { setCreated((await API.get(`/api/admin/domains/${created.id}`)).data.domain); } catch { /* keep last */ }
        }, 15000);
        return () => clearInterval(t);
    }, [created]);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setError('');
        try {
            const res = await API.post('/api/admin/domains', { resellerId: reseller.id, domain, includeWww });
            setCreated(res.data.domain);
            onAdded();
        } catch (err) { setError(errMsg(err, 'Could not add the domain.')); } finally { setBusy(false); }
    };

    if (created) {
        return (
            <Modal title={`Connect ${created.domain}`} onClose={onClose}>
                <div className="dm-row-between"><StateBadge state={created.state} /><span className="dm-muted">Checking automatically every 15 seconds</span></div>
                {created.lastError && <div className="dm-note">{created.lastError}</div>}
                <h4 className="dm-subhead">Ask the reseller to add these DNS records</h4>
                <DnsRecordsTable domain={created} />
                <div className="dm-actions-end"><button className="admin-btn primary" onClick={onClose}>Done</button></div>
            </Modal>
        );
    }

    return (
        <Modal title="Add Custom Domain" onClose={onClose}>
            <form onSubmit={submit} className="dm-form">
                <label className="dm-label">1. Reseller account</label>
                <ResellerPicker value={reseller} onChange={setReseller} />
                <label className="dm-label">2. Custom domain</label>
                <input className="dm-input" placeholder="mybusiness.com" value={domain} onChange={(e) => setDomain(e.target.value)} disabled={!reseller} />
                <label className="dm-check"><input type="checkbox" checked={includeWww} onChange={(e) => setIncludeWww(e.target.checked)} /> Also connect www.{domain || 'mybusiness.com'}</label>
                {error && <div className="dm-error"><AlertTriangle size={14} /> {error}</div>}
                <div className="dm-actions-end">
                    <button type="button" className="admin-btn secondary" onClick={onClose}>Cancel</button>
                    <button type="submit" className="admin-btn primary" disabled={!reseller || !domain.trim() || busy}>{busy ? 'Adding…' : 'Add Domain'}</button>
                </div>
            </form>
        </Modal>
    );
};

const GenerateDomainModal = ({ onClose, baseDomain }) => {
    const [reseller, setReseller] = useState(null);
    const [sub, setSub] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    useEffect(() => { setSub(reseller?.subdomain || ''); setResult(null); }, [reseller]);
    const submit = async (e) => {
        e.preventDefault(); setBusy(true); setError('');
        try { setResult((await API.post('/api/admin/domains/generate', { resellerId: reseller.id, subdomain: sub || undefined })).data); } catch (err) { setError(errMsg(err, 'Could not generate the domain.')); } finally { setBusy(false); }
    };
    return (
        <Modal title="Generate Domain" onClose={onClose}>
            <form onSubmit={submit} className="dm-form">
                <p className="dm-muted">Gives a reseller a free {baseDomain} address. It works instantly, with HTTPS from the platform's wildcard certificate, and needs no DNS changes.</p>
                <label className="dm-label">Reseller account</label>
                <ResellerPicker value={reseller} onChange={setReseller} />
                <label className="dm-label">Subdomain</label>
                <div className="dm-suffix-input"><input className="dm-input" value={sub} onChange={(e) => setSub(e.target.value.toLowerCase())} placeholder="mybusiness" disabled={!reseller} /><span>.{baseDomain}</span></div>
                {error && <div className="dm-error"><AlertTriangle size={14} /> {error}</div>}
                {result && <div className="dm-success"><CheckCircle2 size={16} /> <a href={result.url} target="_blank" rel="noreferrer">{result.url}</a> {result.created ? 'is ready.' : 'is already assigned.'}</div>}
                <div className="dm-actions-end">
                    <button type="button" className="admin-btn secondary" onClick={onClose}>Close</button>
                    <button type="submit" className="admin-btn primary" disabled={!reseller || busy}>{busy ? 'Saving…' : 'Generate'}</button>
                </div>
            </form>
        </Modal>
    );
};

const DomainRow = ({ d, onChanged, setFlash }) => {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState('');
    const run = async (key, fn, confirmText) => {
        if (confirmText && !window.confirm(confirmText)) return;
        setBusy(key);
        try { await fn(); setFlash({ type: 'success', text: `${d.domain}: done.` }); } catch (err) { setFlash({ type: 'error', text: `${d.domain}: ${errMsg(err, 'Action failed.')}` }); } finally { setBusy(''); onChanged(); }
    };
    const post = (path, body) => API.post(`/api/admin/domains/${d.id}/${path}`, body);
    const btn = (key, label, Icon, onClick, cls = 'secondary') => (
        <button className={`admin-btn ${cls} dm-btn`} disabled={!!busy} onClick={onClick}>
            {busy === key ? <RefreshCw size={14} className="animate-spin" /> : <Icon size={14} />} {label}
        </button>
    );

    return (
        <div className={`dm-row ${open ? 'open' : ''}`}>
            <button className="dm-row-main" onClick={() => setOpen(!open)}>
                {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Globe size={18} className="dm-globe" />
                <div className="dm-domain-cell">
                    <span className="dm-domain">{d.domain}</span>
                    <span className="dm-muted">{d.reseller?.name || 'Unknown reseller'}{d.includeWww ? ` · www.${d.domain}` : ''}</span>
                </div>
                <div className="dm-badges">
                    <StateBadge state={d.state} />
                    <DnsBadge d={d} />
                    <SslBadge d={d} />
                    {d.disconnectRequest?.status === 'pending' && <Badge tone="red">Disconnect requested</Badge>}
                </div>
            </button>
            {open && (
                <div className="dm-detail">
                    {d.liveUrl && <a className="dm-live" href={d.liveUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> {d.liveUrl}</a>}
                    {d.lastError && <div className="dm-note"><AlertTriangle size={14} /> {d.lastError}</div>}
                    <div className="dm-grid">
                        <div><span className="dm-k">Reseller</span><span>{d.reseller?.name} <span className="dm-muted">{d.reseller?.email}</span></span></div>
                        <div><span className="dm-k">In this state since</span><span>{fmtDate(d.stateSince)}</span></div>
                        <div><span className="dm-k">Last DNS check</span><span>{fmtDate(d.dns?.lastCheckedAt)}</span></div>
                        <div><span className="dm-k">Certificate expires</span><span>{fmtDate(d.ssl?.expiresAt)}</span></div>
                        <div><span className="dm-k">SSL attempts</span><span>{d.ssl?.attempts || 0}{d.ssl?.nextAttemptAt ? ` · next ${fmtDate(d.ssl.nextAttemptAt)}` : ''}</span></div>
                        <div><span className="dm-k">Activated</span><span>{fmtDate(d.activatedAt)}</span></div>
                    </div>
                    <h4 className="dm-subhead">DNS records</h4>
                    <DnsRecordsTable domain={d} />
                    {d.disconnectRequest?.status === 'pending' && (
                        <div className="dm-note">Reseller requested disconnection{d.disconnectRequest.reason ? `: "${d.disconnectRequest.reason}"` : ''}.
                            <div className="dm-actions">
                                {btn('dapprove', 'Approve & remove', Trash2, () => run('dapprove', () => post('disconnect/approve'), `Remove ${d.domain}? The reseller's site will stop working on this domain.`), 'danger')}
                                {btn('dreject', 'Decline', X, () => run('dreject', () => post('disconnect/reject')))}
                            </div>
                        </div>
                    )}
                    <div className="dm-actions">
                        {btn('check', 'Check now', RefreshCw, () => run('check', () => post('check')))}
                        {['failed', 'pending_dns'].includes(d.state) && btn('retry', 'Retry verification', RotateCcw, () => run('retry', () => post('retry')))}
                        {['failed', 'pending_ssl', 'active', 'ssl_renewal_required'].includes(d.state) && btn('ssl', d.state === 'active' || d.state === 'ssl_renewal_required' ? 'Renew SSL' : 'Retry SSL', ShieldCheck, () => run('ssl', () => post('retry-ssl')))}
                        {d.state === 'suspended'
                            ? btn('resume', 'Resume', PlayCircle, () => run('resume', () => post('resume')))
                            : btn('suspend', 'Suspend', PauseCircle, () => {
                                const reason = window.prompt(`Suspend ${d.domain}? Visitors will see "Website not found". Optional reason:`);
                                if (reason === null) return;
                                run('suspend', () => post('suspend', { reason }));
                            })}
                        {btn('remove', 'Remove', Trash2, () => run('remove', () => API.delete(`/api/admin/domains/${d.id}`), `Remove ${d.domain} completely? This deletes its nginx config and certificate.`), 'danger')}
                    </div>
                    {d.history?.length > 0 && (
                        <>
                            <h4 className="dm-subhead">Activity</h4>
                            <ul className="dm-history">
                                {[...d.history].reverse().map((h, i) => (
                                    <li key={i}><StateBadge state={h.state} /><span className="dm-muted">{fmtDate(h.at)}</span><span>{h.message}</span></li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const AdminDomains = () => {
    const [data, setData] = useState({ domains: [], counts: {}, resellerRequests: [] });
    const [config, setConfig] = useState(null);
    const [tab, setTab] = useState('all');
    const [q, setQ] = useState('');
    const [loading, setLoading] = useState(true);
    const [flash, setFlash] = useState(null);
    const [modal, setModal] = useState(null);
    const [sysCheck, setSysCheck] = useState(null);
    const timer = useRef(null);

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await API.get('/api/admin/domains');
            setData(res.data);
        } catch (err) {
            setFlash({ type: 'error', text: errMsg(err, 'Failed to load domains.') });
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        load();
        API.get('/api/admin/domains/config').then((r) => setConfig(r.data)).catch(() => {});
    }, [load]);

    // Keep pending domains fresh while the page is open.
    useEffect(() => {
        clearInterval(timer.current);
        if (data.domains.some((d) => ['pending_dns', 'verifying', 'pending_ssl'].includes(d.state))) {
            timer.current = setInterval(() => load(true), 30000);
        }
        return () => clearInterval(timer.current);
    }, [data.domains, load]);

    const groups = { connected: ['active', 'ssl_renewal_required'], pending: ['pending_dns', 'verifying', 'pending_ssl'], failed: ['failed', 'suspended'] };
    const visible = useMemo(() => data.domains
        .filter((d) => tab === 'all' || (groups[tab] || []).includes(d.state))
        .filter((d) => !q || d.domain.includes(q.toLowerCase()) || (d.reseller?.name || '').toLowerCase().includes(q.toLowerCase())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.domains, tab, q]);

    const runSystemCheck = async () => {
        setSysCheck({ loading: true });
        try { setSysCheck((await API.get('/api/admin/domains/system-check')).data); } catch (err) { setSysCheck({ ok: false, message: errMsg(err, 'Check failed.') }); }
    };

    const counts = data.counts || {};
    const baseDomain = config?.platformBaseDomains?.[0] || '9jasub.com';

    return (
        <div className="dm-page dm-scope">
            <div className="dm-header">
                <div>
                    <h1><Globe size={28} /> Domains</h1>
                    <p className="dm-muted">Connect reseller storefronts to their own domains. DNS points straight to this server{config?.vpsIPv4 ? ` (${config.vpsIPv4})` : ''}; HTTPS is issued and renewed automatically by Let's Encrypt.</p>
                </div>
                <div className="dm-header-actions">
                    <button className="admin-btn secondary dm-btn" onClick={runSystemCheck}><Server size={16} /> System check</button>
                    <button className="admin-btn secondary dm-btn" onClick={() => load()} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>
                    <button className="admin-btn secondary dm-btn" onClick={() => setModal({ type: 'generate' })}><Sparkles size={16} /> Generate Domain</button>
                    <button className="admin-btn primary dm-btn" onClick={() => setModal({ type: 'add' })}><Plus size={16} /> Custom Domain</button>
                </div>
            </div>

            {config && !config.vpsIPv4 && <div className="dm-error dm-banner"><AlertTriangle size={16} /> VPS_PUBLIC_IPV4 is not set on the server, so DNS cannot be verified. See DOMAINS_SETUP.md.</div>}
            {sysCheck && !sysCheck.loading && (
                <div className={sysCheck.ok ? 'dm-success dm-banner' : 'dm-error dm-banner'}>
                    {sysCheck.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {sysCheck.message}
                    <button className="dm-icon-btn" onClick={() => setSysCheck(null)}><X size={14} /></button>
                </div>
            )}
            {flash && (
                <div className={flash.type === 'success' ? 'dm-success dm-banner' : 'dm-error dm-banner'}>
                    {flash.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {flash.text}
                    <button className="dm-icon-btn" onClick={() => setFlash(null)}><X size={14} /></button>
                </div>
            )}

            <div className="dm-stats">
                <button className={`dm-stat ${tab === 'connected' ? 'on' : ''}`} onClick={() => setTab('connected')}><span>Connected</span><strong>{counts.connected || 0}</strong></button>
                <button className={`dm-stat ${tab === 'pending' ? 'on' : ''}`} onClick={() => setTab('pending')}><span>Pending</span><strong>{counts.pending || 0}</strong></button>
                <button className={`dm-stat ${tab === 'failed' ? 'on' : ''}`} onClick={() => setTab('failed')}><span>Failed / Suspended</span><strong>{counts.failed || 0}</strong></button>
                <button className={`dm-stat ${tab === 'requests' ? 'on' : ''}`} onClick={() => setTab('requests')}><span>Reseller requests</span><strong>{data.resellerRequests?.length || 0}</strong></button>
            </div>

            <div className="dm-toolbar">
                <div className="dm-tabs">
                    {TABS.map((t) => <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>{t.label}</button>)}
                </div>
                {tab !== 'requests' && <div className="dm-search dm-search-sm"><Search size={14} /><input placeholder="Filter domains" value={q} onChange={(e) => setQ(e.target.value)} /></div>}
            </div>

            {tab === 'requests' ? (
                <div className="dm-list">
                    {data.resellerRequests.length === 0 && <div className="dm-empty"><Inbox size={36} /> No domain requests from resellers.</div>}
                    {data.resellerRequests.map((r) => (
                        <div className="dm-row" key={r.id}>
                            <div className="dm-row-main dm-static">
                                <Globe size={18} className="dm-globe" />
                                <div className="dm-domain-cell"><span className="dm-domain">{r.domain}</span><span className="dm-muted">{r.reseller?.name} · {r.reseller?.email} · requested {fmtDate(r.createdAt)}</span></div>
                                <div className="dm-badges">
                                    <Badge tone="gray">{r.status}</Badge>
                                    <button className="admin-btn primary dm-btn" disabled={!r.reseller} onClick={() => setModal({ type: 'add', initial: { reseller: r.reseller, domain: r.domain } })}><Plus size={14} /> Set up</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="dm-list">
                    {loading && data.domains.length === 0 && <div className="dm-empty"><RefreshCw size={28} className="animate-spin" /> Loading domains…</div>}
                    {!loading && visible.length === 0 && (
                        <div className="dm-empty"><Globe size={36} /> {data.domains.length === 0 ? 'No custom domains yet. Click "Custom Domain" to connect one.' : 'No domains in this view.'}</div>
                    )}
                    {visible.map((d) => <DomainRow key={d.id} d={d} onChanged={() => load(true)} setFlash={setFlash} />)}
                </div>
            )}

            {modal?.type === 'add' && <AddDomainModal initial={modal.initial} onClose={() => setModal(null)} onAdded={() => load(true)} />}
            {modal?.type === 'generate' && <GenerateDomainModal baseDomain={baseDomain} onClose={() => { setModal(null); load(true); }} />}
        </div>
    );
};

export default AdminDomains;
