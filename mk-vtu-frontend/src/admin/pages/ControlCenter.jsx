import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Activity, DollarSign, TrendingUp, Wallet, UserPlus, RefreshCw,
  Megaphone, Image as ImageIcon, Edit2, Trash2, Eye, MousePointerClick, Wrench, X
} from 'lucide-react';
import API from '../../api';
import { useToast } from '../../context/ToastContext';
import './ControlCenter.css';

// One-screen admin home: platform insights plus quick management of the
// user-facing announcement bar and home-page banner ads. Reuses the existing
// /api/admin/stats and /api/marketing/admin/* endpoints, so anything posted
// here shows up in the Marketing Center too (and vice versa).

const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });

const AUDIENCES = ['All Users', 'Retail Users', 'Resellers', 'Reseller Customers'];
const AD_ACTIONS = ['Open Data Page', 'Open Airtime Page', 'Open Cable TV Page', 'Open Electricity Page', 'Open WhatsApp', 'Open External Link', 'None'];

const MAINTENANCE_TEMPLATE = {
  title: 'Scheduled Maintenance',
  content: 'We are currently under maintenance to improve our services. Some services may be slow or unavailable. Your wallet balance is safe and any failed transaction is refunded automatically. Thank you for your patience.',
  priority: 'Warning'
};

const emptyAnnouncement = { title: '', content: '', priority: 'Info', status: 'Active', targetAudience: 'All Users', endDate: '' };
const emptyAd = {
  campaignType: 'Advertisement', title: '', subtitle: '', badgeText: '', buttonText: 'View',
  actionType: 'Open Data Page', actionUrl: '', bgColor: '#ffffff', displayMode: 'Dashboard Grid Only',
  targetAudience: 'All Users', status: 'Active', endDate: ''
};

const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 16) : '');
const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;

const ControlCenter = () => {
  const { showToast } = useToast();
  const [timeframe, setTimeframe] = useState('24H');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [announcements, setAnnouncements] = useState([]);
  const [annForm, setAnnForm] = useState(emptyAnnouncement);
  const [annEditingId, setAnnEditingId] = useState(null);

  const [ads, setAds] = useState([]);
  const [adForm, setAdForm] = useState(emptyAd);
  const [adEditingId, setAdEditingId] = useState(null);
  const [showAdForm, setShowAdForm] = useState(false);

  const [saving, setSaving] = useState(false);

  const fetchStats = (range) => {
    setStatsLoading(true);
    API.get(`/api/admin/stats?timeframe=${range}`, authHeaders())
      .then(res => setStats(res.data))
      .catch(() => showToast('Failed to load platform insights', 'error'))
      .finally(() => setStatsLoading(false));
  };

  const fetchAnnouncements = () => {
    API.get('/api/marketing/admin/announcements', authHeaders())
      .then(res => setAnnouncements(res.data || []))
      .catch(() => showToast('Failed to load announcements', 'error'));
  };

  const fetchAds = () => {
    API.get('/api/marketing/admin/campaigns', authHeaders())
      .then(res => setAds((res.data || []).filter(c => c.campaignType !== 'Announcement' && c.campaignType !== 'Blog')))
      .catch(() => showToast('Failed to load banner ads', 'error'));
  };

  useEffect(() => { fetchStats(timeframe); }, [timeframe]);
  useEffect(() => { fetchAnnouncements(); fetchAds(); }, []);

  // Announcements
  const resetAnnForm = () => { setAnnForm(emptyAnnouncement); setAnnEditingId(null); };

  const editAnnouncement = (a) => {
    setAnnEditingId(a._id);
    setAnnForm({
      title: a.title || '', content: a.content || '', priority: a.priority || 'Info',
      status: a.status || 'Active', targetAudience: a.targetAudience || 'All Users', endDate: toInputDate(a.endDate)
    });
  };

  const saveAnnouncement = async (e) => {
    e.preventDefault();
    if (!annForm.title.trim() || !annForm.content.trim()) return showToast('Title and message are required', 'error');
    setSaving(true);
    try {
      const payload = { ...annForm, endDate: annForm.endDate || null };
      if (annEditingId) {
        await API.put(`/api/marketing/admin/announcements/${annEditingId}`, payload, authHeaders());
        showToast('Announcement updated', 'success');
      } else {
        await API.post('/api/marketing/admin/announcements', payload, authHeaders());
        showToast('Announcement posted', 'success');
      }
      resetAnnForm();
      fetchAnnouncements();
    } catch (err) {
      showToast(`Failed to save announcement: ${err.response?.data?.details || err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleAnnouncement = async (a) => {
    try {
      await API.put(`/api/marketing/admin/announcements/${a._id}`, { status: a.status === 'Active' ? 'Inactive' : 'Active' }, authHeaders());
      fetchAnnouncements();
    } catch {
      showToast('Failed to update announcement', 'error');
    }
  };

  const deleteAnnouncement = async (a) => {
    if (!window.confirm(`Delete announcement "${a.title}"?`)) return;
    try {
      await API.delete(`/api/marketing/admin/announcements/${a._id}`, authHeaders());
      if (annEditingId === a._id) resetAnnForm();
      fetchAnnouncements();
    } catch {
      showToast('Failed to delete announcement', 'error');
    }
  };

  // Banner ads
  const resetAdForm = () => { setAdForm(emptyAd); setAdEditingId(null); setShowAdForm(false); };

  const editAd = (ad) => {
    setAdEditingId(ad._id);
    setAdForm({
      campaignType: ad.campaignType || 'Advertisement', title: ad.title || '', subtitle: ad.subtitle || '',
      badgeText: ad.badgeText || '', buttonText: ad.buttonText || 'View', actionType: ad.actionType || 'None',
      actionUrl: ad.actionUrl || '', bgColor: ad.bgColor || '#ffffff', displayMode: ad.displayMode || 'Dashboard Grid Only',
      targetAudience: ad.targetAudience || 'All Users', status: ad.status || 'Active', endDate: toInputDate(ad.endDate)
    });
    setShowAdForm(true);
  };

  const saveAd = async (e) => {
    e.preventDefault();
    if (!adForm.title.trim()) return showToast('Banner title is required', 'error');
    if (adForm.actionType === 'Open External Link' && !adForm.actionUrl.trim()) return showToast('Enter the link the button should open', 'error');
    setSaving(true);
    try {
      const payload = { ...adForm, endDate: adForm.endDate || null };
      if (adEditingId) {
        await API.put(`/api/marketing/admin/campaigns/${adEditingId}`, payload, authHeaders());
        showToast('Banner updated', 'success');
      } else {
        await API.post('/api/marketing/admin/campaigns', payload, authHeaders());
        showToast('Banner added', 'success');
      }
      resetAdForm();
      fetchAds();
    } catch (err) {
      showToast(`Failed to save banner: ${err.response?.data?.details || err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleAd = async (ad) => {
    try {
      await API.put(`/api/marketing/admin/campaigns/${ad._id}`, { status: ad.status === 'Active' ? 'Inactive' : 'Active' }, authHeaders());
      fetchAds();
    } catch {
      showToast('Failed to update banner', 'error');
    }
  };

  const deleteAd = async (ad) => {
    if (!window.confirm(`Delete banner "${ad.title}"?`)) return;
    try {
      await API.delete(`/api/marketing/admin/campaigns/${ad._id}`, authHeaders());
      if (adEditingId === ad._id) resetAdForm();
      fetchAds();
    } catch {
      showToast('Failed to delete banner', 'error');
    }
  };

  const business = stats?.business || {};
  const kpis = [
    { label: 'Revenue', value: naira(business.totalRevenue), icon: <DollarSign size={18} />, tone: 'green' },
    { label: 'Transactions', value: Number(business.totalTransactions || 0).toLocaleString(), icon: <Activity size={18} />, tone: 'blue' },
    { label: 'Wallet Funding', value: naira(business.walletFundingVolume), icon: <Wallet size={18} />, tone: 'purple' },
    { label: 'New Sign-ups', value: Number(business.newRegistrations || 0).toLocaleString(), icon: <UserPlus size={18} />, tone: 'amber' },
    { label: 'Online Now', value: Number(business.totalOnlineUsers || 0).toLocaleString(), icon: <TrendingUp size={18} />, tone: 'blue' },
    { label: 'Total Users', value: Number(stats?.totalUsers || 0).toLocaleString(), icon: <Users size={18} />, tone: 'green' }
  ];

  const activeAnnouncements = announcements.filter(a => a.status === 'Active').length;
  const activeAds = ads.filter(a => a.status === 'Active').length;

  return (
    <div className="cc-page">
      <div className="cc-header">
        <div>
          <h2>Control Center</h2>
          <p>Platform insights, announcements and banner ads in one place.</p>
        </div>
        <div className="cc-header-actions">
          <div className="cc-pills">
            {['24H', '7D', '30D', '12M'].map(r => (
              <button key={r} className={timeframe === r ? 'active' : ''} onClick={() => setTimeframe(r)}>{r}</button>
            ))}
          </div>
          <button className="cc-icon-btn" onClick={() => fetchStats(timeframe)} title="Refresh insights">
            <RefreshCw size={16} className={statsLoading ? 'cc-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="cc-kpis">
        {kpis.map(k => (
          <div key={k.label} className="cc-kpi">
            <div className={`cc-kpi-icon cc-tone-${k.tone}`}>{k.icon}</div>
            <div>
              <span className="cc-kpi-label">{k.label}</span>
              <strong className="cc-kpi-value">{statsLoading && !stats ? '…' : k.value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="cc-grid">
        {/* Announcements */}
        <section className="cc-card">
          <div className="cc-card-head">
            <h3><Megaphone size={18} /> Announcements <span className="cc-count">{activeAnnouncements} live</span></h3>
            <button className="cc-link-btn" onClick={() => { setAnnEditingId(null); setAnnForm({ ...emptyAnnouncement, ...MAINTENANCE_TEMPLATE }); }}>
              <Wrench size={14} /> Maintenance notice
            </button>
          </div>
          <p className="cc-hint">Shown as a bar at the top of users' home page.</p>

          <form className="cc-form" onSubmit={saveAnnouncement}>
            <input placeholder="Title" value={annForm.title} onChange={e => setAnnForm({ ...annForm, title: e.target.value })} />
            <textarea rows={3} placeholder="Message" value={annForm.content} onChange={e => setAnnForm({ ...annForm, content: e.target.value })} />
            <div className="cc-row">
              <label>Type
                <select value={annForm.priority} onChange={e => setAnnForm({ ...annForm, priority: e.target.value })}>
                  <option>Info</option><option>Warning</option><option>Critical</option>
                </select>
              </label>
              <label>Show to
                <select value={annForm.targetAudience} onChange={e => setAnnForm({ ...annForm, targetAudience: e.target.value })}>
                  {AUDIENCES.map(a => <option key={a}>{a}</option>)}
                </select>
              </label>
              <label>Hide after (optional)
                <input type="datetime-local" value={annForm.endDate} onChange={e => setAnnForm({ ...annForm, endDate: e.target.value })} />
              </label>
            </div>
            <div className="cc-form-actions">
              {annEditingId && <button type="button" className="cc-btn-ghost" onClick={resetAnnForm}>Cancel</button>}
              <button type="submit" className="cc-btn" disabled={saving}>{annEditingId ? 'Save changes' : 'Post announcement'}</button>
            </div>
          </form>

          <ul className="cc-list">
            {announcements.length === 0 && <li className="cc-empty">No announcements yet.</li>}
            {announcements.map(a => (
              <li key={a._id} className="cc-item">
                <div className="cc-item-main">
                  <div className="cc-item-title">
                    <span className={`cc-badge cc-prio-${(a.priority || 'Info').toLowerCase()}`}>{a.priority || 'Info'}</span>
                    {a.title}
                  </div>
                  <div className="cc-item-sub">{a.content}</div>
                  <div className="cc-item-meta">
                    {a.targetAudience || 'All Users'} · <Eye size={12} /> {a.views || 0}
                    {a.endDate && <> · ends {new Date(a.endDate).toLocaleString()}</>}
                  </div>
                </div>
                <div className="cc-item-actions">
                  <button className={`cc-switch ${a.status === 'Active' ? 'on' : ''}`} onClick={() => toggleAnnouncement(a)} title={a.status === 'Active' ? 'Turn off' : 'Turn on'}><span /></button>
                  <button className="cc-icon-btn" onClick={() => editAnnouncement(a)} title="Edit"><Edit2 size={14} /></button>
                  <button className="cc-icon-btn danger" onClick={() => deleteAnnouncement(a)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Banner ads */}
        <section className="cc-card">
          <div className="cc-card-head">
            <h3><ImageIcon size={18} /> Banner Ads <span className="cc-count">{activeAds} live</span></h3>
            {!showAdForm && <button className="cc-btn" onClick={() => { setAdForm(emptyAd); setAdEditingId(null); setShowAdForm(true); }}>+ Add banner</button>}
          </div>
          <p className="cc-hint">Promo cards on users' home page. For icons, gradients and scheduling use the <Link to="/admin/marketing/campaigns">full campaign editor</Link>.</p>

          {showAdForm && (
            <form className="cc-form" onSubmit={saveAd}>
              <div className="cc-form-title">
                <strong>{adEditingId ? 'Edit banner' : 'New banner'}</strong>
                <button type="button" className="cc-icon-btn" onClick={resetAdForm}><X size={14} /></button>
              </div>
              <input placeholder="Title (e.g. 1GB for ₦250)" value={adForm.title} onChange={e => setAdForm({ ...adForm, title: e.target.value })} />
              <input placeholder="Subtitle (optional)" value={adForm.subtitle} onChange={e => setAdForm({ ...adForm, subtitle: e.target.value })} />
              <div className="cc-row">
                <label>Badge
                  <input placeholder="e.g. HOT" value={adForm.badgeText} onChange={e => setAdForm({ ...adForm, badgeText: e.target.value })} />
                </label>
                <label>Button text
                  <input value={adForm.buttonText} onChange={e => setAdForm({ ...adForm, buttonText: e.target.value })} />
                </label>
                <label>Background
                  <input type="color" value={adForm.bgColor} onChange={e => setAdForm({ ...adForm, bgColor: e.target.value })} />
                </label>
              </div>
              <div className="cc-row">
                <label>Button opens
                  <select value={adForm.actionType} onChange={e => setAdForm({ ...adForm, actionType: e.target.value })}>
                    {!AD_ACTIONS.includes(adForm.actionType) && <option>{adForm.actionType}</option>}
                    {AD_ACTIONS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </label>
                {(adForm.actionType === 'Open External Link' || adForm.actionType === 'Open WhatsApp') && (
                  <label>Link
                    <input placeholder="https://..." value={adForm.actionUrl} onChange={e => setAdForm({ ...adForm, actionUrl: e.target.value })} />
                  </label>
                )}
              </div>
              <div className="cc-row">
                <label>Where
                  <select value={adForm.displayMode} onChange={e => setAdForm({ ...adForm, displayMode: e.target.value })}>
                    <option>Dashboard Grid Only</option><option>Popup Only</option><option>Both</option>
                  </select>
                </label>
                <label>Show to
                  <select value={adForm.targetAudience} onChange={e => setAdForm({ ...adForm, targetAudience: e.target.value })}>
                    {AUDIENCES.map(a => <option key={a}>{a}</option>)}
                  </select>
                </label>
                <label>Hide after (optional)
                  <input type="datetime-local" value={adForm.endDate} onChange={e => setAdForm({ ...adForm, endDate: e.target.value })} />
                </label>
              </div>
              <div className="cc-form-actions">
                <button type="button" className="cc-btn-ghost" onClick={resetAdForm}>Cancel</button>
                <button type="submit" className="cc-btn" disabled={saving}>{adEditingId ? 'Save changes' : 'Add banner'}</button>
              </div>
            </form>
          )}

          <ul className="cc-list">
            {ads.length === 0 && <li className="cc-empty">No banner ads yet.</li>}
            {ads.map(ad => {
              const ctr = ad.views ? ((ad.clicks || 0) / ad.views * 100).toFixed(1) : '0.0';
              return (
                <li key={ad._id} className="cc-item">
                  <div className="cc-swatch" style={{ background: ad.gradientColor || ad.bgColor || '#ffffff' }} />
                  <div className="cc-item-main">
                    <div className="cc-item-title">
                      {ad.badgeText && <span className="cc-badge cc-prio-info">{ad.badgeText}</span>}
                      {ad.title}
                    </div>
                    {ad.subtitle && <div className="cc-item-sub">{ad.subtitle}</div>}
                    <div className="cc-item-meta">
                      {ad.campaignType} · {ad.targetAudience || 'All Users'} · <Eye size={12} /> {ad.views || 0} · <MousePointerClick size={12} /> {ad.clicks || 0} ({ctr}%)
                    </div>
                  </div>
                  <div className="cc-item-actions">
                    <button className={`cc-switch ${ad.status === 'Active' ? 'on' : ''}`} onClick={() => toggleAd(ad)} title={ad.status === 'Active' ? 'Turn off' : 'Turn on'}><span /></button>
                    <button className="cc-icon-btn" onClick={() => editAd(ad)} title="Edit"><Edit2 size={14} /></button>
                    <button className="cc-icon-btn danger" onClick={() => deleteAd(ad)} title="Delete"><Trash2 size={14} /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default ControlCenter;
