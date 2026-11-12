import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    KeyRound, RefreshCw, Save, Eye, EyeOff, CheckCircle2, XCircle, CircleDashed, AlertTriangle,
    PlugZap, RotateCcw, History, ShieldCheck, X, Info, Hammer
} from 'lucide-react';
import API from '../../api';
import './AdminIntegrations.css';

// System Settings -> Integrations & API Configuration. The server only ever
// returns masked values; this page sends new values once and never receives
// them back.

const STATUS = {
    connected: { label: 'Connected', tone: 'green', Icon: CheckCircle2 },
    failed: { label: 'Failed', tone: 'red', Icon: XCircle },
    not_configured: { label: 'Not Configured', tone: 'gray', Icon: CircleDashed },
    untested: { label: 'Configured · not tested', tone: 'blue', Icon: CircleDashed },
    configured: { label: 'Configured', tone: 'blue', Icon: CheckCircle2 }
};
const SOURCE = { dashboard: 'Saved in dashboard', environment: 'From server .env', unset: 'Not set' };

const errMsg = (err, fallback) => err?.response?.data?.message || fallback;
const fmt = (d) => (d ? new Date(d).toLocaleString() : '');

const StatusBadge = ({ status }) => {
    const s = STATUS[status] || STATUS.not_configured;
    return <span className={`ix-badge ix-${s.tone}`}><s.Icon size={13} /> {s.label}</span>;
};

const Toggle = ({ checked, onChange, disabled, label }) => (
    <label className={`ix-switch ${disabled ? 'disabled' : ''}`} title={label}>
        <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} aria-label={label} />
        <span className="ix-slider" />
        <span className="ix-switch-text">{checked ? 'Enabled' : 'Disabled'}</span>
    </label>
);

const Field = ({ setting, draft, onDraft, onClear }) => {
    const [reveal, setReveal] = useState(false);
    const masked = setting.type === 'secret' || setting.type === 'identifier';
    const dirty = draft !== undefined;
    const id = `ix-${setting.key}`;

    let input;
    if (setting.type === 'bool') {
        input = (
            <select id={id} className="ix-input" value={dirty ? (draft ?? '') : ''} onChange={(e) => onDraft(e.target.value === '' ? undefined : e.target.value)}>
                <option value="">{setting.isSet ? `Keep current (${setting.display})` : `Not set (default: ${setting.defaultValue ?? 'false'})`}</option>
                <option value="true">true</option>
                <option value="false">false</option>
            </select>
        );
    } else {
        input = (
            <div className="ix-input-wrap">
                <input
                    id={id}
                    className="ix-input"
                    type={masked && !reveal ? 'password' : 'text'}
                    autoComplete="new-password"
                    spellCheck={false}
                    placeholder={setting.isSet ? (masked ? 'Enter a new value to replace it' : setting.display) : (setting.placeholder || '')}
                    value={dirty && draft !== null ? draft : ''}
                    onChange={(e) => onDraft(e.target.value === '' ? undefined : e.target.value)}
                />
                {masked && (
                    <button type="button" className="ix-icon-btn" onClick={() => setReveal(!reveal)} title={reveal ? 'Hide' : 'Show'} aria-label={reveal ? 'Hide value' : 'Show value'}>
                        {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={`ix-field ${dirty ? 'dirty' : ''}`}>
            <div className="ix-field-head">
                <label htmlFor={id}>{setting.label}{setting.optional && <span className="ix-muted"> (optional)</span>}</label>
                <span className={`ix-source ix-src-${setting.source}`}>{SOURCE[setting.source]}</span>
            </div>
            <div className="ix-current">
                <span className="ix-muted">Current:</span> <code>{setting.display ?? '—'}</code>
                {setting.source === 'dashboard' && (
                    <button type="button" className="ix-link" onClick={onClear} title="Remove the dashboard value; the server .env value (if any) is used again">
                        <RotateCcw size={12} /> Use .env value
                    </button>
                )}
                {draft === null && <span className="ix-badge ix-amber">Will be removed on save</span>}
            </div>
            {input}
            {setting.applies === 'rebuild' && <div className="ix-note"><Hammer size={12} /> Takes effect after the marketing website is rebuilt (see deployment guide).</div>}
            {setting.help && <div className="ix-help">{setting.help}</div>}
            <div className="ix-key">{setting.key}</div>
        </div>
    );
};

const ProviderCard = ({ p, drafts, setDraft, onSave, onTest, onToggle, busy }) => {
    const dirtyKeys = p.settings.filter((s) => drafts[s.key] !== undefined).map((s) => s.key);
    return (
        <section className="ix-card" aria-labelledby={`ix-h-${p.id}`}>
            <header className="ix-card-head">
                <div>
                    <h3 id={`ix-h-${p.id}`}>{p.name}</h3>
                    <p className="ix-muted">{p.description}</p>
                </div>
                <div className="ix-card-actions">
                    <StatusBadge status={p.status} />
                    {p.toggle && <Toggle checked={p.enabled} disabled={busy === `toggle-${p.id}`} onChange={(v) => onToggle(p, v)} label={`Enable ${p.name}`} />}
                </div>
            </header>
            {p.lastTest && (
                <div className={`ix-test ix-test-${p.lastTest.status}`}>
                    {p.lastTest.status === 'connected' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    <span>{p.lastTest.message}</span>
                    <span className="ix-muted">· tested {fmt(p.lastTest.at)}{p.lastTest.byEmail ? ` by ${p.lastTest.byEmail}` : ''}</span>
                </div>
            )}
            <div className="ix-fields">
                {p.settings.map((s) => (
                    <Field key={s.key} setting={s} draft={drafts[s.key]} onDraft={(v) => setDraft(s.key, v)} onClear={() => setDraft(s.key, null)} />
                ))}
            </div>
            <footer className="ix-card-foot">
                {p.canTest ? (
                    <button className="ix-btn" disabled={!!busy || p.status === 'not_configured'} onClick={() => onTest(p)} title={p.status === 'not_configured' ? 'Fill in the required fields first' : 'Uses the saved settings'}>
                        {busy === `test-${p.id}` ? <RefreshCw size={15} className="animate-spin" /> : <PlugZap size={15} />} Test Connection
                    </button>
                ) : <span className="ix-muted ix-small"><Info size={13} /> No connection test for this integration.</span>}
                <button className="ix-btn primary" disabled={!dirtyKeys.length || !!busy} onClick={() => onSave(dirtyKeys)}>
                    {busy === `save-${p.id}` ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />} Save{dirtyKeys.length ? ` (${dirtyKeys.length})` : ''}
                </button>
            </footer>
        </section>
    );
};

const AdminIntegrations = () => {
    const [view, setView] = useState(null);
    const [group, setGroup] = useState('supabase');
    const [drafts, setDrafts] = useState({});
    const [busy, setBusy] = useState('');
    const [flash, setFlash] = useState(null);
    const [audit, setAudit] = useState(null);
    const [loadError, setLoadError] = useState('');

    const load = useCallback(async () => {
        try {
            const res = await API.get('/api/admin/integrations');
            setView(res.data);
            setLoadError('');
        } catch (err) {
            setLoadError(err?.response?.status === 403 ? 'Only Super Admin accounts can open Integrations & API Configuration.' : errMsg(err, 'Could not load settings.'));
        }
    }, []);
    useEffect(() => { load(); }, [load]);

    const setDraft = (key, value) => setDrafts((d) => {
        const next = { ...d };
        if (value === undefined) delete next[key]; else next[key] = value;
        return next;
    });

    const save = async (keys, busyKey) => {
        const changes = Object.fromEntries(keys.map((k) => [k, drafts[k]]));
        setBusy(busyKey); setFlash(null);
        try {
            const res = await API.put('/api/admin/integrations', { changes });
            setView(res.data.view);
            setDrafts((d) => { const n = { ...d }; keys.forEach((k) => delete n[k]); return n; });
            setFlash({ type: 'success', text: res.data.message });
            if (audit) loadAudit();
        } catch (err) {
            setFlash({ type: 'error', text: errMsg(err, 'Saving failed.') });
        } finally { setBusy(''); }
    };

    const test = async (p) => {
        setBusy(`test-${p.id}`); setFlash(null);
        try {
            const res = await API.post(`/api/admin/integrations/providers/${p.id}/test`);
            setFlash({ type: res.data.ok ? 'success' : 'error', text: `${p.name}: ${res.data.message}` });
            await load();
        } catch (err) {
            setFlash({ type: 'error', text: `${p.name}: ${errMsg(err, 'Test failed.')}` });
        } finally { setBusy(''); }
    };

    const toggle = async (p, enabled) => {
        if (!enabled && !window.confirm(`Disable ${p.name}? Purchases routed to it will stop until it is enabled again.`)) return;
        setBusy(`toggle-${p.id}`); setFlash(null);
        try {
            const res = await API.post(`/api/admin/integrations/providers/${p.id}/enabled`, { enabled });
            setView(res.data.view);
            setFlash({ type: 'success', text: res.data.message });
        } catch (err) {
            setFlash({ type: 'error', text: errMsg(err, 'Could not change the switch.') });
        } finally { setBusy(''); }
    };

    const loadAudit = async () => {
        try { setAudit((await API.get('/api/admin/integrations/audit')).data.entries); } catch { setAudit([]); }
    };

    const pending = Object.keys(drafts);
    const providers = useMemo(() => (view?.providers || []).filter((p) => p.group === group), [view, group]);
    const counts = useMemo(() => {
        const c = {};
        (view?.providers || []).forEach((p) => {
            c[p.group] = c[p.group] || { failed: 0, dirty: 0 };
            if (p.status === 'failed') c[p.group].failed++;
            if (p.settings.some((s) => drafts[s.key] !== undefined)) c[p.group].dirty++;
        });
        return c;
    }, [view, drafts]);

    if (loadError) return <div className="ix-page ix-scope"><div className="ix-flash error"><AlertTriangle size={16} /> {loadError}</div></div>;
    if (!view) return <div className="ix-page ix-scope ix-loading"><RefreshCw size={24} className="animate-spin" /> Loading settings…</div>;

    return (
        <div className="ix-page ix-scope">
            <div className="ix-header">
                <div>
                    <div className="ix-crumb">System Settings</div>
                    <h1><KeyRound size={26} /> Integrations &amp; API Configuration</h1>
                    <p className="ix-muted">Saved values are encrypted on the server and take effect immediately. Secrets are never shown again after saving.</p>
                </div>
                <div className="ix-header-actions">
                    <button className="ix-btn" onClick={() => { setDrafts({}); load(); }} disabled={!!busy}><RefreshCw size={15} /> Refresh</button>
                    <button className="ix-btn primary" onClick={() => save(pending, 'save-all')} disabled={!pending.length || !!busy}>
                        {busy === 'save-all' ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />} Save All{pending.length ? ` (${pending.length})` : ''}
                    </button>
                </div>
            </div>

            {!view.encryption.configured && (
                <div className="ix-flash error"><AlertTriangle size={16} /> SETTINGS_ENCRYPTION_KEY is not set on the server, so values cannot be saved here yet. The server .env values are in use. See the deployment guide.</div>
            )}
            {view.encryption.loadErrors?.length > 0 && (
                <div className="ix-flash error"><AlertTriangle size={16} /> Saved values for {view.encryption.loadErrors.join(', ')} could not be decrypted (encryption key changed?). The .env values are in use; re-enter them.</div>
            )}
            {flash && (
                <div className={`ix-flash ${flash.type}`} role="status">
                    {flash.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} <span>{flash.text}</span>
                    <button className="ix-icon-btn" onClick={() => setFlash(null)} aria-label="Dismiss"><X size={14} /></button>
                </div>
            )}

            <nav className="ix-tabs" aria-label="Categories">
                {view.groups.map((g) => (
                    <button key={g.id} className={group === g.id ? 'on' : ''} onClick={() => setGroup(g.id)}>
                        {g.name}
                        {counts[g.id]?.dirty ? <span className="ix-dot ix-dot-amber" title="Unsaved changes" /> : null}
                        {counts[g.id]?.failed ? <span className="ix-dot ix-dot-red" title="Connection failed" /> : null}
                    </button>
                ))}
            </nav>

            <div className="ix-cards">
                {providers.map((p) => (
                    <ProviderCard key={p.id} p={p} drafts={drafts} setDraft={setDraft} busy={busy}
                        onSave={(keys) => save(keys, `save-${p.id}`)} onTest={test} onToggle={toggle} />
                ))}
            </div>

            <section className="ix-card ix-audit">
                <header className="ix-card-head">
                    <div><h3><History size={18} /> Change history</h3><p className="ix-muted">Who changed what and when. Values are never recorded.</p></div>
                    <button className="ix-btn" onClick={loadAudit}><RefreshCw size={15} /> {audit ? 'Refresh' : 'Show'}</button>
                </header>
                {audit && (audit.length === 0 ? <p className="ix-muted">No changes yet.</p> : (
                    <div className="ix-audit-list">
                        {audit.map((e) => (
                            <div key={e._id} className="ix-audit-row">
                                <span className="ix-muted">{fmt(e.createdAt)}</span>
                                <span>{e.actorEmail || 'unknown'}</span>
                                <code>{e.action}</code>
                                <code>{e.target}</code>
                                <span className="ix-muted">{e.detail || ''}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </section>
            <p className="ix-muted ix-small ix-foot"><ShieldCheck size={13} /> MONGO_URI, JWT_SECRET, PORT and SETTINGS_ENCRYPTION_KEY stay in the server .env on purpose: the app needs them before it can read this page's settings.</p>
        </div>
    );
};

export default AdminIntegrations;
