import React, { useState, useEffect } from 'react';
import { Copy, ArrowUpCircle, History, X, ShieldCheck, Clock, CheckCircle2, ChevronRight, Info, PlusCircle } from 'lucide-react';
import API from '../api';
import './Wallet.css';

const Wallet = ({ token, user }) => {
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [identifierType, setIdentifierType] = useState('bvn');
  const [identifierValue, setIdentifierValue] = useState('');
  const [localUser, setLocalUser] = useState(user);
  const [toast, setToast] = useState(null);
  const [isGeneratingTemp, setIsGeneratingTemp] = useState(false);
  const [isGeneratingPerm, setIsGeneratingPerm] = useState(false);
  const [fundingSuccessData, setFundingSuccessData] = useState(null);
  
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [cashbackHistory, setCashbackHistory] = useState([]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
    fetchCashbackHistory();
  }, []);

  useEffect(() => {
    if (user) {
      setLocalUser(user);
    }
  }, [user]);

  useEffect(() => {
    if (localUser?.accountType === 'temporary' && localUser?.accountExpiryDate) {
      const updateCountdown = () => {
        const distance = new Date(localUser.accountExpiryDate).getTime() - new Date().getTime();
        if (distance <= 0) {
          setTimeLeft("00:00:00");
          setLocalUser(prev => ({
              ...prev,
              accountType: null,
              account_number: null,
              bank_name: null,
              accountExpiryDate: null,
              temporaryAmount: null
          }));
        } else {
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      };
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [localUser]);

  useEffect(() => {
    const handleFunded = (e) => {
        setFundingSuccessData(e.detail);
        showToast("Wallet Funded Successfully", "success");
        
        // Hide after 8 seconds
        setTimeout(() => {
            setFundingSuccessData(null);
            setLocalUser(prev => ({
                ...prev,
                accountType: null,
                account_number: null,
                bank_name: null,
                accountExpiryDate: null,
                temporaryAmount: null
            }));
        }, 8000);
    };
    window.addEventListener('wallet:funded', handleFunded);
    return () => window.removeEventListener('wallet:funded', handleFunded);
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await API.get('/api/user/withdrawals', { headers: { Authorization: `Bearer ${token}` } });
      setWithdrawalHistory(res.data);
    } catch (err) {
      console.error("Fetch withdrawals error:", err);
    }
  };

  const fetchCashbackHistory = async () => {
    try {
      const res = await API.get('/api/user/cashback-history', { headers: { Authorization: `Bearer ${token}` } });
      setCashbackHistory(res.data);
    } catch (err) {
      console.error("Fetch cashback history error:", err);
    }
  };

  const handleWithdrawClick = () => {
    if (!withdrawAmount || !bankName || !accountNumber) {
      alert("Please fill all withdrawal details");
      return;
    }
    setShowPinModal(true);
  };

  const submitWithdrawal = async () => {
    if (!transactionPin) {
      alert("Please enter your transaction PIN");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post(
        '/user/withdraw',
        { amount: Number(withdrawAmount), bankName, accountNumber, accountName, transactionPin },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message);
      setWithdrawAmount('');
      setBankName('');
      setAccountNumber('');
      setTransactionPin('');
      setShowPinModal(false);
      if (typeof setIsWithdrawing === 'function') setIsWithdrawing(false);
      window.dispatchEvent(new CustomEvent('wallet:refresh'));
      fetchWithdrawals();
    } catch (err) {
      alert(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const generateTempAccount = async () => {
    if (!fundAmount || fundAmount < 100) return alert("Minimum funding is ₦100");
    setIsGeneratingTemp(true);
    showToast("Generating secure payment account...", "info");
    try {
      const res = await API.post('/api/user/generate-temp-va', { amount: fundAmount }, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Virtual account generated successfully.", "success");
      setShowFundModal(false);
      setFundAmount('');
      
      // Update local state instead of reload
      if (res.data?.account) {
          setLocalUser(prev => ({
              ...prev,
              accountType: 'temporary',
              account_number: res.data.account.account_number,
              bank_name: res.data.account.bank_name,
              accountExpiryDate: res.data.account.expiry_date ? new Date(res.data.account.expiry_date.replace(" ", "T") + "Z") : new Date(Date.now() + 60 * 60 * 1000),
              temporaryAmount: fundAmount
          }));
      } else {
          setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      showToast("Unable to generate account. Please try again.", "error");
    } finally {
      setIsGeneratingTemp(false);
    }
  };

  const generatePermanentAccount = async () => {
    if (!identifierValue || identifierValue.length < 10) return alert(`Valid ${identifierType.toUpperCase()} is required`);
    setIsGeneratingPerm(true);
    showToast("Verifying KYC and generating permanent account...", "info");
    try {
      const res = await API.post('/api/user/generate-permanent-va', { identifier: identifierValue, type: identifierType }, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Virtual account generated successfully.", "success");
      setShowUpgradeModal(false);
      if (res.data?.account) {
          setLocalUser(prev => ({
              ...prev,
              accountType: 'permanent',
              account_number: res.data.account.account_number,
              bank_name: res.data.account.bank_name
          }));
      } else {
          setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      showToast("Unable to generate account. Please try again.", "error");
    } finally {
      setIsGeneratingPerm(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const hasPermanent = localUser?.accountType === 'permanent' || (localUser?.account_number && localUser?.accountType !== 'temporary');
  const hasTemporary = localUser?.accountType === 'temporary' && localUser?.account_number;

  return (
    <div className="fintech-wallet-page">
      
      {/* Toast Notification */}
      <div className={`fintech-toast ${toast?.type || ''} ${toast ? 'show' : ''}`}>
        {toast?.type === 'success' && <CheckCircle2 size={18} />}
        {toast?.type === 'error' && <X size={18} />}
        {toast?.type === 'info' && <Info size={18} />}
        {toast?.message}
      </div>

      {/* SIMPLIFIED WALLET BALANCE SECTION */}
      <div className="fintech-balance-card">
        <div className="balance-info">
          <p>Total Balance</p>
          <h2>₦{(localUser?.totalBalance || 0).toLocaleString()}</h2>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px' }}>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Earnings</p>
            <h4 style={{ margin: '4px 0 0 0', fontSize: '16px' }}>₦{(localUser?.earningsBalance || 0).toLocaleString()}</h4>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px' }}>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Cashback</p>
            <h4 style={{ margin: '4px 0 0 0', fontSize: '16px' }}>₦{(localUser?.cashbackBalance || 0).toLocaleString()}</h4>
          </div>
        </div>
        <button className="fintech-fund-btn" onClick={() => setShowFundModal(true)} style={{ marginTop: '20px' }}>
          <PlusCircle size={20} /> Fund Wallet
        </button>
      </div>

      <div className="wallet-content-area">
        
        {/* PERMANENT ACCOUNT VIEW */}
        {hasPermanent && (
          <div className="fintech-account-card permanent-variant fade-in">
            <div className="account-card-header">
               <span className="account-status">
                  <ShieldCheck size={16} /> Permanent Account
               </span>
               <span className="account-verified">Verified ✓</span>
            </div>
            
            <div className="account-card-body">
              <p className="transfer-label">Transfer To This Account</p>
              <div className="account-number-row">
                 <h3>{localUser?.account_number}</h3>
                 <button className="copy-icon-btn" onClick={() => copyToClipboard(localUser?.account_number, 'perm')}>
                    {copiedIndex === 'perm' ? <CheckCircle2 size={20} color="#10B981" /> : <Copy size={20} />}
                 </button>
              </div>
            </div>

            <div className="account-card-footer">
               <div className="bank-details">
                  <p className="bank-name">{localUser?.bank_name}</p>
               </div>
               <div className="owner-details">
                  <p className="owner-label">Wallet Owner:</p>
                  <p className="owner-name">{localUser?.name} ✓</p>
               </div>
            </div>
            {localUser?.account_number2 && (
              <div className="secondary-account-row">
                 <div className="account-card-body" style={{borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px'}}>
                  <p className="transfer-label">Secondary Account ({localUser?.bank_name2})</p>
                  <div className="account-number-row">
                     <h3 style={{fontSize: '20px'}}>{localUser?.account_number2}</h3>
                     <button className="copy-icon-btn" onClick={() => copyToClipboard(localUser?.account_number2, 'perm2')}>
                        {copiedIndex === 'perm2' ? <CheckCircle2 size={20} color="#10B981" /> : <Copy size={20} />}
                     </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TEMPORARY ACCOUNT VIEW */}
        {!hasPermanent && hasTemporary && !isGeneratingTemp && !isGeneratingPerm && !fundingSuccessData && (
          <>
            <div className="fintech-account-card temporary-variant fade-in">
              <div className="account-card-header">
                 <span className="account-status warning-status">
                    <Clock size={16} /> Temporary Virtual Account
                 </span>
                 <span className="account-timer">Expires In: {timeLeft}</span>
              </div>
              
              <div className="account-card-body" style={{ textAlign: 'center', margin: '20px 0' }}>
                <p className="transfer-label" style={{ fontSize: '14px', marginBottom: '4px' }}>Amount Expected</p>
                <h3 style={{ fontSize: '36px', color: '#111827', margin: 0 }}>₦{(localUser?.temporaryAmount || 0).toLocaleString()}</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>Generated For: <strong>{localUser?.name}</strong></p>
              </div>

              <div className="account-details-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#f9fafb', padding: '16px', borderRadius: '16px', marginBottom: '20px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>Bank Name:</p>
                    <p style={{ margin: 0, fontWeight: 700, color: '#111827' }}>{localUser?.bank_name}</p>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>Account Number:</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                       <p style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: '18px' }}>{localUser?.account_number}</p>
                       <button className="copy-icon-btn" onClick={() => copyToClipboard(localUser?.account_number, 'temp')} style={{ padding: '6px' }}>
                          {copiedIndex === 'temp' ? <CheckCircle2 size={18} color="#10B981" /> : <Copy size={18} />}
                       </button>
                    </div>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>Account Holder:</p>
                    <p style={{ margin: 0, fontWeight: 700, color: '#111827' }}>{localUser?.name} ✓</p>
                 </div>
              </div>

              <div className="important-notice-box" style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '16px', color: '#991b1b', fontSize: '13px', lineHeight: '1.5' }}>
                 <p style={{ fontWeight: 800, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}><Info size={16} /> IMPORTANT NOTICE</p>
                 <p style={{ margin: '0 0 8px 0' }}>This account was generated specifically for your wallet funding request.</p>
                 <p style={{ margin: '0 0 8px 0' }}>Please transfer exactly <strong>₦{(localUser?.temporaryAmount || 0).toLocaleString()}</strong>.</p>
                 <p style={{ margin: '0 0 4px 0' }}>Sending a lower or higher amount may result in:</p>
                 <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px' }}>
                    <li>Funding failure</li>
                    <li>Delayed wallet credit</li>
                    <li>Manual review</li>
                    <li>Transaction reversal by the provider</li>
                 </ul>
                 <p style={{ margin: '0 0 8px 0', color: '#111827' }}>Use the Copy button to copy the account number.</p>
                 <p style={{ margin: 0, color: '#111827' }}>After payment is received, your wallet will be credited automatically.</p>
              </div>
            </div>

            {/* UPGRADE PROMPT */}
            <div className="upgrade-banner-card">
               <div className="upgrade-content">
                 <h4>Get A Permanent Virtual Account</h4>
                 <ul className="upgrade-benefits">
                   <li><CheckCircle2 size={16} color="#10B981"/> Never Expires</li>
                   <li><CheckCircle2 size={16} color="#10B981"/> Dedicated Account Number</li>
                   <li><CheckCircle2 size={16} color="#10B981"/> Faster Wallet Funding</li>
                   <li><CheckCircle2 size={16} color="#10B981"/> Recommended For Frequent Users</li>
                 </ul>
               </div>
               <button className="upgrade-btn" onClick={() => setShowUpgradeModal(true)}>
                 Upgrade Now <ChevronRight size={18} />
               </button>
            </div>
          </>
        )}

        {/* FUNDING SUCCESS VIEW */}
        {fundingSuccessData && (
          <div className="fintech-account-card fade-in" style={{ borderTop: '4px solid #10B981', textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', color: '#10B981', marginBottom: '16px' }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#111827' }}>Wallet Funded Successfully</h3>
              <div style={{ display: 'inline-block', background: '#ecfdf5', color: '#10B981', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '700', letterSpacing: '1px' }}>
                FUNDED ✓
              </div>
            </div>
            
            <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Amount Received:</p>
                  <p style={{ margin: 0, fontWeight: 800, color: '#111827', fontSize: '16px' }}>₦{(fundingSuccessData.amount || 0).toLocaleString()}</p>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>New Balance:</p>
                  <p style={{ margin: 0, fontWeight: 800, color: '#10B981', fontSize: '18px' }}>₦{(fundingSuccessData.balance || 0).toLocaleString()}</p>
               </div>
            </div>
          </div>
        )}

        {/* LOADING SKELETON */}
        {(isGeneratingTemp || isGeneratingPerm) && (
          <div className="skeleton-card">
            <div className="skeleton-header skeleton-pulse"></div>
            <div style={{textAlign: 'center', margin: '20px 0'}}>
                <div className="skeleton-title skeleton-pulse" style={{margin: '0 auto 12px'}}></div>
                <div className="skeleton-number skeleton-pulse" style={{margin: '0 auto'}}></div>
            </div>
            <div style={{marginTop: '30px'}}>
                <div className="skeleton-row skeleton-pulse"></div>
                <div className="skeleton-row skeleton-pulse"></div>
                <div className="skeleton-row skeleton-pulse"></div>
            </div>
          </div>
        )}

        {/* Withdrawal Trigger */}
        <div className="fintech-action-card" onClick={() => setIsWithdrawing(true)}>
           <div className="action-icon">
              <ArrowUpCircle size={28} />
           </div>
           <div className="action-text">
              <h4>Withdraw to Bank</h4>
              <p>Send funds from your wallet to any Nigerian bank account.</p>
           </div>
           <ChevronRight size={20} color="#9ca3af" />
        </div>

        {/* Withdrawal History */}
        {withdrawalHistory.length > 0 && (
          <div className="fintech-history-section">
            <div className="section-label">
              <History size={18} /> Recent Withdrawals
            </div>
            <div className="fintech-history-list">
              {withdrawalHistory.map((w, i) => (
                <div key={i} className="fintech-history-item">
                  <div className="history-left">
                    <div className="history-bank">{w.bankName}</div>
                    <div className="history-acc">{w.accountNumber}</div>
                    <div className="history-date">{new Date(w.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="history-right">
                    <div className="history-amount">₦{w.amount.toLocaleString()}</div>
                    <div className={`history-status status-${w.status}`}>
                      {w.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cashback History */}
        {cashbackHistory.length > 0 && (
          <div className="fintech-history-section" style={{ marginTop: '24px' }}>
            <div className="section-label">
              <History size={18} /> Cashback History
            </div>
            <div className="fintech-history-list">
              {cashbackHistory.map((c, i) => (
                <div key={i} className="fintech-history-item">
                  <div className="history-left">
                    <div className="history-bank">{c.description || 'Activation Reward'}</div>
                    <div className="history-acc">{c.reference}</div>
                    <div className="history-date">{new Date(c.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="history-right">
                    <div className="history-amount" style={{ color: '#10B981' }}>+₦{c.amount.toLocaleString()}</div>
                    <div className={`history-status status-${c.status}`}>
                      {c.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* FUND WALLET MODAL */}
      {showFundModal && (
        <div className="fintech-modal-overlay">
          <div className="fintech-modal animate-slide-up">
            <div className="modal-top">
              <h3>Fund Your Wallet</h3>
              <button className="icon-btn" onClick={() => setShowFundModal(false)}><X size={24} /></button>
            </div>
            <div className="modal-middle">
              <div className="fintech-input-group">
                <label>Amount (₦)</label>
                <div className="input-with-icon">
                  <span className="currency-symbol">₦</span>
                  <input 
                    type="number" 
                    placeholder="5000" 
                    value={fundAmount} 
                    onChange={(e) => setFundAmount(e.target.value)} 
                    autoFocus
                  />
                </div>
              </div>
              <p className="modal-hint">A temporary account will be generated for this exact amount.</p>
              <button 
                className="fintech-primary-btn" 
                onClick={generateTempAccount}
                disabled={isGeneratingTemp}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
              >
                {isGeneratingTemp ? <><div className="spinner"></div> Generating Account...</> : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="fintech-modal-overlay">
          <div className="fintech-modal animate-slide-up">
            <div className="modal-top">
              <h3>Generate Permanent Account</h3>
              <button className="icon-btn" onClick={() => setShowUpgradeModal(false)}><X size={24} /></button>
            </div>
            <div className="modal-middle">
              <label style={{display:'block', marginBottom:'10px', fontWeight:600, color:'#374151'}}>Select Verification Method</label>
              <div className="radio-group">
                <label className={`radio-option ${identifierType === 'bvn' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    value="bvn" 
                    checked={identifierType === 'bvn'} 
                    onChange={(e) => setIdentifierType(e.target.value)} 
                  />
                  <span>BVN</span>
                </label>
                <label className={`radio-option ${identifierType === 'nin' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    value="nin" 
                    checked={identifierType === 'nin'} 
                    onChange={(e) => setIdentifierType(e.target.value)} 
                  />
                  <span>NIN</span>
                </label>
              </div>

              <div className="fintech-input-group" style={{marginTop: '20px'}}>
                <label>{identifierType.toUpperCase()} Number</label>
                <input 
                  type="text" 
                  placeholder={`11-digit ${identifierType.toUpperCase()}`} 
                  value={identifierValue} 
                  onChange={(e) => setIdentifierValue(e.target.value.replace(/\D/g, '').slice(0,11))} 
                  maxLength={11}
                />
              </div>
              
              <button 
                className="fintech-primary-btn" 
                onClick={generatePermanentAccount}
                disabled={isGeneratingPerm}
                style={{marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'}}
              >
                {isGeneratingPerm ? <><div className="spinner"></div> Generating Account...</> : 'Generate Permanent Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAWAL MODALS (Keep existing withdrawal logic but match style) */}
      {isWithdrawing && (
        <div className="fintech-modal-overlay">
          <div className="fintech-modal animate-slide-up">
            <div className="modal-top">
              <h3>Withdraw Funds</h3>
              <button className="icon-btn" onClick={() => setIsWithdrawing(false)}><X size={24} /></button>
            </div>
            <div className="modal-middle">
              <div className="fintech-input-group">
                <label>Amount (₦)</label>
                <input type="number" placeholder="Min 100" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
              </div>
              <div className="fintech-input-group">
                <label>Bank Name</label>
                <input type="text" placeholder="e.g. Zenith Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
              <div className="fintech-input-group">
                <label>Account Number</label>
                <input type="text" placeholder="10 Digits" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
              </div>
              <div className="fintech-input-group">
                <label>Account Name (Optional)</label>
                <input type="text" placeholder="Full Name" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
              </div>
              <button className="fintech-primary-btn" onClick={handleWithdrawClick}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="fintech-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="fintech-modal animate-slide-up" style={{maxWidth: '360px', textAlign: 'center'}}>
            <div className="modal-top">
              <h3>Confirm Transaction</h3>
              <button className="icon-btn" onClick={() => setShowPinModal(false)}><X size={24} /></button>
            </div>
            <div className="modal-middle">
              <p style={{color:'#6b7280', marginBottom:'20px'}}>Confirm your ₦{Number(withdrawAmount).toLocaleString()} withdrawal</p>
              <input 
                type="password" 
                maxLength={4} 
                className="fintech-pin-box"
                placeholder="****"
                value={transactionPin}
                onChange={(e) => setTransactionPin(e.target.value)}
                autoFocus
              />
              <button 
                className="fintech-primary-btn" 
                onClick={submitWithdrawal}
                disabled={loading}
                style={{marginTop: '24px'}}
              >
                {loading ? 'Processing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Wallet;
