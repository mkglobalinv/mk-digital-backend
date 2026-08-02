import React, { useState } from 'react';
import { User, Phone, MapPin, CreditCard, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import './Auth.css';

const KYC = ({ user }) => {
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [idNumber, setIdNumber] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
        const token = localStorage.getItem('token');
        const res = await API.post('/api/user/kyc', { fullName, phone, address, idNumber }, { headers: { Authorization: token } });
        if (res.data.success) {
            setSuccessMsg(res.data.message);
            setTimeout(() => {
                navigate('/home');
                window.location.reload();
            }, 2000);
        }
    } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Failed to submit KYC.');
    } finally {
        setLoading(false);
    }
  };

  if (user?.kycVerified) {
      return (
          <div className="auth-page">
              <div className="auth-card" style={{ textAlign: 'center' }}>
                  <ShieldCheck size={64} color="#4CAF50" style={{ margin: '0 auto 20px' }} />
                  <h2>KYC Verified</h2>
                  <p style={{ color: '#888', marginTop: '10px' }}>Your account is fully verified. Your transaction limit has been lifted.</p>
                  <button onClick={() => navigate('/home')} className="auth-btn" style={{ marginTop: '20px' }}>Back to Home</button>
              </div>
          </div>
      );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Account Verification</h1>
          <p className="auth-subtitle">Complete your KYC to lift the ₦10,000 transaction limit.</p>
        </div>

        {errorMsg && <div className="auth-message">{errorMsg}</div>}
        {successMsg && <div className="auth-message" style={{background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', borderLeftColor: '#4CAF50'}}>{successMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label>Full Name</label>
            <div className="input-wrapper">
              <User size={18} className="auth-input-icon" />
              <input type="text" placeholder="Your full name" className="auth-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          </div>

          <div className="auth-input-group">
            <label>Phone Number</label>
            <div className="input-wrapper">
              <Phone size={18} className="auth-input-icon" />
              <input type="tel" placeholder="08012345678" className="auth-input" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} required maxLength={11} />
            </div>
          </div>

          <div className="auth-input-group">
            <label>Residential Address</label>
            <div className="input-wrapper">
              <MapPin size={18} className="auth-input-icon" />
              <input type="text" placeholder="123 Main St, City, State" className="auth-input" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
          </div>

          <div className="auth-input-group">
            <label>BVN or NIN</label>
            <div className="input-wrapper">
              <CreditCard size={18} className="auth-input-icon" />
              <input type="text" placeholder="11-digit number" className="auth-input" value={idNumber} onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))} required maxLength={11} />
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <div style={{display:'flex',justifyContent:'center'}}><Loader2 className="animate-spin" size={24} /></div> : (
              <>Submit KYC <ArrowRight size={18} /></>
            )}
          </button>
        </form>
        
        <div className="auth-footer" style={{marginTop: '20px', cursor: 'pointer', color: '#ffb74d'}} onClick={() => navigate('/home')}>
          Skip for now
        </div>
      </div>
    </div>
  );
};

export default KYC;
