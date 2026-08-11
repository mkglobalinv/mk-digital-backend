import React, { useState, useRef } from 'react';
import {
  X, Users, BookOpen, Edit3, Phone, Calendar, UserCog,
  Check, Upload, ChevronRight, Info, Send, FileText
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import API from '../../../api';
// ─── Constants ─────────────────────────────────────────────────────────────────
const WHATSAPP_NUMBER = '2347081385387';
const STEP_LABELS = ['CHANNEL', 'AFFIDAVIT', 'MODIFY', 'DETAILS', 'REVIEW'];

const MODIFICATIONS = [
  { id: 'name',  label: 'BVN Name Update',  icon: UserCog,  description: 'Update your registered name on BVN records' },
  { id: 'phone', label: 'BVN Phone Update', icon: Phone,    description: 'Update your registered phone number on BVN' },
  { id: 'dob',   label: 'BVN DOB Update',   icon: Calendar, description: 'Correct your date of birth on BVN records' },
];

const formatCurrency = (n) =>
  '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const isValidNigerianPhone = (v) => /^0[789][01]\d{8}$/.test(v.replace(/\s/g, ''));

// ─── Small reusable UI pieces ──────────────────────────────────────────────────
const SectionHeader = ({ title, subtitle }) => (
  <div style={{ marginBottom: '14px' }}>
    <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>{title}</div>
    {subtitle && <div style={{ fontSize: '12px', color: 'var(--text-gray)', lineHeight: '1.4' }}>{subtitle}</div>}
  </div>
);

const Field = ({ label, required, children }) => (
  <div style={{ marginBottom: '14px' }}>
    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-gray)', textTransform: 'uppercase', marginBottom: '6px' }}>
      {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
    </label>
    {children}
  </div>
);

const Input = ({ value, onChange, placeholder, type = 'text' }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    style={{
      width: '100%', padding: '11px 14px', background: 'var(--bg-color)',
      border: '1px solid var(--border-color)', borderRadius: '10px',
      fontSize: '14px', color: 'var(--text-dark)', outline: 'none', boxSizing: 'border-box',
    }}
  />
);

const ReviewRow = ({ label, value }) =>
  value ? (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
      <span style={{ color: 'var(--text-gray)', fontWeight: '600' }}>{label}</span>
      <span style={{ color: 'var(--text-dark)', fontWeight: '700', maxWidth: '55%', textAlign: 'right' }}>{value}</span>
    </div>
  ) : null;

// ─── Main Component ────────────────────────────────────────────────────────────
export default function BvnModifyModal({ onClose }) {
  const { showToast } = useToast();
  const toast = {
    loading: (msg) => { showToast(msg, 'success'); return '1'; },
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
    dismiss: () => {}
  };
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [affidavitOption, setAffidavitOption] = useState(null);
  const [selectedMods, setSelectedMods] = useState([]);
  const [step3Error, setStep3Error] = useState('');
  const [currentInfo, setCurrentInfo] = useState({ bvn: '', dob: '', surname: '', firstName: '', middleName: '', nin: '' });
  const [nameUpdate, setNameUpdate] = useState({ newSurname: '', newFirstName: '', newMiddleName: '' });
  const [phoneUpdate, setPhoneUpdate] = useState({ oldPhone: '', newPhone: '' });
  const [dobUpdate, setDobUpdate] = useState({ correctDob: '' });
  const [affidavitFile, setAffidavitFile] = useState(null);
  const [step4Error, setStep4Error] = useState('');

  const withCourtAffidavitPrice = 7500;
  const withoutCourtAffidavitPrice = 9500;
  const currentAffidavitPrice = affidavitOption === 'with_affidavit' ? withCourtAffidavitPrice : affidavitOption === 'without_affidavit' ? withoutCourtAffidavitPrice : 0;
  const total = selectedMods.length * currentAffidavitPrice;
  const hasMod = (id) => selectedMods.includes(id);

  const closeReset = () => {
    setStep(1); setAffidavitOption(null); setSelectedMods([]); setStep3Error('');
    setCurrentInfo({ bvn: '', dob: '', surname: '', firstName: '', middleName: '', nin: '' });
    setNameUpdate({ newSurname: '', newFirstName: '', newMiddleName: '' });
    setPhoneUpdate({ oldPhone: '', newPhone: '' });
    setDobUpdate({ correctDob: '' }); setAffidavitFile(null); setStep4Error('');
    onClose();
  };

  const toggleMod = (id) => {
    setStep3Error('');
    setSelectedMods(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('File is too large. Max 5 MB.', 'error'); e.target.value = ''; return; }
    setAffidavitFile(file);
  };

  const validateStep3 = () => {
    if (selectedMods.length === 0) { setStep3Error('Please select at least one modification.'); return false; }
    return true;
  };

  const validateStep4 = () => {
    const { bvn, dob, surname, firstName } = currentInfo;
    if (!bvn.trim() || !dob || !surname.trim() || !firstName.trim()) {
      setStep4Error('Please fill in all required fields: BVN, Date of Birth, Surname, and First Name.'); return false;
    }
    if (bvn.replace(/\D/g, '').length !== 11) { setStep4Error('BVN must be exactly 11 digits.'); return false; }
    if (hasMod('name')) {
      if (!nameUpdate.newSurname.trim() && !nameUpdate.newFirstName.trim() && !nameUpdate.newMiddleName.trim()) {
        setStep4Error('Please enter at least one new name field for BVN Name Update.'); return false;
      }
    }
    if (hasMod('phone')) {
      if (!phoneUpdate.oldPhone.trim() || !phoneUpdate.newPhone.trim()) { setStep4Error('Old and new phone numbers are both required.'); return false; }
      if (!isValidNigerianPhone(phoneUpdate.oldPhone)) { setStep4Error('Old phone number is not a valid 11-digit Nigerian number.'); return false; }
      if (!isValidNigerianPhone(phoneUpdate.newPhone)) { setStep4Error('New phone number is not a valid 11-digit Nigerian number.'); return false; }
    }
    if (hasMod('dob') && !dobUpdate.correctDob) { setStep4Error('Please enter the corrected Date of Birth.'); return false; }
    if (affidavitOption === 'with_affidavit' && !affidavitFile) { setStep4Error('Please upload your Court Affidavit document.'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    const toastId = toast.loading('Submitting application...');
    try {
      const payload = {
          serviceType: 'bvn_modification',
          submittedData: {
              affidavitOption,
              selectedMods,
              currentInfo,
              nameUpdate,
              phoneUpdate,
              dobUpdate
          }
      };
      
      const res = await API.post('/api/retail/identity/manual-application', payload);
      if (res.data.status === 'success') {
          toast.dismiss(toastId);
          let msg = `*BVN MODIFICATION REQUEST*\n`;
          msg += `Service: BVN Modification\nChannel: Agency Banking\n`;
          msg += `Application ID: ${res.data.data.applicationId}\n`;
          msg += `Source Website: ${res.data.data.websiteId}\n`;
          msg += `Affidavit: ${affidavitOption === 'with_affidavit' ? 'With Court Affidavit' : 'Without Court Affidavit'}\n`;
          msg += `Modifications: ${selectedMods.map(m => MODIFICATIONS.find(mod => mod.id === m)?.label).join(', ')}\n`;
          
          msg += `\n*Current BVN Information:*\nBVN: ${currentInfo.bvn}\nDate of Birth: ${currentInfo.dob}\nSurname: ${currentInfo.surname}\nFirst Name: ${currentInfo.firstName}\n`;
          if (currentInfo.middleName) msg += `Middle Name: ${currentInfo.middleName}\n`;
          if (currentInfo.nin) msg += `NIN: ${currentInfo.nin}\n`;
          if (hasMod('name')) {
            msg += `\n*New Name Details:*\n`;
            if (nameUpdate.newSurname) msg += `New Surname: ${nameUpdate.newSurname}\n`;
            if (nameUpdate.newFirstName) msg += `New First Name: ${nameUpdate.newFirstName}\n`;
            if (nameUpdate.newMiddleName) msg += `New Middle Name: ${nameUpdate.newMiddleName}\n`;
          }
          if (hasMod('phone')) msg += `\n*Phone Update:*\nOld Phone: ${phoneUpdate.oldPhone}\nNew Phone: ${phoneUpdate.newPhone}\n`;
          if (hasMod('dob')) msg += `\n*DOB Correction:*\nCorrected DOB: ${dobUpdate.correctDob}\n`;
          if (affidavitFile) msg += `\nAffidavit: ${affidavitFile.name} (${(affidavitFile.size / 1024).toFixed(1)} KB) — please request file separately\n`;
          msg += `\nPlease process this BVN modification request manually.`;

          toast.success('Request submitted. Redirecting to WhatsApp…');
          setTimeout(() => { window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank'); closeReset(); }, 1500);
      }
    } catch (err) {
       toast.dismiss(toastId);
       toast.error('Failed to submit application');
    }
  };

  // ─── Progress Bar ──────────────────────────────────────────────────────────────
  const ProgressBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px 10px', flexShrink: 0 }}>
      {['CHANNEL', 'AFFIDAVIT', 'MODIFY', 'DETAILS'].map((label, i) => {
        const isActive = i === step - 1, isDone = i < step - 1;
        return (
          <React.Fragment key={label}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', background: isDone ? '#10B981' : isActive ? '#8B5CF6' : 'var(--border-color)', color: (isDone || isActive) ? '#fff' : 'var(--text-gray)', transition: 'all 0.3s' }}>
                {isDone ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '8px', fontWeight: '700', marginTop: '3px', letterSpacing: '0.3px', color: isActive ? '#8B5CF6' : isDone ? '#10B981' : 'var(--text-gray)' }}>{label}</span>
            </div>
            {i < 3 && <div style={{ height: '2px', flex: 1, marginBottom: '14px', background: isDone ? '#10B981' : 'var(--border-color)', transition: 'all 0.3s' }} />}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ─── Sticky Footer ─────────────────────────────────────────────────────────────
  const Footer = ({ onBack, onNext, nextLabel = 'Next →', nextDisabled = false, showTotal = false }) => (
    <div style={{ borderTop: '1px solid var(--border-color)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: 'var(--bg-surface)', flexShrink: 0 }}>
      {showTotal && (
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-gray)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>STATUS</div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#8B5CF6', transition: 'all 0.3s' }}>MANUAL</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
        {onBack && (
          <button onClick={onBack} style={{ padding: '11px 18px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-dark)', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>← Back</button>
        )}
        <button onClick={onNext} disabled={nextDisabled} style={{ padding: '11px 22px', borderRadius: '10px', border: 'none', background: nextDisabled ? 'var(--border-color)' : '#8B5CF6', color: '#fff', fontWeight: '800', fontSize: '13px', cursor: nextDisabled ? 'not-allowed' : 'pointer', opacity: nextDisabled ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
          {nextLabel}
        </button>
      </div>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="modal-overlay-modern" onClick={closeReset}>
      <div className="modal-content-modern animate-scale-in" onClick={e => e.stopPropagation()} style={{ padding: 0, maxWidth: '520px', width: '92%', margin: '32px auto', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', margin: '0 0 2px' }}>
              {['BVN Modification', 'Affidavit Option', 'What to Modify', 'Your BVN Details'][step - 1]}
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-gray)' }}>
              {[
                'Choose an agency to process your BVN modification.',
                'Choose whether you are providing a court affidavit',
                'Select one or more BVN fields you want to update',
                'Enter your current registered information exactly as it appears',
              ][step - 1]}
            </p>
          </div>
          <button className="icon-btn" onClick={closeReset}><X size={20} /></button>
        </div>

        <ProgressBar />

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 16px' }}>

          {/* ── STEP 1 — CHANNEL ── */}
          {step === 1 && (
            <button style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '18px', background: 'var(--bg-surface)', border: '2px solid var(--border-color)', borderRadius: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', width: '100%' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.background = '#F5F3FF'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
              onClick={() => setStep(2)}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={22} color="#2563EB" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '800', color: 'var(--text-dark)', fontSize: '15px', marginBottom: '4px' }}>Agency Banking</div>
                <div style={{ color: 'var(--text-gray)', fontSize: '12px', lineHeight: '1.5' }}>BVN modification processed through a licensed Agency Banking outlet.</div>
              </div>
              <ChevronRight size={18} color="var(--text-gray)" style={{ alignSelf: 'center', flexShrink: 0 }} />
            </button>
          )}

          {/* ── STEP 2 — AFFIDAVIT ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { id: 'with_affidavit', label: 'WITH COURT AFFIDAVIT', desc: 'You provide a sworn court affidavit document', features: ['Lower cost', 'Document upload required', 'Court-sworn document'], accentColor: '#10B981', bg: '#F0FDF4', barBg: '#d1fae5', icon: <BookOpen size={16} color="#059669" />, iconBg: '#D1FAE5', price: withCourtAffidavitPrice },
                { id: 'without_affidavit', label: 'WITHOUT COURT AFFIDAVIT', desc: 'No affidavit document required', features: ['Higher cost', 'No upload needed', 'Quick submission'], accentColor: '#F59E0B', bg: '#FFFBEB', barBg: '#FDE68A', icon: <Edit3 size={16} color="#D97706" />, iconBg: '#FEF3C7', price: withoutCourtAffidavitPrice },
              ].map(opt => {
                const isSelected = affidavitOption === opt.id;
                return (
                  <button key={opt.id} onClick={() => setAffidavitOption(opt.id)} style={{ display: 'flex', flexDirection: 'column', padding: 0, width: '100%', cursor: 'pointer', border: `2px solid ${isSelected ? opt.accentColor : 'var(--border-color)'}`, borderRadius: '16px', background: isSelected ? opt.bg : 'var(--bg-surface)', transition: 'all 0.25s', overflow: 'hidden', boxShadow: isSelected ? `0 0 0 3px ${opt.accentColor}25` : 'none', textAlign: 'left' }}>
                    <div style={{ height: '4px', background: isSelected ? opt.accentColor : opt.barBg, width: '100%' }} />
                    <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: opt.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{opt.icon}</div>
                          <span style={{ fontWeight: '800', color: 'var(--text-dark)', fontSize: '13px' }}>{opt.label}</span>
                        </div>
                        <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-gray)' }}>{opt.desc}</p>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: opt.accentColor, lineHeight: '1.8' }}>{opt.features.map(f => <li key={f}>{f}</li>)}</ul>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
                        <div style={{ fontSize: '21px', fontWeight: '900', color: opt.accentColor }}>{formatCurrency(opt.price)}</div>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${isSelected ? opt.accentColor : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', transition: 'all 0.2s' }}>
                          {isSelected && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: opt.accentColor }} />}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── STEP 3 — MODIFY (multi-select) ── */}
          {step === 3 && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {MODIFICATIONS.map(mod => {
                  const Icon = mod.icon;
                  const isSelected = hasMod(mod.id);
                  return (
                    <button key={mod.id} onClick={() => toggleMod(mod.id)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', border: `2px solid ${isSelected ? '#8B5CF6' : 'var(--border-color)'}`, borderRadius: '14px', background: isSelected ? '#F5F3FF' : 'var(--bg-surface)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.25s', width: '100%', boxShadow: isSelected ? '0 0 0 3px rgba(139,92,246,0.15)' : 'none' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isSelected ? '#EDE9FE' : 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.25s' }}>
                        <Icon size={20} color={isSelected ? '#8B5CF6' : 'var(--text-gray)'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '800', color: isSelected ? '#6D28D9' : 'var(--text-dark)', fontSize: '14px', marginBottom: '2px' }}>{mod.label}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{mod.description}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                        <div style={{ fontWeight: '900', color: isSelected ? '#8B5CF6' : 'var(--text-gray)', fontSize: '16px' }}>{formatCurrency(currentAffidavitPrice)}</div>
                        <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: `2px solid ${isSelected ? '#8B5CF6' : 'var(--border-color)'}`, background: isSelected ? '#8B5CF6' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                          {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {step3Error && <div style={{ marginTop: '12px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '12px', color: '#DC2626', fontWeight: '600' }}>⚠ {step3Error}</div>}
            </div>
          )}

          {/* ── STEP 4 — DETAILS ── */}
          {step === 4 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#EDE9FE', border: '1px solid #DDD6FE', borderRadius: '10px', marginBottom: '14px' }}>
                <Info size={16} color="#7C3AED" style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '12px', color: '#5B21B6', lineHeight: '1.5', fontWeight: '600' }}>On Submit, you will be redirected to WhatsApp to complete manual processing. No wallet deduction.</p>
              </div>

              {/* Current Information */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
                <SectionHeader title="Current Information" subtitle="Enter your current registered BVN information exactly as it appears" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 14px' }}>
                  <Field label="BVN Number" required><Input value={currentInfo.bvn} onChange={e => setCurrentInfo(p => ({ ...p, bvn: e.target.value }))} placeholder="11-digit BVN" /></Field>
                  <Field label="Date of Birth" required><Input type="date" value={currentInfo.dob} onChange={e => setCurrentInfo(p => ({ ...p, dob: e.target.value }))} /></Field>
                  <Field label="Surname" required><Input value={currentInfo.surname} onChange={e => setCurrentInfo(p => ({ ...p, surname: e.target.value }))} placeholder="Your surname" /></Field>
                  <Field label="First Name" required><Input value={currentInfo.firstName} onChange={e => setCurrentInfo(p => ({ ...p, firstName: e.target.value }))} placeholder="Your first name" /></Field>
                  <Field label="Middle Name"><Input value={currentInfo.middleName} onChange={e => setCurrentInfo(p => ({ ...p, middleName: e.target.value }))} placeholder="Optional" /></Field>
                  <Field label="NIN (Optional)"><Input value={currentInfo.nin} onChange={e => setCurrentInfo(p => ({ ...p, nin: e.target.value }))} placeholder="11-digit NIN" /></Field>
                </div>
              </div>

              {/* Conditional — Name */}
              {hasMod('name') && (
                <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
                  <SectionHeader title="New Name Details" subtitle="Enter only the name fields you want to change. Leave blank to keep current." />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 14px' }}>
                    <Field label="New Surname"><Input value={nameUpdate.newSurname} onChange={e => setNameUpdate(p => ({ ...p, newSurname: e.target.value }))} placeholder="New surname" /></Field>
                    <Field label="New First Name"><Input value={nameUpdate.newFirstName} onChange={e => setNameUpdate(p => ({ ...p, newFirstName: e.target.value }))} placeholder="New first name" /></Field>
                    <Field label="New Middle Name"><Input value={nameUpdate.newMiddleName} onChange={e => setNameUpdate(p => ({ ...p, newMiddleName: e.target.value }))} placeholder="New middle name" /></Field>
                  </div>
                </div>
              )}

              {/* Conditional — Phone */}
              {hasMod('phone') && (
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
                  <SectionHeader title="Phone Number Change" subtitle="Enter your old and new registered phone numbers" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 14px' }}>
                    <Field label="Old Phone Number" required><Input value={phoneUpdate.oldPhone} onChange={e => setPhoneUpdate(p => ({ ...p, oldPhone: e.target.value }))} placeholder="11-digit old number" type="tel" /></Field>
                    <Field label="New Phone Number" required><Input value={phoneUpdate.newPhone} onChange={e => setPhoneUpdate(p => ({ ...p, newPhone: e.target.value }))} placeholder="11-digit new number" type="tel" /></Field>
                  </div>
                </div>
              )}

              {/* Conditional — DOB */}
              {hasMod('dob') && (
                <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
                  <SectionHeader title="Date of Birth Correction" subtitle="Enter the correct date of birth to replace the current one" />
                  <Field label="Correct Date of Birth" required><Input type="date" value={dobUpdate.correctDob} onChange={e => setDobUpdate(p => ({ ...p, correctDob: e.target.value }))} /></Field>
                </div>
              )}

              {/* Conditional — Affidavit upload */}
              {affidavitOption === 'with_affidavit' && (
                <div style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
                  <SectionHeader title="Court Affidavit — Upload Required" subtitle="PDF, JPG, PNG — max 5 MB" />
                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFileChange} />
                  <div onClick={() => fileInputRef.current?.click()} style={{ border: affidavitFile ? '1px solid #10B981' : '1px dashed #A7F3D0', background: affidavitFile ? '#ECFDF5' : '#F0FDF4', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {affidavitFile ? (
                      <><Check size={22} color="#10B981" style={{ margin: '0 auto 6px' }} /><p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '700', color: '#065F46' }}>{affidavitFile.name}</p><p style={{ margin: 0, fontSize: '11px', color: '#10B981' }}>Tap to change file</p></>
                    ) : (
                      <><Upload size={22} color="#10B981" style={{ margin: '0 auto 6px' }} /><p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '700', color: '#065F46' }}>Click to upload your affidavit</p><p style={{ margin: 0, fontSize: '11px', color: '#10B981' }}>PDF, JPG, PNG — max 5 MB</p></>
                    )}
                  </div>
                </div>
              )}

              {step4Error && <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '12px', color: '#DC2626', fontWeight: '600' }}>⚠ {step4Error}</div>}
            </div>
          )}

        </div>

        {/* ── Footer per step ── */}
        {step === 1 && <Footer onNext={() => setStep(2)} nextLabel="Continue →" />}
        {step === 2 && <Footer onBack={() => setStep(1)} onNext={() => affidavitOption && setStep(3)} nextLabel="Continue →" nextDisabled={!affidavitOption} />}
        {step === 3 && <Footer onBack={() => setStep(2)} onNext={() => { if (validateStep3()) { setStep4Error(''); setStep(4); } }} nextLabel="Continue →" showTotal />}
        {step === 4 && <Footer onBack={() => setStep(3)} onNext={() => { if (validateStep4()) handleSubmit(); }} nextLabel={<><Send size={13} /> Submit via WhatsApp</>} showTotal />}
      </div>
    </div>
  );
}
