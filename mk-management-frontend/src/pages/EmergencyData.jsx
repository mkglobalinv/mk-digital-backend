import React, { useState, useEffect } from 'react';
import API from '../api';
import { ShieldAlert, Search, CheckCircle, XCircle, Clock } from 'lucide-react';

const EmergencyData = () => {
  const [smsRaw, setSmsRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Scanned Details
  const [requestDetails, setRequestDetails] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await API.get('/api/admin/emergency-data/history');
      if (res.data.status === 'success') {
        setHistory(res.data.history);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!smsRaw) return;
    setLoading(true);
    setMessage(null);
    setRequestDetails(null);

    try {
      const parts = smsRaw.split('|');
      if (parts.length < 3 || parts[0] !== 'EMER') {
        throw new Error("Invalid SMS format. Expected EMER|USERID|PLANID");
      }
      
      const emergencyId = parts[1];
      const planId = parts[2];
      
      // 1. Search User
      const userRes = await API.get(`/api/admin/emergency-data/search?emergencyId=${emergencyId}`);
      const user = userRes.data.user;
      const tenant = userRes.data.tenant;
      
      // 2. Load Pricing
      const priceRes = await API.get(`/api/admin/emergency-data/pricing?userId=${user._id}&planId=${planId}`);
      const pricing = priceRes.data.pricing;
      
      setRequestDetails({
        rawSms: smsRaw,
        user,
        tenant,
        planId,
        pricing
      });

    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    if (!requestDetails) return;
    
    if (action === 'approve') {
      if (!window.confirm("Approve this Emergency Data Purchase? This will instantly deduct their wallet and fulfill the data.")) return;
    } else {
      const reason = prompt("Enter rejection reason:");
      if (reason === null) return;
      requestDetails.reason = reason;
    }
    
    setLoading(true);
    try {
      const payload = {
        userId: requestDetails.user._id,
        planId: requestDetails.planId,
        network: "AUTO", // Simplified for UI, backend defaults or infers from plan if needed
        phone: requestDetails.user.phone || "08000000000", // Phone number should be from the user profile or SMS
        rawSms: requestDetails.rawSms,
        reason: requestDetails.reason
      };
      
      if (action === 'approve') {
          const res = await API.post('/api/admin/emergency-data/approve', payload);
          setMessage({ type: 'success', text: res.data.message });
      } else {
          const res = await API.post('/api/admin/emergency-data/reject', payload);
          setMessage({ type: 'success', text: res.data.message });
      }
      
      setRequestDetails(null);
      setSmsRaw('');
      fetchHistory();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Action failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={32} />
            Emergency SMS Data
          </h1>
          <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>Process offline customer data requests manually.</p>
        </div>
      </div>

      {message && (
        <div style={{ padding: '16px', backgroundColor: message.type === 'error' ? '#ef444420' : '#10b98120', color: message.type === 'error' ? '#ef4444' : '#10b981', border: `1px solid ${message.type === 'error' ? '#ef444450' : '#10b98150'}`, borderRadius: '8px', marginBottom: '24px' }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Input Panel */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search color="#38bdf8" /> Scan SMS Request
          </h3>
          <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
            Enter the exact SMS text received from the customer device.
          </p>
          <form onSubmit={handleScan} style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              placeholder="e.g. EMER|X1B9C2|MTN_1GB" 
              value={smsRaw}
              onChange={(e) => setSmsRaw(e.target.value.toUpperCase())}
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#f8fafc' }}
              required
            />
            <button 
              type="submit"
              disabled={loading}
              style={{ padding: '12px 24px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {loading ? 'Scanning...' : 'Scan'}
            </button>
          </form>
        </div>

        {/* Processing Panel */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: '#f8fafc' }}>
            Request Details
          </h3>
          
          {requestDetails ? (
             <div className="animate-fade-in">
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ padding: '12px', backgroundColor: '#0f172a', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Customer Name</div>
                      <div style={{ fontSize: '16px', color: '#f8fafc', fontWeight: 'bold' }}>{requestDetails.user.name}</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#0f172a', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Tenant/Reseller</div>
                      <div style={{ fontSize: '16px', color: '#f8fafc', fontWeight: 'bold' }}>{requestDetails.tenant ? requestDetails.tenant.branding?.siteName || requestDetails.tenant.name : 'System Retail'}</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#0f172a', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Wallet Balance</div>
                      <div style={{ fontSize: '16px', color: requestDetails.user.balance1 >= requestDetails.pricing.finalPrice ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>₦{requestDetails.user.balance1}</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#0f172a', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Plan Charge Amount</div>
                      <div style={{ fontSize: '16px', color: '#f59e0b', fontWeight: 'bold' }}>₦{requestDetails.pricing.finalPrice}</div>
                  </div>
               </div>
               
               <div style={{ display: 'flex', gap: '16px' }}>
                   <button 
                     onClick={() => handleAction('approve')}
                     disabled={loading || requestDetails.user.balance1 < requestDetails.pricing.finalPrice}
                     style={{ flex: 1, padding: '12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: (requestDetails.user.balance1 < requestDetails.pricing.finalPrice) ? 0.5 : 1 }}
                   >
                       Approve & Charge
                   </button>
                   <button 
                     onClick={() => handleAction('reject')}
                     disabled={loading}
                     style={{ flex: 1, padding: '12px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                   >
                       Reject
                   </button>
               </div>
             </div>
          ) : (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>
               Scan a valid SMS string to load details.
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '32px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock color="#94a3b8" /> Processing History
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cbd5e1' }}>
             <thead>
                 <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left' }}>
                     <th style={{ padding: '12px 8px' }}>Date</th>
                     <th style={{ padding: '12px 8px' }}>Customer</th>
                     <th style={{ padding: '12px 8px' }}>Plan</th>
                     <th style={{ padding: '12px 8px' }}>Charge</th>
                     <th style={{ padding: '12px 8px' }}>Status</th>
                 </tr>
             </thead>
             <tbody>
                 {history.map(item => (
                     <tr key={item._id} style={{ borderBottom: '1px solid #334155' }}>
                         <td style={{ padding: '12px 8px', fontSize: '14px' }}>{new Date(item.createdAt).toLocaleString()}</td>
                         <td style={{ padding: '12px 8px', fontSize: '14px' }}>{item.userId?.name}</td>
                         <td style={{ padding: '12px 8px', fontSize: '14px' }}>{item.planId}</td>
                         <td style={{ padding: '12px 8px', fontSize: '14px' }}>₦{item.amountCharged}</td>
                         <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                             {item.status === 'APPROVED' ? <span style={{ color: '#10b981' }}>APPROVED</span> : <span style={{ color: '#ef4444' }}>REJECTED</span>}
                         </td>
                     </tr>
                 ))}
                 {history.length === 0 && (
                     <tr>
                         <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No history found</td>
                     </tr>
                 )}
             </tbody>
          </table>
      </div>

    </div>
  );
};

export default EmergencyData;
