import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import './Auth.css';

const ForgotPin = () => {
  const [step, setStep] = useState(1); // 1: Questions, 2: OTP, 3: New PIN
  const [email, setEmail] = useState('');
  const [sq1, setSq1] = useState('');
  const [ans1, setAns1] = useState('');
  const [sq2, setSq2] = useState('');
  const [ans2, setAns2] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleVerifyQuestions = async (e) => {
      e.preventDefault();
      if (!sq1 || !ans1 || !sq2 || !ans2) return setErrorMsg("Please answer both questions");
      
      setLoading(true);
      setErrorMsg('');
      try {
          const res = await API.post("/auth/verify-security-questions", {
              email,
              answers: [
                  { question: sq1, answer: ans1 },
                  { question: sq2, answer: ans2 }
              ]
          });
          if (res.data.success) {
              setSuccessMsg(res.data.message);
              setStep(2);
          }
      } catch (err) {
          setErrorMsg(err.response?.data?.message || 'Verification failed.');
      } finally {
          setLoading(false);
      }
  };

  const handleVerifyOtp = async (e) => {
      e.preventDefault();
      setLoading(true);
      setErrorMsg('');
      try {
          const res = await API.post("/auth/verify-otp", { email, otp });
          if (res.data.success) {
              setResetToken(res.data.resetToken);
              setSuccessMsg("OTP verified. Please enter your new PIN.");
              setStep(3);
          }
      } catch (err) {
          setErrorMsg(err.response?.data?.message || 'OTP verification failed.');
      } finally {
          setLoading(false);
      }
  };

  const handleResetPin = async (e) => {
      e.preventDefault();
      if (newPin !== confirmPin) return setErrorMsg("PINs do not match");
      if (newPin.length !== 4) return setErrorMsg("PIN must be 4 digits");

      setLoading(true);
      setErrorMsg('');
      try {
          const res = await API.post("/auth/reset-pin", { email, newPin, resetToken });
          if (res.data.success) {
              setSuccessMsg("Transaction PIN reset successfully!");
              setTimeout(() => navigate('/home'), 2000);
          }
      } catch (err) {
          setErrorMsg(err.response?.data?.message || 'Failed to reset PIN.');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-wrapper" style={{ margin: '0 auto 15px', background: 'rgba(255, 152, 0, 0.1)', color: '#FF9800', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={28} />
          </div>
          <h1 className="auth-title">Reset Transaction PIN</h1>
          <p className="auth-subtitle">
              {step === 1 && "Answer your security questions"}
              {step === 2 && "Enter OTP sent to your email"}
              {step === 3 && "Create a new 4-digit PIN"}
          </p>
        </div>

        {errorMsg && <div className="auth-message">{errorMsg}</div>}
        {successMsg && <div className="auth-message" style={{background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', borderLeftColor: '#4CAF50'}}>{successMsg}</div>}

        {step === 1 && (
            <form onSubmit={handleVerifyQuestions} className="auth-form">
                <div className="auth-input-group">
                    <label>Email Address</label>
                    <div className="input-wrapper">
                    <Mail size={18} className="auth-input-icon" />
                    <input type="email" placeholder="name@example.com" className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                </div>

                <div className="auth-input-group">
                    <label>Security Question 1</label>
                    <select className="auth-input" style={{paddingLeft: '14px', marginBottom: '8px'}} value={sq1} onChange={(e) => setSq1(e.target.value)} required>
                        <option value="">Select a question...</option>
                        <option value="Mother's maiden name">Mother's maiden name</option>
                        <option value="First school name">First school name</option>
                        <option value="Childhood nickname">Childhood nickname</option>
                        <option value="Name of first pet">Name of first pet</option>
                    </select>
                    <input type="text" placeholder="Your Answer" className="auth-input" style={{paddingLeft: '14px'}} value={ans1} onChange={(e) => setAns1(e.target.value)} required />
                </div>

                <div className="auth-input-group">
                    <label>Security Question 2</label>
                    <select className="auth-input" style={{paddingLeft: '14px', marginBottom: '8px'}} value={sq2} onChange={(e) => setSq2(e.target.value)} required>
                        <option value="">Select a question...</option>
                        <option value="Mother's maiden name">Mother's maiden name</option>
                        <option value="First school name">First school name</option>
                        <option value="Childhood nickname">Childhood nickname</option>
                        <option value="Name of first pet">Name of first pet</option>
                    </select>
                    <input type="text" placeholder="Your Answer" className="auth-input" style={{paddingLeft: '14px'}} value={ans2} onChange={(e) => setAns2(e.target.value)} required />
                </div>

                <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? <div style={{display:'flex',justifyContent:'center'}}><Loader2 className="animate-spin" size={24} /></div> : (
                        <>Verify Answers <ArrowRight size={18} /></>
                    )}
                </button>
            </form>
        )}

        {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="auth-form">
                <div className="auth-input-group">
                    <label>Verification Code (OTP)</label>
                    <div style={{position: 'relative'}}>
                    <input 
                        type="text" placeholder="Enter 6-digit OTP" className="auth-input" 
                        style={{textAlign: 'center', letterSpacing: '8px', fontSize: '19.8px', paddingLeft: '14px'}}
                        value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required maxLength={6}
                    />
                    </div>
                </div>

                <button type="submit" className="auth-btn" disabled={loading || otp.length !== 6}>
                    {loading ? <div style={{display:'flex',justifyContent:'center'}}><Loader2 className="animate-spin" size={24} /></div> : (
                        <>Verify OTP <ArrowRight size={18} /></>
                    )}
                </button>
            </form>
        )}

        {step === 3 && (
            <form onSubmit={handleResetPin} className="auth-form">
                <div className="auth-input-group">
                    <label>New 4-digit PIN</label>
                    <div style={{position: 'relative'}}>
                    <Lock size={18} className="auth-input-icon" style={{ top: '14px', left: '14px'}} />
                    <input 
                        type="password" placeholder="Enter new PIN" className="auth-input" 
                        value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} required maxLength={4}
                    />
                    </div>
                </div>

                <div className="auth-input-group">
                    <label>Confirm 4-digit PIN</label>
                    <div style={{position: 'relative'}}>
                    <Lock size={18} className="auth-input-icon" style={{ top: '14px', left: '14px'}} />
                    <input 
                        type="password" placeholder="Confirm new PIN" className="auth-input" 
                        value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))} required maxLength={4}
                    />
                    </div>
                </div>

                <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? <div style={{display:'flex',justifyContent:'center'}}><Loader2 className="animate-spin" size={24} /></div> : (
                        <>Reset PIN <ArrowRight size={18} /></>
                    )}
                </button>
            </form>
        )}

        <div className="auth-footer" style={{marginTop: '20px'}}>
          <Link to="/home" className="auth-link">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPin;
