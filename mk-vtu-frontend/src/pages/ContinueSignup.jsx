import React, { useState } from 'react';
import { User, Lock, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import './Auth.css';
import './Auth.css';

const ContinueSignup = () => {
  const [transactionPin, setTransactionPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [sq1, setSq1] = useState('');
  const [ans1, setAns1] = useState('');
  const [sq2, setSq2] = useState('');
  const [ans2, setAns2] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
        setErrorMsg("Email not found. Please start the signup process again.");
        return;
    }

    if (transactionPin.length !== 4) {
      setErrorMsg("Transaction PIN must be exactly 4 digits");
      return;
    }
    
    if (transactionPin !== confirmPin) {
      setErrorMsg("Transaction PINs do not match");
      return;
    }

    if (!sq1 || !ans1 || !sq2 || !ans2) {
      setErrorMsg("Please answer both security questions");
      return;
    }
    
    if (sq1 === sq2) {
      setErrorMsg("Please choose two different security questions");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const payload = { 
          email,
          transactionPin,
          securityQuestions: [
              { question: sq1, answer: ans1 },
          ]
      };
      
      const res = await API.post("/continue-signup", payload);
      
      if (res.data.success) {
         setSuccessMsg("Signup complete! Redirecting to login...");
         setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to complete signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-wrapper" style={{ margin: '0 auto 15px', background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={28} />
          </div>
          <h1 className="auth-title">Complete Your Profile</h1>
          <p className="auth-subtitle">Just a few more details to secure your account</p>
        </div>

        {errorMsg && <div className="auth-message">{errorMsg}</div>}
        {successMsg && <div className="auth-message" style={{background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', borderLeftColor: '#4CAF50'}}>{successMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          
          <div className="auth-input-group">
            <label>Transaction PIN</label>
            <p style={{fontSize: '12.1px', color: '#ffb74d', marginTop: '4px', marginBottom: '8px'}}>Create a 4-digit PIN for authorizing transactions.</p>
            <div style={{position: 'relative'}}>
              <Lock size={18} className="auth-input-icon" style={{ top: '14px', left: '14px'}} />
              <input 
                type="password" 
                placeholder="Enter 4-digit PIN" 
                className="auth-input"
                value={transactionPin}
                onChange={(e) => setTransactionPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                maxLength={4}
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label>Confirm Transaction PIN</label>
            <div style={{position: 'relative'}}>
              <Lock size={18} className="auth-input-icon" style={{ top: '14px', left: '14px'}} />
              <input 
                type="password" 
                placeholder="Confirm 4-digit PIN" 
                className="auth-input"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                maxLength={4}
              />
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
            <input 
              type="text" 
              placeholder="Enter your answer" 
              className="auth-input"
              style={{paddingLeft: '14px'}}
              value={ans1}
              onChange={(e) => setAns1(e.target.value)}
              required
            />
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
            <input 
              type="text" 
              placeholder="Enter your answer" 
              className="auth-input"
              style={{paddingLeft: '14px'}}
              value={ans2}
              onChange={(e) => setAns2(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <div style={{display:'flex',justifyContent:'center'}}><Loader2 className="animate-spin" size={24} /></div> : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Complete Signup <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContinueSignup;
