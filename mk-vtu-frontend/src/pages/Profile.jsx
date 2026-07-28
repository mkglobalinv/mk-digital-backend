import React, { useState } from 'react';
import { LogOut, Lock, HelpCircle, Shield, Trash2, ChevronRight, UserCircle2, Bell, Settings, X, Send, Fingerprint, Terminal } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import { isBiometricAvailable, registerBiometric } from '../services/biometricService';
import './Profile.css';

const Profile = ({ logout, user, token, siteInfo }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [pinAction, setPinAction] = useState('change'); // menu, change, forgot-otp, forgot-reset
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [refStats, setRefStats] = useState(null);
  const [refLoading, setRefLoading] = useState(false);

  // PIN Form States
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Help Form States
  const [helpForm, setHelpForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '', complaint: '' });
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  React.useEffect(() => {
    isBiometricAvailable().then(supported => setBiometricSupported(supported));
  }, []);

  const handleHelpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/help-center', helpForm);
      setMsg({ type: 'success', text: 'Your message has been sent.' });
      setTimeout(() => setShowHelpModal(false), 2000);
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to send message.' });
    } finally { setLoading(false); }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/change-pin', { oldPin, newPin, confirmPin });
      setMsg({ type: 'success', text: 'PIN changed successfully' });
      setTimeout(() => setShowPinModal(false), 2000);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change PIN' });
    } finally { setLoading(false); }
  };

  const handleForgotPin = async () => {
    setLoading(true);
    try {
      await API.post('/auth/request-pin-otp', {});
      setMsg({ type: 'success', text: 'OTP sent to your email.' });
      setPinAction('forgot-otp');
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to send OTP' });
    } finally { setLoading(false); }
  };

  const [otp, setOtp] = React.useState('');
  const [resetToken, setResetToken] = React.useState('');

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await API.post('/auth/verify-otp', { email: user.email, otp });
      setResetToken(res.data.resetToken);
      setMsg({ type: 'success', text: 'OTP verified. Enter your new PIN.' });
      setPinAction('forgot-reset');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Invalid OTP' });
    } finally { setLoading(false); }
  };

  const handleResetPin = async (e) => {
    e.preventDefault();
    if (newPin !== confirmPin) return setMsg({ type: 'error', text: 'PINs do not match' });
    setLoading(true);
    try {
      await API.post('/auth/reset-pin', { email: user.email, newPin, resetToken });
      setMsg({ type: 'success', text: 'PIN reset successfully' });
      setTimeout(() => setShowPinModal(false), 2000);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to reset PIN' });
    } finally { setLoading(false); }
  };

  React.useEffect(() => {
    if (showReferralModal && !refStats) {
      setRefLoading(true);
      API.get('/api/user/referral-analytics')
        .then(res => setRefStats(res.data))
        .catch(err => console.error("Failed to fetch referral stats", err))
        .finally(() => setRefLoading(false));
    }
  }, [showReferralModal]);

  return (
    <div className="page-container profile-page premium-theme">
      <div className="profile-header-premium">
        <h2>My Profile</h2>
        <button className="logout-btn-header" onClick={logout}><LogOut size={20} /></button>
      </div>

      <div className="profile-hero">
         <div className="profile-avatar-container">
            <UserCircle2 size={80} className="avatar-icon" />
         </div>
         <h2 className="profile-display-name">{user?.name || 'Member'}</h2>
         <p className="profile-email">{user?.email}</p>
         {user && (
            <div 
               onClick={() => navigate('/verify-email', { state: { email: user.email } })}
               style={{
                  fontSize: '12px',
                  marginTop: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: user.isEmailVerified ? '#10b981' : '#ef4444',
                  background: user.isEmailVerified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  display: 'inline-block',
                  border: user.isEmailVerified ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
               }}
            >
               {user.isEmailVerified ? '🟢 Email Verified' : '🔴 Email Not Verified'}
            </div>
         )}
         <div className={`premium-badge ${user?.kycVerified ? 'verified' : 'unverified'}`}>
            {user?.kycVerified ? 'Verified Account' : 'Basic (Unverified)'}
         </div>
      </div>

      <div className="profile-menu-container">
        <div className="menu-group">
           <h3 className="menu-group-title">Account Security</h3>
           <button className="premium-menu-item" onClick={() => { setShowPinModal(true); setPinAction('change'); setMsg({type:'',text:''}); }}>
             <div className="menu-left">
               <div className="menu-icon-wrapper blue"><Lock size={18} /></div>
               <span className="menu-text">Transaction PIN</span>
             </div>
             <ChevronRight size={18} className="menu-arrow" />
           </button>
           <button className="premium-menu-item" onClick={() => !user?.kycVerified && navigate('/kyc')}>
             <div className="menu-left">
               <div className="menu-icon-wrapper green"><Shield size={18} /></div>
               <span className="menu-text">Identity Verification</span>
             </div>
             <span className={`menu-status ${user?.kycVerified ? 'success' : 'pending'}`}>
                {user?.kycVerified ? 'Verified' : 'Unverified'}
             </span>
           </button>
           {biometricSupported && (
             <div className="premium-menu-item no-hover">
               <div className="menu-left">
                 <div className="menu-icon-wrapper purple"><Fingerprint size={18} /></div>
                 <span className="menu-text">Biometric Login</span>
               </div>
               <div 
                 className={`premium-toggle ${user?.biometricEnabled ? 'on' : 'off'}`} 
                 onClick={async () => {
                   if (biometricLoading) return;
                   const targetState = !user?.biometricEnabled;
                   if (targetState) {
                     setBiometricLoading(true);
                     try {
                       const challengeRes = await API.get('/api/biometric/register-challenge');
                       const regData = await registerBiometric(challengeRes.data);
                       await API.post('/api/biometric/register-verify', regData);
                       localStorage.setItem('biometricEnabled', 'true');
                       window.location.reload();
                     } catch (err) { console.error(err); }
                     finally { setBiometricLoading(false); }
                   } else {
                     await API.post('/api/biometric/toggle', { enabled: false });
                     localStorage.setItem('biometricEnabled', 'false');
                     window.location.reload();
                   }
                 }}
               >
                 <div className="toggle-thumb"></div>
               </div>
             </div>
           )}
        </div>

        <div className="menu-group">
           <h3 className="menu-group-title">Preferences</h3>
           <div className="premium-menu-item no-hover">
             <div className="menu-left">
               <div className="menu-icon-wrapper orange"><Bell size={18} /></div>
               <span className="menu-text">Push Notifications</span>
             </div>
             <div className={`premium-toggle ${notifications ? 'on' : 'off'}`} onClick={() => setNotifications(!notifications)}>
               <div className="toggle-thumb"></div>
             </div>
           </div>

           <button className="premium-menu-item" onClick={() => setShowReferralModal(true)}>
             <div className="menu-left">
               <div className="menu-icon-wrapper green"><UserCircle2 size={18} /></div>
               <span className="menu-text">Refer & Earn</span>
             </div>
             <ChevronRight size={18} className="menu-arrow" />
           </button>
         </div>

        <div className="menu-group">
           <h3 className="menu-group-title">Support & Safety</h3>
           <button className="premium-menu-item" onClick={() => setShowHelpModal(true)}>
             <div className="menu-left">
               <div className="menu-icon-wrapper blue"><HelpCircle size={18} /></div>
               <span className="menu-text">Help Center</span>
             </div>
             <ChevronRight size={18} className="menu-arrow" />
           </button>
        </div>

        <button className="full-logout-btn" onClick={logout}>
           <LogOut size={18} />
           <span>Log Out</span>
        </button>
      </div>

      {/* PIN MODAL */}
      {showPinModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal">
            <div className="modal-header">
              <h3>Transaction PIN</h3>
              <button onClick={() => setShowPinModal(false)}><X size={20} /></button>
            </div>
            {msg.text && <div className={`modal-msg ${msg.type}`}>{msg.text}</div>}
            {pinAction === 'change' && (
              <form onSubmit={handleChangePin} className="modal-form">
                <input type="password" placeholder="Old PIN" maxLength={4} className="modal-input" value={oldPin} onChange={e => setOldPin(e.target.value.replace(/\D/g,''))} required />
                <input type="password" placeholder="New PIN" maxLength={4} className="modal-input" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g,''))} required />
                <input type="password" placeholder="Confirm New PIN" maxLength={4} className="modal-input" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g,''))} required />
                <button type="submit" className="modal-submit-btn" disabled={loading}>{loading ? 'Updating...' : 'Update PIN'}</button>
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '14px', color: '#3b82f6', cursor: 'pointer', fontWeight: '500' }} onClick={handleForgotPin}>
                    Forgot PIN?
                  </span>
                </div>
              </form>
            )}
            {pinAction === 'forgot-otp' && (
              <form onSubmit={handleVerifyOtp} className="modal-form">
                <input type="text" placeholder="Enter OTP from Email" maxLength={6} className="modal-input" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,''))} required />
                <button type="submit" className="modal-submit-btn" disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
              </form>
            )}
            {pinAction === 'forgot-reset' && (
              <form onSubmit={handleResetPin} className="modal-form">
                <input type="password" placeholder="New 4-Digit PIN" maxLength={4} className="modal-input" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g,''))} required />
                <input type="password" placeholder="Confirm New PIN" maxLength={4} className="modal-input" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g,''))} required />
                <button type="submit" className="modal-submit-btn" disabled={loading}>{loading ? 'Resetting...' : 'Reset PIN'}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* HELP MODAL */}
      {showHelpModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal">
            <div className="modal-header">
              <h3>Contact Support</h3>
              <button onClick={() => setShowHelpModal(false)}><X size={20} /></button>
            </div>
            {msg.text && <div className={`modal-msg ${msg.type}`}>{msg.text}</div>}
            <form onSubmit={handleHelpSubmit} className="modal-form">
              <input type="text" placeholder="Name" className="modal-input" value={helpForm.name} onChange={e => setHelpForm({...helpForm, name: e.target.value})} required />
              <input type="email" placeholder="Email" className="modal-input" value={helpForm.email} onChange={e => setHelpForm({...helpForm, email: e.target.value})} required />
              <input type="tel" placeholder="Phone" className="modal-input" value={helpForm.phone} onChange={e => setHelpForm({...helpForm, phone: e.target.value})} required />
              <textarea placeholder="Your Complaint" className="modal-input" rows={4} value={helpForm.complaint} onChange={e => setHelpForm({...helpForm, complaint: e.target.value})} required></textarea>
              <button type="submit" className="modal-submit-btn" disabled={loading}>
                {loading ? 'Sending...' : <span style={{display:'flex', alignItems:'center', gap:'8px', justifyContent:'center'}}>Send Message <Send size={16}/></span>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REFERRAL MODAL */}
      {showReferralModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <h3>Referral Analytics</h3>
              <button onClick={() => setShowReferralModal(false)}><X size={20} /></button>
            </div>
            
            {/* Overview Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
               <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Total Referrals</p>
                  <h4 style={{ margin: '4px 0 0 0', fontSize: '24px', color: 'var(--text-color)' }}>{refLoading ? '-' : (refStats?.totalReferrals || 0)}</h4>
               </div>
               <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Activations</p>
                  <h4 style={{ margin: '4px 0 0 0', fontSize: '24px', color: '#10b981' }}>{refLoading ? '-' : (refStats?.successfulActivations || 0)}</h4>
               </div>
               <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Total Earnings</p>
                  <h4 style={{ margin: '4px 0 0 0', fontSize: '24px', color: 'var(--text-color)' }}>₦{refLoading ? '-' : (refStats?.totalEarnings || 0).toLocaleString()}</h4>
               </div>
            </div>

            {/* Link Generator */}
            <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
               <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-muted)' }}>Your Referral Link</p>
               <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                     type="text" 
                     readOnly 
                     value={`${window.location.origin}/register?ref=${user?.referralCode || user?._id}`}
                     style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', fontSize: '13px' }}
                  />
                  <button 
                     onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user?.referralCode || user?._id}`);
                        setMsg({ type: 'success', text: 'Copied!' });
                     }}
                     style={{ padding: '0 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                     Copy
                  </button>
               </div>
            </div>

            {/* History Table */}
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
               <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Referral History</h4>
               {refLoading ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading history...</p>
               ) : refStats?.history?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {refStats.history.map((h, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '500', fontSize: '14px', color: 'var(--text-color)' }}>{h.name}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(h.date).toLocaleDateString()}</p>
                        </div>
                        <div style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', background: h.status === 'Activated' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: h.status === 'Activated' ? '#10b981' : '#f59e0b' }}>
                          {h.status}
                        </div>
                      </div>
                    ))}
                  </div>
               ) : (
                 <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No referrals yet. Share your link to start earning!</p>
               )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
