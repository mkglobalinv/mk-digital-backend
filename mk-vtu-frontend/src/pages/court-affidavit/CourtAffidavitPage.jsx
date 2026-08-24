import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, Check, ChevronRight, AlertTriangle, FileClock, Plus, ImageIcon,
} from 'lucide-react';
import { AFFIDAVIT_TYPES, getAffidavitType, getSectionsForType } from './affidavitTypes';

/**
 * Court Affidavit — private/unlisted draft.
 *
 * Fully independent of the Birth Attestation Letter service: own route, own
 * data file, own component, no shared config, fields, or pricing. Built
 * from user-supplied reference screenshots (idgate360.com.ng/services, used
 * for UI/UX and content reference only) plus the written spec.
 *
 * Workflow: Type -> Form -> Preview -> Confirm -> Done. No backend
 * submission, pricing, wallet, or WhatsApp integration was specified for
 * this service (unlike Birth Attestation) — this draft is a client-side-only
 * walkthrough that ends on a local "Done" confirmation screen. See the
 * implementation report for what's still undefined.
 */

const BLUE = '#2563EB';
const STEPS = ['Type', 'Form', 'Preview', 'Confirm', 'Done'];

const emptyFormData = () => ({});

const CourtAffidavitPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('new'); // 'new' | 'history'
  const [stepIndex, setStepIndex] = useState(0); // 0=Type,1=Form,2=Preview,3=Confirm,4=Done
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [formData, setFormData] = useState(emptyFormData());
  const [formError, setFormError] = useState('');
  const [reference, setReference] = useState(null);

  const selectedType = selectedTypeId ? getAffidavitType(selectedTypeId) : null;
  const sections = selectedTypeId ? getSectionsForType(selectedTypeId) : [];

  const resetFlow = () => {
    setStepIndex(0);
    setSelectedTypeId(null);
    setFormData(emptyFormData());
    setFormError('');
    setReference(null);
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

  const handleConfirm = () => {
    // No backend submission was specified for this service — this generates
    // a local-only reference for display purposes and moves straight to the
    // Done screen. See implementation report.
    setReference(`CA-DRAFT-${Date.now()}`);
    setStepIndex(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
            border: `1px dashed ${file ? BLUE : 'var(--border-color)'}`,
            background: 'var(--bg-color)', cursor: 'pointer', textAlign: 'center',
          }}>
            <ImageIcon size={22} color={file ? BLUE : 'var(--text-gray)'} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: file ? BLUE : 'var(--text-dark)' }}>
              {file ? file.name : 'Tap to upload passport photo'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-gray)' }}>{field.helpText}</span>
            <input type="file" accept={field.accept} onChange={(e) => handleFileChange(field, e)} style={{ display: 'none' }} />
          </label>
        </div>
      );
    }
    return (
      <input
        type={field.type === 'date' ? 'date' : 'text'}
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

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setStepIndex(1)} style={{
                flex: 1, padding: '15px', borderRadius: '14px', border: `1px solid ${BLUE}`,
                background: 'var(--bg-card, #fff)', color: BLUE, fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                <ArrowLeft size={16} /> Edit
              </button>
              <button onClick={handleConfirm} style={{
                flex: 2, padding: '15px', borderRadius: '14px', border: 'none', background: BLUE,
                color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                Confirm <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {tab === 'new' && stepIndex === 4 && (
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
              <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800 }}>Affidavit Confirmed</h3>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '13px' }}>{selectedType?.name}</p>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-gray)', textTransform: 'uppercase', marginBottom: '4px' }}>Draft Reference</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '16px' }}>{reference}</div>
              <p style={{ fontSize: '12px', color: 'var(--text-gray)', lineHeight: 1.5, marginBottom: '20px' }}>
                This is a local draft reference only — no request has been submitted to a server yet.
              </p>
              <button onClick={resetFlow} style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: BLUE,
                color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
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
