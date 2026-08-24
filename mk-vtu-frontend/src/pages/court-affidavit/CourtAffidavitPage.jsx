import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, Check, ChevronRight, AlertTriangle, FileClock, Plus, ImageIcon,
  Loader2, MessageCircle,
} from 'lucide-react';
import API from '../../api';
import { useTheme } from '../../context/ThemeContext';
import { BUSINESS_WHATSAPP_NUMBER } from '../../config/businessWhatsapp';
import { AFFIDAVIT_TYPES, getAffidavitType, getSectionsForType } from './affidavitTypes';

/**
 * Court Affidavit — manual/assisted service, ₦3,500 flat (all 8 types).
 *
 * Entry point: IdentityServicesGrid.jsx ('court-affidavit' card). Always
 * visible on the main retail platform; on reseller sites it's gated by the
 * reseller's activatedManualServices ('court_affidavit'), toggled from
 * ResellerBranding.jsx — identical mechanism to nin_modification /
 * bvn_modification / cac_registration / birth_attestation.
 *
 * Fully independent of the Birth Attestation Letter service in fields,
 * pricing, and form content — but reuses the exact same backend pipeline
 * (POST /api/retail/identity/assisted-purchase -> wallet deduction ->
 * Transaction + ServiceRequest, status PENDING_REVIEW, already visible in
 * the generic admin "Assisted Service Requests" screen).
 *
 * Workflow: Type -> Form -> Preview -> Confirm & Pay -> Done + WhatsApp handoff.
 */

const BLUE = '#2563EB';
const STEPS = ['Type', 'Form', 'Preview', 'Confirm', 'Done'];
const SERVICE_TYPE = 'court-affidavit';
const SERVICE_AMOUNT = 3500;

const emptyFormData = () => ({});
const formatCurrency = (n) => `₦${Number(n).toLocaleString()}`;

const CourtAffidavitPage = () => {
  const navigate = useNavigate();
  const { isLightMode } = useTheme();
  // Explicit theme-resolved colors for the two native/custom widgets that
  // don't reliably pick up var(--bg-color) on some mobile browsers: the
  // <input type="date"> internal widget chrome, and the passport-photo
  // upload dropzone. colorScheme below is the actual fix for the date
  // picker; these hex values are a belt-and-suspenders fallback.
  const THEME_BG = isLightMode ? '#F8FAFC' : '#121212';
  const THEME_TEXT = isLightMode ? '#0F172A' : '#FFFFFF';
  const THEME_BORDER = isLightMode ? '#E2E8F0' : '#262626';
  const [tab, setTab] = useState('new'); // 'new' | 'history'
  const [stepIndex, setStepIndex] = useState(0); // 0=Type,1=Form,2=Preview,3=Confirm,4=Done
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [formData, setFormData] = useState(emptyFormData());
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);

  const selectedType = selectedTypeId ? getAffidavitType(selectedTypeId) : null;
  const sections = selectedTypeId ? getSectionsForType(selectedTypeId) : [];

  const resetFlow = () => {
    setStepIndex(0);
    setSelectedTypeId(null);
    setFormData(emptyFormData());
    setFormError('');
    setSubmitError(null);
    setResult(null);
  };

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setFormError(`${field.label}: only JPG/PNG files are accepted.`);
      e.target.value = '';
      return;
    }
    if (file.size > field.maxSizeMB * 1024 * 1024) {
      setFormError(`${field.label}: file exceeds the ${field.maxSizeMB}MB limit.`);
      e.target.value = '';
      return;
    }
    setFormError('');
    setFormData((prev) => ({ ...prev, [field.name]: file }));
  };

  const allFields = sections.flatMap((s) => (s.fields || s.groups?.flatMap((g) => g.fields) || []));

  const validateForm = () => {
    const missing = allFields.filter((f) => f.required && !formData[f.name]);
    if (missing.length > 0) {
      setFormError(`Please fill in all required fields (${missing.length} missing).`);
      return false;
    }
    setFormError('');
    return true;
  };

  const goToForm = () => {
    if (!selectedTypeId) return;
    setStepIndex(1);
  };

  const goToPreview = () => {
    if (!validateForm()) return;
    setStepIndex(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildWhatsappHref = (data) => {
    if (!data) return '#';
    const msg =
      `*COURT AFFIDAVIT REQUEST*\n\n` +
      `Affidavit Type: ${selectedType?.name}\n` +
      `Service: ${data.service}\n` +
      `Request ID: ${data.reference}\n` +
      `Customer: ${formData.firstName || ''} ${formData.surname || ''}\n` +
      `Phone Number: ${formData.phoneNumber || ''}\n` +
      `Amount Paid: ${formatCurrency(data.amount)}\n\n` +
      `Please process this request.`;
    return `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const reference = `CA-${Date.now()}`;
      const payload = new FormData();
      payload.append('reference', reference);
      payload.append('serviceType', SERVICE_TYPE);
      payload.append('whatsappNumber', formData.phoneNumber);
      payload.append('affidavitType', selectedType.name);
      allFields.forEach((f) => {
        if (f.type === 'file') {
          // Shared endpoint expects files under the 'documents' field name
          // (see routes/retail/identityRoutes.js: uploadSecureDocument.array('documents', 5)).
          if (formData[f.name]) payload.append('documents', formData[f.name]);
        } else {
          payload.append(f.name, formData[f.name] || '');
        }
      });

      const res = await API.post('/api/retail/identity/assisted-purchase', payload);
      setResult(res.data);
      setStepIndex(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Submit straight to WhatsApp on success — the visible button on the
      // Done screen stays as a manual fallback in case the browser blocks
      // this automatic popup (common when it's not in the same synchronous
      // gesture as the click, which an async submit isn't).
      window.open(buildWhatsappHref(res.data.data), '_blank');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappHref = buildWhatsappHref(result?.data);

  const renderFieldInput = (field) => {
    const commonStyle = {
      width: '100%', padding: '12px 14px', background: 'var(--bg-color)',
      border: '1px solid var(--border-color)', borderRadius: '10px',
      fontSize: '14px', color: 'var(--text-dark)', outline: 'none',
      boxSizing: 'border-box', fontFamily: 'inherit',
    };
    if (field.type === 'select') {
      return (
        <select value={formData[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} style={commonStyle}>
          <option value="" disabled>{field.placeholder}</option>
          {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }
    if (field.type === 'textarea') {
      return (
        <textarea
          value={formData[field.name] || ''}
          placeholder={field.placeholder}
          onChange={(e) => handleFieldChange(field.name, e.target.value)}
          style={{ ...commonStyle, resize: 'vertical', minHeight: '110px' }}
        />
      );
    }
    if (field.type === 'file') {
      const file = formData[field.name];
      return (
        <div>
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '6px', padding: '28px 16px', borderRadius: '12px',
            border: `1px dashed ${file ? BLUE : THEME_BORDER}`,
            background: THEME_BG, cursor: 'pointer', textAlign: 'center',
          }}>
            <ImageIcon size={22} color={file ? BLUE : 'var(--text-gray)'} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: file ? BLUE : THEME_TEXT }}>
              {file ? file.name : 'Tap to upload passport photo'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-gray)' }}>{field.helpText}</span>
            <input type="file" accept={field.accept} onChange={(e) => handleFileChange(field, e)} style={{ display: 'none' }} />
          </label>
        </div>
      );
    }
    if (field.type === 'date') {
      return (
        <input
          type="date"
          value={formData[field.name] || ''}
          onChange={(e) => handleFieldChange(field.name, e.target.value)}
          style={{ ...commonStyle, background: THEME_BG, color: THEME_TEXT, border: `1px solid ${THEME_BORDER}`, colorScheme: isLightMode ? 'light' : 'dark' }}
        />
      );
    }
    return (
      <input
        type="text"
        value={formData[field.name] || ''}
        placeholder={field.placeholder}
        onChange={(e) => handleFieldChange(field.name, e.target.value)}
        style={commonStyle}
      />
    );
  };

  const renderFieldsGrid = (fields) => {
    const rows = [];
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      const next = fields[i + 1];
      if (f.col === 1 && next && next.col === 2) {
        rows.push(
          <div key={f.name} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {[f, next].map((field) => (
              <div key={field.name}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '6px' }}>
                  {field.label} {field.required && <span style={{ color: '#EF4444' }}>*</span>}
                </label>
                {renderFieldInput(field)}
              </div>
            ))}
          </div>
        );
        i++;
      } else {
        rows.push(
          <div key={f.name} style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '6px' }}>
              {f.label} {f.required && <span style={{ color: '#EF4444' }}>*</span>}
            </label>
            {renderFieldInput(f)}
          </div>
        );
      }
    }
    return rows;
  };

  const SectionCard = ({ section }) => (
    <div style={{
      background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color)',
      borderRadius: '16px', padding: '20px', marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{
          width: '22px', height: '22px', borderRadius: '50%', background: BLUE, color: '#fff',
          fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{section.letter}</span>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--text-dark)' }}>{section.title}</h3>
      </div>
      {section.groups
        ? section.groups.map((g) => (
            <div key={g.heading} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-gray)', letterSpacing: '0.5px', marginBottom: '10px' }}>{g.heading}</div>
              {renderFieldsGrid(g.fields)}
            </div>
          ))
        : renderFieldsGrid(section.fields)}
    </div>
  );

  const Header = ({ title = 'Court Affidavit' }) => (
    <div style={{
      background: 'var(--bg-card, #ffffff)', padding: '20px', borderBottom: '1px solid var(--border-color)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div onClick={() => (stepIndex === 0 ? navigate(-1) : setStepIndex((s) => Math.max(0, s - 1)))}
          style={{ background: 'rgba(37,99,235,0.1)', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={18} color={BLUE} />
        </div>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-dark)' }}>{title}</h2>
      </div>
      <Bell size={18} color="var(--text-gray)" />
    </div>
  );

  const Tabs = () => (
    <div style={{ display: 'flex', gap: '10px', padding: '16px 20px 0' }}>
      <button onClick={() => setTab('new')} style={{
        flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
        border: `1px solid ${tab === 'new' ? BLUE : 'var(--border-color)'}`,
        background: tab === 'new' ? 'rgba(37,99,235,0.06)' : 'var(--bg-card, #fff)',
        color: tab === 'new' ? BLUE : 'var(--text-dark)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      }}>
        <Plus size={14} /> New Request
      </button>
      <button onClick={() => setTab('history')} style={{
        flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
        border: `1px solid ${tab === 'history' ? BLUE : 'var(--border-color)'}`,
        background: tab === 'history' ? 'rgba(37,99,235,0.06)' : 'var(--bg-card, #fff)',
        color: tab === 'history' ? BLUE : 'var(--text-dark)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      }}>
        <FileClock size={14} /> History
      </button>
    </div>
  );

  const ProgressIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '18px 24px 4px' }}>
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '40px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 800,
              background: i < stepIndex ? BLUE : i === stepIndex ? BLUE : 'var(--bg-card, #fff)',
              color: i <= stepIndex ? '#fff' : 'var(--text-gray)',
              border: i <= stepIndex ? 'none' : '1px solid var(--border-color)',
            }}>
              {i < stepIndex ? <Check size={13} /> : i + 1}
            </div>
            <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: i === stepIndex ? 700 : 500, color: i === stepIndex ? BLUE : 'var(--text-gray)' }}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: '1px', background: i < stepIndex ? BLUE : 'var(--border-color)', marginTop: '13px' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const TypeBadge = () => selectedType && (
    <div style={{ margin: '16px 20px 0' }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
        borderRadius: '999px', background: 'rgba(37,99,235,0.08)', color: BLUE,
        fontSize: '12px', fontWeight: 700,
      }}>
        <Check size={12} /> {selectedType.name}
      </span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', fontFamily: 'Inter, sans-serif', paddingBottom: '40px' }}>
      <Header />
      <Tabs />
      <ProgressIndicator />

      {/* ── Step 0: Type selection ── */}
      {tab === 'new' && stepIndex === 0 && (
        <div style={{ padding: '4px 20px 0' }}>
          <h3 style={{ margin: '4px 0 2px', fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)' }}>Select Affidavit Type</h3>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-gray)' }}>Choose the type of affidavit you need.</p>

          {AFFIDAVIT_TYPES.map((t) => {
            const Icon = t.icon;
            const selected = selectedTypeId === t.id;
            return (
              <div key={t.id} onClick={() => setSelectedTypeId(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '16px',
                background: 'var(--bg-card, #ffffff)', border: `1px solid ${selected ? BLUE : 'var(--border-color)'}`,
                borderRadius: '14px', marginBottom: '12px', cursor: 'pointer',
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: t.tint.bg, color: t.tint.color }}>
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)' }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>{t.description}</div>
                </div>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${selected ? BLUE : 'var(--border-color)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {selected && <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: BLUE }} />}
                </div>
              </div>
            );
          })}

          <button onClick={goToForm} disabled={!selectedTypeId} style={{
            width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
            background: selectedTypeId ? BLUE : 'rgba(37,99,235,0.35)',
            color: '#fff', fontWeight: 700, fontSize: '15px',
            cursor: selectedTypeId ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px',
          }}>
            Continue <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ── History tab (no backend yet — empty state only) ── */}
      {tab === 'history' && (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <FileClock size={36} color="var(--text-gray)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-gray)', fontSize: '14px' }}>No affidavit requests yet.</p>
        </div>
      )}

      {/* ── Step 1: Form ── */}
      {tab === 'new' && stepIndex === 1 && selectedType && (
        <div>
          <TypeBadge />
          <div style={{ padding: '16px 20px 0' }}>
            {sections.map((section) => <SectionCard key={section.letter + section.title} section={section} />)}

            {formError && (
              <div style={{
                background: '#fef2f2', color: '#ef4444', padding: '14px 16px', borderRadius: '12px',
                marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px',
                border: '1px solid #fecaca', fontSize: '13px', fontWeight: 500,
              }}>
                <AlertTriangle size={18} /> {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setStepIndex(0)} style={{
                flex: 1, padding: '15px', borderRadius: '14px', border: `1px solid ${BLUE}`,
                background: 'var(--bg-card, #fff)', color: BLUE, fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                <ArrowLeft size={16} /> Back
              </button>
              <button onClick={goToPreview} style={{
                flex: 2, padding: '15px', borderRadius: '14px', border: 'none', background: BLUE,
                color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                Preview Affidavit <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Preview ── */}
      {tab === 'new' && stepIndex === 2 && selectedType && (
        <div>
          <TypeBadge />
          <div style={{ padding: '16px 20px 0' }}>
            {sections.map((section) => {
              const fields = section.fields || section.groups?.flatMap((g) => g.fields) || [];
              return (
                <div key={section.letter + section.title} style={{
                  background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color)',
                  borderRadius: '16px', padding: '20px', marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <span style={{
                      width: '22px', height: '22px', borderRadius: '50%', background: BLUE, color: '#fff',
                      fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>{section.letter}</span>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--text-dark)' }}>{section.title}</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '4px 16px' }}>
                    {fields.filter((f) => f.type !== 'file').map((f) => (
                      <div key={f.name} style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-gray)', textTransform: 'uppercase' }}>{f.label}</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{formData[f.name] || '—'}</div>
                      </div>
                    ))}
                    {fields.some((f) => f.type === 'file') && (
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-gray)', textTransform: 'uppercase' }}>Passport Photograph</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{formData.passportPhotograph?.name || 'Not provided'}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color)',
              borderRadius: '16px', padding: '20px', marginBottom: '20px',
            }}>
              <span style={{ color: 'var(--text-gray)', fontSize: '14px' }}>Service Charge</span>
              <span style={{ fontWeight: 800, fontSize: '22px', color: 'var(--text-dark)' }}>{formatCurrency(SERVICE_AMOUNT)}</span>
            </div>

            {submitError && (
              <div style={{
                background: '#fef2f2', color: '#ef4444', padding: '14px 16px', borderRadius: '12px',
                marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px',
                border: '1px solid #fecaca', fontSize: '13px', fontWeight: 500,
              }}>
                <AlertTriangle size={18} /> {submitError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setStepIndex(1)} disabled={submitting} style={{
                flex: 1, padding: '15px', borderRadius: '14px', border: `1px solid ${BLUE}`,
                background: 'var(--bg-card, #fff)', color: BLUE, fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                <ArrowLeft size={16} /> Edit
              </button>
              <button onClick={handleConfirm} disabled={submitting} style={{
                flex: 2, padding: '15px', borderRadius: '14px', border: 'none', background: BLUE,
                color: '#fff', fontWeight: 700, fontSize: '14px', cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: submitting ? 0.7 : 1,
              }}>
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : <>Confirm & Pay {formatCurrency(SERVICE_AMOUNT)} <ChevronRight size={16} /></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {tab === 'new' && stepIndex === 4 && result?.data && (
        <div style={{ maxWidth: '480px', margin: '24px auto 0', padding: '0 20px' }}>
          <div style={{
            background: 'var(--bg-card, #ffffff)', borderRadius: '20px', overflow: 'hidden',
            border: '1px solid var(--border-color)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)',
          }}>
            <div style={{ background: BLUE, padding: '28px 24px', textAlign: 'center', color: '#fff' }}>
              <div style={{
                background: 'rgba(255,255,255,0.2)', width: '64px', height: '64px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
              }}>
                <Check size={30} color="#fff" />
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800 }}>Request Submitted</h3>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '13px' }}>{selectedType?.name}</p>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{
                background: 'var(--bg-color)', borderRadius: '16px', border: '1px solid var(--border-color)',
                padding: '20px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px',
              }}>
                <div><div style={{ fontSize: '11px', color: 'var(--text-gray)', textTransform: 'uppercase' }}>Request ID</div><div style={{ fontWeight: 700 }}>{result.data.reference}</div></div>
                <div><div style={{ fontSize: '11px', color: 'var(--text-gray)', textTransform: 'uppercase' }}>Status</div><div style={{ fontWeight: 700 }}>{result.data.status}</div></div>
                <div><div style={{ fontSize: '11px', color: 'var(--text-gray)', textTransform: 'uppercase' }}>Amount Paid</div><div style={{ fontWeight: 700 }}>{formatCurrency(result.data.amount)}</div></div>
                <div><div style={{ fontSize: '11px', color: 'var(--text-gray)', textTransform: 'uppercase' }}>Est. Processing</div><div style={{ fontWeight: 700 }}>{result.data.expectedProcessingTime}</div></div>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-gray)', lineHeight: 1.5, marginBottom: '20px' }}>
                This is a manual processing service — our team will contact you on WhatsApp to continue.
                Tap below to message us directly with your request details pre-filled.
              </p>

              <a href={whatsappHref} target="_blank" rel="noreferrer" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                width: '100%', padding: '15px', borderRadius: '14px', background: '#25D366',
                color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none',
                marginBottom: '12px', boxSizing: 'border-box',
              }}>
                <MessageCircle size={18} /> Continue on WhatsApp
              </a>

              <button onClick={resetFlow} style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: 'var(--border-color)',
                color: 'var(--text-dark)', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
              }}>
                Start New Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtAffidavitPage;
