import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle, ArrowDownLeft, ArrowUpRight, LayoutGrid, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './FintechComponents.css';

const PremiumWalletCard = ({
  user,
  recentlyFundedStatus,
  setShowMoreMenu,
  isReseller = false
}) => {
  const navigate = useNavigate();
  const [hideBalance, setHideBalance] = useState(() => {
    return sessionStorage.getItem('hideBalance') === 'true';
  });
  const [copied, setCopied] = useState(false);

  const toggleBalancePrivacy = () => {
    const newVal = !hideBalance;
    setHideBalance(newVal);
    sessionStorage.setItem('hideBalance', newVal);
  };

  const copyAccountNumber = (e) => {
    e.stopPropagation();
    if (!user?.account_number) return;
    navigator.clipboard.writeText(user.account_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fintech-wallet-card">
      <div className="wallet-header">
        <div className="wallet-label">
          <span className="wallet-label-text">Total Balance</span>
          <button className="eye-btn" onClick={toggleBalancePrivacy}>
            {hideBalance ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {recentlyFundedStatus && (
          <div className="wallet-badge"><CheckCircle size={10} /> Active</div>
        )}
      </div>
      
      <div className="wallet-balance-row">
        <div className={"wallet-balance " + (hideBalance ? "blurred" : "")}>
          {hideBalance ? '₦ ****.**' : `₦${(user?.totalBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        </div>
      </div>

      <div
        className="wallet-account-row"
        onClick={() => navigate(isReseller ? '/reseller/wallet' : '/wallet')}
      >
        {user?.account_number ? (
          <>
            <span className="wallet-account-text">
              {user.account_number} · {user.bank_name}
            </span>
            <button className="wallet-account-copy-btn" onClick={copyAccountNumber}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </>
        ) : (
          <span className="wallet-account-text muted">Generate your account number →</span>
        )}
      </div>

      <div className="wallet-actions">
        <div className="action-item primary" onClick={() => navigate(isReseller ? '/reseller/wallet' : '/wallet')}>
          <div className="action-icon-wrap"><ArrowDownLeft size={14} /></div>
          <span>Fund</span>
        </div>
        <div className="action-item" onClick={() => navigate(isReseller ? '/reseller/wallet' : '/wallet')}>
          <div className="action-icon-wrap"><ArrowUpRight size={14} /></div>
          <span>Transfer</span>
        </div>
        <div className="action-item" onClick={() => setShowMoreMenu(true)}>
          <div className="action-icon-wrap"><LayoutGrid size={14} /></div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

export default PremiumWalletCard;
