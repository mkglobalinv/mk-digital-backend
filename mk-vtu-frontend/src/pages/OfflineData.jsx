import React, { useState, useEffect } from 'react';
import { WifiOff, Search, Send, AlertTriangle } from 'lucide-react';
import API from '../api';

const OfflineData = ({ user }) => {
  const [network, setNetwork] = useState('MTN');
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    // Attempt to load plans from API. If offline, fallback to cache.
    const fetchPlans = async () => {
      try {
        const res = await API.get(`/api/vtu/data-plans/${network}`);
        setPlans(res.data || []);
        localStorage.setItem(`offline_plans_${network}`, JSON.stringify(res.data));
        setIsCached(false);
      } catch (err) {
        // Fallback to cache
        const cached = localStorage.getItem(`offline_plans_${network}`);
        if (cached) {
          setPlans(JSON.parse(cached));
          setIsCached(true);
        } else {
          setPlans([]);
        }
      }
    };
    fetchPlans();
  }, [network]);

  const generateSmsIntent = () => {
    if (!selectedPlan) return alert("Please select a data plan");
    
    const cachedEmergencyId = localStorage.getItem('emergencyId');
    const actualEmergencyId = user?.emergencyId || cachedEmergencyId;
    
    if (!actualEmergencyId) return alert("Your account is not configured for Emergency Data yet. Please go online and re-login once.");

    const emergencyNumber = "+2348123456789"; // Configure generic system number
    const message = `EMER|${actualEmergencyId}|${selectedPlan}`;
    window.location.href = `sms:${emergencyNumber}?body=${encodeURIComponent(message)}`;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <WifiOff size={32} color="#ef4444" />
        <h1 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>Offline Data Request</h1>
      </div>

      <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '16px', borderRadius: '12px', marginBottom: '24px', color: '#92400e', fontSize: '14px', display: 'flex', gap: '12px' }}>
        <AlertTriangle size={24} style={{ flexShrink: 0 }} />
        <div>
          <p style={{ margin: '0 0 8px', fontWeight: 'bold' }}>No Internet? No Problem.</p>
          <p style={{ margin: 0 }}>Select your cached data plan and send an SMS. Processing may take up to 15 minutes. Final charge will use live pricing. You will receive exactly ₦10 cashback upon success.</p>
        </div>
      </div>

      {isCached && (
        <div style={{ padding: '8px 12px', backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '8px', fontSize: '12px', marginBottom: '24px', fontWeight: 'bold' }}>
          Displaying locally cached pricing.
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>Select Network</label>
        <div style={{ display: 'flex', gap: '12px' }}>
          {['MTN', 'AIRTEL', 'GLO', '9MOBILE'].map(net => (
            <button
              key={net}
              onClick={() => setNetwork(net)}
              style={{
                flex: 1, padding: '12px', borderRadius: '8px', border: network === net ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                backgroundColor: network === net ? '#eff6ff' : '#fff', color: network === net ? '#1d4ed8' : '#475569',
                fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              {net}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>Select Data Plan</label>
        {plans.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
            No cached plans available for {network}. Please connect to the internet once to sync plans.
          </div>
        ) : (
          <select 
            value={selectedPlan} 
            onChange={e => setSelectedPlan(e.target.value)}
            style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '16px' }}
          >
            <option value="">Choose a plan...</option>
            {plans.map(p => (
              <option key={p.plan_code} value={p.plan_code}>
                {p.name} - ₦{p.price}
              </option>
            ))}
          </select>
        )}
      </div>

      <button 
        onClick={generateSmsIntent}
        disabled={!selectedPlan || plans.length === 0}
        style={{
          width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
          backgroundColor: (!selectedPlan || plans.length === 0) ? '#94a3b8' : '#10b981', color: '#fff',
          fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          cursor: (!selectedPlan || plans.length === 0) ? 'not-allowed' : 'pointer'
        }}
      >
        <Send size={20} />
        Generate SMS Request
      </button>

    </div>
  );
};

export default OfflineData;
