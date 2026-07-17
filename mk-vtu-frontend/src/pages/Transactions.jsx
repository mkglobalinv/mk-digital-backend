import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, ArrowUpRight, ArrowDownLeft, Share2, Download, CheckCircle, XCircle, Clock, Copy, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import './Services.css'; 
import { getCleanStatus, getCleanStatusText } from '../utils/statusMapper';

const Transactions = ({ token }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/transactions', { headers: { Authorization: token } })
      .then(res => {
        setTransactions(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Reference copied to clipboard!");
  };

  const shareTransaction = (tx) => {
    const text = `Transaction Receipt\nReference: ${tx.reference}\nService: ${tx.description}\nAmount: ₦${tx.amount.toLocaleString()}\nStatus: ${getCleanStatusText(getCleanStatus(tx.status)).toUpperCase()}\nDate: ${new Date(tx.createdAt).toLocaleString()}\nRecipient: ${tx.phone || 'N/A'}`;
    if (navigator.share) {
      navigator.share({ title: 'Transaction Receipt', text }).catch(console.error);
    } else {
      copyToClipboard(text);
    }
  };

  const downloadReceipt = (tx) => {
    const text = `
----------------------------------
      MK DIGITAL RECEIPT
----------------------------------
Reference: ${tx.reference}
Type: ${tx.type.toUpperCase()}
Description: ${tx.description}
Amount: ₦${tx.amount.toLocaleString()}
Recipient: ${tx.phone || 'N/A'}
Status: ${getCleanStatusText(getCleanStatus(tx.status)).toUpperCase()}
Date: ${new Date(tx.createdAt).toLocaleString()}
----------------------------------
Thank you for choosing MK Digital
    `;
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `receipt-${tx.reference}.txt`;
    // Removed document.body.appendChild(element) for React safety
    element.click();
  };

  return (
    <div className="page-container premium-theme">
      <div className="home-top-bar" style={{ padding: '20px', position: 'sticky', top: 0, zIndex: 100 }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <ArrowLeft onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
            <h2 style={{ fontSize: '22.0px', margin: 0 }}>All Transactions</h2>
         </div>
      </div>

      <div className="home-content" style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>No transactions yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
            {transactions.map((tx) => (
              <div 
                key={tx._id} 
                onClick={() => setSelectedTx(tx)}
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                   <div style={{ 
                      width: '40px', height: '40px', borderRadius: '12px', 
                      background: tx.type === 'credit' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: tx.type === 'credit' ? '#10B981' : '#3B82F6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                   }}>
                      {tx.type === 'credit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                   </div>
                   <div>
                      <h4 style={{ fontSize: '15.4px', margin: 0, color: 'var(--text-color)' }}>{tx.description}</h4>
                      <span style={{ fontSize: '13.2px', color: '#888' }}>{new Date(tx.createdAt).toLocaleString()}</span>
                   </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <h4 style={{ fontSize: '16.5px', margin: 0, color: tx.type === 'credit' ? '#10B981' : 'var(--text-color)' }}>
                      {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                   </h4>
                   <span style={{ 
                      fontSize: '11.0px', padding: '2px 8px', borderRadius: '10px', 
                      background: getCleanStatus(tx.status) === 'success' ? 'rgba(16, 185, 129, 0.1)' : getCleanStatus(tx.status) === 'failed' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: getCleanStatus(tx.status) === 'success' ? '#10B981' : getCleanStatus(tx.status) === 'failed' ? '#EF4444' : '#F59E0B'
                   }}>
                      {getCleanStatusText(getCleanStatus(tx.status)).toUpperCase()}
                   </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', padding: '30px', position: 'relative' }}>
            <div style={{ width: '40px', height: '4px', background: '#e0e0e0', borderRadius: '2px', margin: '0 auto 20px auto', cursor: 'pointer' }} onClick={() => setSelectedTx(null)}></div>
            
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '30px', margin: '0 auto 15px auto',
                background: getCleanStatus(selectedTx.status) === 'success' ? 'rgba(16, 185, 129, 0.1)' : getCleanStatus(selectedTx.status) === 'failed' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                color: getCleanStatus(selectedTx.status) === 'success' ? '#10B981' : getCleanStatus(selectedTx.status) === 'failed' ? '#EF4444' : '#F59E0B',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {getCleanStatus(selectedTx.status) === 'success' ? <CheckCircle size={30} /> : getCleanStatus(selectedTx.status) === 'failed' ? <XCircle size={30} /> : <Clock size={30} />}
              </div>
              <h3 style={{ margin: 0, fontSize: '26.4px' }}>₦{selectedTx.amount.toLocaleString()}</h3>
              <p style={{ margin: '5px 0 0 0', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13.2px', fontWeight: 'bold' }}>{getCleanStatusText(getCleanStatus(selectedTx.status))}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px', background: '#f9f9f9', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888', fontSize: '14.3px' }}>Transaction Type</span>
                <span style={{ fontWeight: '500', fontSize: '14.3px' }}>{selectedTx.description}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888', fontSize: '14.3px' }}>Reference</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontWeight: '500', fontSize: '14.3px', color: 'var(--primary)' }}>{selectedTx.reference}</span>
                  <Copy size={14} style={{ cursor: 'pointer', color: '#888' }} onClick={() => copyToClipboard(selectedTx.reference)} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888', fontSize: '14.3px' }}>Recipient</span>
                <span style={{ fontWeight: '500', fontSize: '14.3px' }}>{selectedTx.phone || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888', fontSize: '14.3px' }}>Date & Time</span>
                <span style={{ fontWeight: '500', fontSize: '14.3px' }}>{new Date(selectedTx.createdAt).toLocaleString()}</span>
              </div>
              {selectedTx.provider_used && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888', fontSize: '14.3px' }}>Channel</span>
                  <span style={{ fontWeight: '500', fontSize: '14.3px', textTransform: 'capitalize' }}>{selectedTx.provider_used}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '30px' }}>
              <button 
                onClick={() => shareTransaction(selectedTx)}
                style={{ padding: '14px', borderRadius: '15px', border: '1px solid #e0e0e0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                <Share2 size={18} /> Share
              </button>
              <button 
                onClick={() => downloadReceipt(selectedTx)}
                style={{ padding: '14px', borderRadius: '15px', border: 'none', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                <Download size={18} /> Receipt
              </button>
            </div>

            <button 
              onClick={() => setSelectedTx(null)}
              style={{ width: '100%', marginTop: '15px', padding: '14px', borderRadius: '15px', border: 'none', background: '#f0f0f0', color: '#666', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
