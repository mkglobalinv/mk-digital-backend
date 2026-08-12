import React, { useState, useRef } from 'react';
import { X, AlertTriangle, Info, Check, Upload, Eye, EyeOff, Send, Calendar, Smartphone, MapPin, Map, UserCog, ArrowLeft } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import API from '../../api';
const MODIFICATION_TYPES = [
  { id: 'name', title: 'Name Modification', desc: 'Correct or change name on NIN records', price: 6500, priceFormatted: '₦6,500', icon: UserCog, color: '#8B5CF6' },
  { id: 'dob', title: 'Date of Birth Modification', desc: 'Correct date of birth on NIN records', price: 37500, priceFormatted: '₦37,500', icon: Calendar, color: '#EC4899' },
  { id: 'phone', title: 'Phone Number Modification', desc: 'Update registered phone number', price: 6500, priceFormatted: '₦6,500', icon: Smartphone, color: '#06B6D4' },
  { id: 'address', title: 'Address Modification', desc: 'Update residential address on NIN', price: 6500, priceFormatted: '₦6,500', icon: MapPin, color: '#10B981' },
  { id: 'state_lga', title: 'State & LGA Modification', desc: 'Update state of origin, state of residence & local government areas', price: 9500, priceFormatted: '₦9,500', icon: Map, color: '#F59E0B' },
];

const InputField = ({ label, name, type = 'text', placeholder, icon: Icon, rightIcon, rightAction, required = true, onChange }) => (
  <div style={{ marginBottom: '16px', width: '100%' }}>
    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '6px', textTransform: 'uppercase' }}>
      {label} {required && '*'}
    </label>
    <div style={{ position: 'relative' }}>
      {Icon && <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}><Icon size={16} /></div>}
      <input
        type={type}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%', padding: `12px 14px ${rightIcon ? '12px 40px' : '12px 14px'}`, paddingLeft: Icon ? '40px' : '14px',
          background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '10px',
          fontSize: '14px', color: 'var(--text-dark)', outline: 'none', boxSizing: 'border-box'
        }}
      />
      {rightIcon && (
        <button type="button" onClick={rightAction} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: 0 }}>
          {rightIcon}
        </button>
      )}
    </div>
  </div>
);

export default function NinModifyModal({ onClose, isReseller }) {
  const [step, setStep] = useState(0); // 0 = Notice, 1 = Selection, 2 = Form
  const [selectedType, setSelectedType] = useState(null);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();
  const toast = {
    loading: (msg) => { showToast(msg, 'success'); return '1'; },
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
    dismiss: () => {}
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generateSerialNumber = () => {
    return 'NIN-MOD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const typeDetails = MODIFICATION_TYPES.find(t => t.id === selectedType);
    if (!typeDetails) return;

    // Manual Validation
    const requiredFields = ['ninNumber', 'whatsapp'];
    if (selectedType === 'name') requiredFields.push('surname', 'firstName');
    if (selectedType === 'phone') requiredFields.push('newPhone');
    if (selectedType === 'dob') requiredFields.push('attestationNo', 'oldDob', 'newDob');
    if (selectedType === 'address') requiredFields.push('newAddress');
    if (selectedType === 'state_lga') requiredFields.push('address', 'townCity', 'lgaOrigin', 'stateOrigin', 'lgaResidence', 'stateResidence');

    const missing = requiredFields.find(field => !formData[field] || formData[field].trim() === '');
    if (missing) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    // Require attestation certificate for DOB modification
    if (selectedType === 'dob' && !selectedFile) {
      showToast('Please upload your Attestation Certificate.', 'error');
      return;
    }

    try {
      showToast('Submitting application...', 'success');
      
      const payload = {
          serviceType: 'nin_modification',
          submittedData: formData
      };
      
      const res = await API.post('/api/retail/identity/manual-application', payload);
      
      if (res.data.status === 'success') {
          showToast('Request submitted successfully. Continue on WhatsApp.', 'success');
          
          let msgBody = `*IDENTITY SERVICE REQUEST*\n`;
          msgBody += `Service: NIN ${typeDetails.title}\n`;
          msgBody += `Application ID: ${res.data.data.applicationId}\n`;
          msgBody += `Source Website: ${res.data.data.websiteId}\n`;
          msgBody += `\n*Submitted Information:*\n`;
          
          Object.entries(formData).forEach(([key, value]) => {
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            msgBody += `${formattedKey}: ${value}\n`;
          });

          if (selectedFile) {
            msgBody += `Attestation Certificate: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB) — Please request file separately\n`;
          }
          
          msgBody += `\nPlease process this request manually.`;
          
          const whatsappNumber = '2347081385387';
          const encodedMsg = encodeURIComponent(msgBody);
          
          setTimeout(() => {
            window.open(`https://wa.me/${whatsappNumber}?text=${encodedMsg}`, '_blank');
            onClose();
          }, 1500);
      }
    } catch (error) {
      console.error("Submission Error:", error);
      showToast('An unexpected error occurred during submission.', 'error');
    }
  };

  const renderNoticeSection = () => (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: '12px', padding: '16px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C53030', margin: '0 0 12px 0', fontSize: '13px', fontWeight: '800' }}>
            <AlertTriangle size={16} /> IMPORTANT NOTICE — READ BEFORE SUBMITTING
          </h4>
          <ol style={{ margin: 0, paddingLeft: '16px', color: '#742A2A', fontSize: '12px', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Create a <strong>fresh email address</strong> and submit it with the correct email password. Do not use your personal email — it will be used exclusively for modification purposes.</li>
            <li>Ensure the email address and password are correct and accessible. If the admin cannot log in, your request will be <strong>cancelled and you will be debited ₦1,000</strong>.</li>
            <li>Do not submit a modification request that has already been processed on another platform.</li>
            <li>Always verify the NIN before submitting. Do not submit NINs with these statuses: <em>Suspended, No Record Found, Migration Required, Invalid NIN</em>.</li>
            <li>Any violation of the above requirements will attract a deduction of <strong>₦1,000 per case</strong>.</li>
          </ol>
        </div>

        <div style={{ background: '#F0F9FF', border: '1px solid #E0F2FE', borderRadius: '12px', padding: '16px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369A1', margin: '0 0 12px 0', fontSize: '13px', fontWeight: '800' }}>
            <Info size={16} /> HOW IT WORKS
          </h4>
          <ol style={{ margin: 0, paddingLeft: '16px', color: '#0C4A6E', fontSize: '12px', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Select modification type</li>
            <li>Fill in required details</li>
            <li>Provide NIMC email & password</li>
            <li>Upload documents if required</li>
            <li>Submit & get debited</li>
            <li>Admin processes in 3-5 days</li>
          </ol>
        </div>
      </div>
      
      <button 
        onClick={() => setStep(1)} 
        style={{
          width: '100%', padding: '16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px',
          fontSize: '15px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.3)', marginTop: '20px'
        }}
      >
        <Check size={18} /> I Have Read and Understood
      </button>
    </div>
  );

  const renderSelection = () => (
    <div className="fade-in">
      <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-dark)', margin: '0 0 16px' }}>Select Modification Type</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
        {MODIFICATION_TYPES.map(opt => (
          <button
            key={opt.id}
            onClick={() => {
              setSelectedType(opt.id);
              setStep(2);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '16px', background: 'var(--bg-surface)', 
              border: '2px solid var(--border-color)',
              borderRadius: '16px', cursor: 'pointer', textAlign: 'left', 
              transition: 'all 0.2s ease', position: 'relative'
            }}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${opt.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: opt.color }}>
              <opt.icon size={22} />
            </div>
            <div>
              <div style={{ fontWeight: '800', color: 'var(--text-dark)', fontSize: '14px', marginBottom: '4px' }}>{opt.title}</div>
              <div style={{ fontWeight: '900', color: opt.color, fontSize: '15px' }}>{opt.priceFormatted}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderFormFields = () => {
    if (!selectedType) return null;
    const typeDetails = MODIFICATION_TYPES.find(t => t.id === selectedType);

    return (
      <form onSubmit={handleSubmit} noValidate className="fade-in" style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
          <button type="button" onClick={() => setStep(1)} className="icon-btn" style={{ background: 'var(--bg-color)', marginRight: '8px' }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${typeDetails.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: typeDetails.color, flexShrink: 0 }}>
            <typeDetails.icon size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)' }}>{typeDetails.title}</h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-gray)' }}>Fill in all required fields below</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
          {selectedType === 'name' && (
            <>
              <InputField label="Surname" name="surname" onChange={handleInputChange} placeholder="Enter surname" />
              <InputField label="First Name" name="firstName" onChange={handleInputChange} placeholder="Enter first name" />
              <InputField label="Middle Name" name="middleName" onChange={handleInputChange} placeholder="Enter middle name (optional)" required={false} />
            </>
          )}

          {selectedType === 'phone' && (
            <InputField label="New Phone Number" name="newPhone" onChange={handleInputChange} placeholder="e.g. 08012345678" />
          )}

          <InputField label="NIN Number" name="ninNumber" onChange={handleInputChange} placeholder="11-digit NIN" />

          {selectedType === 'dob' && (
            <>
              <InputField label="Attestation Number" name="attestationNo" onChange={handleInputChange} placeholder="Court affidavit number" />
              <InputField label="Current (Old) DOB" name="oldDob" type="date" onChange={handleInputChange} placeholder="Select date" />
              <InputField label="Correct (New) DOB" name="newDob" type="date" onChange={handleInputChange} placeholder="Select date" />
            </>
          )}
        </div>

        {selectedType === 'address' && (
          <InputField label="New Address" name="newAddress" onChange={handleInputChange} placeholder="Enter your complete new residential address..." />
        )}

        {selectedType === 'state_lga' && (
          <>
            <InputField label="Address" name="address" onChange={handleInputChange} placeholder="Enter full residential address" />
            <InputField label="Town / City" name="townCity" onChange={handleInputChange} placeholder="Enter town or city" />
            
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#92400E', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14}/> ORIGIN DETAILS</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
                <InputField label="LGA of Origin" name="lgaOrigin" onChange={handleInputChange} placeholder="e.g. Ikeja" />
                <InputField label="State of Origin" name="stateOrigin" onChange={handleInputChange} placeholder="e.g. Lagos" />
              </div>
            </div>

            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#065F46', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14}/> RESIDENCE DETAILS</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
                <InputField label="LGA of Residence" name="lgaResidence" onChange={handleInputChange} placeholder="e.g. Surulere" />
                <InputField label="State of Residence" name="stateResidence" onChange={handleInputChange} placeholder="e.g. Lagos" />
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px', marginTop: '12px' }}>
          <InputField label="NIMC Email" name="nimcEmail" type="email" onChange={handleInputChange} placeholder="yourfresh@email.com" />
          <InputField label="Email Password" name="emailPassword" type={showEmailPassword ? 'text' : 'password'} onChange={handleInputChange} placeholder="Email account password" rightIcon={showEmailPassword ? <EyeOff size={16}/> : <Eye size={16}/>} rightAction={() => setShowEmailPassword(!showEmailPassword)} />
        </div>

        {selectedType === 'dob' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '6px', textTransform: 'uppercase' }}>Attestation Certificate *</label>
            {/* Hidden real file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) {
                  showToast('File is too large. Maximum size is 10 MB.', 'error');
                  e.target.value = '';
                  return;
                }
                setSelectedFile(file);
              }}
            />
            {/* Clickable upload area */}
            <div
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{
                border: selectedFile ? '1px solid #A7F3D0' : '1px dashed #D8B4FE',
                background: selectedFile ? '#ECFDF5' : '#FAF5FF',
                borderRadius: '12px', padding: '24px', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}
            >
              {selectedFile ? (
                <>
                  <Check size={24} color="#10B981" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: '#065F46' }}>{selectedFile.name}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#10B981' }}>Tap to change file</p>
                </>
              ) : (
                <>
                  <Upload size={24} color="#9333EA" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: '#7E22CE' }}>Click to upload file</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#9333EA' }}>PDF, JPG, PNG — max 10 MB</p>
                </>
              )}
            </div>
          </div>
        )}


        <InputField label="WhatsApp Number" name="whatsapp" type="tel" onChange={handleInputChange} placeholder="e.g. 08012345678" />


        <button type="submit" style={{
          width: '100%', padding: '16px', background: typeDetails.color, color: 'white', border: 'none', borderRadius: '12px',
          fontSize: '15px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          boxShadow: `0 4px 12px ${typeDetails.color}40`
        }}>
          <Send size={18} /> Submit Modification Application
        </button>
      </form>
    );
  };

  return (
    <div className="modal-overlay-modern" style={{ overflowY: 'auto', alignItems: 'flex-start' }} onClick={onClose}>
      <div className="modal-content-modern animate-scale-in" onClick={e => e.stopPropagation()} style={{ padding: '24px', maxWidth: '750px', width: '90%', margin: '40px auto', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)', margin: '0 0 4px' }}>NIN Modification</h2>
            <p style={{ margin: 0, color: 'var(--text-gray)', fontSize: '13px' }}>Update your National Identification Number records with ease</p>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ background: 'var(--bg-color)' }}>
            <X size={20} />
          </button>
        </div>

        {step === 0 && renderNoticeSection()}
        {step === 1 && renderSelection()}
        {step === 2 && renderFormFields()}
      </div>
    </div>
  );
}
