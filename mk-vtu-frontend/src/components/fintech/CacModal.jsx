import React, { useState, useRef } from 'react';
import {
  X, Briefcase, Building, BookOpen, Users,
  Check, Upload, ChevronRight, Info, Send, FileText, Plus, Trash2
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import API from '../../../api';
const WHATSAPP_NUMBER = '2347081385387';

const CAC_PACKAGES = [
  { id: 'plc', title: 'Public Limited Company (PLC)', desc: 'Register a Public Limited Company', price: 125000, delivery: '20-30 working days', icon: Building, color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'ngo', title: 'Incorporated Trustee / NGO', desc: 'Register an Incorporated Trustee or NGO', price: 90000, delivery: '20-25 working days', icon: BookOpen, color: '#10B981', bg: '#F0FDF4' },
  { id: 'business_name', title: 'Business Name', desc: 'Register Business Name', price: 30000, delivery: '10-15 working days', icon: Briefcase, color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'private_ltd', title: 'Private Limited Company', desc: 'Register a Private Limited Company', price: 65000, delivery: '15-20 working days', icon: Users, color: '#8B5CF6', bg: '#F5F3FF' }
];

const formatCurrency = (n) =>
  '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const isValidNigerianPhone = (v) => /^0[789][01]\d{8}$/.test(v.replace(/\s/g, ''));

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

const Input = ({ value, onChange, placeholder, type = 'text', as = 'input', options = [] }) => {
  const commonStyle = {
    width: '100%', padding: '11px 14px', background: 'var(--bg-color)',
    border: '1px solid var(--border-color)', borderRadius: '10px',
    fontSize: '14px', color: 'var(--text-dark)', outline: 'none', boxSizing: 'border-box',
  };

  if (as === 'select') {
    return (
      <select value={value} onChange={onChange} style={{...commonStyle, appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%239CA3AF\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}>
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    );
  }
  if (as === 'textarea') {
    return <textarea value={value} onChange={onChange} placeholder={placeholder} style={{...commonStyle, resize: 'vertical', minHeight: '80px'}} />;
  }
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={commonStyle} />;
};

export default function CacModal({ onClose }) {
  const { showToast } = useToast();
  const toast = {
    loading: (msg) => { showToast(msg, 'success'); return '1'; },
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
    dismiss: () => {}
  };
  
  const [step, setStep] = useState(1);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [stepError, setStepError] = useState('');

  // Forms State
  const [personalInfo, setPersonalInfo] = useState({ surname: '', firstName: '', otherName: '', dob: '', gender: '', phone: '', address: '' });
  const [businessInfo, setBusinessInfo] = useState({ name1: '', name2: '', address: '', email: '' });
  
  const initialDirector = { name: '', dob: '', gender: '', nationality: '', phone: '', email: '', address: '', idType: '', idNumber: '', shareholding: '' };
  const [directors, setDirectors] = useState([{ ...initialDirector, id: Date.now() }]);
  
  const [companyDetails, setCompanyDetails] = useState({ nature: '', address: '', email: '' });
  const [shareCapital, setShareCapital] = useState({ authorized: '', shares: '' });
  const [secretary, setSecretary] = useState({ name: '', phone: '', email: '' });

  // Files State
  const [files, setFiles] = useState({ validId: null, passport: null, signature: null, proofOfAddress: null });
  const validIdRef = useRef(null), passportRef = useRef(null), signatureRef = useRef(null), proofOfAddressRef = useRef(null);

  const selectedPackage = CAC_PACKAGES.find(p => p.id === selectedPackageId);
  const isBusinessName = selectedPackageId === 'business_name';

  const closeReset = () => {
    setStep(1); setSelectedPackageId(null); setStepError('');
    onClose();
  };

  const handleFileChange = (key, e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast('File is too large. Max 10 MB.', 'error'); e.target.value = ''; return; }
    setFiles(p => ({ ...p, [key]: file }));
  };

  const addDirector = () => setDirectors(p => [...p, { ...initialDirector, id: Date.now() }]);
  const removeDirector = (id) => setDirectors(p => p.filter(d => d.id !== id));
  const updateDirector = (id, field, value) => setDirectors(p => p.map(d => d.id === id ? { ...d, [field]: value } : d));

  const validateForm = () => {
    setStepError('');
    if (isBusinessName) {
      if (!personalInfo.surname || !personalInfo.firstName || !personalInfo.dob || !personalInfo.gender || !personalInfo.phone || !personalInfo.address) return 'Please fill all required personal information fields.';
      if (!isValidNigerianPhone(personalInfo.phone)) return 'Invalid phone number.';
      if (!businessInfo.name1 || !businessInfo.address || !businessInfo.email) return 'Please fill all required business information fields.';
      if (!files.validId || !files.passport || !files.signature) return 'Please upload all required documents (Valid ID, Passport, Signature).';
    } else {
      if (!businessInfo.name1) return 'Please provide at least one proposed company name.';
      if (!companyDetails.nature || !companyDetails.address || !companyDetails.email) return 'Please fill all required business details.';
      
      for (const [i, d] of directors.entries()) {
        if (!d.name || !d.dob || !d.gender || !d.nationality || !d.phone || !d.email || !d.address || !d.idType || !d.idNumber) {
          return `Please fill all required fields for Director/Proprietor #${i + 1}.`;
        }
      }
      
      if (selectedPackageId === 'plc' || selectedPackageId === 'private_ltd') {
        if (!shareCapital.authorized || !shareCapital.shares) return 'Share Capital information is required for Limited Companies.';
      }
      
      if (!files.validId || !files.passport || !files.signature || !files.proofOfAddress) return 'Please upload all required documents (Valid IDs, Passports, Proof of Address, Signatures).';
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validateForm();
    if (err) { setStepError(err); return; }

    const toastId = toast.loading('Submitting application...');
    try {
      const payload = {
          serviceType: 'cac_registration',
          submittedData: {
              package: selectedPackage,
              isBusinessName,
              personalInfo: isBusinessName ? personalInfo : undefined,
              businessInfo,
              directors: !isBusinessName ? directors : undefined,
              companyDetails: !isBusinessName ? companyDetails : undefined,
              shareCapital: !isBusinessName ? shareCapital : undefined,
              secretary: !isBusinessName ? secretary : undefined
          }
      };
      
      const res = await API.post('/api/retail/identity/manual-application', payload);
      
      if (res.data.status === 'success') {
          toast.dismiss(toastId);
          let msg = `*CAC REGISTRATION REQUEST*\n\n`;
          msg += `Application ID: ${res.data.data.applicationId}\n`;
          msg += `Source Website: ${res.data.data.websiteId}\n`;
          msg += `Package: ${selectedPackage.title}\nPrice: ${formatCurrency(selectedPackage.price)}\n\n`;

          if (isBusinessName) {
            msg += `*Personal Information*\nName: ${personalInfo.surname} ${personalInfo.firstName} ${personalInfo.otherName}\nDOB: ${personalInfo.dob}\nGender: ${personalInfo.gender}\nPhone: ${personalInfo.phone}\nAddress: ${personalInfo.address}\n\n`;
            msg += `*Business Information*\nName 1 (Preferred): ${businessInfo.name1}\nName 2 (Alternative): ${businessInfo.name2 || 'N/A'}\nEmail: ${businessInfo.email}\nBusiness Address: ${businessInfo.address}\n`;
          } else {
            msg += `*Proposed Company Names*\nOption 1: ${businessInfo.name1}\nOption 2: ${businessInfo.name2 || 'N/A'}\n\n`;
            msg += `*Business Details*\nNature of Business: ${companyDetails.nature}\nAddress: ${companyDetails.address}\nEmail: ${companyDetails.email}\n\n`;
            
            if (selectedPackageId === 'plc' || selectedPackageId === 'private_ltd') {
              msg += `*Share Capital*\nAuthorized Capital: ₦${shareCapital.authorized}\nNumber of Shares: ${shareCapital.shares}\n\n`;
            }
            
            msg += `*Directors / Trustees (${directors.length})*\n`;
            directors.forEach((d, i) => {
              msg += `[Director ${i+1}] Name: ${d.name}, DOB: ${d.dob}, Gender: ${d.gender}, Nationality: ${d.nationality}, Phone: ${d.phone}, Email: ${d.email}, ID: ${d.idType} (${d.idNumber})`;
              if (d.shareholding) msg += `, Shareholding: ${d.shareholding}%`;
              msg += `\nAddress: ${d.address}\n\n`;
            });
            
            if (secretary.name) {
              msg += `*Company Secretary*\nName: ${secretary.name}\nPhone: ${secretary.phone}\nEmail: ${secretary.email}\n\n`;
            }
          }

          msg += `\n*Documents Provided (To be requested separately):*\n`;
          if (files.validId) msg += `- Valid ID: ${files.validId.name}\n`;
          if (files.passport) msg += `- Passport: ${files.passport.name}\n`;
          if (files.signature) msg += `- Signature: ${files.signature.name}\n`;
          if (files.proofOfAddress) msg += `- Proof of Address: ${files.proofOfAddress.name}\n`;
          
          msg += `\nPlease process this CAC registration request manually.`;

          toast.success('Request submitted. Redirecting to WhatsApp…');
          setTimeout(() => { window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank'); closeReset(); }, 1500);
      }
    } catch (err) {
       toast.dismiss(toastId);
       toast.error('Failed to submit application');
    }
  };

  const FileUploadCard = ({ title, desc, fileKey, refObj, accept = ".pdf,.jpg,.jpeg,.png" }) => {
    const file = files[fileKey];
    return (
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', flex: 1, minWidth: '150px' }}>
        <input ref={refObj} type="file" accept={accept} style={{ display: 'none' }} onChange={(e) => handleFileChange(fileKey, e)} />
        <div onClick={() => refObj.current?.click()} style={{ border: file ? '1px solid #10B981' : '1px dashed #CBD5E1', background: file ? '#ECFDF5' : '#fff', borderRadius: '10px', padding: '16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {file ? (
            <><Check size={20} color="#10B981" style={{ margin: '0 auto 6px' }} /><p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: '700', color: '#065F46', wordBreak: 'break-all' }}>{file.name}</p><p style={{ margin: 0, fontSize: '10px', color: '#10B981' }}>Tap to change</p></>
          ) : (
            <><Upload size={20} color="#64748B" style={{ margin: '0 auto 6px' }} /><p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: '700', color: '#334155' }}>{title}</p><p style={{ margin: 0, fontSize: '10px', color: '#64748B' }}>{desc}</p></>
          )}
        </div>
      </div>
    );
  };

  const Footer = ({ onBack, onNext, nextLabel, nextIcon = null }) => (
    <div style={{ borderTop: '1px solid var(--border-color)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: 'var(--bg-surface)', flexShrink: 0 }}>
      {selectedPackage && (
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-gray)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>PACKAGE COST</div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: selectedPackage.color }}>{formatCurrency(selectedPackage.price)}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
        {onBack && <button onClick={onBack} style={{ padding: '11px 18px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-dark)', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>← Back</button>}
        <button onClick={onNext} style={{ padding: '11px 22px', borderRadius: '10px', border: 'none', background: '#3B82F6', color: '#fff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {nextIcon}{nextLabel}
        </button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay-modern" onClick={closeReset}>
      <div className="modal-content-modern animate-scale-in" onClick={e => e.stopPropagation()} style={{ padding: 0, maxWidth: '640px', width: '92%', margin: '32px auto', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0, marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)', margin: '0 0 4px' }}>
              {step === 1 ? 'CAC Registration' : selectedPackage?.title}
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-gray)' }}>
              {step === 1 ? 'Select the type of company or business you want to register.' : 'Complete the required information below'}
            </p>
          </div>
          <button className="icon-btn" onClick={closeReset}><X size={20} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 20px' }}>
          
          {/* ── STEP 1: SELECT PACKAGE ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {CAC_PACKAGES.map(opt => {
                const isSelected = selectedPackageId === opt.id;
                const Icon = opt.icon;
                return (
                  <button key={opt.id} onClick={() => setSelectedPackageId(opt.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: isSelected ? opt.bg : 'var(--bg-surface)', border: `2px solid ${isSelected ? opt.color : 'var(--border-color)'}`, borderRadius: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', width: '100%', boxShadow: isSelected ? `0 0 0 3px ${opt.color}15` : 'none' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isSelected ? opt.color : 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? '#fff' : 'var(--text-gray)', transition: 'all 0.2s' }}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', color: isSelected ? opt.color : 'var(--text-dark)', fontSize: '15px', marginBottom: '4px' }}>{opt.title}</div>
                        <div style={{ color: 'var(--text-gray)', fontSize: '12px', marginBottom: '6px' }}>{opt.desc}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(37,99,235,0.1)', color: '#2563EB', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>
                          ⏱️ {opt.delivery}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: '900', color: opt.color, fontSize: '18px', textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-gray)', fontWeight: '700', marginBottom: '2px' }}>STARTING FROM</div>
                      {formatCurrency(opt.price)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── STEP 2: REGISTRATION FORM ── */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', marginBottom: '20px' }}>
                <Info size={16} color="#2563EB" style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '12px', color: '#1E3A8A', lineHeight: '1.5', fontWeight: '600' }}>On Submit, you will be redirected to WhatsApp to complete manual processing. No wallet deduction.</p>
              </div>

              {isBusinessName ? (
                <>
                  {/* BUSINESS NAME FORM */}
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                    <SectionHeader title="1. Personal Information" subtitle="Enter the proprietor's details" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
                      <Field label="Surname" required><Input value={personalInfo.surname} onChange={e => setPersonalInfo(p => ({ ...p, surname: e.target.value }))} placeholder="Surname" /></Field>
                      <Field label="First Name" required><Input value={personalInfo.firstName} onChange={e => setPersonalInfo(p => ({ ...p, firstName: e.target.value }))} placeholder="First Name" /></Field>
                      <Field label="Other Name"><Input value={personalInfo.otherName} onChange={e => setPersonalInfo(p => ({ ...p, otherName: e.target.value }))} placeholder="Optional" /></Field>
                      <Field label="Date of Birth" required><Input type="date" value={personalInfo.dob} onChange={e => setPersonalInfo(p => ({ ...p, dob: e.target.value }))} /></Field>
                      <Field label="Gender" required><Input as="select" value={personalInfo.gender} onChange={e => setPersonalInfo(p => ({ ...p, gender: e.target.value }))} placeholder="Select Gender" options={[{label:'Male',value:'Male'},{label:'Female',value:'Female'}]} /></Field>
                      <Field label="Phone Number" required><Input type="tel" value={personalInfo.phone} onChange={e => setPersonalInfo(p => ({ ...p, phone: e.target.value }))} placeholder="11-digit phone" /></Field>
                    </div>
                    <Field label="Home Address" required><Input as="textarea" value={personalInfo.address} onChange={e => setPersonalInfo(p => ({ ...p, address: e.target.value }))} placeholder="Full home residential address" /></Field>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                    <SectionHeader title="2. Business Information" subtitle="Provide your preferred business names" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
                      <Field label="Business Name 1 (Preferred)" required><Input value={businessInfo.name1} onChange={e => setBusinessInfo(p => ({ ...p, name1: e.target.value }))} placeholder="First choice name" /></Field>
                      <Field label="Business Name 2 (Alternative)"><Input value={businessInfo.name2} onChange={e => setBusinessInfo(p => ({ ...p, name2: e.target.value }))} placeholder="Second choice name (Optional)" /></Field>
                    </div>
                    <Field label="Business Address" required><Input as="textarea" value={businessInfo.address} onChange={e => setBusinessInfo(p => ({ ...p, address: e.target.value }))} placeholder="Full business operating address" /></Field>
                    <Field label="Functional Email Address" required><Input type="email" value={businessInfo.email} onChange={e => setBusinessInfo(p => ({ ...p, email: e.target.value }))} placeholder="example@email.com" /></Field>
                  </div>
                </>
              ) : (
                <>
                  {/* COMPANY FORM */}
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                    <SectionHeader title="1. Company Type" />
                    <Field label="Selected Registration Package">
                      <div style={{ padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#334155', fontWeight: '700', fontSize: '14px' }}>
                        {selectedPackage.title}
                      </div>
                    </Field>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                    <SectionHeader title="2. Proposed Company Name(s)" subtitle="Provide preferred and alternative names" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
                      <Field label="Option 1 (Preferred)" required><Input value={businessInfo.name1} onChange={e => setBusinessInfo(p => ({ ...p, name1: e.target.value }))} placeholder="First choice" /></Field>
                      <Field label="Option 2 (Alternative)"><Input value={businessInfo.name2} onChange={e => setBusinessInfo(p => ({ ...p, name2: e.target.value }))} placeholder="Second choice" /></Field>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                    <SectionHeader title="3. Business Details" />
                    <Field label="Nature of Business / Objects of Company" required><Input as="textarea" value={companyDetails.nature} onChange={e => setCompanyDetails(p => ({ ...p, nature: e.target.value }))} placeholder="Describe the business activities" /></Field>
                    <Field label="Principal Business Address" required><Input as="textarea" value={companyDetails.address} onChange={e => setCompanyDetails(p => ({ ...p, address: e.target.value }))} placeholder="Main office address" /></Field>
                    <Field label="Functional Email Address" required><Input type="email" value={companyDetails.email} onChange={e => setCompanyDetails(p => ({ ...p, email: e.target.value }))} placeholder="company@email.com" /></Field>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                    <SectionHeader title="4. Directors / Proprietors / Trustees" />
                    {directors.map((d, i) => (
                      <div key={d.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, fontSize: '13px', color: '#334155', fontWeight: '800' }}>Director / Proprietor #{i + 1}</h4>
                          {directors.length > 1 && (
                            <button onClick={() => removeDirector(d.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><Trash2 size={14} /> Remove</button>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 12px' }}>
                          <Field label="Full Name" required><Input value={d.name} onChange={e => updateDirector(d.id, 'name', e.target.value)} placeholder="Full legal name" /></Field>
                          <Field label="Date of Birth" required><Input type="date" value={d.dob} onChange={e => updateDirector(d.id, 'dob', e.target.value)} /></Field>
                          <Field label="Gender" required><Input as="select" value={d.gender} onChange={e => updateDirector(d.id, 'gender', e.target.value)} placeholder="Select" options={[{label:'Male',value:'Male'},{label:'Female',value:'Female'}]} /></Field>
                          <Field label="Nationality" required><Input value={d.nationality} onChange={e => updateDirector(d.id, 'nationality', e.target.value)} placeholder="E.g. Nigerian" /></Field>
                          <Field label="Phone" required><Input type="tel" value={d.phone} onChange={e => updateDirector(d.id, 'phone', e.target.value)} placeholder="Phone number" /></Field>
                          <Field label="Email" required><Input type="email" value={d.email} onChange={e => updateDirector(d.id, 'email', e.target.value)} placeholder="Email address" /></Field>
                          <Field label="ID Type" required><Input as="select" value={d.idType} onChange={e => updateDirector(d.id, 'idType', e.target.value)} placeholder="Select ID" options={[{label:'NIN',value:'NIN'},{label:'Intl Passport',value:'Passport'},{label:'Drivers License',value:'DriversLicense'},{label:'Voters Card',value:'VotersCard'}]} /></Field>
                          <Field label="ID Number" required><Input value={d.idNumber} onChange={e => updateDirector(d.id, 'idNumber', e.target.value)} placeholder="ID Document Number" /></Field>
                          {(selectedPackageId === 'plc' || selectedPackageId === 'private_ltd') && (
                            <Field label="Shareholding %"><Input type="number" value={d.shareholding} onChange={e => updateDirector(d.id, 'shareholding', e.target.value)} placeholder="0 - 100" /></Field>
                          )}
                        </div>
                        <Field label="Residential Address" required><Input as="textarea" value={d.address} onChange={e => updateDirector(d.id, 'address', e.target.value)} placeholder="Full home address" /></Field>
                      </div>
                    ))}
                    <button onClick={addDirector} style={{ background: '#EFF6FF', color: '#2563EB', border: '1px dashed #BFDBFE', padding: '10px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center' }}>
                      <Plus size={16} /> Add Another Director / Proprietor
                    </button>
                  </div>

                  {(selectedPackageId === 'plc' || selectedPackageId === 'private_ltd') && (
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                      <SectionHeader title="5. Share Capital Structure" />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
                        <Field label="Authorized Share Capital (₦)" required><Input type="number" value={shareCapital.authorized} onChange={e => setShareCapital(p => ({ ...p, authorized: e.target.value }))} placeholder="e.g. 1000000" /></Field>
                        <Field label="Number of Shares" required><Input type="number" value={shareCapital.shares} onChange={e => setShareCapital(p => ({ ...p, shares: e.target.value }))} placeholder="e.g. 1000000" /></Field>
                      </div>
                    </div>
                  )}

                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                    <SectionHeader title="6. Company Secretary (Optional)" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
                      <Field label="Full Name"><Input value={secretary.name} onChange={e => setSecretary(p => ({ ...p, name: e.target.value }))} placeholder="Secretary name" /></Field>
                      <Field label="Phone Number"><Input type="tel" value={secretary.phone} onChange={e => setSecretary(p => ({ ...p, phone: e.target.value }))} placeholder="Secretary phone" /></Field>
                      <Field label="Email Address"><Input type="email" value={secretary.email} onChange={e => setSecretary(p => ({ ...p, email: e.target.value }))} placeholder="Secretary email" /></Field>
                    </div>
                  </div>
                </>
              )}

              {/* DOCUMENTS */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <SectionHeader title={isBusinessName ? "3. Upload Documents" : "7. Supporting Documents"} subtitle="Accepted formats: PDF, JPG, PNG — max 10 MB each" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <FileUploadCard title="Valid ID(s) *" desc={isBusinessName ? "NIN, Passport, etc." : "Valid IDs of all Directors"} fileKey="validId" refObj={validIdRef} />
                  <FileUploadCard title="Passport Photo(s) *" desc="Recent white-background photo" fileKey="passport" refObj={passportRef} />
                  <FileUploadCard title="Signature Specimen *" desc="Sign on white paper" fileKey="signature" refObj={signatureRef} />
                  {!isBusinessName && (
                    <FileUploadCard title="Proof of Address *" desc="Utility bill, etc." fileKey="proofOfAddress" refObj={proofOfAddressRef} />
                  )}
                </div>
              </div>

              {stepError && <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '13px', color: '#DC2626', fontWeight: '600' }}>⚠ {stepError}</div>}
            </div>
          )}
        </div>

        {step === 1 && <Footer onNext={() => setStep(2)} nextLabel="Continue →" nextDisabled={!selectedPackageId} />}
        {step === 2 && <Footer onBack={() => setStep(1)} onNext={handleSubmit} nextLabel="Submit via WhatsApp" nextIcon={<Send size={14} />} />}
      </div>
    </div>
  );
}
