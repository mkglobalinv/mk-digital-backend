import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, AlertTriangle, Loader2, MessageCircle, Pencil
} from 'lucide-react';
import API from '../../api';
import { BUSINESS_WHATSAPP_NUMBER } from '../../config/businessWhatsapp';

/**
 * BirthAttestationPurchase — "Birth Attestation Letter" manual service.
 *
 * Entry point: IdentityServicesGrid.jsx ('birth-attestation-letter' card).
 * Always visible on the main retail platform; on reseller sites it's gated
 * by the reseller's activatedManualServices ('birth_attestation'), toggled
 * from ResellerBranding.jsx — identical mechanism to nin_modification /
 * bvn_modification / cac_registration.
 *
 * Flow: Form -> Preview -> Confirm & Pay (wallet) -> Success + WhatsApp handoff.
 * Reuses the existing "Assisted Service" architecture verbatim:
 *   POST /api/retail/identity/assisted-purchase  (serviceType: 'birth-attestation-letter')
 * which debits the wallet, creates a Transaction + ServiceRequest
 * (status PENDING_REVIEW), and already shows up in the generic admin
 * "Assisted Service Requests" screen — no backend/admin changes needed.
 */

const SERVICE_TYPE = 'birth-attestation-letter';
const SERVICE_AMOUNT = 22000;

const MARITAL_STATUS_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'];
const HOSPITAL_OR_HOUSE_OPTIONS = ['Hospital', 'House'];
const EDUCATION_OPTIONS = [
  'No Formal Education', 'Primary', 'Secondary (WAEC/NECO)', 'OND/NCE', 'HND',
  'B.Sc / B.A / B.Ed', 'M.Sc / MBA / M.A', 'PhD', 'Others',
];

const SECTIONS = [
  {
    title: "1. Applicant Information",
    fields: [
      { name: 'nin', label: 'NIN Number', required: true, maxLength: 11 },
      { name: 'surname', label: 'Surname', required: true },
      { name: 'firstName', label: 'First Name', required: true },
      { name: 'middleName', label: 'Middle Name', required: true },
      { name: 'newDob', label: 'New Date of Birth', required: true, type: 'date' },
      { name: 'maritalStatus', label: 'Marital Status', required: true, type: 'select', options: MARITAL_STATUS_OPTIONS },
      { name: 'stateOfOrigin', label: 'State of Origin', required: true },
      { name: 'lga', label: 'L.G.A.', required: true },
      { name: 'villageTown', label: 'Village/Town', required: true },
    ],
  },
  {
    title: "2. Birth Information",
    fields: [
      { name: 'placeOfBirthFacility', label: 'Place of Birth', required: true, placeholder: 'Specific location / facility name' },
      { name: 'hospitalOrHouse', label: 'Hospital or House', required: true, type: 'select', options: HOSPITAL_OR_HOUSE_OPTIONS },
    ],
  },
  {
    title: "3. Residential Information",
    fields: [
      { name: 'residentState', label: 'Resident State', required: true },
      { name: 'residentLga', label: 'Resident L.G.A.', required: true },
      { name: 'residentVillageTown', label: 'Resident Village/Town', required: true },
      { name: 'residentAddress', label: 'Resident Address', required: true, placeholder: 'House No., Street, Area' },
    ],
  },
  {
    title: "4. Educational & Occupational Information",
    fields: [
      { name: 'levelOfEducation', label: 'Level of Education', required: true, type: 'select', options: EDUCATION_OPTIONS },
      { name: 'occupation', label: 'Occupation', required: true, placeholder: 'e.g. Teacher, Trader, Student' },
      { name: 'phoneNumber', label: 'Phone Number', required: true, type: 'tel', maxLength: 11, help: 'Used for order updates and the WhatsApp handoff after submission.' },
      { name: 'occupationAddress', label: 'Occupation Address', required: true, placeholder: 'Work / business address' },
    ],
  },
  {
    title: "5. Birth Location Details",
    fields: [
      { name: 'placeOfBirthTown', label: 'Place of Birth', required: true, placeholder: 'Town/City where born' },
      { name: 'stateOfBirth', label: 'State of Birth', required: true },
      { name: 'lgaOfBirth', label: 'L.G.A. of Birth', required: true },
      { name: 'villageTownOfBirth', label: 'Village/Town of Birth', required: true },
    ],
  },
  {
    title: "6. Father's Information",
    fields: [
      { name: 'fatherSurname', label: 'Surname', required: true },
      { name: 'fatherFirstName', label: 'First Name', required: true },
      { name: 'fatherStateOfOrigin', label: 'State of Origin', required: true },
      { name: 'fatherLga', label: 'L.G.A.', required: true },
      { name: 'fatherVillageTown', label: 'Village/Town', required: true },
    ],
  },
  {
    title: "7. Mother's Information",
    fields: [
      { name: 'motherSurname', label: 'Surname', required: true },
      { name: 'motherFirstName', label: 'First Name', required: true },
      { name: 'motherMaidenName', label: 'Maiden Name', required: true, placeholder: "Mother's maiden (family) name" },
      { name: 'motherStateOfOrigin', label: 'State of Origin', required: true },
      { name: 'motherLga', label: 'L.G.A.', required: true },
      { name: 'motherVillageTown', label: 'Village/Town', required: true },
    ],
  },
];

const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);

const formatCurrency = (n) => `₦${Number(n).toLocaleString()}`;

const Field = ({ field, value, onChange }) => {
  const commonStyle = {
    width: '100%', padding: '13px 14px', background: 'var(--bg-color)',
    border: '1px solid var(--border-color)', borderRadius: '10px',
    fontSize: '14px', color: 'var(--text-dark)', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  };
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>
        {field.label} {field.required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      {field.type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          required={field.required}
          style={commonStyle}
        >
          <option value="">Select {field.label}</option>
          {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input
          type={field.type || 'text'}
          value={value}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          required={field.required}
          onChange={(e) => onChange(field.name, e.target.value)}
          style={commonStyle}
        />
      )}
      {field.help && (
        <div style={{ fontSize: '11px', color: 'var(--text-gray)', marginTop: '4px' }}>{field.help}</div>
      )}
    </div>
  );
};

const SectionCard = ({ title, children }) => (
  <div style={{
    background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color)',
    borderRadius: '16px', padding: '20px', marginBottom: '16px',
  }}>
    <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '800', color: '#6366f1' }}>{title}</h3>
    {children}
  </div>
);

const BirthAttestationPurchase = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // 'form' | 'preview'
  const [form, setForm] = useState(() => Object.fromEntries(ALL_FIELDS.map((f) => [f.name, ''])));
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const goToPreview = (e) => {
    e.preventDefault();
    const missing = ALL_FIELDS.filter((f) => f.required && !String(form[f.name] || '').trim());
    if (missing.length > 0) {
      setFormError(`Please fill in all required fields (${missing.length} missing).`);
      return;
    }
    setFormError('');
    setStep('preview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirm = async () => {
    setLoading(true);
    setSubmitError(null);
    try {
      const reference = `BAL-${Date.now()}`;
      const formData = new FormData();
      formData.append('reference', reference);
      formData.append('serviceType', SERVICE_TYPE);
      formData.append('whatsappNumber', form.phoneNumber);
      ALL_FIELDS.forEach((f) => formData.append(f.name, form[f.name]));

      const res = await API.post('/api/retail/identity/assisted-purchase', formData);
      setResult(res.data);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const whatsappHref = (() => {
    if (!result?.data) return '#';
    const msg =
      `*BIRTH ATTESTATION LETTER REQUEST*\n\n` +
      `Service: ${result.data.service}\n` +
      `Request ID: ${result.data.reference}\n` +
      `Customer: ${form.firstName} ${form.surname}\n` +
      `Phone Number: ${form.phoneNumber}\n` +
      `Amount Paid: ${formatCurrency(result.data.amount)}\n\n` +
      `Please process this request.`;
    return `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  })();

  /* ── Success state ── */
  if (result) {
    return (
      <div style={{ padding: '0 0 40px', minHeight: '100vh', background: 'var(--bg-color)', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '600px', margin: '32px auto', padding: '0 20px' }}>
          <div className="animate-fade-in" style={{
            background: 'var(--bg-card, #ffffff)', borderRadius: '24px', overflow: 'hidden',
            border: '1px solid var(--border-color)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '32px 24px', textAlign: 'center', color: 'white',
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.2)', width: '80px', height: '80px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', backdropFilter: 'blur(10px)',
              }}>
                <CheckCircle size={40} color="white" />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800' }}>Request Submitted</h3>
              <p style={{ margin: 0, opacity: 0.9 }}>Your Birth Attestation Letter request is pending manual review</p>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{
                background: 'var(--bg-color)', borderRadius: '16px', border: '1px solid var(--border-color)',
                padding: '20px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px',
              }}>
                <div><div style={{ fontSize: '11px', color: 'var(--text-gray)', textTransform: 'uppercase' }}>Request ID</div><div style={{ fontWeight: '700' }}>{result.data.reference}</div></div>
                <div><div style={{ fontSize: '11px', color: 'var(--text-gray)', textTransform: 'uppercase' }}>Status</div><div style={{ fontWeight: '700' }}>{result.data.status}</div></div>
                <div><div style={{ fontSize: '11px', color: 'var(--text-gray)', textTransform: 'uppercase' }}>Amount Paid</div><div style={{ fontWeight: '700' }}>{formatCurrency(result.data.amount)}</div></div>
                <div><div style={{ fontSize: '11px', color: 'var(--text-gray)', textTransform: 'uppercase' }}>Est. Processing</div><div style={{ fontWeight: '700' }}>{result.data.expectedProcessingTime}</div></div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginBottom: '20px', lineHeight: 1.5 }}>
                This is a manual processing service — our team will contact you on WhatsApp to continue.
                Tap below to message us directly with your request details pre-filled.
              </p>

              <a href={whatsappHref} target="_blank" rel="noreferrer" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                width: '100%', padding: '16px', borderRadius: '16px', background: '#25D366',
                color: '#fff', fontWeight: '700', fontSize: '15px', textDecoration: 'none',
                marginBottom: '12px', boxSizing: 'border-box',
              }}>
                <MessageCircle size={20} /> Continue on WhatsApp
              </a>

              <button type="button" onClick={() => navigate(-1)} style={{
                width: '100%', padding: '14px', borderRadius: '16px', background: 'var(--border-color)',
                color: 'var(--text-dark)', border: 'none', fontWeight: '600', cursor: 'pointer',
              }}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Preview state ── */
  if (step === 'preview') {
    return (
      <div style={{ padding: '0 0 40px', minHeight: '100vh', background: 'var(--bg-color)', fontFamily: 'Inter, sans-serif' }}>
        <div style={{
          background: 'var(--bg-card, #ffffff)', padding: '24px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 10,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}>
          <div onClick={() => setStep('form')} style={{ background: 'rgba(99,102,241,0.1)', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={20} color="#6366f1" />
          </div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)' }}>Preview Application</h2>
        </div>

        <div style={{ maxWidth: '640px', margin: '24px auto', padding: '0 20px' }}>
          {SECTIONS.map((section) => (
            <SectionCard key={section.title} title={section.title}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '4px 16px' }}>
                {section.fields.map((f) => (
                  <div key={f.name} style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-gray)', textTransform: 'uppercase' }}>{f.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)' }}>{form[f.name] || '—'}</div>
                  </div>
                ))}
              </div>
            </SectionCard>
          ))}

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color)',
            borderRadius: '16px', padding: '20px', marginBottom: '20px',
          }}>
            <span style={{ color: 'var(--text-gray)', fontSize: '14px' }}>Service Charge</span>
            <span style={{ fontWeight: '800', fontSize: '22px', color: 'var(--text-dark)' }}>{formatCurrency(SERVICE_AMOUNT)}</span>
          </div>

          {submitError && (
            <div style={{
              background: '#fef2f2', color: '#ef4444', padding: '16px', borderRadius: '12px',
              marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px',
              border: '1px solid #fecaca', fontSize: '14px', fontWeight: '500',
            }}>
              <AlertTriangle size={20} /> {submitError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={() => setStep('form')} disabled={loading} style={{
              flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--border-color)',
              color: 'var(--text-dark)', border: 'none', fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              <Pencil size={16} /> Edit
            </button>
            <button type="button" onClick={handleConfirm} disabled={loading} style={{
              flex: 2, padding: '16px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff', fontSize: '15px', fontWeight: '700', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '8px', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> Processing…</> : `Confirm & Pay ${formatCurrency(SERVICE_AMOUNT)}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form state ── */
  return (
    <div style={{ padding: '0 0 40px', minHeight: '100vh', background: 'var(--bg-color)', fontFamily: 'Inter, sans-serif' }}>
      <div style={{
        background: 'var(--bg-card, #ffffff)', padding: '24px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      }}>
        <div onClick={() => navigate(-1)} style={{ background: 'rgba(99,102,241,0.1)', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={20} color="#6366f1" />
        </div>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: 'var(--text-dark)' }}>Birth Attestation Letter</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Manual processing service &middot; {formatCurrency(SERVICE_AMOUNT)}</div>
        </div>
      </div>

      <form onSubmit={goToPreview} style={{ maxWidth: '640px', margin: '24px auto', padding: '0 20px' }}>
        {SECTIONS.map((section) => (
          <SectionCard key={section.title} title={section.title}>
            {section.fields.map((f) => (
              <Field key={f.name} field={f} value={form[f.name]} onChange={handleChange} />
            ))}
          </SectionCard>
        ))}

        {formError && (
          <div style={{
            background: '#fef2f2', color: '#ef4444', padding: '16px', borderRadius: '12px',
            marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px',
            border: '1px solid #fecaca', fontSize: '14px', fontWeight: '500',
          }}>
            <AlertTriangle size={20} /> {formError}
          </div>
        )}

        <button type="submit" style={{
          width: '100%', padding: '18px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: '#fff', fontSize: '16px', fontWeight: '700', border: 'none', cursor: 'pointer',
        }}>
          Preview Application &rarr;
        </button>
      </form>
    </div>
  );
};

export default BirthAttestationPurchase;
